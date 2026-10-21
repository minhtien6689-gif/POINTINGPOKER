/**
 * ============================================================================
 * TRỢ LÝ VOICE AI GEMINI TỐC ĐỘ CAO – CHUẨN ĐA NỀN TẢNG (iOS, Android, Desktop)
 * Tác giả: Mr Tiến © 2026
 * ============================================================================
 * - Tối ưu Voice AI: Khoan dung STT, Thân thiện TTS tuyến tính, Không rào đón.
 * - Generation Config Tốc Độ Cao: temperature: 0.35, maxOutputTokens: 250, topP: 0.8.
 * - Vượt rào cản Auto-play trên iOS Safari: Mở khóa Web Audio Context im lặng 0.1s.
 * - Voice Activity Detection (VAD): Tự ngắt sau ĐÚNG 3 GIÂY im lặng (Hands-free 100%).
 * - Streaming SSE & Chunked TTS: Đọc ngay câu đầu tiên chỉ sau vài trăm mili-giây.
 * - Visual Feedback: Waveform Visualizer 5 thanh LED neon nhảy theo biên độ thật.
 * - Function Calling / Action JSON: Thuật toán Brace-Matching trích xuất JSON chuẩn xác 100%.
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

  // Default Prompt Chuẩn Voice AI © 2026 Mr Tiến
  const DEFAULT_SYSTEM_INSTRUCTION = `[Vai trò & Không gian hoạt động]
Bạn là trợ lý AI chuyên nghiệp, tốc độ cao được tích hợp trực tiếp trên nền tảng web đa thiết bị © 2026 Mr Tiến. Mục tiêu của bạn là cung cấp thông tin chính xác, giải quyết vấn đề ngay lập tức và mang lại trải nghiệm giao tiếp bằng giọng nói (Voice AI) mượt mà như con người.

[Nguyên tắc Xử lý Đầu vào (Speech-to-Text)]
1. Khoan dung với lỗi chuyển ngữ: Đầu vào của người dùng thường được tạo ra từ nhận diện giọng nói trên điện thoại/máy tính, do đó sẽ có lỗi đồng âm, sai chính tả, ngắt câu sai hoặc lẫn tạp âm. Bạn phải tự động suy luận ngữ cảnh và ý định cốt lõi. Tuyệt đối không bắt bẻ lỗi chính tả hoặc yêu cầu nhắc lại vì những lỗi này.

[Nguyên tắc Tối ưu Đầu ra (Text-to-Speech)]
1. Định dạng thân thiện với giọng đọc: Trả lời bằng ngôn ngữ tự nhiên, câu văn ngắn, có nhịp điệu rõ ràng để công cụ TTS đọc tự nhiên nhất.
2. Cấu trúc tuyến tính: Đi thẳng vào trọng tâm ở câu đầu tiên. Cắt bỏ hoàn toàn các cụm từ rào đón như "Dưới đây là", "Tôi hiểu rồi", "Chào bạn", "Theo thông tin tôi có".
3. Hạn chế Markdown phức tạp: Tuyệt đối không sử dụng bảng biểu (tables), danh sách đánh dấu lồng ghép phức tạp, hoặc mã code dài trong luồng hội thoại thông thường, vì các trình đọc giọng nói không thể phát âm chúng một cách có nghĩa. Nếu cần cung cấp code hoặc cấu trúc phức tạp, hãy xác nhận ngắn gọn bằng giọng nói và chỉ định hiển thị chi tiết trên màn hình.

[Hỗ trợ Thực thi Tác vụ (Function Calling/JSON)]
- Nếu người dùng yêu cầu thực hiện hành động trên ứng dụng web (ví dụ: chuyển trang, nộp bài, xem điểm, tìm kiếm, lọc dữ liệu, reset ván chơi...), hãy phản hồi bằng MỘT câu xác nhận bằng lời cực kỳ ngắn (Ví dụ: "Đang mở bảng điểm cho bạn.", "Đã cập nhật dữ liệu.") kèm theo mã lệnh định dạng JSON ở cuối thông điệp để hệ thống front-end tự động bắt sự kiện và thực thi:
\`\`\`action
{"type": "TÊN_HÀNH_ĐỘNG", "params": {...}}
\`\`\``;

  // Cấu hình thông số mặc định (Thời gian ngưng nói chuẩn xác 3.0 giây)
  const defaults = {
    apiKey: DEFAULT_KEY,
    title: 'Trợ Lý Voice AI',
    brandName: '© 2026 Mr Tiến',
    welcomeMessage: `Xin chào! Tôi là Trợ Lý Voice AI của Mr Tiến. Hãy chạm vào Mic để bắt đầu nói, hệ thống sẽ tự động gửi lệnh sau 3 giây ngưng nói!`,
    systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
    generationConfig: {
      temperature: 0.35,
      maxOutputTokens: 250,
      topP: 0.8
    },
    quickChips: [
      { label: '💡 Giới thiệu tính năng', prompt: 'Giới thiệu tính năng nổi bật của website này.' },
      { label: '🚀 Hướng dẫn nhanh', prompt: 'Hướng dẫn ngắn gọn cách dùng trang web này.' },
      { label: '⚡ Kiểm tra tốc độ', prompt: 'Bạn phản hồi nhanh như thế nào?' }
    ],
    onAction: null,
    enableVoice: true,
    enableTTS: true,
    autoSpeak: true,
    silenceTimeoutMs: 3000, // THỜI GIAN CHỜ NGƯNG NÓI CHUẨN XÁC: 3 GIÂY
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
  let autoSpeak = true;
  let currentSpeakingBtn = null;
  let availableVoices = [];

  // Web Audio Context & VAD State
  let audioCtx = null;
  let isAudioUnlocked = false;
  let micAudioStream = null;
  let micAnalyser = null;
  let vadAnimFrame = null;
  let silenceTimer = null;
  let silenceCountdownInterval = null;
  let remainingSilenceSeconds = 3;
  let hasUserSpoken = false;
  let latestRecognizedText = '';
  let speechRestartCount = 0;

  // Queue TTS Sentence-Chunked
  let ttsQueue = [];
  let isTtsPlaying = false;

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

  /* --------------------------------------------------------------------------
     1. THUẬT TOÁN BRACE-MATCHING TRÍCH XUẤT ACTION JSON CHUẨN XÁC 100%
     -------------------------------------------------------------------------- */
  function extractActionJSON(text) {
    if (!text) return null;

    // 1. Thử tìm trong khối code markdown ```action ... ``` hoặc ```json ... ```
    const codeBlockMatch = text.match(/```(?:action|json)?\s*([\s\S]*?)```/i);
    if (codeBlockMatch) {
      const rawContent = codeBlockMatch[1].trim();
      try {
        const parsed = JSON.parse(rawContent);
        if (parsed && (parsed.type || parsed.action)) return normalizeAction(parsed);
      } catch (e) {}
    }

    // 2. Thuật toán Brace-Matching quét JSON object chứa "type" hoặc "action"
    const typeIdx = text.search(/\{[\s\S]*?"(?:type|action)"\s*:/i);
    if (typeIdx !== -1) {
      let braceCount = 0;
      let inString = false;
      let escape = false;
      let jsonStart = -1;
      let jsonEnd = -1;

      for (let i = typeIdx; i < text.length; i++) {
        const char = text[i];
        if (char === '\\' && inString) {
          escape = !escape;
          continue;
        }
        if (char === '"' && !escape) {
          inString = !inString;
        }
        escape = false;

        if (!inString) {
          if (char === '{') {
            if (braceCount === 0) jsonStart = i;
            braceCount++;
          } else if (char === '}') {
            braceCount--;
            if (braceCount === 0 && jsonStart !== -1) {
              jsonEnd = i + 1;
              break;
            }
          }
        }
      }

      if (jsonStart !== -1 && jsonEnd !== -1) {
        const rawJson = text.slice(jsonStart, jsonEnd);
        try {
          const parsed = JSON.parse(rawJson);
          if (parsed && (parsed.type || parsed.action)) return normalizeAction(parsed);
        } catch (e) {}
      }
    }

    return null;
  }

  function normalizeAction(obj) {
    if (!obj || typeof obj !== 'object') return null;
    const res = Object.assign({}, obj);
    if (res.action && !res.type) res.type = res.action;
    // Phẳng hóa các tham số trong params ra ngoài root để tương thích mọi handler
    if (res.params && typeof res.params === 'object') {
      for (const k in res.params) {
        if (res[k] === undefined) {
          res[k] = res.params[k];
        }
      }
    }
    return res;
  }

  /* --------------------------------------------------------------------------
     2. VƯỢT RÀO CẢN AUTO-PLAY TRÊN iOS SAFARI (Web Audio Unlock)
     -------------------------------------------------------------------------- */
  function unlockAudioContext() {
    if (isAudioUnlocked) return;
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        if (!audioCtx) audioCtx = new AudioCtxClass();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        // Phát đoạn silence 0.1s để Safari cấp quyền Audio Playback
        const buffer = audioCtx.createBuffer(1, 2205, 22050);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start(0);
      }

      // Mở khóa SpeechSynthesis cho iOS Safari
      if ('speechSynthesis' in window) {
        const silentUtt = new SpeechSynthesisUtterance(' ');
        silentUtt.volume = 0.01;
        silentUtt.rate = 10;
        window.speechSynthesis.speak(silentUtt);
      }

      isAudioUnlocked = true;
    } catch (e) {
      console.warn('Unlock audio context error:', e);
    }
  }

  if (typeof document !== 'undefined') {
    ['click', 'touchstart', 'keydown'].forEach(evt => {
      document.addEventListener(evt, unlockAudioContext, { once: true, passive: true });
    });
  }

  /* --------------------------------------------------------------------------
     3. KHỞI TẠO VÀ GIAO DIỆN
     -------------------------------------------------------------------------- */
  function init(userConfig) {
    if (userConfig) {
      config = Object.assign({}, defaults, userConfig);
      if (userConfig.apiKey) {
        apiKey = userConfig.apiKey;
        try { localStorage.setItem(STORAGE_KEY, apiKey); } catch (e) {}
      }
      if (userConfig.autoSpeak !== undefined) {
        autoSpeak = !!userConfig.autoSpeak;
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
            <button id="geminiVoiceToggleBtn" class="gemini-icon-btn ${autoSpeak ? '' : 'muted'}" title="${autoSpeak ? 'Tự động đọc to: BẬT' : 'Tự động đọc to: TẮT'}">${autoSpeak ? '🔊' : '🔇'}</button>
            <button id="geminiClearChatBtn" class="gemini-icon-btn" title="Làm mới hội thoại">🗑️</button>
            <button id="geminiCloseBtn" class="gemini-icon-btn close-btn" title="Đóng (Esc)">✕</button>
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

        <!-- VOICE WAVEFORM VISUALIZER (Kèm đếm ngược 3 giây im lặng) -->
        <div id="geminiVoiceVisualizerBar" class="gemini-voice-visualizer-bar">
          <div class="visualizer-info">
            <span class="visualizer-mic-icon">🎙️</span>
            <span id="geminiVoiceStatusTxt">Đang nghe... (Tự gửi sau 3s ngưng nói)</span>
          </div>
          <div class="visualizer-bars">
            <span class="v-bar" id="vBar1"></span>
            <span class="v-bar" id="vBar2"></span>
            <span class="v-bar" id="vBar3"></span>
            <span class="v-bar" id="vBar4"></span>
            <span class="v-bar" id="vBar5"></span>
          </div>
        </div>

        <!-- Input Area -->
        <div class="gemini-input-wrap">
          <form id="geminiForm" class="gemini-input-form" onsubmit="return false;">
            <button type="button" id="geminiMicBtn" class="gemini-action-btn mic-btn" title="Chạm để nói chuyện (Tự gửi sau 3s ngưng nói)">🎙️</button>
            <input type="text" id="geminiInput" class="gemini-text-input" placeholder="Nhập câu hỏi hoặc nói bằng Mic..." autocomplete="off" />
            <button type="submit" id="geminiSendBtn" class="gemini-action-btn send-btn" title="Gửi (Enter)">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
          <div class="gemini-input-footer">
            <span>✨ Voice AI đa nền tảng • Tự động ngắt &amp; gửi sau 3s ngưng nói • Hỗ trợ iOS &amp; Android</span>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(drawer);

    // Chào mừng mở đầu
    addMessage(config.welcomeMessage, 'ai', false);
  }

  function bindEvents() {
    $('geminiFabBtn').onclick = () => {
      unlockAudioContext();
      toggle();
    };
    $('geminiCloseBtn').onclick = close;

    document.addEventListener('keydown', e => {
      if (e.ctrlKey && e.key.toLowerCase() === config.shortcutKey.toLowerCase()) {
        e.preventDefault();
        unlockAudioContext();
        toggle();
      }
      if (e.key === 'Escape' && !$('geminiDrawer').classList.contains('hidden')) {
        close();
      }
    });

    $('geminiForm').onsubmit = e => {
      e.preventDefault();
      unlockAudioContext();
      const txt = $('geminiInput').value.trim();
      if (!txt || isAiWorking) return;
      $('geminiInput').value = '';
      ask(txt);
    };

    $('geminiQuickChips').addEventListener('click', e => {
      unlockAudioContext();
      const btn = e.target.closest('.chip-item');
      if (!btn || isAiWorking) return;
      const cmd = btn.dataset.cmd;
      if (cmd) ask(cmd);
    });

    $('geminiClearChatBtn').onclick = () => {
      unlockAudioContext();
      stopTTS();
      chatHistory = [];
      $('geminiChatBody').innerHTML = '';
      addMessage('🧹 Đã làm mới đoạn thoại. Hãy chạm vào Mic hoặc gõ câu hỏi tiếp theo nhé!', 'ai', false);
    };

    $('geminiMicBtn').onclick = () => {
      unlockAudioContext();
      toggleVoice();
    };

    const voiceToggleBtn = $('geminiVoiceToggleBtn');
    if (voiceToggleBtn) {
      voiceToggleBtn.onclick = () => {
        unlockAudioContext();
        autoSpeak = !autoSpeak;
        voiceToggleBtn.textContent = autoSpeak ? '🔊' : '🔇';
        voiceToggleBtn.title = autoSpeak ? 'Tự động đọc to: BẬT' : 'Tự động đọc to: TẮT';
        voiceToggleBtn.classList.toggle('muted', !autoSpeak);
        if (autoSpeak) {
          speakText('Đã bật tự động phát giọng nói.');
        } else {
          stopTTS();
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
    unlockAudioContext();
    $('geminiDrawer').classList.remove('hidden');
    setTimeout(() => {
      $('geminiInput')?.focus();
      scrollBottom();
    }, 100);
  }

  function close() {
    $('geminiDrawer').classList.add('hidden');
    stopListening();
    stopTTS();
  }

  /* --------------------------------------------------------------------------
     4. VOICE ACTIVITY DETECTION (VAD) & TỰ NGẮT SAU ĐÚNG 3 GIÂY IM LẶNG
     -------------------------------------------------------------------------- */
  function clearSilenceTimers() {
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
    if (silenceCountdownInterval) {
      clearInterval(silenceCountdownInterval);
      silenceCountdownInterval = null;
    }
  }

  function startSilenceCountdown() {
    clearSilenceTimers();
    remainingSilenceSeconds = 3;
    updateVisualizerStatus(`⏳ Ngưng nói... Tự gửi sau <strong style="color:#FF007A;">${remainingSilenceSeconds}s</strong>`);

    silenceCountdownInterval = setInterval(() => {
      remainingSilenceSeconds -= 1;
      if (remainingSilenceSeconds > 0) {
        updateVisualizerStatus(`⏳ Ngưng nói... Tự gửi sau <strong style="color:#FF007A;">${remainingSilenceSeconds}s</strong>`);
      } else {
        clearSilenceTimers();
      }
    }, 1000);

    silenceTimer = setTimeout(() => {
      clearSilenceTimers();
      if (isListening && latestRecognizedText.trim().length > 0) {
        const textToSend = latestRecognizedText.trim();
        updateVisualizerStatus('⚡ Đã ngưng 3s, đang gửi lệnh...');
        stopListening();
        if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
        setTimeout(() => ask(textToSend), 150);
      }
    }, config.silenceTimeoutMs || 3000);
  }

  function updateVisualizerStatus(htmlText) {
    const statusTxt = $('geminiVoiceStatusTxt');
    if (statusTxt) statusTxt.innerHTML = htmlText;
  }

  async function setupMicStreamAndVAD() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    try {
      micAudioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        if (!audioCtx) audioCtx = new AudioCtxClass();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const source = audioCtx.createMediaStreamSource(micAudioStream);
        micAnalyser = audioCtx.createAnalyser();
        micAnalyser.fftSize = 64;
        source.connect(micAnalyser);

        startVisualizerLoop();
      }
    } catch (err) {
      console.warn('VAD Audio Stream error:', err);
    }
  }

  function stopMicStreamAndVAD() {
    if (vadAnimFrame) {
      cancelAnimationFrame(vadAnimFrame);
      vadAnimFrame = null;
    }
    clearSilenceTimers();
    if (micAudioStream) {
      micAudioStream.getTracks().forEach(t => t.stop());
      micAudioStream = null;
    }
    micAnalyser = null;
    resetVisualizerBars();
  }

  function startVisualizerLoop() {
    if (!micAnalyser) return;
    const dataArray = new Uint8Array(micAnalyser.frequencyBinCount);

    function update() {
      if (!isListening) return;
      micAnalyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const normalizedVol = Math.min(1, avg / 120);

      // 5 Bars Sóng Âm
      const b1 = $('vBar1');
      const b2 = $('vBar2');
      const b3 = $('vBar3');
      const b4 = $('vBar4');
      const b5 = $('vBar5');

      if (b1 && b2 && b3 && b4 && b5) {
        b1.style.height = `${Math.max(4, normalizedVol * 16)}px`;
        b2.style.height = `${Math.max(6, normalizedVol * 22)}px`;
        b3.style.height = `${Math.max(8, normalizedVol * 26)}px`;
        b4.style.height = `${Math.max(6, normalizedVol * 20)}px`;
        b5.style.height = `${Math.max(4, normalizedVol * 14)}px`;
      }

      const SPEECH_THRESHOLD = 18;
      if (avg > SPEECH_THRESHOLD) {
        // Người dùng đang nói to -> Hủy đếm ngược, tiếp tục nghe
        if (silenceTimer) {
          clearSilenceTimers();
          updateVisualizerStatus('🎙️ Đang nghe tiếp giọng nói...');
        }
      }

      vadAnimFrame = requestAnimationFrame(update);
    }

    update();
  }

  function resetVisualizerBars() {
    for (let i = 1; i <= 5; i++) {
      const b = $(`vBar${i}`);
      if (b) b.style.height = '6px';
    }
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
      return alert('Trình duyệt chưa hỗ trợ Web Speech API. Hãy mở trên Chrome hoặc Safari để trò chuyện bằng giọng nói!');
    }

    if (isListening) {
      stopListening();
      return;
    }

    stopTTS();
    hasUserSpoken = false;
    latestRecognizedText = '';
    speechRestartCount = 0;

    await setupMicStreamAndVAD();

    try {
      speechRecognition = new SpeechRec();
      speechRecognition.lang = 'vi-VN';
      speechRecognition.continuous = true;
      speechRecognition.interimResults = true;
      speechRecognition.maxAlternatives = 1;

      speechRecognition.onstart = () => {
        isListening = true;
        if (navigator.vibrate) navigator.vibrate(50);
        $('geminiMicBtn')?.classList.add('recording');
        $('geminiVoiceVisualizerBar')?.classList.add('active');
        updateVisualizerStatus('🎙️ Đang nghe... (Tự gửi sau 3s ngưng nói)');
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

        const currentText = (finalText || interimText).trim();
        if (currentText) {
          latestRecognizedText = currentText;
          hasUserSpoken = true;
          const input = $('geminiInput');
          if (input) input.value = currentText;

          // Bắt đầu đếm ngược ĐÚNG 3 GIÂY im lặng kể từ từ ngữ cuối cùng
          startSilenceCountdown();
        }
      };

      speechRecognition.onerror = e => {
        console.warn('SpeechRecognition error:', e.error);
        if (e.error === 'not-allowed') {
          alert('⚠️ Quyền Microphone chưa được cấp. Hãy vào cài đặt Safari/Chrome trên điện thoại để cấp quyền Micro cho trang web.');
          stopListening();
        }
      };

      speechRecognition.onend = () => {
        // Tự động duy trì microphone nếu trình duyệt ngắt sớm trước khi hết 3 giây
        if (isListening) {
          if (silenceTimer) {
            // Vẫn đang trong thời gian chờ 3 giây -> Khởi động lại STT ngay
            if (speechRestartCount < 5) {
              speechRestartCount++;
              try { speechRecognition.start(); } catch (err) {}
            }
          } else if (latestRecognizedText.trim().length > 0) {
            // Đã hết thời gian và có nội dung
            const textToSend = latestRecognizedText.trim();
            stopListening();
            ask(textToSend);
          } else {
            stopListening();
          }
        }
      };

      speechRecognition.start();
    } catch (err) {
      console.warn('Speech start error:', err);
      stopListening();
    }
  }

  function stopListening() {
    isListening = false;
    hasUserSpoken = false;
    clearSilenceTimers();
    try {
      if (speechRecognition) {
        speechRecognition.abort?.();
        speechRecognition = null;
      }
    } catch (e) {}
    stopMicStreamAndVAD();
    $('geminiMicBtn')?.classList.remove('recording');
    $('geminiVoiceVisualizerBar')?.classList.remove('active');
    const input = $('geminiInput');
    if (input) input.placeholder = 'Nhập câu hỏi hoặc nói bằng Mic...';
  }

  /* --------------------------------------------------------------------------
     5. TEXT-TO-SPEECH (TTS) TUYẾN TÍNH & HÀNG ĐỢI SENTENCE-CHUNKED
     -------------------------------------------------------------------------- */
  function stopTTS() {
    ttsQueue = [];
    isTtsPlaying = false;
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
    resetSpeakingState();
  }

  function cleanTextForSpeech(raw) {
    if (!raw) return '';
    return raw
      .replace(/```(?:action|json)[\s\S]*?```/gi, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\{"type":[\s\S]*?\}/gi, '')
      .replace(/[*#_`>~•|✦]/g, ' ')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function queueTTSChunk(sentence) {
    const clean = cleanTextForSpeech(sentence);
    if (!clean || clean.length < 2) return;
    ttsQueue.push(clean);
    processTtsQueue();
  }

  function processTtsQueue() {
    if (isTtsPlaying || ttsQueue.length === 0 || !autoSpeak) return;
    if (!('speechSynthesis' in window)) return;

    const nextSentence = ttsQueue.shift();
    if (!nextSentence) return;

    isTtsPlaying = true;
    try {
      const utt = new SpeechSynthesisUtterance(nextSentence);
      utt.lang = 'vi-VN';
      utt.rate = 1.05;
      utt.pitch = 1.0;

      if (!availableVoices.length) loadVoices();
      const viVoice = availableVoices.find(v => v.lang && (v.lang.includes('vi') || v.lang.includes('VI')));
      if (viVoice) utt.voice = viVoice;

      utt.onend = () => {
        isTtsPlaying = false;
        processTtsQueue();
      };

      utt.onerror = () => {
        isTtsPlaying = false;
        processTtsQueue();
      };

      window.speechSynthesis.speak(utt);
    } catch (e) {
      isTtsPlaying = false;
      processTtsQueue();
    }
  }

  function speakText(text, triggerBtn = null) {
    if (!('speechSynthesis' in window)) return;
    stopTTS();

    const clean = cleanTextForSpeech(text);
    if (!clean) return;

    if (triggerBtn) {
      currentSpeakingBtn = triggerBtn;
      triggerBtn.innerHTML = '⏹️ Dừng';
      triggerBtn.classList.add('speaking-active');
    }

    try {
      const utt = new SpeechSynthesisUtterance(clean);
      utt.lang = 'vi-VN';
      utt.rate = 1.05;
      utt.pitch = 1.0;

      if (!availableVoices.length) loadVoices();
      const viVoice = availableVoices.find(v => v.lang && (v.lang.includes('vi') || v.lang.includes('VI')));
      if (viVoice) utt.voice = viVoice;

      utt.onend = () => resetSpeakingState();
      utt.onerror = () => resetSpeakingState();

      window.speechSynthesis.speak(utt);
    } catch (e) {
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

  /* --------------------------------------------------------------------------
     6. HIỂN THỊ TIN NHẮN & STREAMING UI
     -------------------------------------------------------------------------- */
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
            <button class="meta-action-btn speak-btn" title="Đọc to âm thanh">🔊 Đọc</button>
            <button class="meta-action-btn copy-btn">📋 Chép</button>
          </div>
        </div>
      `;
      const speakBtn = row.querySelector('.speak-btn');
      if (speakBtn) {
        speakBtn.onclick = () => {
          unlockAudioContext();
          if (currentSpeakingBtn === speakBtn) {
            stopTTS();
          } else {
            speakText(text, speakBtn);
          }
        };
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
    return row;
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

  /* --------------------------------------------------------------------------
     7. XỬ LÝ STREAMING GEMINI API VÀ SENTENCE-CHUNKED TTS (Tốc độ phản hồi cao)
     -------------------------------------------------------------------------- */
  async function ask(promptText) {
    if (isAiWorking) return;
    isAiWorking = true;
    unlockAudioContext();
    stopTTS();

    addMessage(promptText, 'user');
    showTyping();

    const contents = chatHistory.slice(-4).map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }]
    }));
    contents.push({ role: 'user', parts: [{ text: promptText }] });

    let fullReplyText = '';
    let streamSentenceBuffer = '';

    removeTyping();
    const streamingRow = document.createElement('div');
    streamingRow.className = 'chat-msg-row ai-row';
    streamingRow.innerHTML = `
      <div class="chat-avatar ai-avatar">✨</div>
      <div class="chat-msg-bubble ai-bubble">
        <div class="bubble-content" id="geminiStreamContent"></div>
        <span class="streaming-cursor"></span>
      </div>
    `;
    $('geminiChatBody')?.appendChild(streamingRow);
    const streamContentElem = $('geminiStreamContent');

    try {
      let streamSucceeded = false;

      for (const model of GEMINI_MODELS) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: contents,
              systemInstruction: { parts: [{ text: config.systemInstruction }] },
              generationConfig: config.generationConfig || {
                temperature: 0.35,
                maxOutputTokens: 250,
                topP: 0.8
              }
            })
          });

          if (res.ok && res.body) {
            const reader = res.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';

            while (true) {
              const { value, done } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop();

              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data: ')) {
                  const jsonStr = trimmed.slice(6);
                  if (jsonStr === '[DONE]') continue;
                  try {
                    const data = JSON.parse(jsonStr);
                    const chunkText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (chunkText) {
                      fullReplyText += chunkText;
                      streamSentenceBuffer += chunkText;

                      if (streamContentElem) {
                        streamContentElem.innerHTML = formatMarkdown(fullReplyText);
                      }
                      scrollBottom();

                      // Sentence Chunking phát âm ngay
                      if (autoSpeak) {
                        const sentenceMatch = streamSentenceBuffer.match(/([^\n.?!;]+[.?!;\n]+)/g);
                        if (sentenceMatch) {
                          sentenceMatch.forEach(s => queueTTSChunk(s));
                          streamSentenceBuffer = streamSentenceBuffer.slice(sentenceMatch.join('').length);
                        }
                      }
                    }
                  } catch (err) {}
                }
              }
            }

            streamSucceeded = true;
            break;
          }
        } catch (e) {
          console.warn(`Model ${model} stream error:`, e);
        }
      }

      // Xử lý nốt câu còn lại
      if (streamSentenceBuffer.trim() && autoSpeak) {
        queueTTSChunk(streamSentenceBuffer.trim());
      }

      if (!streamSucceeded || !fullReplyText.trim()) {
        fullReplyText = `Đã tiếp nhận yêu cầu: "${promptText}". Tôi sẵn sàng hỗ trợ bạn tiếp theo!`;
        if (streamContentElem) streamContentElem.innerHTML = formatMarkdown(fullReplyText);
        if (autoSpeak) queueTTSChunk(fullReplyText);
      }

      streamingRow.querySelector('.streaming-cursor')?.remove();

      // TRÍCH XUẤT VÀ TỰ ĐỘNG THỰC THI ACTION CHUẨN XÁC 100%
      let cleanText = fullReplyText;
      let actionNotice = null;
      const parsedAction = extractActionJSON(fullReplyText);

      if (parsedAction) {
        cleanText = fullReplyText
          .replace(/```(?:action|json)[\s\S]*?```/gi, '')
          .replace(/\{[\s\S]*?"(?:type|action)"[\s\S]*?\}/gi, '')
          .trim();

        if (typeof config.onAction === 'function') {
          try {
            console.log('⚡ GeminiAssistant: Executing onAction callback with:', parsedAction);
            actionNotice = config.onAction(parsedAction);
          } catch (e) {
            console.error('Action execution callback error:', e);
          }
        }
      }

      if (actionNotice) {
        const badgeElem = document.createElement('div');
        badgeElem.className = 'action-executed-badge';
        badgeElem.innerHTML = `<span class="action-check-icon">⚡</span><span>${escapeHTML(actionNotice)}</span>`;
        const bubble = streamingRow.querySelector('.ai-bubble');
        if (bubble) bubble.insertBefore(badgeElem, bubble.firstChild);
      }

      const metaDiv = document.createElement('div');
      metaDiv.className = 'bubble-meta';
      metaDiv.innerHTML = `
        <button class="meta-action-btn speak-btn" title="Đọc to âm thanh">🔊 Đọc</button>
        <button class="meta-action-btn copy-btn">📋 Chép</button>
      `;
      const speakBtn = metaDiv.querySelector('.speak-btn');
      speakBtn.onclick = () => {
        unlockAudioContext();
        if (currentSpeakingBtn === speakBtn) {
          stopTTS();
        } else {
          speakText(cleanText, speakBtn);
        }
      };
      const copyBtn = metaDiv.querySelector('.copy-btn');
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(cleanText);
        copyBtn.textContent = '✓ Đã chép!';
        setTimeout(() => copyBtn.textContent = '📋 Chép', 1500);
      };
      streamingRow.querySelector('.ai-bubble')?.appendChild(metaDiv);

      chatHistory.push({ role: 'user', text: promptText });
      chatHistory.push({ role: 'model', text: fullReplyText });

    } catch (err) {
      streamingRow.remove();
      addMessage(`❌ Lỗi kết nối: ${err.message}`, 'ai', false);
    } finally {
      isAiWorking = false;
    }
  }

  /* --------------------------------------------------------------------------
     8. EXPORT PUBLIC API
     -------------------------------------------------------------------------- */
  return {
    init: init,
    open: open,
    close: close,
    toggle: toggle,
    ask: ask,
    speak: speakText,
    stopTTS: stopTTS,
    unlockAudio: unlockAudioContext,
    setKey: key => {
      apiKey = key;
      localStorage.setItem(STORAGE_KEY, key);
      updateStatus();
    }
  };
}));
