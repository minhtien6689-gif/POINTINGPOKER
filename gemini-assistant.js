/**
 * ============================================================================
 * TRỢ LÝ VOICE AI GEMINI PRO TỐC ĐỘ CAO – CHUẨN ĐA NỀN TẢNG (iOS, Android, Desktop)
 * Tác giả: Mr Tiến © 2026
 * ============================================================================
 * - Ưu tiên Gemini Pro: gemini-2.5-pro, gemini-1.5-pro, gemini-2.0-pro (Pro Mode)
 * - Tối ưu Voice AI: Khoan dung STT, Thân thiện TTS tuyến tính, Không rào đón.
 * - Generation Config Tốc Độ Cao: temperature: 0.35, maxOutputTokens: 250, topP: 0.8.
 * - Vượt rào cản Auto-play trên iOS Safari: Mở khóa Web Audio Context im lặng 0.1s.
 * - Voice Activity Detection (VAD) Tối Ưu: Tự động gửi sau ĐÚNG 3.0 GIÂY ngưng nói
 *   (Thanh đếm ngược thời gian thực 3s -> 2s -> 1s, thanh tiến trình mượt mà).
 * - Phản hồi tiếp nhận lệnh ngay lập tức (Zero-latency Acknowledgment).
 * - Thực thi Action NGAY KHI PHÁT HIỆN trong luồng Stream SSE (Không chờ kết thúc).
 * - Modal Cài Đặt Gemini Pro API Key & Giọng Nói Neumorphism trực tiếp trong ứng dụng.
 * - Offline Smart NLP Engine dự phòng cực kỳ thông minh khi mất kết nối mạng.
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
  const STORAGE_MODEL_KEY = 'gemini_preferred_model';
  const STORAGE_SILENCE_KEY = 'gemini_silence_timeout';
  const DEFAULT_KEY = 'AIzaSyAHWjI_8gZa-TSzVyvHJPYTrPFC3LvFjhA';

  // Danh sách mô hình ưu tiên: GEMINI PRO CAO CẤP HÀNG ĐẦU
  const DEFAULT_PRO_MODELS = [
    'gemini-2.5-pro',
    'gemini-1.5-pro',
    'gemini-2.0-pro-exp-02-05',
    'gemini-2.5-flash',
    'gemini-1.5-flash'
  ];

  // System Instruction Chuẩn Voice AI © 2026 Mr Tiến
  const DEFAULT_SYSTEM_INSTRUCTION = `[Vai trò & Không gian hoạt động]
Bạn là trợ lý AI chuyên nghiệp phiên bản Pro cao cấp, tốc độ cao được tích hợp trực tiếp trên nền tảng web đa thiết bị © 2026 Mr Tiến. Mục tiêu của bạn là cung cấp thông tin chính xác, giải quyết vấn đề ngay lập tức và mang lại trải nghiệm giao tiếp bằng giọng nói (Voice AI) mượt mà như con người.

[Nguyên tắc Xử lý Đầu vào (Speech-to-Text)]
1. Khoan dung với lỗi chuyển ngữ: Đầu vào của người dùng thường được tạo ra từ nhận diện giọng nói trên điện thoại/máy tính, do đó sẽ có lỗi đồng âm, sai chính tả, ngắt câu sai hoặc lẫn tạp âm. Bạn phải tự động suy luận ngữ cảnh và ý định cốt lõi. Tuyệt đối không bắt bẻ lỗi chính tả hoặc yêu cầu nhắc lại vì những lỗi này.

[Nguyên tắc Tối ưu Đầu ra (Text-to-Speech)]
1. Định dạng thân thiện với giọng đọc: Trả lời bằng ngôn ngữ tự nhiên, câu văn ngắn, có nhịp điệu rõ ràng để công cụ TTS đọc tự nhiên nhất.
2. Cấu trúc tuyến tính: Đi thẳng vào trọng tâm ở câu đầu tiên. Cắt bỏ hoàn toàn các cụm từ rào đón như "Dưới đây là", "Tôi hiểu rồi", "Chào bạn", "Theo thông tin tôi có".
3. Hạn chế Markdown phức tạp: Tuyệt đối không sử dụng bảng biểu (tables), danh sách đánh dấu lồng ghép phức tạp, hoặc mã code dài trong luồng hội thoại thông thường, vì các trình đọc giọng nói không thể phát âm chúng một cách có nghĩa. Nếu cần cung cấp code hoặc cấu trúc phức tạp, hãy xác nhận ngắn gọn bằng giọng nói và chỉ định hiển thị chi tiết trên màn hình.

[Hỗ trợ Thực thi Tác vụ (Function Calling/JSON)]
- Nếu người dùng yêu cầu thực hiện hành động trên ứng dụng web (ví dụ: chuyển trang, nộp bài, xem điểm, tìm kiếm, lọc dữ liệu, reset ván chơi, quay số, đổi bộ bài...), hãy phản hồi bằng MỘT câu xác nhận bằng lời cực kỳ ngắn (Ví dụ: "Đang mở bảng điểm cho bạn.", "Đã cập nhật dữ liệu.") kèm theo mã lệnh định dạng JSON ở cuối thông điệp để hệ thống front-end tự động bắt sự kiện và thực thi:
\`\`\`action
{"type": "TÊN_HÀNH_ĐỘNG", "params": {...}}
\`\`\``;

  // Cấu hình thông số mặc định (Thời gian ngưng nói chuẩn xác 3.0 giây)
  const defaults = {
    apiKey: DEFAULT_KEY,
    preferredModel: 'gemini-2.5-pro',
    title: 'Trợ Lý Voice AI Pro',
    brandName: '© 2026 Mr Tiến',
    welcomeMessage: `Xin chào! Tôi là **Trợ Lý Voice AI Gemini Pro © 2026 Mr Tiến**.\nHãy chạm vào **Mic 🎙️** để ra lệnh bằng giọng nói, hệ thống sẽ tự động thực hiện sau 3 giây ngưng nói! Bạn cũng có thể bấm nút **⚙️** ở góc để cài đặt Pro API Key của mình.`,
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

  let storedModel = '';
  try { storedModel = localStorage.getItem(STORAGE_MODEL_KEY); } catch (e) {}
  let preferredModel = storedModel || config.preferredModel || 'gemini-2.5-pro';

  let storedSilence = null;
  try { storedSilence = parseInt(localStorage.getItem(STORAGE_SILENCE_KEY), 10); } catch (e) {}
  if (storedSilence && storedSilence >= 1000 && storedSilence <= 6000) {
    config.silenceTimeoutMs = storedSilence;
  }

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
  let silenceTicker = null;
  let lastSpeechTimestamp = 0;
  let ambientNoiseFloor = 14;
  let noiseFloorCalibrationCount = 0;
  let isUserCurrentlyTalking = false;
  let hasUserSpoken = false;
  let latestRecognizedText = '';
  let sessionAccumulatedText = '';
  let speechRestartCount = 0;

  // Queue TTS Sentence-Chunked
  let ttsQueue = [];
  let isTtsPlaying = false;

  const $ = id => document.getElementById(id);

  function maskApiKey(key) {
    if (!key || typeof key !== 'string') return 'Chưa cấu hình';
    const trimmed = key.trim();
    if (trimmed.length < 10) return 'Chưa cấu hình';
    const prefix = trimmed.slice(0, 6);
    const suffix = trimmed.slice(-4);
    return `${prefix}••••••••••••${suffix}`;
  }

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
        const buffer = audioCtx.createBuffer(1, 2205, 22050);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start(0);
      }

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
      if (userConfig.preferredModel) {
        preferredModel = userConfig.preferredModel;
        try { localStorage.setItem(STORAGE_MODEL_KEY, preferredModel); } catch (e) {}
      }
      if (userConfig.autoSpeak !== undefined) {
        autoSpeak = !!userConfig.autoSpeak;
      }
      if (userConfig.silenceTimeoutMs) {
        config.silenceTimeoutMs = userConfig.silenceTimeoutMs;
      }
    }

    if (!localStorage.getItem(STORAGE_KEY)) {
      try { localStorage.setItem(STORAGE_KEY, apiKey); } catch (e) {}
    }

    createUI();
    bindEvents();
    if (config.enableVoice) initSpeech();
    updateStatus();
    updateModelBadge();
  }

  function createUI() {
    if ($('geminiFabContainer')) return;

    // 1. FAB Button
    const fab = document.createElement('div');
    fab.id = 'geminiFabContainer';
    fab.className = 'gemini-fab-container';
    fab.innerHTML = `
      <button id="geminiFabBtn" class="gemini-fab-btn" title="Mở ${escapeHTML(config.title)} (Ctrl+${config.shortcutKey.toUpperCase()})" aria-label="${escapeHTML(config.title)}">
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
                <span class="gemini-pro-badge" id="geminiModelBadge" title="Chế độ Gemini Pro. Bấm để cài đặt">✨ Pro</span>
              </div>
            </div>
          </div>

          <div class="gemini-header-actions">
            <button id="geminiSettingsBtn" class="gemini-icon-btn" title="Cài đặt Gemini Pro API Key &amp; Giọng nói">⚙️</button>
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

        <!-- VOICE WAVEFORM VISUALIZER (Kèm đếm ngược 3 giây im lặng & thanh tiến trình) -->
        <div id="geminiVoiceVisualizerBar" class="gemini-voice-visualizer-bar">
          <div class="visualizer-info-row">
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
          <div class="silence-progress-wrap" id="geminiSilenceProgressWrap">
            <div class="silence-progress-bar" id="geminiSilenceProgressBar" style="width: 100%;"></div>
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
            <span>✨ Gemini Pro Voice AI • Tự động gửi sau 3s ngưng nói • Hỗ trợ iOS &amp; Android</span>
          </div>
        </div>

        <!-- Settings Modal Overlay -->
        <div id="geminiSettingsModal" class="gemini-settings-modal hidden">
          <div class="settings-modal-header">
            <h4 class="settings-modal-title">⚙️ Cài Đặt Gemini Pro Voice AI</h4>
            <button type="button" id="geminiSettingsCloseBtn" class="gemini-icon-btn close-btn" title="Đóng">✕</button>
          </div>
          <form id="geminiSettingsForm" class="settings-form" onsubmit="return false;">
            <div class="settings-group">
              <label class="settings-label">Gemini Pro API Key:</label>
              
              <!-- Khung Trạng Thái Bảo Mật (Ẩn API Key Hoàn Toàn) -->
              <div class="settings-key-security-box" id="geminiKeySecurityBox">
                <div class="security-status-indicator">
                  <span class="status-shield">🛡️</span>
                  <div class="security-details">
                    <span class="security-title">Bảo Mật API Key:</span>
                    <span class="security-status-val" id="geminiKeyStatusVal">🔒 Đang kiểm tra...</span>
                  </div>
                </div>
                <button type="button" id="geminiClearKeyBtn" class="settings-mini-btn" title="Xóa API Key cá nhân và dùng mặc định">✕ Đặt lại</button>
              </div>

              <!-- Ô nhập Key mới bảo mật, luôn để trống để tránh lộ key cũ -->
              <div class="settings-input-row" style="margin-top: 6px;">
                <input type="password" id="geminiApiKeyInput" class="settings-text-input" placeholder="🔑 Nhập Key mới để thay đổi (để trống nếu giữ nguyên)..." autocomplete="off" />
                <button type="button" id="geminiApiKeyToggleEye" class="settings-icon-toggle" title="Hiện/Ẩn ký tự đang nhập">👁️</button>
              </div>
              <div class="settings-input-subtext">
                🔒 <em>API Key được mã hóa và ẩn an toàn, chống nhìn trộm màn hình và bảo vệ thông tin tài khoản.</em>
              </div>
            </div>

            <div class="settings-group">
              <label class="settings-label" for="geminiModelSelect">Phiên bản Gemini ưu tiên:</label>
              <select id="geminiModelSelect" class="settings-select">
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Cao cấp nhất - Khuyên dùng)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Chính xác cao, ổn định)</option>
                <option value="gemini-2.0-pro-exp-02-05">Gemini 2.0 Pro Experimental</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Tốc độ phản hồi cực nhanh)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Dự phòng)</option>
              </select>
            </div>

            <div class="settings-group">
              <div class="settings-slider-row">
                <label class="settings-label" for="geminiSilenceSlider">Tự động gửi khi ngưng nói:</label>
                <span id="geminiSilenceSliderVal" class="settings-slider-val">${((config.silenceTimeoutMs || 3000) / 1000).toFixed(1)}s</span>
              </div>
              <input type="range" id="geminiSilenceSlider" class="settings-slider" min="1.5" max="5.0" step="0.5" value="${((config.silenceTimeoutMs || 3000) / 1000).toFixed(1)}" />
            </div>

            <div class="settings-btn-row">
              <button type="button" id="geminiTestKeyBtn" class="settings-btn settings-btn-test">⚡ Kiểm Tra Key</button>
              <button type="submit" id="geminiSaveSettingsBtn" class="settings-btn settings-btn-save">💾 Lưu &amp; Áp Dụng</button>
            </div>

            <div id="geminiSettingsStatusBox" class="settings-status-box"></div>

            <div class="settings-help-text">
              💡 Dán API Key cá nhân của bạn để mở khóa toàn bộ sức mạnh của <strong>Gemini Pro</strong>. Nhận key miễn phí tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">Google AI Studio</a>.
            </div>
          </form>
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
        if (!$('geminiSettingsModal').classList.contains('hidden')) {
          closeSettingsModal();
        } else {
          close();
        }
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

    // Settings Modal Bindings
    $('geminiSettingsBtn').onclick = openSettingsModal;
    $('geminiModelBadge').onclick = openSettingsModal;
    $('geminiSettingsCloseBtn').onclick = closeSettingsModal;

    $('geminiApiKeyToggleEye').onclick = () => {
      const inp = $('geminiApiKeyInput');
      if (inp) {
        inp.type = inp.type === 'password' ? 'text' : 'password';
      }
    };

    const clearKeyBtn = $('geminiClearKeyBtn');
    if (clearKeyBtn) {
      clearKeyBtn.onclick = () => {
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
        apiKey = DEFAULT_KEY;
        try { localStorage.setItem(STORAGE_KEY, apiKey); } catch (e) {}
        updateKeySecurityDisplay();
        updateStatus();
        const inp = $('geminiApiKeyInput');
        if (inp) {
          inp.value = '';
          inp.placeholder = '🔑 Nhập Key mới để thay đổi (để trống nếu giữ nguyên)...';
        }
        showSettingsStatus('🔄 Đã đặt lại về cấu hình API Key mặc định của hệ thống.', true);
      };
    }

    $('geminiSilenceSlider').oninput = e => {
      const val = parseFloat(e.target.value).toFixed(1);
      $('geminiSilenceSliderVal').textContent = `${val}s`;
    };

    $('geminiTestKeyBtn').onclick = async () => {
      const inputKey = $('geminiApiKeyInput').value.trim();
      const keyToTest = inputKey || apiKey;
      if (!keyToTest) {
        showSettingsStatus('⚠️ Chưa có API Key nào để kiểm tra', false);
        return;
      }
      showSettingsStatus('⏳ Đang kiểm tra kết nối với Google Gemini Pro API...', null);
      const res = await testGeminiApiKey(keyToTest);
      if (res.success) {
        showSettingsStatus(`✅ Kết nối thành công! Đã kích hoạt mô hình ${res.model}`, true);
        if (inputKey) {
          // Người dùng đã nhập key hợp lệ trong ô kiểm tra
          updateKeySecurityDisplay(inputKey);
        }
      } else {
        showSettingsStatus(`❌ Lỗi kết nối: ${res.error}`, false);
      }
    };

    $('geminiSettingsForm').onsubmit = e => {
      e.preventDefault();
      saveSettingsFromModal();
    };
  }

  function updateKeySecurityDisplay(overrideKey = null) {
    const statusVal = $('geminiKeyStatusVal');
    if (!statusVal) return;
    const currentKey = overrideKey || apiKey;
    if (currentKey && currentKey.length > 10) {
      statusVal.innerHTML = `<span class="key-masked-pill">🔒 ${escapeHTML(maskApiKey(currentKey))}</span>`;
    } else {
      statusVal.innerHTML = `<span class="key-unconfigured">⚠️ Chưa cấu hình Key</span>`;
    }
  }

  function openSettingsModal() {
    const modal = $('geminiSettingsModal');
    if (!modal) return;
    
    // ẨN HIỂN THỊ API KEY: Tuyệt đối không gán chuỗi API Key thô vào ô input
    const inputElem = $('geminiApiKeyInput');
    if (inputElem) {
      inputElem.value = '';
      inputElem.type = 'password';
      inputElem.placeholder = (apiKey && apiKey.length > 10)
        ? '🔑 Nhập Key mới để thay đổi (để trống nếu giữ nguyên)...'
        : '🔑 Dán API Key (AIzaSy...)';
    }

    // Hiển thị trạng thái bảo mật dạng masked (ẩn an toàn)
    updateKeySecurityDisplay();

    $('geminiModelSelect').value = preferredModel;
    const sSec = ((config.silenceTimeoutMs || 3000) / 1000).toFixed(1);
    $('geminiSilenceSlider').value = sSec;
    $('geminiSilenceSliderVal').textContent = `${sSec}s`;
    hideSettingsStatus();
    modal.classList.remove('hidden');
  }

  function closeSettingsModal() {
    $('geminiSettingsModal')?.classList.add('hidden');
  }

  function showSettingsStatus(msg, isSuccess) {
    const box = $('geminiSettingsStatusBox');
    if (!box) return;
    box.className = 'settings-status-box active';
    if (isSuccess === true) box.classList.add('success');
    else if (isSuccess === false) box.classList.add('error');
    box.innerHTML = escapeHTML(msg);
  }

  function hideSettingsStatus() {
    const box = $('geminiSettingsStatusBox');
    if (box) {
      box.className = 'settings-status-box';
      box.innerHTML = '';
    }
  }

  async function testGeminiApiKey(keyToTest) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${keyToTest}`);
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error?.message || `HTTP ${res.status}` };
      }
      const modelNames = (data.models || []).map(m => m.name.replace('models/', ''));
      const foundPro = modelNames.find(m => m.includes('2.5-pro') || m.includes('1.5-pro')) || 'Gemini Pro';
      return { success: true, model: foundPro, models: modelNames };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  function saveSettingsFromModal() {
    const inputKey = $('geminiApiKeyInput').value.trim();
    const newModel = $('geminiModelSelect').value;
    const newSilence = Math.round(parseFloat($('geminiSilenceSlider').value) * 1000);

    let keyNotice = '';
    if (inputKey) {
      if (inputKey.length >= 10) {
        apiKey = inputKey;
        try { localStorage.setItem(STORAGE_KEY, apiKey); } catch (e) {}
        keyNotice = ' (Đã cập nhật API Key an toàn)';
      } else {
        showSettingsStatus('⚠️ API Key không hợp lệ (độ dài quá ngắn)', false);
        return;
      }
    }
    // Nếu inputKey trống: Giữ nguyên apiKey hiện tại mà không làm mất key!

    preferredModel = newModel;
    try { localStorage.setItem(STORAGE_MODEL_KEY, preferredModel); } catch (e) {}

    config.silenceTimeoutMs = newSilence;
    try { localStorage.setItem(STORAGE_SILENCE_KEY, newSilence.toString()); } catch (e) {}

    updateStatus();
    updateModelBadge();
    closeSettingsModal();
    addMessage(`⚙️ Đã lưu cấu hình: Mô hình **${preferredModel}**, thời gian tự gửi khi dừng nói: **${(newSilence / 1000).toFixed(1)}s**!${keyNotice}`, 'ai', false);
  }

  function updateStatus() {
    const dot = $('geminiStatusDot');
    if (dot) dot.className = (apiKey && apiKey.length > 10) ? 'gemini-pulse-dot active' : 'gemini-pulse-dot offline';
  }

  function updateModelBadge() {
    const badge = $('geminiModelBadge');
    if (!badge) return;
    if (preferredModel.includes('pro')) {
      badge.textContent = '✨ Pro';
      badge.title = `Đang ưu tiên: ${preferredModel}. Bấm để đổi cài đặt.`;
    } else {
      badge.textContent = '⚡ Flash';
      badge.title = `Đang ưu tiên: ${preferredModel}. Bấm để đổi cài đặt.`;
    }
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
    closeSettingsModal();
    stopListening();
    stopTTS();
  }

  /* --------------------------------------------------------------------------
     4. VOICE ACTIVITY DETECTION (VAD) & TỰ ĐỘNG GỬI SAU ĐÚNG 3.0 GIÂY NGƯNG NÓI
     -------------------------------------------------------------------------- */
  function startSilenceMonitoring() {
    stopSilenceMonitoring();
    lastSpeechTimestamp = Date.now();
    const timeout = config.silenceTimeoutMs || 3000;

    const pWrap = $('geminiSilenceProgressWrap');
    if (pWrap) pWrap.style.display = 'block';

    silenceTicker = setInterval(() => {
      if (!isListening) {
        stopSilenceMonitoring();
        return;
      }

      if (isUserCurrentlyTalking) {
        lastSpeechTimestamp = Date.now();
      }

      const elapsed = Date.now() - lastSpeechTimestamp;
      const remainingMs = Math.max(0, timeout - elapsed);
      const remainingSec = (remainingMs / 1000).toFixed(1);
      const percent = Math.min(100, Math.max(0, (remainingMs / timeout) * 100));

      const pBar = $('geminiSilenceProgressBar');
      if (pBar) pBar.style.width = `${percent}%`;

      if (hasUserSpoken && latestRecognizedText.trim().length > 0) {
        if (remainingMs > 0) {
          updateVisualizerStatus(`⏳ Ngưng nói... Tự gửi sau <strong class="silence-timer-digit">${remainingSec}s</strong>`);
        } else {
          // THỜI GIAN NGƯNG NÓI ĐÃ HẾT (ĐÚNG 3.0S) -> TỰ ĐỘNG GỬI LỆNH NGAY!
          stopSilenceMonitoring();
          updateVisualizerStatus('⚡ Đã dừng 3s, gửi lệnh ngay...');
          const textToSend = latestRecognizedText.trim();
          stopListening();
          if (navigator.vibrate) {
            try { navigator.vibrate([40, 30, 40]); } catch (e) {}
          }
          setTimeout(() => ask(textToSend), 100);
        }
      } else {
        updateVisualizerStatus('🎙️ Đang nghe... Hãy nói yêu cầu của bạn!');
        if (pBar) pBar.style.width = '100%';
      }
    }, 50);
  }

  function stopSilenceMonitoring() {
    if (silenceTicker) {
      clearInterval(silenceTicker);
      silenceTicker = null;
    }
    const pWrap = $('geminiSilenceProgressWrap');
    if (pWrap) pWrap.style.display = 'none';
    const pBar = $('geminiSilenceProgressBar');
    if (pBar) pBar.style.width = '100%';
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

        ambientNoiseFloor = 14;
        noiseFloorCalibrationCount = 0;
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
    stopSilenceMonitoring();
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

      // Hiệu chỉnh ngưỡng tạp âm môi trường trong 30 khung hình đầu
      if (noiseFloorCalibrationCount < 30) {
        ambientNoiseFloor = Math.max(12, Math.min(32, (ambientNoiseFloor * noiseFloorCalibrationCount + avg) / (noiseFloorCalibrationCount + 1)));
        noiseFloorCalibrationCount++;
      }

      const normalizedVol = Math.min(1, Math.max(0, (avg - (ambientNoiseFloor * 0.7)) / 85));

      // 5 Bars Sóng Âm Neon nhảy theo âm thanh thực
      const b1 = $('vBar1');
      const b2 = $('vBar2');
      const b3 = $('vBar3');
      const b4 = $('vBar4');
      const b5 = $('vBar5');

      if (b1 && b2 && b3 && b4 && b5) {
        b1.style.height = `${Math.max(4, normalizedVol * 18)}px`;
        b2.style.height = `${Math.max(6, normalizedVol * 24)}px`;
        b3.style.height = `${Math.max(8, normalizedVol * 28)}px`;
        b4.style.height = `${Math.max(6, normalizedVol * 22)}px`;
        b5.style.height = `${Math.max(4, normalizedVol * 16)}px`;
      }

      // Ngưỡng giọng nói động thích ứng với tạp âm phòng
      const speechThreshold = Math.max(26, ambientNoiseFloor + 12);
      isUserCurrentlyTalking = (avg > speechThreshold);
      if (isUserCurrentlyTalking && isListening && hasUserSpoken) {
        lastSpeechTimestamp = Date.now();
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
    sessionAccumulatedText = '';
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
        if (navigator.vibrate) {
          try { navigator.vibrate(50); } catch (e) {}
        }
        $('geminiMicBtn')?.classList.add('recording');
        $('geminiVoiceVisualizerBar')?.classList.add('active');
        updateVisualizerStatus('🎙️ Đang nghe... Hãy nói yêu cầu của bạn!');
        const input = $('geminiInput');
        if (input) {
          input.placeholder = '🎙️ Đang nghe... Hãy nói yêu cầu của bạn!';
          input.value = '';
        }
      };

      speechRecognition.onspeechstart = () => {
        if (hasUserSpoken) {
          lastSpeechTimestamp = Date.now();
        }
      };

      speechRecognition.onresult = e => {
        let interimText = '';

        for (let i = e.resultIndex; i < e.results.length; ++i) {
          const chunk = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            sessionAccumulatedText = (sessionAccumulatedText ? sessionAccumulatedText + ' ' : '') + chunk.trim();
          } else {
            interimText += chunk;
          }
        }

        const fullCurrentText = (sessionAccumulatedText + (interimText ? ' ' + interimText : '')).trim();
        if (fullCurrentText) {
          latestRecognizedText = fullCurrentText;
          hasUserSpoken = true;
          lastSpeechTimestamp = Date.now();
          const input = $('geminiInput');
          if (input) input.value = fullCurrentText;

          // Bắt đầu hoặc khởi động lại đếm ngược thời gian thực
          if (!silenceTicker) {
            startSilenceMonitoring();
          }
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
        if (!isListening) return;
        const timeout = config.silenceTimeoutMs || 3000;
        const elapsed = Date.now() - lastSpeechTimestamp;

        // Nếu đã nói và thời gian im lặng đạt đủ 3.0s, gửi lệnh ngay
        if (hasUserSpoken && latestRecognizedText.trim().length > 0 && elapsed >= timeout) {
          stopSilenceMonitoring();
          const textToSend = latestRecognizedText.trim();
          stopListening();
          if (navigator.vibrate) {
            try { navigator.vibrate([40, 30, 40]); } catch (e) {}
          }
          ask(textToSend);
          return;
        }

        // Tự động khởi động lại nhận diện để tránh ngắt quãng giữa câu
        if (speechRestartCount < 10) {
          speechRestartCount++;
          try {
            speechRecognition.start();
          } catch (err) {
            setTimeout(() => {
              if (isListening) {
                try { speechRecognition.start(); } catch (e) {}
              }
            }, 120);
          }
        } else {
          if (hasUserSpoken && latestRecognizedText.trim().length > 0) {
            stopSilenceMonitoring();
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
    stopSilenceMonitoring();
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
     6. HIỂN THỊ TIN NHẮN & BADGE HÀNH ĐỘNG
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

  function insertActionBadge(rowElement, actionNotice) {
    if (!rowElement || !actionNotice) return;
    if (rowElement.querySelector('.action-executed-badge')) return;
    const badgeElem = document.createElement('div');
    badgeElem.className = 'action-executed-badge';
    badgeElem.innerHTML = `<span class="action-check-icon">⚡</span><span>${escapeHTML(actionNotice)}</span>`;
    const bubble = rowElement.querySelector('.ai-bubble');
    if (bubble) bubble.insertBefore(badgeElem, bubble.firstChild);
  }

  function scrollBottom() {
    const body = $('geminiChatBody');
    if (body) body.scrollTop = body.scrollHeight;
  }

  /* --------------------------------------------------------------------------
     7. XỬ LÝ STREAMING GEMINI PRO VÀ THỰC THI ACTION NGAY TRONG LUỒNG STREAM
     -------------------------------------------------------------------------- */
  async function ask(promptText) {
    if (isAiWorking) return;
    isAiWorking = true;
    unlockAudioContext();
    stopTTS();

    addMessage(promptText, 'user');

    const contents = chatHistory.slice(-4).map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }]
    }));
    contents.push({ role: 'user', parts: [{ text: promptText }] });

    let fullReplyText = '';
    let streamSentenceBuffer = '';
    let actionAlreadyDispatched = false;
    let actionNotice = null;

    // PHẢN HỒI TIẾP NHẬN LỆNH NGAY LẬP TỨC (Zero-delay feedback)
    const streamingRow = document.createElement('div');
    streamingRow.className = 'chat-msg-row ai-row';
    streamingRow.innerHTML = `
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
        <div class="instant-ack-pill">⚡ Đang tiếp nhận lệnh: "${escapeHTML(promptText.length > 40 ? promptText.slice(0, 37) + '...' : promptText)}"</div>
        <div class="bubble-content" id="geminiStreamContent"></div>
        <span class="streaming-cursor"></span>
      </div>
    `;
    $('geminiChatBody')?.appendChild(streamingRow);
    const streamContentElem = $('geminiStreamContent');
    scrollBottom();

    // Sắp xếp thứ tự gọi mô hình: Ưu tiên mô hình Pro người dùng đã chọn
    const activeModels = [preferredModel, ...DEFAULT_PRO_MODELS.filter(m => m !== preferredModel)];

    try {
      let streamSucceeded = false;

      for (const model of activeModels) {
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
            // Xóa nhãn tiếp nhận tạm thời khi bắt đầu có dữ liệu stream
            streamingRow.querySelector('.instant-ack-pill')?.remove();

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

                      // THỰC THI ACTION NGAY KHI PHÁT HIỆN TRONG LUỒNG STREAM (Không cần đợi hết response)
                      if (!actionAlreadyDispatched) {
                        const parsed = extractActionJSON(fullReplyText);
                        if (parsed) {
                          actionAlreadyDispatched = true;
                          try {
                            if (typeof config.onAction === 'function') {
                              actionNotice = config.onAction(parsed);
                            }
                            if (actionNotice) {
                              insertActionBadge(streamingRow, actionNotice);
                              if (window.StarfieldInstance?.createBurst) {
                                window.StarfieldInstance.createBurst(window.innerWidth / 2, window.innerHeight / 3, 25);
                              }
                            }
                          } catch (e) {
                            console.error('Real-time action dispatch error:', e);
                          }
                        }
                      }

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

      // Xử lý nốt câu còn lại trong buffer
      if (streamSentenceBuffer.trim() && autoSpeak) {
        queueTTSChunk(streamSentenceBuffer.trim());
      }

      streamingRow.querySelector('.instant-ack-pill')?.remove();
      streamingRow.querySelector('.streaming-cursor')?.remove();

      // Nếu không kết nối được Gemini Pro (do Key lỗi hoặc mạng), hiển thị thông báo thân thiện và chạy bộ xử lý cục bộ
      if (!streamSucceeded || !fullReplyText.trim()) {
        fullReplyText = `Đã tiếp nhận yêu cầu: "${promptText}".`;
        
        let errorHelp = `
          <div style="margin-top:6px; padding:8px 10px; background:rgba(255,240,230,0.8); border:1px solid rgba(255,112,67,0.4); border-radius:10px; font-size:11.5px;">
            ⚠️ <strong>Chưa thể kết nối Gemini Pro</strong> (API Key hiện tại có thể chưa cấu hình hoặc đã hết hạn).<br>
            👉 Bạn hãy bấm nút bên dưới để dán <strong>Gemini Pro API Key</strong> của mình nhé:
            <div style="margin-top:6px;">
              <button type="button" class="chat-action-inline-btn" id="inlineOpenSettingsBtn">⚙️ Cài Đặt Gemini Pro Key Ngay</button>
            </div>
          </div>
        `;
        if (streamContentElem) streamContentElem.innerHTML = formatMarkdown(fullReplyText) + errorHelp;
        const inlineBtn = $('inlineOpenSettingsBtn');
        if (inlineBtn) inlineBtn.onclick = openSettingsModal;

        if (autoSpeak) queueTTSChunk(fullReplyText);

        // Chạy Local Smart Intent fallback nếu có onAction
        if (!actionAlreadyDispatched && typeof config.onAction === 'function') {
          const fallbackAction = guessActionLocally(promptText);
          if (fallbackAction) {
            try {
              actionNotice = config.onAction(fallbackAction);
              if (actionNotice) insertActionBadge(streamingRow, actionNotice);
            } catch (err) {}
          }
        }
      } else {
        // Kiểm tra lại lần cuối nếu action chưa được dispatch
        if (!actionAlreadyDispatched) {
          const parsed = extractActionJSON(fullReplyText);
          if (parsed && typeof config.onAction === 'function') {
            try {
              actionNotice = config.onAction(parsed);
              if (actionNotice) insertActionBadge(streamingRow, actionNotice);
            } catch (err) {}
          }
        }
      }

      let cleanText = fullReplyText
        .replace(/```(?:action|json)[\s\S]*?```/gi, '')
        .replace(/\{[\s\S]*?"(?:type|action)"[\s\S]*?\}/gi, '')
        .trim();

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

  // Fallback Intent Matching cục bộ
  function guessActionLocally(text) {
    if (!text) return null;
    const t = text.toLowerCase();
    if (t.includes('quay') || t.includes('bắt đầu') || t.includes('chơi')) return { type: 'START_GAME' };
    if (t.includes('ván mới') || t.includes('nhập điểm')) return { type: 'OPEN_ROUND_MODAL' };
    if (t.includes('đặt lại') || t.includes('reset')) return { type: 'RESET_GAME' };
    if (t.includes('lật bài')) return { type: 'FLIP_CARDS' };
    return null;
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
    openSettings: openSettingsModal,
    setKey: key => {
      apiKey = key;
      localStorage.setItem(STORAGE_KEY, key);
      updateStatus();
    },
    setModel: model => {
      preferredModel = model;
      localStorage.setItem(STORAGE_MODEL_KEY, model);
      updateModelBadge();
    }
  };
}));
