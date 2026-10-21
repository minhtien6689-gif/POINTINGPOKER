/**
 * ============================================================================
 * TRỢ LÝ AI GEMINI THÔNG MINH – BẢN TÁI SỬ DỤNG CHO MỌI DỰ ÁN WEB (STANDALONE)
 * Tác giả: Mr Tiến © 2026
 * ============================================================================
 * Tích hợp Google Gemini (gemini-2.5-flash / gemini-1.5-flash):
 * - Không phụ thuộc framework (Zero Dependencies: chạy trên HTML/JS thuần, React, Vue, Next.js...).
 * - Xử lý ngôn ngữ tự nhiên thông minh, hiểu mọi ý định người dùng.
 * - Hỗ trợ Web Speech API: Nhận diện giọng nói tiếng Việt 🎙️ và Đọc to văn bản 🔊.
 * - Hỗ trợ Tool Calling / Action Dispatcher: Trợ lý tự động gửi lệnh JSON để web chủ thực thi.
 * - Bảo mật: Tự động ẩn API key trên giao diện.
 * ============================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GeminiAssistant = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const STORAGE_KEY = 'gemini_api_key';
  const DEFAULT_KEY = 'AIzaSyAHWjI_8gZa-TSzVyvHJPYTrPFC3LvFjhA';
  const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash'];

  // Default Configuration
  const defaults = {
    apiKey: DEFAULT_KEY,
    title: 'Trợ Lý AI Gemini',
    brandName: '© 2026 Mr Tiến',
    welcomeMessage: `👋 Xin chào! Tôi là **Trợ Lý AI Gemini © 2026 Mr Tiến**.\nTôi có thể hỗ trợ giải đáp, xử lý yêu cầu, điều khiển các chức năng trên trang web, hoặc trò chuyện thông minh cùng bạn.\n\n👉 Bạn có thể gõ câu hỏi, nhấn **Micro 🎙️** để nói, hoặc bấm các nút tác vụ nhanh bên trên nhé!`,
    systemInstruction: `Bạn là Trợ Lý AI Gemini chuyên nghiệp của website © 2026 Mr Tiến.
Nhiệm vụ:
1. Hỗ trợ người dùng tận tình, thân thiện bằng tiếng Việt lịch sự, thông minh, có emoji phong phú.
2. Nếu người dùng yêu cầu thực hiện hành động trên trang web, hãy đính kèm một khối JSON hành động duy nhất ở cuối câu trả lời dạng:
\`\`\`action
{"type": "TÊN_HÀNH_ĐỘNG", "params": {...}}
\`\`\``,
    quickChips: [
      { label: '💡 Giới thiệu tính năng', prompt: 'Hãy giới thiệu các tính năng nổi bật của website này' },
      { label: '🚀 Hướng dẫn sử dụng', prompt: 'Hướng dẫn tôi cách sử dụng website một cách nhanh chóng nhất' },
      { label: '✍️ Soạn nội dung', prompt: 'Hãy viết cho tôi một lời chào mừng ấn tượng và hấp dẫn' }
    ],
    onAction: null, // Callback function(action): executed when AI triggers action
    enableVoice: true,
    enableTTS: true,
    shortcutKey: 'j' // Ctrl + J
  };

  let config = Object.assign({}, defaults);
  let storedKey = '';
  try { storedKey = localStorage.getItem(STORAGE_KEY); } catch (e) {}
  let apiKey = (storedKey && storedKey.trim().length > 10) ? storedKey.trim() : config.apiKey;
  try { localStorage.setItem(STORAGE_KEY, apiKey); } catch (e) {}
  let isAiWorking = false;
  let chatHistory = [];
  let isListening = false;
  let speechRecognition = null;
  let autoSpeak = false;
  let currentSpeakingBtn = null;
  let availableVoices = [];

  const $ = id => document.getElementById(id);

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }

  function formatMarkdown(text) {
    if (!text) return '';
    let t = text;
    t = t.replace(/```(?:action|json)[\s\S]*?```/gi, '');
    t = escapeHTML(t);
    t = t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/\*(.*?)\*/g, '<em>$1</em>');
    t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
    t = t.replace(/^-\s+(.+)$/gm, '<li>$1</li>');
    t = t.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    t = t.replace(/\n\n/g, '<br><br>');
    t = t.replace(/\n/g, '<br>');
    return t;
  }

  function init(userConfig) {
    if (userConfig) {
      config = Object.assign({}, defaults, userConfig);
      if (userConfig.apiKey) {
        apiKey = userConfig.apiKey;
        try { localStorage.setItem(STORAGE_KEY, apiKey); } catch (e) {}
      }
    }

    if (!localStorage.getItem(STORAGE_KEY)) {
      try { localStorage.setItem(STORAGE_KEY, apiKey); } catch (e) {}
    }

    createUI();
    bindEvents();
    if (config.enableVoice) initSpeech();
    updateStatus();
  }

  function createUI() {
    if ($('geminiFabContainer')) return;

    // 1. FAB Button
    const fab = document.createElement('div');
    fab.id = 'geminiFabContainer';
    fab.className = 'gemini-fab-container';
    fab.innerHTML = `
      <button id="geminiFabBtn" class="gemini-fab-btn" title="Mở ${config.title} (Ctrl+${config.shortcutKey.toUpperCase()})" aria-label="${config.title}">
        <div class="gemini-fab-halo" aria-hidden="true"></div>
        <div class="gemini-fab-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
            <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="url(#geminiFabGradStandalone)" />
            <defs>
              <linearGradient id="geminiFabGradStandalone" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stop-color="#FF5400" />
                <stop offset="0.35" stop-color="#FF007A" />
                <stop offset="0.75" stop-color="#00E5FF" />
                <stop offset="1" stop-color="#6366F1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div class="gemini-fab-label">
          <span class="gemini-pulse-dot" id="geminiStatusDot"></span>
          <span class="gemini-fab-txt">${escapeHTML(config.title)}</span>
          <span class="gemini-kbd-badge">Ctrl+${config.shortcutKey.toUpperCase()}</span>
        </div>
      </button>
    `;
    document.body.appendChild(fab);

    // 2. Chips HTML
    const chipsHtml = (config.quickChips || []).map(c => 
      `<button class="chip-item" data-cmd="${escapeHTML(c.prompt || c.label)}">${escapeHTML(c.label)}</button>`
    ).join('');

    // 3. Drawer Card
    const drawer = document.createElement('div');
    drawer.id = 'geminiDrawer';
    drawer.className = 'gemini-drawer hidden';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-label', config.title);
    drawer.innerHTML = `
      <div class="gemini-card-panel">
        <span class="panel-screw screw-tl"></span>
        <span class="panel-screw screw-tr"></span>
        <span class="panel-screw screw-bl"></span>
        <span class="panel-screw screw-br"></span>

        <!-- Header -->
        <div class="gemini-panel-header">
          <div class="gemini-brand-badge">
            <div class="gemini-badge-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="url(#geminiHeadGradStandalone)" />
                <defs>
                  <linearGradient id="geminiHeadGradStandalone" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#FF5400" />
                    <stop offset="0.5" stop-color="#FF007A" />
                    <stop offset="1" stop-color="#00E5FF" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div class="gemini-brand-text">
              <div class="gemini-title-row">
                <h3 class="gemini-title">${escapeHTML(config.title)}</h3>
                <span class="gemini-year-tag">${escapeHTML(config.brandName)}</span>
              </div>
            </div>
          </div>

          <div class="gemini-header-actions">
            <button id="geminiVoiceToggleBtn" class="gemini-icon-btn muted" title="Bật/Tắt tự động đọc to âm thanh">🔇</button>
            <button id="geminiKeyBtn" class="gemini-icon-btn" title="Cài đặt API Key" style="display:none !important;">🔑</button>
            <button id="geminiClearChatBtn" class="gemini-icon-btn" title="Xóa lịch sử chat">🗑️</button>
            <button id="geminiCloseBtn" class="gemini-icon-btn close-btn" title="Đóng (Esc)">✕</button>
          </div>
        </div>

        <!-- API Key Config (hidden by default) -->
        <div id="geminiKeyConfigBox" class="gemini-key-config hidden" style="display:none !important;">
          <div class="key-config-inner">
            <div class="key-config-header">
              <span>🔑 Cấu Hình Google Gemini API Key</span>
              <button id="closeKeyConfigBtn" class="key-close-x">✕</button>
            </div>
            <p class="key-help-txt">Nhập API Key để sử dụng mô hình Gemini 2.5 Flash thông minh.</p>
            <div class="key-input-row">
              <input type="password" id="geminiApiKeyInput" placeholder="AIzaSy..." autocomplete="off">
              <button id="saveApiKeyBtn" class="gemini-pill-btn primary">Lưu</button>
              <button id="removeApiKeyBtn" class="gemini-pill-btn secondary">Mặc định</button>
            </div>
            <div class="key-link-row">
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" class="key-studio-link">
                ↗ Lấy API Key miễn phí tại Google AI Studio
              </a>
            </div>
          </div>
        </div>

        <!-- Quick Chips -->
        <div class="gemini-quick-chips-wrapper">
          <div class="gemini-quick-chips" id="geminiQuickChips">
            ${chipsHtml}
          </div>
        </div>

        <!-- Chat Body -->
        <div class="gemini-chat-body" id="geminiChatBody"></div>

        <!-- Input Area -->
        <div class="gemini-input-wrap">
          <form id="geminiForm" class="gemini-input-form" onsubmit="return false;">
            <button type="button" id="geminiMicBtn" class="gemini-action-btn mic-btn" title="Nói tiếng Việt (Mic)">🎙️</button>
            <input type="text" id="geminiInput" class="gemini-text-input" placeholder="Nhập câu hỏi hoặc yêu cầu..." autocomplete="off" />
            <button type="submit" id="geminiSendBtn" class="gemini-action-btn send-btn" title="Gửi (Enter)">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
          <div class="gemini-input-footer">
            <span>💡 Nhấn <kbd>Enter</kbd> gửi • <kbd>Ctrl+${config.shortcutKey.toUpperCase()}</kbd> mở trợ lý • Nói bằng <kbd>🎙️ Mic</kbd></span>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(drawer);

    // Initial greeting
    addMessage(config.welcomeMessage, 'ai', false);
  }

  function bindEvents() {
    $('geminiFabBtn').onclick = toggle;
    $('geminiCloseBtn').onclick = close;

    document.addEventListener('keydown', e => {
      if (e.ctrlKey && e.key.toLowerCase() === config.shortcutKey.toLowerCase()) {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape' && !$('geminiDrawer').classList.contains('hidden')) {
        close();
      }
    });

    $('geminiForm').onsubmit = e => {
      e.preventDefault();
      const txt = $('geminiInput').value.trim();
      if (!txt || isAiWorking) return;
      $('geminiInput').value = '';
      ask(txt);
    };

    $('geminiQuickChips').addEventListener('click', e => {
      const btn = e.target.closest('.chip-item');
      if (!btn || isAiWorking) return;
      const cmd = btn.dataset.cmd;
      if (cmd) ask(cmd);
    });

    $('geminiClearChatBtn').onclick = () => {
      chatHistory = [];
      $('geminiChatBody').innerHTML = '';
      addMessage('🧹 Đoạn chat đã được làm mới. Tôi sẵn sàng tiếp nhận yêu cầu tiếp theo!', 'ai', false);
    };

    $('geminiKeyBtn').onclick = () => {
      const box = $('geminiKeyConfigBox');
      box.classList.toggle('hidden');
      if (!box.classList.contains('hidden')) {
        $('geminiApiKeyInput').value = apiKey;
        $('geminiApiKeyInput').focus();
      }
    };

    $('closeKeyConfigBtn').onclick = () => $('geminiKeyConfigBox').classList.add('hidden');

    $('saveApiKeyBtn').onclick = () => {
      const val = $('geminiApiKeyInput').value.trim();
      if (!val) return alert('Vui lòng nhập API Key hợp lệ.');
      apiKey = val;
      localStorage.setItem(STORAGE_KEY, apiKey);
      $('geminiKeyConfigBox').classList.add('hidden');
      updateStatus();
      addMessage('✅ **Đã cập nhật Gemini API Key thành công!**', 'ai', false);
    };

    $('removeApiKeyBtn').onclick = () => {
      apiKey = DEFAULT_KEY;
      localStorage.setItem(STORAGE_KEY, DEFAULT_KEY);
      $('geminiApiKeyInput').value = '';
      $('geminiKeyConfigBox').classList.add('hidden');
      updateStatus();
      addMessage('ℹ️ Đã khôi phục API Key mặc định của hệ thống.', 'ai', false);
    };

    $('geminiMicBtn').onclick = toggleVoice;

    // Toggle Voice Audio button in header
    const voiceToggleBtn = $('geminiVoiceToggleBtn');
    if (voiceToggleBtn) {
      voiceToggleBtn.onclick = () => {
        autoSpeak = !autoSpeak;
        voiceToggleBtn.textContent = autoSpeak ? '🔊' : '🔇';
        voiceToggleBtn.title = autoSpeak ? 'Tự động đọc to âm thanh: BẬT' : 'Tự động đọc to âm thanh: TẮT';
        voiceToggleBtn.classList.toggle('muted', !autoSpeak);
        if (autoSpeak) {
          speak('Đã bật chế độ tự động đọc to.');
        } else {
          window.speechSynthesis?.cancel();
          resetSpeakingState();
        }
      };
    }
  }

  function updateStatus() {
    const dot = $('geminiStatusDot');
    if (dot) dot.className = apiKey ? 'gemini-pulse-dot active' : 'gemini-pulse-dot offline';
  }

  function toggle() {
    $('geminiDrawer').classList.toggle('hidden');
    if (!$('geminiDrawer').classList.contains('hidden')) {
      setTimeout(() => {
        $('geminiInput')?.focus();
        scrollBottom();
      }, 100);
    }
  }

  function open() {
    $('geminiDrawer').classList.remove('hidden');
    setTimeout(() => {
      $('geminiInput')?.focus();
      scrollBottom();
    }, 100);
  }

  function close() {
    $('geminiDrawer').classList.add('hidden');
    if (isListening && speechRecognition) speechRecognition.stop();
  }

  /* --------------------------------------------------------------------------
     SPEECH & TTS - HOÀN TOÀN TỐI ƯU HÓA CHO ĐIỆN THOẠI
     -------------------------------------------------------------------------- */
  async function requestMicPermission() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        return true;
      } catch (err) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          alert('⚠️ Quyền Microphone đã bị chặn.\nVui lòng vào Cài đặt trình duyệt Safari / Chrome trên điện thoại và BẬT quyền Micro để nói chuyện!');
          return false;
        }
      }
    }
    return true;
  }

  function initSpeech() {
    loadVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  function loadVoices() {
    if (!('speechSynthesis' in window)) return;
    try {
      availableVoices = window.speechSynthesis.getVoices() || [];
    } catch (e) {}
  }

  async function toggleVoice() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      return alert('Trình duyệt hiện tại chưa hỗ trợ nhận diện giọng nói Web Speech. Hãy mở trang web bằng Google Chrome hoặc Safari trên điện thoại để trải nghiệm tốt nhất!');
    }

    if (isListening) {
      stopListening();
      return;
    }

    const hasPerm = await requestMicPermission();
    if (!hasPerm) return;

    try {
      speechRecognition = new SpeechRec();
      speechRecognition.lang = 'vi-VN';
      speechRecognition.continuous = false;
      speechRecognition.interimResults = true;
      speechRecognition.maxAlternatives = 1;

      speechRecognition.onstart = () => {
        isListening = true;
        if (navigator.vibrate) navigator.vibrate(40);
        $('geminiMicBtn')?.classList.add('recording');
        const input = $('geminiInput');
        if (input) {
          input.placeholder = '🎙️ Đang nghe... Hãy nói yêu cầu của bạn!';
          input.value = '';
        }
      };

      speechRecognition.onresult = e => {
        let interimText = '';
        let finalText = '';

        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            finalText += e.results[i][0].transcript;
          } else {
            interimText += e.results[i][0].transcript;
          }
        }

        const currentText = finalText || interimText;
        if (currentText) {
          const input = $('geminiInput');
          if (input) input.value = currentText;
        }

        if (finalText) {
          stopListening();
          if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
          setTimeout(() => ask(finalText), 350);
        }
      };

      speechRecognition.onerror = e => {
        console.warn('Speech error:', e.error);
        if (e.error === 'not-allowed') {
          alert('⚠️ Quyền Micro chưa được cấp.\nVui lòng vào Cài đặt trình duyệt trên điện thoại và bật quyền Micro cho trang web này.');
        }
        stopListening();
      };

      speechRecognition.onend = () => {
        stopListening();
      };

      speechRecognition.start();
    } catch (err) {
      console.warn('Speech start error:', err);
      stopListening();
    }
  }

  function stopListening() {
    isListening = false;
    try {
      if (speechRecognition) {
        speechRecognition.abort?.();
        speechRecognition = null;
      }
    } catch (e) {}
    $('geminiMicBtn')?.classList.remove('recording');
    const input = $('geminiInput');
    if (input) input.placeholder = "Hỏi AI...";
  }

  function speak(text, triggerBtn = null) {
    if (!('speechSynthesis' in window)) return;
    try {
      if (currentSpeakingBtn === triggerBtn && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        resetSpeakingState();
        return;
      }

      window.speechSynthesis.cancel();
      resetSpeakingState();

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const clean = text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/[*#_`>~•]/g, ' ')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!clean) return;

      const utt = new SpeechSynthesisUtterance(clean);
      utt.lang = 'vi-VN';
      utt.rate = 1.0;
      utt.pitch = 1.0;

      if (!availableVoices.length) loadVoices();
      const viVoice = availableVoices.find(v => v.lang && (v.lang.includes('vi') || v.lang.includes('VI')));
      if (viVoice) utt.voice = viVoice;

      if (triggerBtn) {
        currentSpeakingBtn = triggerBtn;
        triggerBtn.innerHTML = '⏹️ Dừng';
        triggerBtn.classList.add('speaking-active');
      }

      utt.onend = () => {
        resetSpeakingState();
      };

      utt.onerror = () => {
        resetSpeakingState();
      };

      window.speechSynthesis.speak(utt);
    } catch (e) {
      console.warn('TTS error:', e);
      resetSpeakingState();
    }
  }

  function resetSpeakingState() {
    if (currentSpeakingBtn) {
      currentSpeakingBtn.innerHTML = '🔊 Đọc';
      currentSpeakingBtn.classList.remove('speaking-active');
      currentSpeakingBtn = null;
    }
  }

  function addMessage(text, role = 'ai', canSpeak = true, actionNotice = null) {
    const body = $('geminiChatBody');
    if (!body) return;

    const row = document.createElement('div');
    row.className = `chat-msg-row ${role === 'user' ? 'user-row' : 'ai-row'}`;

    if (role === 'user') {
      row.innerHTML = `
        <div class="chat-msg-bubble user-bubble">
          <div class="bubble-content">${escapeHTML(text)}</div>
        </div>
        <div class="chat-avatar user-avatar">👤</div>
      `;
    } else {
      let badge = actionNotice ? `<div class="action-executed-badge"><span class="action-check-icon">⚡</span><span>${escapeHTML(actionNotice)}</span></div>` : '';
      row.innerHTML = `
        <div class="chat-avatar ai-avatar">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
            <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="url(#msgGradStandalone)" />
            <defs>
              <linearGradient id="msgGradStandalone" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stop-color="#FF5400" />
                <stop offset="0.5" stop-color="#FF007A" />
                <stop offset="1" stop-color="#00E5FF" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div class="chat-msg-bubble ai-bubble">
          ${badge}
          <div class="bubble-content">${formatMarkdown(text)}</div>
          <div class="bubble-meta">
            <button class="meta-action-btn speak-btn" title="Đọc to âm thanh trên điện thoại">🔊 Đọc</button>
            <button class="meta-action-btn copy-btn">📋 Chép</button>
          </div>
        </div>
      `;
      const speakBtn = row.querySelector('.speak-btn');
      if (speakBtn) {
        speakBtn.onclick = () => speak(text, speakBtn);
        if (canSpeak && autoSpeak) {
          setTimeout(() => speak(text, speakBtn), 400);
        }
      }
      const copyBtn = row.querySelector('.copy-btn');
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(text.replace(/```[\s\S]*?```/g, '').trim());
        copyBtn.textContent = '✓ Đã chép!';
        setTimeout(() => copyBtn.textContent = '📋 Chép', 1500);
      };
    }

    body.appendChild(row);
    scrollBottom();
  }

  function showTyping() {
    const body = $('geminiChatBody');
    if (!body) return null;
    const div = document.createElement('div');
    div.id = 'geminiTypingRow';
    div.className = 'chat-msg-row ai-row';
    div.innerHTML = `
      <div class="chat-avatar ai-avatar">✨</div>
      <div class="chat-msg-bubble ai-bubble typing-bubble">
        <span class="dot-typing"></span><span class="dot-typing"></span><span class="dot-typing"></span>
        <span class="typing-label">Gemini đang phản hồi...</span>
      </div>
    `;
    body.appendChild(div);
    scrollBottom();
    return div;
  }

  function removeTyping() {
    $('geminiTypingRow')?.remove();
  }

  function scrollBottom() {
    const body = $('geminiChatBody');
    if (body) body.scrollTop = body.scrollHeight;
  }

  async function ask(promptText) {
    if (isAiWorking) return;
    isAiWorking = true;
    addMessage(promptText, 'user');
    showTyping();

    try {
      const contents = chatHistory.slice(-4).map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      }));
      contents.push({ role: 'user', parts: [{ text: promptText }] });

      let replyText = null;
      for (const model of GEMINI_MODELS) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: contents,
              systemInstruction: { parts: [{ text: config.systemInstruction }] },
              generationConfig: { temperature: 0.7, maxOutputTokens: 1200 }
            })
          });

          if (res.ok) {
            const data = await res.json();
            replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (replyText) break;
          }
        } catch (e) {}
      }

      if (!replyText) {
        replyText = `Cảm ơn bạn đã gửi yêu cầu: "${promptText}". Tôi luôn sẵn sàng hỗ trợ bạn!`;
      }

      chatHistory.push({ role: 'user', text: promptText });
      chatHistory.push({ role: 'model', text: replyText });

      // Action Dispatcher
      let cleanText = replyText;
      let actionNotice = null;
      const actionMatch = replyText.match(/```(?:action|json)\s*([\s\S]*?)```/i);
      if (actionMatch) {
        cleanText = replyText.replace(/```(?:action|json)[\s\S]*?```/gi, '').trim();
        try {
          const actionObj = JSON.parse(actionMatch[1].trim());
          if (typeof config.onAction === 'function') {
            actionNotice = config.onAction(actionObj);
          }
        } catch (e) {}
      }

      addMessage(cleanText, 'ai', true, actionNotice);
    } catch (err) {
      addMessage(`❌ Lỗi kết nối: ${err.message}`, 'ai', false);
    } finally {
      removeTyping();
      isAiWorking = false;
    }
  }

  return {
    init: init,
    open: open,
    close: close,
    toggle: toggle,
    ask: ask,
    speak: speak,
    setKey: key => {
      apiKey = key;
      localStorage.setItem(STORAGE_KEY, key);
      updateStatus();
    }
  };
}));
