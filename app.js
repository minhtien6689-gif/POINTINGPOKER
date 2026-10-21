/**
 * ==========================================================================
 * POINTINGPOKER — Mr Tiến Web App Tính Điểm Tiến Lên Miền Nam Thông Minh
 * Senior Fullstack Architecture — Single Page Application (SPA)
 * Tích Hợp Trợ Lý AI Gemini © 2026 Mr Tiến • Điều Khiển Bằng Giọng Nói 🎙️
 * ==========================================================================
 */

'use strict';

// ===== CONSTANTS & CONFIGURATION =====
const STORAGE_KEY = 'pointingpoker_state_v1';

const CHOP_ITEMS = [
    { key: 'heo_den', name: '🐷 Heo Đen', points: 1, desc: '+1đ / -1đ' },
    { key: 'heo_do', name: '🔴 Heo Đỏ', points: 2, desc: '+2đ / -2đ' },
    { key: 'doi_heo_den', name: '♠️♣️ Đôi Heo Đen', points: 2, desc: '+2đ / -2đ' },
    { key: 'doi_heo_do', name: '♥️♦️ Đôi Heo Đỏ', points: 4, desc: '+4đ / -4đ' },
    { key: 'ba_doi_thong', name: '🎴 3 Đôi Thông', points: 3, desc: '+3đ / -3đ' },
    { key: 'tu_quy', name: '👑 Tứ Quý', points: 4, desc: '+4đ / -4đ' },
    { key: 'bon_doi_thong', name: '⚡ 4 Đôi Thông', points: 5, desc: '+5đ / -5đ' }
];

// Thứ tự 4 người chơi mặc định: Tường, Trang, Thư, Diễm (Theo đúng yêu cầu của Mr Tiến)
const DEFAULT_PLAYERS = [
    { id: 'p1', name: 'Tường', color: '#FF7043', avatar: '👑' },
    { id: 'p2', name: 'Trang', color: '#FF4D8D', avatar: '⚡' },
    { id: 'p3', name: 'Thư', color: '#26C6A0', avatar: '🎯' },
    { id: 'p4', name: 'Diễm', color: '#7C3AED', avatar: '🔥' }
];

// ===== WEB AUDIO SYNTHESIZER (NO EXTERNAL FILES NEEDED) =====
class SoundFX {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTap() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(520, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(260, this.ctx.currentTime + 0.06);
            gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.06);
        } catch (e) { /* ignore audio error */ }
    }

    playRank(rank) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        try {
            const freqs = { 1: 880, 2: 659, 3: 523, 4: 392 };
            const freq = freqs[rank] || 440;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.15);
        } catch (e) { /* ignore */ }
    }

    playChop() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.18);
            gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.18);
        } catch (e) { /* ignore */ }
    }

    playCong() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(140, this.ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(90, this.ctx.currentTime + 0.25);
            gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.25);
        } catch (e) { /* ignore */ }
    }

    playVictory() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        try {
            const notes = [
                { f: 523.25, d: 0.15, t: 0 },
                { f: 659.25, d: 0.15, t: 0.14 },
                { f: 783.99, d: 0.15, t: 0.28 },
                { f: 1046.50, d: 0.45, t: 0.42 }
            ];
            notes.forEach(n => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(n.f, this.ctx.currentTime + n.t);
                gain.gain.setValueAtTime(0.2, this.ctx.currentTime + n.t);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + n.t + n.d);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(this.ctx.currentTime + n.t);
                osc.stop(this.ctx.currentTime + n.t + n.d);
            });
        } catch (e) { /* ignore */ }
    }

    playVoiceListen() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        try {
            const freqs = [440, 660, 880];
            freqs.forEach((f, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(f, this.ctx.currentTime + idx * 0.07);
                gain.gain.setValueAtTime(0.12, this.ctx.currentTime + idx * 0.07);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + (idx + 1) * 0.07);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(this.ctx.currentTime + idx * 0.07);
                osc.stop(this.ctx.currentTime + (idx + 1) * 0.07);
            });
        } catch (e) { /* ignore */ }
    }

    playVoiceSuccess() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        try {
            const freqs = [587.33, 880];
            freqs.forEach((f, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(f, this.ctx.currentTime + idx * 0.09);
                gain.gain.setValueAtTime(0.16, this.ctx.currentTime + idx * 0.09);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + (idx + 1) * 0.09 + 0.05);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(this.ctx.currentTime + idx * 0.09);
                osc.stop(this.ctx.currentTime + (idx + 1) * 0.09 + 0.05);
            });
        } catch (e) { /* ignore */ }
    }

    playToiTrang() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        try {
            const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
            notes.forEach((f, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(f, this.ctx.currentTime + idx * 0.06);
                gain.gain.setValueAtTime(0.15, this.ctx.currentTime + idx * 0.06);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + (idx + 1) * 0.06 + 0.1);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(this.ctx.currentTime + idx * 0.06);
                osc.stop(this.ctx.currentTime + (idx + 1) * 0.06 + 0.1);
            });
        } catch (e) { /* ignore */ }
    }
}

const Sound = new SoundFX();

// Haptic vibration feedback for mobile devices
function hapticFeedback(pattern = 15) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(pattern); } catch (e) { /* ignore */ }
    }
}

// Unlock Web Audio API on first user gesture for Mobile Safari / Android Chrome
function unlockAudioOnGesture() {
    const unlock = () => {
        Sound.init();
        ['click', 'touchstart', 'touchend', 'keydown'].forEach(evt => {
            window.removeEventListener(evt, unlock);
        });
    };
    ['click', 'touchstart', 'touchend', 'keydown'].forEach(evt => {
        window.addEventListener(evt, unlock, { once: true, passive: true });
    });
}
unlockAudioOnGesture();

// ===== TIẾNG VIỆT VOICE NLP PARSER (TIẾN LÊN MIỀN NAM) =====
function removeVietnameseAccents(str) {
    if (!str) return '';
    return str.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .toLowerCase();
}

function parseVietnameseRoundSpeech(transcript, players) {
    const raw = (transcript || '').toLowerCase().trim();
    const clean = removeVietnameseAccents(raw);

    const result = {
        isToiTrang: false,
        toiTrangPlayerId: null,
        ranks: {},
        chops: [],
        congPlayers: [],
        denCongPlayerId: null,
        recognizedText: transcript
    };

    // 1. Tới Trắng check
    if (clean.includes('toi trang') || clean.includes('thang trang') || clean.includes('an trang')) {
        result.isToiTrang = true;
        for (const p of players) {
            const pClean = removeVietnameseAccents(p.name);
            if (clean.includes(pClean)) {
                result.toiTrangPlayerId = p.id;
                break;
            }
        }
        return result;
    }

    // 2. Ranks check (1, 2, 3, 4)
    const rankTerms = {
        1: ['nhat', 've nhat', 'hang nhat', 'dung dau', 've dau', 'an', 'mot', '1'],
        2: ['nhi', 've nhi', 'hang nhi', 'hai', '2'],
        3: ['ba', 've ba', 'hang ba', 'thu ba', '3'],
        4: ['chot', 've chot', 'bet', 've bet', 'bon', 'tu', 'hang bon', 'doi so', 'cuoi', '4']
    };

    players.forEach(p => {
        const pClean = removeVietnameseAccents(p.name);
        for (const [rankStr, terms] of Object.entries(rankTerms)) {
            const rank = parseInt(rankStr, 10);
            for (const term of terms) {
                const regex1 = new RegExp(`${pClean}[\\s,]+(?:la|ve|duoc|hang)?\\s*${term}\\b`, 'i');
                const regex2 = new RegExp(`\\b${term}\\s+(?:la|ve|thuoc ve)?\\s*${pClean}\\b`, 'i');
                if (regex1.test(clean) || regex2.test(clean)) {
                    result.ranks[p.id] = rank;
                    break;
                }
            }
        }
    });

    // If 3 ranks determined, assign 4th automatically
    const assignedRanks = Object.values(result.ranks);
    const assignedPlayers = Object.keys(result.ranks);
    if (assignedPlayers.length === 3 && new Set(assignedRanks).size === 3) {
        const missingRank = [1, 2, 3, 4].find(r => !assignedRanks.includes(r));
        const missingPlayer = players.find(p => !assignedPlayers.includes(p.id));
        if (missingRank && missingPlayer) {
            result.ranks[missingPlayer.id] = missingRank;
        }
    }

    // 3. Chặt Heo check
    if (clean.includes('chat')) {
        const isRed = clean.includes('do');
        const pts = isRed ? 2 : 1;
        const itemKey = isRed ? 'heo_do' : 'heo_den';
        const itemName = isRed ? '🔴 Heo Đỏ' : '🐷 Heo Đen';

        let chopper = null;
        let chopped = null;
        players.forEach(p => {
            const pClean = removeVietnameseAccents(p.name);
            const chopIdx = clean.indexOf('chat');
            const pIdx = clean.indexOf(pClean);
            if (pIdx !== -1) {
                if (pIdx < chopIdx && !chopper) {
                    chopper = p;
                } else if (pIdx > chopIdx && !chopped) {
                    chopped = p;
                }
            }
        });

        if (chopper && chopped && chopper.id !== chopped.id) {
            result.chops.push({
                id: 'chop_voice_' + Date.now(),
                chopperId: chopper.id,
                choppedId: chopped.id,
                itemKey,
                itemName,
                points: pts
            });
        }
    }

    // 4. Cóng check
    if (clean.includes('cong') || clean.includes('chay bai')) {
        players.forEach(p => {
            const pClean = removeVietnameseAccents(p.name);
            if (clean.includes(`${pClean} cong`) || clean.includes(`${pClean} bi cong`) || clean.includes(`cong ${pClean}`)) {
                result.congPlayers.push(p.id);
            }
        });
        if (clean.includes('den')) {
            players.forEach(p => {
                const pClean = removeVietnameseAccents(p.name);
                if (clean.includes(`${pClean} den`) || clean.includes(`den ${pClean}`)) {
                    result.denCongPlayerId = p.id;
                }
            });
        }
    }

    return result;
}

// ===== APPLICATION STATE STORE =====
class Store {
    constructor() {
        this.state = this.loadInitialState();
        this.listeners = [];
    }

    loadInitialState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.players && parsed.players.length === 4) {
                    // Tự động di chuyển tên người chơi cũ sang Tường, Trang, Thư, Diễm nếu chưa chơi hoặc mang tên cũ
                    const oldNames = ['Tiến', 'Minh', 'Tuấn', 'Hùng', 'minh', 'an', 'Người 1', 'Người 2'];
                    const hasOldDefault = parsed.players.some(p => oldNames.includes(p.name));
                    if (hasOldDefault && (!parsed.rounds || parsed.rounds.length === 0)) {
                        parsed.players = DEFAULT_PLAYERS.map(p => ({
                            id: p.id,
                            name: p.name,
                            color: p.color,
                            avatar: p.avatar,
                            score: 0, wins: 0, seconds: 0, thirds: 0, fourths: 0, chopsGiven: 0, chopsTaken: 0, congCount: 0
                        }));
                    }
                    return parsed;
                }
            }
        } catch (e) {
            console.error('Error loading state from localStorage:', e);
        }

        return {
            gameStatus: 'SETUP', // 'SETUP' | 'PLAYING' | 'GAMEOVER'
            targetScore: 50,
            players: DEFAULT_PLAYERS.map(p => ({
                id: p.id,
                name: p.name,
                color: p.color,
                avatar: p.avatar,
                score: 0,
                wins: 0,
                seconds: 0,
                thirds: 0,
                fourths: 0,
                chopsGiven: 0,
                chopsTaken: 0,
                congCount: 0
            })),
            rounds: [],
            settings: {
                soundEnabled: true
            }
        };
    }

    saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        } catch (e) {
            console.error('Error saving state to localStorage:', e);
        }
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.saveState();
        this.listeners.forEach(fn => fn(this.state));
    }

    getState() {
        return this.state;
    }

    // Actions
    startGame(names, targetScore) {
        this.state.targetScore = parseInt(targetScore, 10) || 50;
        this.state.players = this.state.players.map((p, idx) => ({
            ...p,
            name: (names[idx] && names[idx].trim()) || DEFAULT_PLAYERS[idx].name,
            score: 0,
            wins: 0,
            seconds: 0,
            thirds: 0,
            fourths: 0,
            chopsGiven: 0,
            chopsTaken: 0,
            congCount: 0
        }));
        this.state.rounds = [];
        this.state.gameStatus = 'PLAYING';
        this.notify();
    }

    addRound(roundData) {
        // Calculate points based on logic rules
        const calcResult = calculateRoundPoints(roundData, this.state.players);

        const newRound = {
            id: 'round_' + Date.now(),
            roundNumber: this.state.rounds.length + 1,
            timestamp: new Date().toISOString(),
            isToiTrang: roundData.isToiTrang,
            toiTrangPlayerId: roundData.toiTrangPlayerId,
            ranks: roundData.ranks,
            chops: roundData.chops,
            congPlayers: roundData.congPlayers,
            denCongPlayerId: roundData.denCongPlayerId,
            deltas: calcResult.deltas,
            breakdowns: calcResult.breakdowns,
            summary: calcResult.summary
        };

        this.state.rounds.push(newRound);

        // Update player cumulative stats
        this.state.players = this.state.players.map(p => {
            const delta = calcResult.deltas[p.id] || 0;
            const newScore = p.score + delta;

            const isWinner = roundData.isToiTrang
                ? roundData.toiTrangPlayerId === p.id
                : roundData.ranks[p.id] === 1;

            const isSecond = !roundData.isToiTrang && roundData.ranks[p.id] === 2;
            const isThird = !roundData.isToiTrang && roundData.ranks[p.id] === 3;
            const isFourth = !roundData.isToiTrang && roundData.ranks[p.id] === 4;

            // Chops count
            const chopsGiven = (roundData.chops || []).filter(c => c.chopperId === p.id).length;
            const chopsTaken = (roundData.chops || []).filter(c => c.choppedId === p.id).length;
            const isCong = (roundData.congPlayers || []).includes(p.id);

            return {
                ...p,
                score: newScore,
                wins: p.wins + (isWinner ? 1 : 0),
                seconds: p.seconds + (isSecond ? 1 : 0),
                thirds: p.thirds + (isThird ? 1 : 0),
                fourths: p.fourths + (isFourth ? 1 : 0),
                chopsGiven: p.chopsGiven + chopsGiven,
                chopsTaken: p.chopsTaken + chopsTaken,
                congCount: p.congCount + (isCong ? 1 : 0)
            };
        });

        // Check Game Over condition: Any player reached or exceeded targetScore
        const maxScore = Math.max(...this.state.players.map(p => p.score));
        if (maxScore >= this.state.targetScore) {
            this.state.gameStatus = 'GAMEOVER';
        }

        this.notify();
    }

    undoLastRound() {
        if (this.state.rounds.length === 0) return;
        const lastRound = this.state.rounds.pop();

        // Revert scores
        this.state.players = this.state.players.map(p => {
            const delta = lastRound.deltas[p.id] || 0;
            const isWinner = lastRound.isToiTrang
                ? lastRound.toiTrangPlayerId === p.id
                : lastRound.ranks[p.id] === 1;

            const isSecond = !lastRound.isToiTrang && lastRound.ranks[p.id] === 2;
            const isThird = !lastRound.isToiTrang && lastRound.ranks[p.id] === 3;
            const isFourth = !lastRound.isToiTrang && lastRound.ranks[p.id] === 4;

            const chopsGiven = (lastRound.chops || []).filter(c => c.chopperId === p.id).length;
            const chopsTaken = (lastRound.chops || []).filter(c => c.choppedId === p.id).length;
            const isCong = (lastRound.congPlayers || []).includes(p.id);

            return {
                ...p,
                score: p.score - delta,
                wins: Math.max(0, p.wins - (isWinner ? 1 : 0)),
                seconds: Math.max(0, p.seconds - (isSecond ? 1 : 0)),
                thirds: Math.max(0, p.thirds - (isThird ? 1 : 0)),
                fourths: Math.max(0, p.fourths - (isFourth ? 1 : 0)),
                chopsGiven: Math.max(0, p.chopsGiven - chopsGiven),
                chopsTaken: Math.max(0, p.chopsTaken - chopsTaken),
                congCount: Math.max(0, p.congCount - (isCong ? 1 : 0))
            };
        });

        if (this.state.gameStatus === 'GAMEOVER') {
            this.state.gameStatus = 'PLAYING';
        }

        this.notify();
    }

    resetGame() {
        this.state.gameStatus = 'SETUP';
        this.state.rounds = [];
        this.state.players = DEFAULT_PLAYERS.map(p => ({
            id: p.id,
            name: p.name,
            color: p.color,
            avatar: p.avatar,
            score: 0,
            wins: 0,
            seconds: 0,
            thirds: 0,
            fourths: 0,
            chopsGiven: 0,
            chopsTaken: 0,
            congCount: 0
        }));
        this.notify();
    }

    restartWithSamePlayers() {
        this.state.gameStatus = 'PLAYING';
        this.state.rounds = [];
        this.state.players = this.state.players.map(p => ({
            ...p,
            score: 0,
            wins: 0,
            seconds: 0,
            thirds: 0,
            fourths: 0,
            chopsGiven: 0,
            chopsTaken: 0,
            congCount: 0
        }));
        this.notify();
    }

    increaseTargetScore(amount) {
        this.state.targetScore += amount;
        this.state.gameStatus = 'PLAYING';
        this.notify();
    }

    toggleSound() {
        this.state.settings.soundEnabled = !this.state.settings.soundEnabled;
        Sound.enabled = this.state.settings.soundEnabled;
        this.notify();
    }
}

const AppStore = new Store();
Sound.enabled = AppStore.getState().settings.soundEnabled;

// ==========================================================================
// SCORING ENGINE (LOGIC TOÁN HỌC CHUẨN XÁC 100% THEO ĐỀ BÀI)
// ==========================================================================
function calculateRoundPoints(roundData, players) {
    const deltas = {};
    const breakdowns = {};
    players.forEach(p => {
        deltas[p.id] = 0;
        breakdowns[p.id] = [];
    });

    // Ngoại lệ 1: TỚI TRẮNG
    if (roundData.isToiTrang) {
        const winnerId = roundData.toiTrangPlayerId;
        if (winnerId) {
            deltas[winnerId] = 9;
            breakdowns[winnerId].push({ label: 'Tới trắng', points: 9 });
            players.forEach(p => {
                if (p.id !== winnerId) {
                    deltas[p.id] = 0;
                    breakdowns[p.id].push({ label: 'Thua tới trắng', points: 0 });
                }
            });
        }
        return {
            deltas,
            breakdowns,
            summary: {
                type: 'TOI_TRANG',
                winnerId
            }
        };
    }

    // Trường hợp bình thường:
    // A. Điểm thứ hạng cơ bản: Nhất +3, Nhì +2, Ba +1, Chót 0
    const rankPoints = { 1: 3, 2: 2, 3: 1, 4: 0 };
    let winnerId = null;

    players.forEach(p => {
        const rank = roundData.ranks ? roundData.ranks[p.id] : null;
        if (rank) {
            const basePts = rankPoints[rank] || 0;
            deltas[p.id] += basePts;
            const rankNames = { 1: 'Về Nhất', 2: 'Về Nhì', 3: 'Về Ba', 4: 'Về Chót' };
            breakdowns[p.id].push({ label: `${rankNames[rank]}`, points: basePts });
            if (rank === 1) {
                winnerId = p.id;
            }
        }
    });

    // C. Điểm Chặt Heo/Hàng:
    if (roundData.chops && Array.isArray(roundData.chops)) {
        roundData.chops.forEach(chop => {
            const pts = parseInt(chop.points, 10) || 0;
            if (chop.chopperId && chop.choppedId && chop.chopperId !== chop.choppedId) {
                deltas[chop.chopperId] += pts;
                deltas[chop.choppedId] -= pts;

                const chopperName = players.find(p => p.id === chop.chopperId)?.name || 'Người chơi';
                const choppedName = players.find(p => p.id === chop.choppedId)?.name || 'Người chơi';

                breakdowns[chop.chopperId].push({
                    label: `Chặt ${chop.itemName || 'hàng'} (${choppedName})`,
                    points: pts
                });
                breakdowns[chop.choppedId].push({
                    label: `Bị chặt ${chop.itemName || 'hàng'} (${chopperName})`,
                    points: -pts
                });
            }
        });
    }

    // D. Điểm Cóng & Đền Cóng:
    const congPlayers = roundData.congPlayers || [];
    const congCount = congPlayers.length;

    if (congCount > 0 && winnerId) {
        const totalCongPenalty = congCount * 6; // -6 điểm mỗi người

        // Người Về Nhất nhận toàn bộ tổng điểm phạt
        deltas[winnerId] += totalCongPenalty;
        breakdowns[winnerId].push({
            label: `Ăn cóng (${congCount} người)`,
            points: totalCongPenalty
        });

        // Kiểm tra có người Đền Cóng không?
        if (roundData.denCongPlayerId) {
            // Trường hợp ĐỀN CÓNG: Người đền gánh thay TOÀN BỘ những người bị cóng
            const denId = roundData.denCongPlayerId;
            deltas[denId] -= totalCongPenalty;
            breakdowns[denId].push({
                label: `Đền cóng thay ${congCount} người`,
                points: -totalCongPenalty
            });

            // Các người cóng thực tế không bị trừ điểm
            congPlayers.forEach(cId => {
                breakdowns[cId].push({
                    label: 'Bị cóng (Được người khác đền)',
                    points: 0
                });
            });
        } else {
            // Trường hợp bình thường (KHÔNG AI ĐỀN): Mỗi người cóng tự chịu -6đ
            congPlayers.forEach(cId => {
                deltas[cId] -= 6;
                breakdowns[cId].push({
                    label: 'Phạt cóng',
                    points: -6
                });
            });
        }
    }

    return {
        deltas,
        breakdowns,
        summary: {
            type: 'NORMAL',
            winnerId,
            chopsCount: (roundData.chops || []).length,
            congCount
        }
    };
}

// ==========================================================================
// TOAST NOTIFICATION UTILITY
// ==========================================================================
function showToast(message, duration = 2500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px) scale(0.9)';
        toast.style.transition = 'all 0.25s ease';
        setTimeout(() => toast.remove(), 250);
    }, duration);
}

// ==========================================================================
// RENDERERS: VIEWS & MODALS
// ==========================================================================

function renderApp() {
    const state = AppStore.getState();
    const root = document.getElementById('app-root');
    if (!root) return;

    // Update sound icon in header
    const soundIcon = document.getElementById('sound-icon');
    if (soundIcon) {
        soundIcon.textContent = state.settings.soundEnabled ? '🔊' : '🔇';
    }

    if (state.gameStatus === 'SETUP') {
        renderSetupView(root, state);
    } else {
        renderDashboardView(root, state);
    }

    // Check if Game Over Modal should display
    if (state.gameStatus === 'GAMEOVER') {
        renderGameOverModal(state);
    }
}

// ----- VIEW 1: SETUP SCREEN -----
function renderSetupView(container, state) {
    const hasPreviousRounds = state.rounds && state.rounds.length > 0;

    let resumeHtml = '';
    if (hasPreviousRounds) {
        resumeHtml = `
            <div class="resume-box">
                <div class="resume-info">
                    Đang có ván đấu dở dang (<strong>${state.rounds.length} ván</strong> đã chơi).
                </div>
                <div class="resume-actions">
                    <button class="btn-sm btn-sm-primary" id="btn-resume-game">Tiếp tục chơi</button>
                    <button class="btn-sm btn-sm-ghost" id="btn-discard-game">Chơi mới</button>
                </div>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="setup-container">
            <!-- Hero Sparkling Title -->
            <div class="hero-header">
                <div class="hero-title">
                    <span class="line-1">TIẾN LÊN MIỀN NAM</span>
                    <h1 class="line-2">
                        <span class="sparkle-icon">✦</span>
                        POINTING POKER
                        <span class="sparkle-icon sparkle-icon--right">✦</span>
                    </h1>
                    <span class="line-3">BẢNG GHI & TÍNH ĐIỂM THÔNG MINH BẬC NHẤT</span>
                </div>
                <p class="hero-subtitle">Tự động tính thứ hạng, chặt heo, cóng, đền cóng & hỗ trợ ra lệnh bằng Giọng Nói AI</p>
            </div>

            ${resumeHtml}

            <!-- Setup Form Card -->
            <div class="neu-card">
                <div class="setup-card-title">
                    <span>🎴</span> Thiết lập 4 người chơi
                </div>

                <!-- Nút nạp nhanh 4 người chơi mặc định: Tường - Trang - Thư - Diễm -->
                <button type="button" class="quick-fill-names-chip" id="btn-quick-fill-default-names">
                    <span>🔄</span> Mặc định: <strong>Tường • Trang • Thư • Diễm</strong>
                </button>

                <div class="setup-group">
                    <label class="setup-label">Tên 4 cơ thủ trên chiếu bài:</label>
                    <div class="players-grid">
                        ${state.players.map((p, idx) => `
                            <div class="player-input-card">
                                <div class="player-avatar-badge player-avatar-${idx + 1}">${p.avatar || (idx + 1)}</div>
                                <input type="text" class="player-name-input" id="player-input-${idx}" 
                                       value="${p.name}" placeholder="${DEFAULT_PLAYERS[idx].name}" maxlength="15" autocomplete="off">
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="setup-group">
                    <label class="setup-label">Số điểm đích để kết thúc trận (Target Score):</label>
                    <div class="target-score-wrapper">
                        <div class="chips-row">
                            <button type="button" class="chip-btn ${state.targetScore === 30 ? 'active' : ''}" data-target="30">30 điểm</button>
                            <button type="button" class="chip-btn ${state.targetScore === 50 ? 'active' : ''}" data-target="50">50 điểm (Khuyên dùng)</button>
                            <button type="button" class="chip-btn ${state.targetScore === 100 ? 'active' : ''}" data-target="100">100 điểm</button>
                        </div>
                        <div class="custom-target-input-wrap">
                            <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted);">Tùy chỉnh:</span>
                            <input type="number" id="custom-target-input" class="custom-target-input" 
                                   value="${state.targetScore}" min="10" max="500" step="5">
                            <span style="font-size: 0.85rem; font-weight: 700; color: var(--primary);">điểm</span>
                        </div>
                    </div>
                </div>

                <button type="button" class="btn-primary-action" id="btn-start-game">
                    <span>🚀</span> BẮT ĐẦU TRẬN ĐẤU
                </button>
            </div>
        </div>
    `;

    // Event Listeners for Setup
    const startBtn = document.getElementById('btn-start-game');
    const customTargetInput = document.getElementById('custom-target-input');
    const chipBtns = container.querySelectorAll('.chip-btn');
    const quickFillBtn = document.getElementById('btn-quick-fill-default-names');

    if (quickFillBtn) {
        quickFillBtn.addEventListener('click', () => {
            Sound.playTap();
            DEFAULT_PLAYERS.forEach((dp, idx) => {
                const inp = document.getElementById(`player-input-${idx}`);
                if (inp) inp.value = dp.name;
            });
            showToast('✅ Đã nạp 4 tên mặc định: Tường, Trang, Thư, Diễm!');
        });
    }

    chipBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            Sound.playTap();
            chipBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (customTargetInput) {
                customTargetInput.value = btn.dataset.target;
            }
        });
    });

    if (customTargetInput) {
        customTargetInput.addEventListener('input', () => {
            const val = parseInt(customTargetInput.value, 10);
            chipBtns.forEach(b => {
                if (parseInt(b.dataset.target, 10) === val) {
                    b.classList.add('active');
                } else {
                    b.classList.remove('active');
                }
            });
        });
    }

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            Sound.playTap();
            const names = [
                document.getElementById('player-input-0')?.value || DEFAULT_PLAYERS[0].name,
                document.getElementById('player-input-1')?.value || DEFAULT_PLAYERS[1].name,
                document.getElementById('player-input-2')?.value || DEFAULT_PLAYERS[2].name,
                document.getElementById('player-input-3')?.value || DEFAULT_PLAYERS[3].name
            ];
            const targetScore = parseInt(customTargetInput?.value, 10) || 50;
            AppStore.startGame(names, targetScore);
            showToast('🔥 Trận đấu bắt đầu! Chúc 4 cơ thủ may mắn!');
        });
    }

    const resumeBtn = document.getElementById('btn-resume-game');
    if (resumeBtn) {
        resumeBtn.addEventListener('click', () => {
            Sound.playTap();
            AppStore.state.gameStatus = 'PLAYING';
            AppStore.notify();
            showToast('Đã khôi phục ván đấu gần nhất!');
        });
    }

    const discardBtn = document.getElementById('btn-discard-game');
    if (discardBtn) {
        discardBtn.addEventListener('click', () => {
            Sound.playTap();
            openResetConfirmModal();
        });
    }
}

// ----- VIEW 2: DASHBOARD SCREEN -----
function renderDashboardView(container, state) {
    // Sort players by total score descending for leaderboard display
    const sortedPlayers = [...state.players].sort((a, b) => b.score - a.score);
    const leader = sortedPlayers[0];
    const totalRounds = state.rounds.length;

    // Last round score changes
    const lastRound = totalRounds > 0 ? state.rounds[totalRounds - 1] : null;

    container.innerHTML = `
        <div class="dashboard-container">
            <!-- Header Title -->
            <div class="hero-header" style="margin-bottom: 16px;">
                <div class="hero-title">
                    <span class="line-1">TIẾN LÊN MIỀN NAM</span>
                    <h1 class="line-2" style="font-size: clamp(1.5rem, 5.5vw, 2.1rem);">
                        <span class="sparkle-icon">✦</span>
                        BẢNG ĐIỂM CHÍNH
                        <span class="sparkle-icon sparkle-icon--right">✦</span>
                    </h1>
                </div>
            </div>

            <!-- DESKTOP 2-COLUMN LAYOUT -->
            <div class="dashboard-layout-desktop">
                <!-- CỘT TRÁI (LEFT COLUMN): Bảng Xếp Hạng & Cụm Nút Hành Động -->
                <div class="dashboard-col-left">
                    <!-- Pill Stats Bar (1 row on mobile as required by GEMINI.md) -->
                    <div class="pill-stats-bar">
                        <div class="pill-stat-col">
                            <span class="stat-label">Đã chơi</span>
                            <span class="stat-value">${totalRounds} ván</span>
                        </div>
                        <div class="pill-stat-col">
                            <span class="stat-label">Điểm đích</span>
                            <span class="stat-value highlight">${state.targetScore}đ</span>
                        </div>
                        <div class="pill-stat-col">
                            <span class="stat-label">Dẫn đầu</span>
                            <span class="stat-value" style="color: #FFB300;">
                                ${leader.name} (${leader.score}đ)
                            </span>
                        </div>
                    </div>

                    <!-- Leaderboard Header -->
                    <div class="leaderboard-title">
                        <h2><span>🏆</span> Bảng xếp hạng 4 cơ thủ</h2>
                        <span class="match-target-badge">Mục tiêu: ${state.targetScore} điểm</span>
                    </div>

                    <!-- Leaderboard Cards -->
                    <div class="leaderboard-grid">
                        ${sortedPlayers.map((player, rankIdx) => {
                            const rankNum = rankIdx + 1;
                            const progressPercent = Math.min(100, Math.max(0, (player.score / state.targetScore) * 100));
                            
                            // Delta in last round
                            let deltaBadge = '';
                            if (lastRound && lastRound.deltas) {
                                const delta = lastRound.deltas[player.id];
                                if (delta > 0) {
                                    deltaBadge = `<span class="score-delta-badge pos">+${delta}</span>`;
                                } else if (delta < 0) {
                                    deltaBadge = `<span class="score-delta-badge neg">${delta}</span>`;
                                } else {
                                    deltaBadge = `<span class="score-delta-badge zero">0</span>`;
                                }
                            }

                            return `
                                <div class="player-card rank-${rankNum}">
                                    <div class="player-card-header">
                                        <div class="player-identity">
                                            <div class="rank-badge rank-badge-${rankNum}">
                                                ${rankNum === 1 ? '🥇' : rankNum === 2 ? '🥈' : rankNum === 3 ? '🥉' : '💩'}
                                            </div>
                                            <div class="player-details">
                                                <div class="player-name-text">
                                                    ${player.name}
                                                    ${rankNum === 1 ? '<span class="player-tag">Đang dẫn đầu</span>' : ''}
                                                </div>
                                                <div class="player-micro-stats">
                                                    <span class="micro-badge" title="Số lần về nhất">🥇 ${player.wins}</span>
                                                    <span class="micro-badge" title="Số lần chặt heo">🐷 ${player.chopsGiven}</span>
                                                    ${player.congCount > 0 ? `<span class="micro-badge" style="color: var(--accent-red);" title="Số lần cóng">❄️ ${player.congCount}</span>` : ''}
                                                </div>
                                            </div>
                                        </div>

                                        <div class="player-score-area">
                                            ${deltaBadge}
                                            <span class="player-score-num">${player.score}</span>
                                            <span class="player-score-unit">điểm</span>
                                        </div>
                                    </div>

                                    <!-- Progress Bar to Target Score -->
                                    <div class="progress-container">
                                        <div class="progress-meta">
                                            <span>Tiến trình đến đích</span>
                                            <span>${player.score} / ${state.targetScore} (${Math.round(progressPercent)}%)</span>
                                        </div>
                                        <div class="progress-track">
                                            <div class="progress-fill ${rankNum === 1 ? 'lead' : ''}" style="width: ${progressPercent}%;"></div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <!-- =============================================================
                         CỤM NÚT ĐIỀU KHIỂN HÀNH ĐỘNG TO RÕ RÀNG (YÊU CẦU MỚI MR TIẾN)
                         ============================================================= -->
                    <div class="dashboard-actions-panel">
                        <!-- Nút 1: VÁN MỚI (To nhất, nổi bật nhất, hiệu ứng Gradient cầu vồng) -->
                        <button type="button" class="btn-action-primary" id="btn-open-round-modal">
                            <span class="btn-action-icon">➕</span>
                            <div class="btn-action-text-wrap">
                                <span class="btn-action-main-text">THÊM KẾT QUẢ VÁN ${totalRounds + 1}</span>
                                <span class="btn-action-sub-text">Nhập thứ hạng • Chặt heo • Cóng • Tới trắng</span>
                            </div>
                        </button>

                        <!-- Hàng 2 Nút Phụ To Bản: Đặt lại & Hoàn tác -->
                        <div class="action-buttons-row">
                            <!-- Nút 2: ĐẶT LẠI TRẬN ĐẤU (To, rõ ràng, dễ sử dụng) -->
                            <button type="button" class="btn-action-secondary btn-reset-match" id="btn-reset-match-big">
                                <span class="btn-icon-sub">🔄</span>
                                <div class="btn-text-sub">
                                    <span class="btn-title-sub">ĐẶT LẠI TRẬN</span>
                                    <span class="btn-desc-sub">Chơi lại / Đổi người</span>
                                </div>
                            </button>

                            <!-- Nút 3: HOÀN TÁC VÁN GẦN NHẤT (Undo) -->
                            <button type="button" class="btn-action-secondary btn-undo-match" id="btn-undo-match-big" ${totalRounds === 0 ? 'disabled' : ''}>
                                <span class="btn-icon-sub">↩️</span>
                                <div class="btn-text-sub">
                                    <span class="btn-title-sub">HOÀN TÁC VÁN ${totalRounds}</span>
                                    <span class="btn-desc-sub">${totalRounds > 0 ? 'Xóa ván vừa nhập' : 'Chưa có ván'}</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    <!-- Thanh Phím Tắt Nhanh Cho Máy Tính (Desktop Shortcuts Bar) -->
                    <div class="desktop-shortcuts-bar">
                        <span>⌨️ Phím tắt:</span>
                        <span class="kbd-tag"><span class="kbd-key">Space</span> Ván mới</span>
                        <span class="kbd-tag"><span class="kbd-key">Ctrl+Z</span> Hoàn tác</span>
                        <span class="kbd-tag"><span class="kbd-key">R</span> Đặt lại</span>
                        <span class="kbd-tag"><span class="kbd-key">V</span> Giọng nói AI</span>
                    </div>
                </div>

                <!-- CỘT PHẢI (RIGHT COLUMN): Trợ Lý AI Voice & Lịch Sử Ván Đấu -->
                <div class="dashboard-col-right">
                    <!-- Khối Điều Khiển Giọng Nói AI Trên Desktop -->
                    <div class="ai-voice-desktop-card">
                        <div class="ai-voice-desktop-header">
                            <div class="ai-voice-desktop-title">
                                <span>🎙️</span>
                                <span>Trợ Lý Giọng Nói AI</span>
                            </div>
                            <button type="button" class="btn-desktop-mic" id="btn-desktop-mic-trigger">
                                <span>🎙️</span> Nói ngay
                            </button>
                        </div>
                        <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4;">
                            Bấm <strong>"Nói ngay"</strong> hoặc chọn câu mẫu bên dưới để ghi điểm tự động mà không cần bấm phím:
                        </p>
                        <div class="desktop-voice-chips">
                            <button type="button" class="desktop-chip-btn" data-voice="Tường nhất, Trang nhì, Thư ba, Diễm chót">🎙️ Tường nhất, Trang nhì...</button>
                            <button type="button" class="desktop-chip-btn" data-voice="Tường tới trắng ván này">🌟 Tường tới trắng</button>
                            <button type="button" class="desktop-chip-btn" data-voice="Tường chặt heo đỏ của Trang">🔥 Tường chặt heo Trang</button>
                            <button type="button" class="desktop-chip-btn" data-voice="Diễm bị cóng ván này">❄️ Diễm bị cóng</button>
                            <button type="button" class="desktop-chip-btn" data-voice="Ai đang dẫn đầu bảng điểm?">📊 Ai đang dẫn đầu?</button>
                        </div>
                    </div>

                    <!-- Round History Table / List -->
                    <div class="history-section">
                        <div class="history-header">
                            <h3><span>📜</span> Lịch sử các ván (${totalRounds})</h3>
                        </div>

                        ${totalRounds === 0 ? `
                            <div class="neu-card empty-history-box">
                                <p>Chưa có ván bài nào được ghi nhận.</p>
                                <p style="font-size: 0.78rem; margin-top: 4px; color: var(--text-light);">
                                    Nhấn nút <strong>"THÊM KẾT QUẢ VÁN 1"</strong> ở bên trái hoặc nói với <strong>Trợ Lý AI 🎙️</strong> để bắt đầu!
                                </p>
                            </div>
                        ` : `
                            <div class="history-list">
                                ${[...state.rounds].reverse().map(round => {
                                    let tagHtml = '';
                                    if (round.isToiTrang) {
                                        tagHtml = '<span class="round-tag toi-trang">🌟 Tới Trắng</span>';
                                    } else {
                                        if (round.chops && round.chops.length > 0) {
                                            tagHtml += `<span class="round-tag chat-heo">🔥 ${round.chops.length} pha chặt</span>`;
                                        }
                                        if (round.congPlayers && round.congPlayers.length > 0) {
                                            tagHtml += `<span class="round-tag cong">❄️ ${round.congPlayers.length} người cóng</span>`;
                                        }
                                    }

                                    return `
                                        <div class="history-item">
                                            <div class="history-item-top">
                                                <div class="round-number-badge">
                                                    <span>🃏</span> Ván ${round.roundNumber}
                                                </div>
                                                <div class="round-tags">
                                                    ${tagHtml}
                                                </div>
                                            </div>

                                            <div class="history-scores-grid">
                                                ${state.players.map(p => {
                                                    const pts = round.deltas ? round.deltas[p.id] : 0;
                                                    const ptsClass = pts > 0 ? 'win' : pts < 0 ? 'loss' : 'neutral';
                                                    const ptsText = pts > 0 ? `+${pts}` : `${pts}`;
                                                    return `
                                                        <div class="history-score-cell">
                                                            <span class="history-cell-name">${p.name}</span>
                                                            <span class="history-cell-pts ${ptsClass}">${ptsText}</span>
                                                        </div>
                                                    `;
                                                }).join('')}
                                            </div>

                                            <!-- Quick notes if any -->
                                            ${round.breakdowns ? `
                                                <div class="history-item-notes">
                                                    ${state.players.map(p => {
                                                        const list = round.breakdowns[p.id] || [];
                                                        if (list.length === 0) return '';
                                                        const noteStr = list.map(item => `${item.label} (${item.points > 0 ? '+' : ''}${item.points})`).join(', ');
                                                        return `<div><strong>${p.name}:</strong> ${noteStr}</div>`;
                                                    }).join('')}
                                                </div>
                                            ` : ''}
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        `}
                    </div>
                </div>
            </div>

            <!-- Mobile Sticky Bottom Action Bar (Cố định ở đáy màn hình điện thoại) -->
            <div class="mobile-sticky-action-bar">
                <button type="button" class="mobile-sticky-btn mobile-sticky-primary" id="mobile-sticky-add-round">
                    <span>➕ VÁN ${totalRounds + 1}</span>
                </button>
                <button type="button" class="mobile-sticky-btn mobile-sticky-secondary" id="mobile-sticky-reset">
                    <span>🔄 ĐẶT LẠI</span>
                </button>
            </div>
        </div>
    `;

    // Event Listeners for Dashboard
    const openRoundBtn = document.getElementById('btn-open-round-modal');
    if (openRoundBtn) {
        openRoundBtn.addEventListener('click', () => {
            Sound.playTap();
            hapticFeedback(15);
            openRoundInputModal();
        });
    }

    const stickyAddRoundBtn = document.getElementById('mobile-sticky-add-round');
    if (stickyAddRoundBtn) {
        stickyAddRoundBtn.addEventListener('click', () => {
            Sound.playTap();
            hapticFeedback(15);
            openRoundInputModal();
        });
    }

    // Reset Match Button (To, rõ ràng)
    const resetMatchBigBtn = document.getElementById('btn-reset-match-big');
    if (resetMatchBigBtn) {
        resetMatchBigBtn.addEventListener('click', () => {
            Sound.playTap();
            hapticFeedback(15);
            openResetConfirmModal();
        });
    }

    const stickyResetBtn = document.getElementById('mobile-sticky-reset');
    if (stickyResetBtn) {
        stickyResetBtn.addEventListener('click', () => {
            Sound.playTap();
            hapticFeedback(15);
            openResetConfirmModal();
        });
    }

    // Undo Round Button (To, rõ ràng)
    const undoMatchBigBtn = document.getElementById('btn-undo-match-big');
    if (undoMatchBigBtn) {
        undoMatchBigBtn.addEventListener('click', () => {
            Sound.playTap();
            hapticFeedback(15);
            if (totalRounds > 0 && confirm(`Bạn có chắc muốn hoàn tác (xóa) kết quả Ván ${totalRounds}?`)) {
                AppStore.undoLastRound();
                showToast(`Đã hoàn tác kết quả Ván ${totalRounds}!`);
            }
        });
    }

    // Desktop AI Voice Mic Trigger Button
    const desktopMicBtn = document.getElementById('btn-desktop-mic-trigger');
    if (desktopMicBtn) {
        desktopMicBtn.addEventListener('click', () => {
            Sound.playTap();
            hapticFeedback(25);
            if (window.GeminiAssistant) {
                window.GeminiAssistant.open();
                setTimeout(() => {
                    const mic = document.getElementById('geminiMicBtn');
                    if (mic && !mic.classList.contains('recording')) {
                        mic.click();
                    }
                }, 350);
            }
        });
    }

    // Desktop Voice Quick Chips
    const desktopChips = container.querySelectorAll('.desktop-chip-btn');
    desktopChips.forEach(chip => {
        chip.addEventListener('click', () => {
            Sound.playTap();
            hapticFeedback(15);
            const voiceText = chip.dataset.voice;
            if (voiceText && window.GeminiAssistant) {
                window.GeminiAssistant.open();
                const input = document.getElementById('geminiInput');
                const sendBtn = document.getElementById('geminiSendBtn');
                if (input && sendBtn) {
                    input.value = voiceText;
                    sendBtn.click();
                }
            }
        });
    });
}

// ==========================================================================
// MODAL XÁC NHẬN ĐẶT LẠI VÁN ĐẤU (THIẾT KẾ RÕ RÀNG & AN TOÀN)
// ==========================================================================
function openResetConfirmModal() {
    const modalsRoot = document.getElementById('modals-root');
    if (!modalsRoot) return;

    const state = AppStore.getState();
    const roundCount = state.rounds.length;

    modalsRoot.innerHTML = `
        <div class="modal-backdrop" id="reset-confirm-backdrop">
            <div class="modal-sheet reset-confirm-sheet" style="max-width: 460px;">
                <div class="reset-confirm-icon">🔄</div>
                <h3 class="reset-confirm-title">Đặt lại ván bài?</h3>
                <p class="reset-confirm-desc">
                    Trận đấu hiện đã chơi <strong>${roundCount} ván</strong>. Vui lòng chọn cách bạn muốn đặt lại:
                </p>

                <div class="reset-options-list">
                    <!-- Lựa chọn 1: Giữ nguyên 4 người Tường, Trang, Thư, Diễm -->
                    <div class="reset-option-card" id="opt-restart-same-players">
                        <span class="reset-option-icon">⚡</span>
                        <div class="reset-option-info">
                            <span class="reset-option-title">Chơi ván mới (Cùng 4 người)</span>
                            <span class="reset-option-subtitle">Giữ nguyên: ${state.players.map(p => p.name).join(', ')} • Reset điểm về 0</span>
                        </div>
                    </div>

                    <!-- Lựa chọn 2: Thiết lập lại từ đầu -->
                    <div class="reset-option-card danger" id="opt-reset-to-setup">
                        <span class="reset-option-icon">⚙️</span>
                        <div class="reset-option-info">
                            <span class="reset-option-title">Thiết lập lại từ đầu</span>
                            <span class="reset-option-subtitle">Quay về màn hình Khởi tạo (đổi tên người chơi, đổi điểm đích)</span>
                        </div>
                    </div>
                </div>

                <button type="button" class="btn-cancel-round" id="btn-cancel-reset" style="width: 100%;">
                    Hủy bỏ
                </button>
            </div>
        </div>
    `;

    const closeModal = () => { modalsRoot.innerHTML = ''; };

    document.getElementById('btn-cancel-reset')?.addEventListener('click', closeModal);
    document.getElementById('reset-confirm-backdrop')?.addEventListener('click', e => {
        if (e.target.id === 'reset-confirm-backdrop') closeModal();
    });

    document.getElementById('opt-restart-same-players')?.addEventListener('click', () => {
        Sound.playTap();
        closeModal();
        AppStore.restartWithSamePlayers();
        showToast('🔄 Đã làm mới điểm số cho trận mới!');
    });

    document.getElementById('opt-reset-to-setup')?.addEventListener('click', () => {
        Sound.playTap();
        closeModal();
        AppStore.resetGame();
        showToast('⚙️ Đã chuyển về màn hình thiết lập trận đấu!');
    });
}

// ==========================================================================
// VIEW 3: ROUND INPUT MODAL CONTROLLER
// ==========================================================================
function openRoundInputModal() {
    const modalsRoot = document.getElementById('modals-root');
    if (!modalsRoot) return;

    const state = AppStore.getState();
    const roundNumber = state.rounds.length + 1;

    // Local form state for this round
    const modalForm = {
        isToiTrang: false,
        toiTrangPlayerId: null,
        ranks: {
            p1: null,
            p2: null,
            p3: null,
            p4: null
        },
        chops: [], // { id, chopperId, choppedId, itemKey, itemName, points }
        congPlayers: [], // array of player ids
        denCongPlayerId: '' // '' or player id
    };

    function renderModalHtml() {
        const preview = calculateRoundPoints(modalForm, state.players);

        // Check if selection is valid
        let isValid = false;
        if (modalForm.isToiTrang) {
            isValid = !!modalForm.toiTrangPlayerId;
        } else {
            // Check if all 4 ranks are assigned and unique
            const assignedRanks = Object.values(modalForm.ranks).filter(Boolean);
            const uniqueRanks = new Set(assignedRanks);
            isValid = assignedRanks.length === 4 && uniqueRanks.size === 4;
        }

        return `
            <div class="modal-backdrop" id="round-modal-backdrop">
                <div class="modal-sheet">
                    <div class="modal-header">
                        <div class="modal-title">
                            <span>🃏</span> Nhập kết quả Ván ${roundNumber}
                        </div>
                        <button type="button" class="modal-close-btn" id="btn-close-modal">✕</button>
                    </div>

                    <div class="modal-body">
                        <!-- NÚT ĐỌC KẾT QUẢ VÁN BẰNG GIỌNG NÓI TRỰC TIẾP TRONG MODAL -->
                        <div style="margin-bottom: 14px;">
                            <button type="button" class="modal-voice-input-btn" id="btn-modal-voice-input">
                                <span class="voice-icon">🎙️</span>
                                <span id="modal-voice-btn-text">ĐỌC KẾT QUẢ VÁN NÀY (BẰNG GIỌNG NÓI)</span>
                            </button>
                            <div class="voice-speech-hint" id="modal-voice-hint">
                                💡 Nhấn và nói: "Tường nhất, Trang nhì, Thư ba, Diễm chót" hoặc "Tường tới trắng"
                            </div>
                        </div>

                        <!-- SECTION 1: XẾP HẠNG 4 NGƯỜI (TOGGLE BUTTONS TO RÕ RÀNG) -->
                        <div>
                            <div class="section-title">
                                <span>Thứ hạng ván bài</span>
                                <span class="section-tip">Chọn Nhất, Nhì, Ba, Chót</span>
                            </div>

                            <div class="rank-selector-list">
                                ${state.players.map((p, pIdx) => {
                                    const currentRank = modalForm.ranks[p.id];
                                    return `
                                        <div class="player-rank-row">
                                            <div class="player-rank-info">
                                                <div class="rank-player-name">
                                                    <span class="player-avatar-badge player-avatar-${pIdx + 1}" style="width: 26px; height: 26px; font-size: 0.8rem;">
                                                        ${p.avatar || (pIdx + 1)}
                                                    </span>
                                                    <span>${p.name}</span>
                                                </div>
                                                <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted);">
                                                    ${currentRank ? `Hạng ${currentRank}` : 'Chưa chọn'}
                                                </span>
                                            </div>

                                            <div class="rank-buttons-group">
                                                <button type="button" 
                                                        class="rank-toggle-btn rank-1-btn ${currentRank === 1 ? 'active' : ''}" 
                                                        data-player="${p.id}" data-rank="1"
                                                        ${modalForm.isToiTrang ? 'disabled' : ''}>
                                                    <span>🥇 Nhất</span>
                                                    <span class="rank-pts">+3đ</span>
                                                </button>
                                                <button type="button" 
                                                        class="rank-toggle-btn rank-2-btn ${currentRank === 2 ? 'active' : ''}" 
                                                        data-player="${p.id}" data-rank="2"
                                                        ${modalForm.isToiTrang ? 'disabled' : ''}>
                                                    <span>🥈 Nhì</span>
                                                    <span class="rank-pts">+2đ</span>
                                                </button>
                                                <button type="button" 
                                                        class="rank-toggle-btn rank-3-btn ${currentRank === 3 ? 'active' : ''}" 
                                                        data-player="${p.id}" data-rank="3"
                                                        ${modalForm.isToiTrang ? 'disabled' : ''}>
                                                    <span>🥉 Ba</span>
                                                    <span class="rank-pts">+1đ</span>
                                                </button>
                                                <button type="button" 
                                                        class="rank-toggle-btn rank-4-btn ${currentRank === 4 ? 'active' : ''}" 
                                                        data-player="${p.id}" data-rank="4"
                                                        ${modalForm.isToiTrang ? 'disabled' : ''}>
                                                    <span>💩 Chót</span>
                                                    <span class="rank-pts">0đ</span>
                                                </button>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>

                        <!-- SECTION 2: 3 KHỐI ACCORDION (TỚI TRẮNG, CHẶT HEO, CÓNG & ĐỀN CÓNG) -->
                        <div class="accordions-container">
                            <!-- Accordion 1: Tới Trắng -->
                            <div class="accordion-item ${modalForm.isToiTrang ? 'open' : ''}" id="acc-toi-trang">
                                <div class="accordion-header" id="acc-toi-trang-header">
                                    <div class="accordion-header-left">
                                        <span>🌟</span>
                                        <span>Tới Trắng (Ngoại lệ 1)</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        ${modalForm.isToiTrang ? '<span class="accordion-badge">Bật</span>' : ''}
                                        <span class="accordion-arrow">▼</span>
                                    </div>
                                </div>
                                <div class="accordion-content">
                                    <div class="toi-trang-wrap">
                                        <div class="toggle-switch-row">
                                            <span class="toggle-label">Ván này có người Tới Trắng:</span>
                                            <label class="switch">
                                                <input type="checkbox" id="toi-trang-checkbox" ${modalForm.isToiTrang ? 'checked' : ''}>
                                                <span class="slider"></span>
                                            </label>
                                        </div>

                                        ${modalForm.isToiTrang ? `
                                            <div style="margin-top: 6px;">
                                                <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary);">Chọn người Tới Trắng (+9 điểm):</span>
                                                <div class="toi-trang-winner-select">
                                                    ${state.players.map(p => `
                                                        <button type="button" class="winner-chip-btn ${modalForm.toiTrangPlayerId === p.id ? 'active' : ''}" data-player="${p.id}">
                                                            <span>👑</span> ${p.name}
                                                        </button>
                                                    `).join('')}
                                                </div>
                                            </div>
                                        ` : ''}

                                        <div class="rule-note">
                                            <strong>Quy tắc:</strong> Người Tới trắng nhận <strong>+9 điểm</strong>. 3 người thua còn lại <strong>0 điểm</strong> (không bị phạt). Bỏ qua chặt heo và cóng.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Accordion 2: Chặt Heo / Hàng -->
                            <div class="accordion-item ${modalForm.chops.length > 0 ? 'open' : ''}" id="acc-chat-heo" ${modalForm.isToiTrang ? 'style="opacity: 0.5; pointer-events: none;"' : ''}>
                                <div class="accordion-header" id="acc-chat-heo-header">
                                    <div class="accordion-header-left">
                                        <span>🔥</span>
                                        <span>Chặt Heo / Hàng (Mục C)</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        ${modalForm.chops.length > 0 ? `<span class="accordion-badge">${modalForm.chops.length} pha chặt</span>` : ''}
                                        <span class="accordion-arrow">▼</span>
                                    </div>
                                </div>
                                <div class="accordion-content">
                                    <div class="chop-list" id="chop-list-container">
                                        ${modalForm.chops.map((chop, cIdx) => `
                                            <div class="chop-item-row" data-chop-index="${cIdx}">
                                                <div class="chop-selectors-grid">
                                                    <div>
                                                        <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted);">Người Chặt (+):</span>
                                                        <select class="select-input chop-chopper-select" data-chop-index="${cIdx}">
                                                            ${state.players.map(p => `
                                                                <option value="${p.id}" ${chop.chopperId === p.id ? 'selected' : ''}>${p.name}</option>
                                                            `).join('')}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted);">Người Bị Chặt (-):</span>
                                                        <select class="select-input chop-chopped-select" data-chop-index="${cIdx}">
                                                            ${state.players.map(p => `
                                                                <option value="${p.id}" ${chop.choppedId === p.id ? 'selected' : ''}>${p.name}</option>
                                                            `).join('')}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div class="chop-type-row">
                                                    <select class="select-input chop-item-select" data-chop-index="${cIdx}" style="flex: 1;">
                                                        ${CHOP_ITEMS.map(item => `
                                                            <option value="${item.key}" ${chop.itemKey === item.key ? 'selected' : ''}>
                                                                ${item.name} (${item.desc})
                                                            </option>
                                                        `).join('')}
                                                    </select>
                                                    <button type="button" class="btn-delete-chop" data-chop-index="${cIdx}" title="Xóa pha chặt này">🗑️</button>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>

                                    <button type="button" class="btn-add-chop" id="btn-add-chop-row">
                                        <span>➕</span> Thêm pha chặt heo/hàng
                                    </button>

                                    <div class="rule-note" style="margin-top: 8px;">
                                        <strong>Quy tắc:</strong> Heo Đỏ: Chặt +2đ, Bị -2đ. Heo Đen: Chặt +1đ, Bị -1đ. Có thể cộng dồn nhiều pha trong ván.
                                    </div>
                                </div>
                            </div>

                            <!-- Accordion 3: Cóng & Đền Cóng -->
                            <div class="accordion-item ${modalForm.congPlayers.length > 0 ? 'open' : ''}" id="acc-cong" ${modalForm.isToiTrang ? 'style="opacity: 0.5; pointer-events: none;"' : ''}>
                                <div class="accordion-header" id="acc-cong-header">
                                    <div class="accordion-header-left">
                                        <span>❄️</span>
                                        <span>Cóng & Đền Cóng (Ngoại lệ 2)</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        ${modalForm.congPlayers.length > 0 ? `<span class="accordion-badge">${modalForm.congPlayers.length} người cóng</span>` : ''}
                                        <span class="accordion-arrow">▼</span>
                                    </div>
                                </div>
                                <div class="accordion-content">
                                    <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px; display: block;">
                                        Đánh dấu những người bị Cóng (-6đ/người):
                                    </span>
                                    <div class="cong-players-grid">
                                        ${state.players.map(p => {
                                            const isWinner = modalForm.ranks[p.id] === 1;
                                            return `
                                                <label class="cong-checkbox-label" ${isWinner ? 'style="opacity: 0.4; pointer-events: none;"' : ''}>
                                                    <input type="checkbox" class="cong-player-cb" data-player="${p.id}" 
                                                           ${modalForm.congPlayers.includes(p.id) ? 'checked' : ''}
                                                           ${isWinner ? 'disabled' : ''}>
                                                    <span>${p.name} ${isWinner ? '(Nhất)' : ''}</span>
                                                </label>
                                            `;
                                        }).join('')}
                                    </div>

                                    ${modalForm.congPlayers.length > 0 ? `
                                        <div class="den-cong-wrap">
                                            <span class="den-cong-label">Chọn người Đền Cóng (nếu có ai gánh thay):</span>
                                            <select class="select-input" id="den-cong-select">
                                                <option value="" ${modalForm.denCongPlayerId === '' ? 'selected' : ''}>
                                                    Không có người đền (Mỗi người cóng tự trừ -6đ)
                                                </option>
                                                ${state.players.map(p => `
                                                    <option value="${p.id}" ${modalForm.denCongPlayerId === p.id ? 'selected' : ''}>
                                                        ${p.name} đền thay (${modalForm.congPlayers.length * 6} điểm)
                                                    </option>
                                                `).join('')}
                                            </select>
                                        </div>
                                    ` : ''}

                                    <div class="rule-note" style="margin-top: 8px;">
                                        <strong>Quy tắc Cóng:</strong> Phạt <strong>-6đ/người</strong>, chuyển hết cho người Nhất. Nếu có người <strong>Đền Cóng</strong>, người này gánh trừ thay toàn bộ điểm phạt cho các người cóng.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- SECTION 3: LIVE SCORE PREVIEW (XEM TRƯỚC ĐIỂM SỐ MINH BẠCH) -->
                        <div class="preview-card">
                            <div class="preview-title">
                                <span>📊</span> Xem trước điểm ván này:
                            </div>
                            <div class="preview-grid">
                                ${state.players.map(p => {
                                    const delta = preview.deltas[p.id] || 0;
                                    const deltaClass = delta > 0 ? 'win' : delta < 0 ? 'loss' : 'zero';
                                    const deltaText = delta > 0 ? `+${delta}` : `${delta}`;
                                    const list = preview.breakdowns[p.id] || [];
                                    const summaryText = list.map(item => item.label).join(', ') || '0đ';

                                    return `
                                        <div class="preview-cell">
                                            <span class="preview-name">${p.name}</span>
                                            <span class="preview-pts ${deltaClass}">${deltaText}</span>
                                            <span class="preview-detail-text" title="${summaryText}">${summaryText}</span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn-cancel-round" id="btn-cancel-modal">Hủy</button>
                        <button type="button" class="btn-save-round" id="btn-submit-round" ${isValid ? '' : 'disabled'}>
                            <span>💾</span> LƯU KẾT QUẢ VÁN
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function updateModalView() {
        modalsRoot.innerHTML = renderModalHtml();
        attachModalEvents();
    }

    function attachModalEvents() {
        const closeBtn = document.getElementById('btn-close-modal');
        const cancelBtn = document.getElementById('btn-cancel-modal');
        const backdrop = document.getElementById('round-modal-backdrop');

        const closeModal = () => {
            modalsRoot.innerHTML = '';
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
        if (backdrop) {
            backdrop.addEventListener('click', e => {
                if (e.target === backdrop) closeModal();
            });
        }

        // Rank Toggle Buttons
        const rankBtns = modalsRoot.querySelectorAll('.rank-toggle-btn');
        rankBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const playerId = btn.dataset.player;
                const rank = parseInt(btn.dataset.rank, 10);
                Sound.playRank(rank);

                // If this player already has this rank, toggle off
                if (modalForm.ranks[playerId] === rank) {
                    modalForm.ranks[playerId] = null;
                } else {
                    // Check if another player currently holds this rank, and free it
                    Object.keys(modalForm.ranks).forEach(otherId => {
                        if (modalForm.ranks[otherId] === rank) {
                            modalForm.ranks[otherId] = null;
                        }
                    });
                    modalForm.ranks[playerId] = rank;
                }

                // If this player became rank 1, remove them from cóng list if they were checked
                if (modalForm.ranks[playerId] === 1) {
                    modalForm.congPlayers = modalForm.congPlayers.filter(id => id !== playerId);
                }

                updateModalView();
            });
        });

        // Accordion headers toggle open
        ['toi-trang', 'chat-heo', 'cong'].forEach(key => {
            const header = document.getElementById(`acc-${key}-header`);
            const item = document.getElementById(`acc-${key}`);
            if (header && item) {
                header.addEventListener('click', () => {
                    Sound.playTap();
                    item.classList.toggle('open');
                });
            }
        });

        // Tới Trắng Toggle
        const toiTrangCb = document.getElementById('toi-trang-checkbox');
        if (toiTrangCb) {
            toiTrangCb.addEventListener('change', e => {
                Sound.playTap();
                modalForm.isToiTrang = e.target.checked;
                if (modalForm.isToiTrang && !modalForm.toiTrangPlayerId) {
                    modalForm.toiTrangPlayerId = state.players[0].id;
                }
                updateModalView();
            });
        }

        // Tới Trắng Winner selection
        const winnerChips = modalsRoot.querySelectorAll('.winner-chip-btn');
        winnerChips.forEach(btn => {
            btn.addEventListener('click', () => {
                Sound.playTap();
                modalForm.toiTrangPlayerId = btn.dataset.player;
                updateModalView();
            });
        });

        // Add Chop Row Button
        const addChopBtn = document.getElementById('btn-add-chop-row');
        if (addChopBtn) {
            addChopBtn.addEventListener('click', () => {
                Sound.playChop();
                const defaultItem = CHOP_ITEMS[1]; // Heo đỏ default
                modalForm.chops.push({
                    id: 'chop_' + Date.now(),
                    chopperId: state.players[0].id,
                    choppedId: state.players[1].id,
                    itemKey: defaultItem.key,
                    itemName: defaultItem.name,
                    points: defaultItem.points
                });
                updateModalView();
            });
        }

        // Delete Chop Button
        const deleteChopBtns = modalsRoot.querySelectorAll('.btn-delete-chop');
        deleteChopBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                Sound.playTap();
                const idx = parseInt(btn.dataset.chopIndex, 10);
                modalForm.chops.splice(idx, 1);
                updateModalView();
            });
        });

        // Chopper & Chopped selects
        const chopperSelects = modalsRoot.querySelectorAll('.chop-chopper-select');
        chopperSelects.forEach(select => {
            select.addEventListener('change', e => {
                const idx = parseInt(select.dataset.chopIndex, 10);
                if (modalForm.chops[idx]) {
                    modalForm.chops[idx].chopperId = e.target.value;
                    if (modalForm.chops[idx].chopperId === modalForm.chops[idx].choppedId) {
                        const other = state.players.find(p => p.id !== e.target.value);
                        if (other) modalForm.chops[idx].choppedId = other.id;
                    }
                    updateModalView();
                }
            });
        });

        const choppedSelects = modalsRoot.querySelectorAll('.chop-chopped-select');
        choppedSelects.forEach(select => {
            select.addEventListener('change', e => {
                const idx = parseInt(select.dataset.chopIndex, 10);
                if (modalForm.chops[idx]) {
                    modalForm.chops[idx].choppedId = e.target.value;
                    if (modalForm.chops[idx].chopperId === modalForm.chops[idx].choppedId) {
                        const other = state.players.find(p => p.id !== e.target.value);
                        if (other) modalForm.chops[idx].chopperId = other.id;
                    }
                    updateModalView();
                }
            });
        });

        const itemSelects = modalsRoot.querySelectorAll('.chop-item-select');
        itemSelects.forEach(select => {
            select.addEventListener('change', e => {
                const idx = parseInt(select.dataset.chopIndex, 10);
                const item = CHOP_ITEMS.find(it => it.key === e.target.value);
                if (modalForm.chops[idx] && item) {
                    modalForm.chops[idx].itemKey = item.key;
                    modalForm.chops[idx].itemName = item.name;
                    modalForm.chops[idx].points = item.points;
                    updateModalView();
                }
            });
        });

        // Cóng Checkboxes
        const congCbs = modalsRoot.querySelectorAll('.cong-player-cb');
        congCbs.forEach(cb => {
            cb.addEventListener('change', e => {
                const pId = cb.dataset.player;
                if (e.target.checked) {
                    Sound.playCong();
                    if (!modalForm.congPlayers.includes(pId)) {
                        modalForm.congPlayers.push(pId);
                    }
                } else {
                    modalForm.congPlayers = modalForm.congPlayers.filter(id => id !== pId);
                }
                updateModalView();
            });
        });

        // Đền Cóng Select
        const denCongSelect = document.getElementById('den-cong-select');
        if (denCongSelect) {
            denCongSelect.addEventListener('change', e => {
                modalForm.denCongPlayerId = e.target.value;
                updateModalView();
            });
        }

        // Submit Round Button
        const submitBtn = document.getElementById('btn-submit-round');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                Sound.playTap();
                if (window.StarfieldInstance) {
                    window.StarfieldInstance.createBurst(window.innerWidth / 2, window.innerHeight * 0.45, 18);
                }
                AppStore.addRound(modalForm);
                closeModal();
                showToast(`🎉 Đã lưu kết quả Ván ${roundNumber}!`);
            });
        }

        // Voice Recognition Direct in Modal
        const voiceModalBtn = document.getElementById('btn-modal-voice-input');
        if (voiceModalBtn) {
            voiceModalBtn.addEventListener('click', () => {
                startVoiceRecognitionForModal();
            });
        }
    }

    function startVoiceRecognitionForModal() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            showToast('⚠️ Trình duyệt chưa hỗ trợ Web Speech API. Bạn có thể dùng Trợ Lý AI Gemini!');
            if (window.GeminiAssistant) window.GeminiAssistant.open();
            return;
        }

        const voiceBtn = document.getElementById('btn-modal-voice-input');
        const btnText = document.getElementById('modal-voice-btn-text');
        const hintText = document.getElementById('modal-voice-hint');

        try {
            const recognition = new SpeechRecognition();
            recognition.lang = 'vi-VN';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            if (voiceBtn) voiceBtn.classList.add('listening');
            if (btnText) btnText.textContent = '🔴 ĐANG LẮNG NGHE... HÃY ĐỌC KẾT QUẢ!';
            if (hintText) hintText.textContent = 'Đang nghe... ví dụ: "Tường nhất Trang nhì Thư ba Diễm chót"';
            Sound.playVoiceListen();
            hapticFeedback(25);

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log('🎙️ Modal Voice Recognized:', transcript);
                
                const parsed = parseVietnameseRoundSpeech(transcript, state.players);
                
                let matchedSomething = false;
                if (parsed.isToiTrang) {
                    modalForm.isToiTrang = true;
                    if (parsed.toiTrangPlayerId) modalForm.toiTrangPlayerId = parsed.toiTrangPlayerId;
                    matchedSomething = true;
                } else {
                    if (Object.keys(parsed.ranks).length > 0) {
                        modalForm.isToiTrang = false;
                        Object.entries(parsed.ranks).forEach(([pId, r]) => {
                            modalForm.ranks[pId] = r;
                        });
                        matchedSomething = true;
                    }
                    if (parsed.chops.length > 0) {
                        modalForm.chops = [...modalForm.chops, ...parsed.chops];
                        matchedSomething = true;
                    }
                    if (parsed.congPlayers.length > 0) {
                        parsed.congPlayers.forEach(cId => {
                            if (!modalForm.congPlayers.includes(cId)) modalForm.congPlayers.push(cId);
                        });
                        matchedSomething = true;
                    }
                    if (parsed.denCongPlayerId) {
                        modalForm.denCongPlayerId = parsed.denCongPlayerId;
                        matchedSomething = true;
                    }
                }

                if (matchedSomething) {
                    Sound.playVoiceSuccess();
                    hapticFeedback([20, 40, 20]);
                    showToast(`🎙️ Đã nhận diện: "${transcript}"`);
                } else {
                    showToast(`🎙️ Đã nghe: "${transcript}" (Chưa rõ thứ hạng, vui lòng bấm chọn thủ công)`);
                }

                updateModalView();
            };

            recognition.onerror = (event) => {
                console.warn('Speech recognition error in modal:', event.error);
                if (voiceBtn) voiceBtn.classList.remove('listening');
                if (btnText) btnText.textContent = 'ĐỌC KẾT QUẢ VÁN NÀY (BẰNG GIỌNG NÓI)';
                if (hintText) hintText.textContent = '💡 Nhấn và nói: "Tường nhất, Trang nhì, Thư ba, Diễm chót"';
                if (event.error !== 'no-speech') {
                    showToast(`Lỗi giọng nói: ${event.error}`);
                }
            };

            recognition.onend = () => {
                if (voiceBtn) voiceBtn.classList.remove('listening');
                if (btnText) btnText.textContent = 'ĐỌC KẾT QUẢ VÁN NÀY (BẰNG GIỌNG NÓI)';
                if (hintText) hintText.textContent = '💡 Nhấn và nói: "Tường nhất, Trang nhì, Thư ba, Diễm chót"';
            };

            recognition.start();
        } catch (err) {
            console.error('Error starting speech recognition in modal:', err);
            if (voiceBtn) voiceBtn.classList.remove('listening');
            showToast('Không thể bật micro lúc này.');
        }
    }

    updateModalView();
}

// ==========================================================================
// VIEW 4: GAME OVER MODAL (CÚP VÀNG CHIẾN THẮNG & THỨ HẠNG)
// ==========================================================================
function renderGameOverModal(state) {
    const modalsRoot = document.getElementById('modals-root');
    if (!modalsRoot) return;

    // Victory sound and Confetti Cannon
    Sound.playVictory();
    if (window.StarfieldInstance) {
        window.StarfieldInstance.createBurst(window.innerWidth * 0.35, window.innerHeight * 0.4, 25);
        window.StarfieldInstance.createBurst(window.innerWidth * 0.65, window.innerHeight * 0.4, 25);
        window.StarfieldInstance.spawnMeteor();
    }
    if (window.confetti) {
        window.confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 }
        });
        setTimeout(() => {
            window.confetti({
                particleCount: 80,
                angle: 60,
                spread: 55,
                origin: { x: 0 }
            });
            window.confetti({
                particleCount: 80,
                angle: 120,
                spread: 55,
                origin: { x: 1 }
            });
        }, 400);
    }

    // Sort players for final rankings
    const sorted = [...state.players].sort((a, b) => b.score - a.score);
    const champion = sorted[0];

    modalsRoot.innerHTML = `
        <div class="modal-backdrop" id="gameover-modal-backdrop">
            <div class="modal-sheet gameover-modal-sheet" style="max-width: 520px;">
                <div class="trophy-animation">🏆</div>
                <h2 class="gameover-title">KẾT THÚC TRẬN ĐẤU!</h2>
                <p class="winner-announcement">
                    Nhà vô địch: <strong>${champion.name}</strong> (${champion.score} điểm)
                </p>

                <!-- Final Podium Rankings -->
                <div class="final-podium-grid">
                    ${sorted.map((p, idx) => {
                        const medals = ['🥇 Quán Quân', '🥈 Á Quân', '🥉 Hạng Ba', '💩 Đội Sổ'];
                        return `
                            <div class="podium-item rank-${idx + 1}">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span style="font-size: 1.2rem;">${idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '💩'}</span>
                                    <div style="text-align: left;">
                                        <div style="font-family: var(--font-heading); font-size: 0.95rem; font-weight: 800; color: var(--text-primary);">
                                            ${p.name}
                                        </div>
                                        <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">
                                            ${medals[idx]} • ${p.wins} lần Nhất
                                        </div>
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <span style="font-family: var(--font-heading); font-size: 1.3rem; font-weight: 900; color: var(--primary);">
                                        ${p.score}
                                    </span>
                                    <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);"> điểm</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- Actions -->
                <div class="gameover-actions">
                    <button type="button" class="btn-primary-action" id="btn-restart-same" style="margin-top: 0;">
                        <span>🔄</span> CHƠI VÁN MỚI (CÙNG 4 NGƯỜI)
                    </button>
                    <button type="button" class="chip-btn" id="btn-raise-target" style="padding: 12px; font-size: 0.9rem;">
                        <span>⚡</span> Chơi tiếp (Tăng điểm đích thêm +20đ)
                    </button>
                    <button type="button" class="btn-sm btn-sm-ghost" id="btn-new-match-setup" style="padding: 10px;">
                        Thiết lập trận mới (Đổi người chơi)
                    </button>
                </div>
            </div>
        </div>
    `;

    // Events for Game Over Modal
    const restartBtn = document.getElementById('btn-restart-same');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            Sound.playTap();
            modalsRoot.innerHTML = '';
            AppStore.restartWithSamePlayers();
            showToast('Đã bắt đầu ván mới!');
        });
    }

    const raiseTargetBtn = document.getElementById('btn-raise-target');
    if (raiseTargetBtn) {
        raiseTargetBtn.addEventListener('click', () => {
            Sound.playTap();
            modalsRoot.innerHTML = '';
            AppStore.increaseTargetScore(20);
            showToast(`Đã nâng điểm đích lên ${AppStore.getState().targetScore} điểm!`);
        });
    }

    const newMatchBtn = document.getElementById('btn-new-match-setup');
    if (newMatchBtn) {
        newMatchBtn.addEventListener('click', () => {
            Sound.playTap();
            modalsRoot.innerHTML = '';
            AppStore.resetGame();
        });
    }
}

// ==========================================================================
// SHARE / EXPORT TO CLIPBOARD
// ==========================================================================
function copyMatchSummary() {
    const state = AppStore.getState();
    const sorted = [...state.players].sort((a, b) => b.score - a.score);
    const dateStr = new Date().toLocaleDateString('vi-VN');

    let text = `♠️♥️ TIẾN LÊN MIỀN NAM - POINTING POKER PRO ♣️♦️\n`;
    text += `📅 Ngày: ${dateStr} | Số ván: ${state.rounds.length} ván | Đích: ${state.targetScore}đ\n`;
    text += `----------------------------------------\n`;
    text += `🏆 BẢNG XẾP HẠNG HIỆN TẠI:\n`;

    sorted.forEach((p, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '💩';
        text += `${medal} #${idx + 1}. ${p.name}: ${p.score} điểm (${p.wins} lần Nhất, ${p.chopsGiven} pha chặt)\n`;
    });

    text += `----------------------------------------\n`;
    text += `© 2026 Mr Tiến | Pointing Poker`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('📋 Đã sao chép bảng điểm vào bộ nhớ tạm! Dán ngay vào Zalo/Messenger.');
        }).catch(() => {
            prompt('Sao chép tóm tắt bảng điểm:', text);
        });
    } else {
        prompt('Sao chép tóm tắt bảng điểm:', text);
    }
}

// ==========================================================================
// TÍCH HỢP TRỢ LÝ AI GEMINI & ĐIỀU KHIỂN BẰNG GIỌNG NÓI 🎙️ (MR TIẾN)
// ==========================================================================
function findPlayerIdByName(nameStr) {
    if (!nameStr) return null;
    const clean = nameStr.toLowerCase().trim();
    const state = AppStore.getState();
    const p = state.players.find(player => {
        const pName = player.name.toLowerCase();
        return pName === clean || clean.includes(pName) || pName.includes(clean);
    });
    return p ? p.id : null;
}

function handleAiAction(action) {
    console.log('⚡ Pointing Poker Action Received from Gemini AI:', action);
    if (!action || !action.type) return null;

    const state = AppStore.getState();

    switch (action.type) {
        case 'OPEN_ROUND_MODAL':
            openRoundInputModal();
            return 'Đã mở cửa sổ nhập kết quả ván mới!';

        case 'RECORD_ROUND': {
            // action.ranks: { "Tường": 1, "Trang": 2, "Thư": 3, "Diễm": 4 }
            if (!action.ranks) return null;
            const rankMap = {};
            state.players.forEach(p => {
                // Find matching key
                const key = Object.keys(action.ranks).find(k => {
                    const cleanK = k.toLowerCase().trim();
                    const cleanP = p.name.toLowerCase().trim();
                    return cleanK === cleanP || cleanK.includes(cleanP) || cleanP.includes(cleanK);
                });
                if (key) {
                    rankMap[p.id] = parseInt(action.ranks[key], 10);
                }
            });

            // Validate all 4 ranks
            const assigned = Object.values(rankMap).filter(Boolean);
            if (assigned.length === 4 && new Set(assigned).size === 4) {
                AppStore.addRound({
                    isToiTrang: false,
                    ranks: rankMap,
                    chops: action.chops || [],
                    congPlayers: action.congPlayers || [],
                    denCongPlayerId: action.denCongPlayerId || ''
                });
                Sound.playVictory();
                const rankSummary = state.players.map(p => `${p.name} (Hạng ${rankMap[p.id]})`).join(', ');
                return `Đã ghi nhận Ván ${state.rounds.length}: ${rankSummary}!`;
            } else {
                openRoundInputModal();
                return 'Đã mở bảng nhập điểm, vui lòng kiểm tra lại thứ hạng 4 người!';
            }
        }

        case 'TOI_TRANG': {
            const pId = findPlayerIdByName(action.player);
            if (pId) {
                AppStore.addRound({
                    isToiTrang: true,
                    toiTrangPlayerId: pId
                });
                Sound.playVictory();
                const p = state.players.find(pl => pl.id === pId);
                return `🌟 Chúc mừng ${p.name} TỚI TRẮNG (+9 điểm)!`;
            }
            return 'Không tìm thấy người chơi tới trắng được yêu cầu.';
        }

        case 'RECORD_CHOP': {
            const chopperId = findPlayerIdByName(action.chopper);
            const choppedId = findPlayerIdByName(action.chopped);
            const itemKey = action.item || 'heo_do';
            const item = CHOP_ITEMS.find(it => it.key === itemKey) || CHOP_ITEMS[1];

            if (chopperId && choppedId && chopperId !== choppedId) {
                Sound.playChop();
                const chopper = state.players.find(p => p.id === chopperId);
                const chopped = state.players.find(p => p.id === choppedId);
                return `🔥 Ghi nhận pha chặt: ${chopper.name} chặt ${item.name} của ${chopped.name} (${item.desc})!`;
            }
            return null;
        }

        case 'RECORD_CONG': {
            Sound.playCong();
            return `❄️ Ghi nhận phạt cóng trong ván!`;
        }

        case 'RESET_GAME': {
            openResetConfirmModal();
            return 'Đã mở bảng xác nhận đặt lại trận đấu!';
        }

        case 'UNDO_ROUND': {
            if (state.rounds.length > 0) {
                const roundNum = state.rounds.length;
                AppStore.undoLastRound();
                return `↩️ Đã hoàn tác kết quả Ván ${roundNum}!`;
            }
            return 'Hiện chưa có ván nào để hoàn tác.';
        }

        case 'READ_LEADERBOARD': {
            const sorted = [...state.players].sort((a, b) => b.score - a.score);
            let speech = `Bảng điểm hiện tại sau ${state.rounds.length} ván: `;
            sorted.forEach((p, idx) => {
                speech += `Hạng ${idx + 1}: ${p.name} ${p.score} điểm. `;
            });
            if (window.GeminiAssistant) {
                window.GeminiAssistant.speak(speech);
            }
            return speech;
        }

        case 'SHARE_SUMMARY': {
            copyMatchSummary();
            return '📋 Đã sao chép bảng điểm vào bộ nhớ tạm!';
        }

        default:
            return null;
    }
}

function initGeminiVoiceAssistant() {
    if (!window.GeminiAssistant) {
        console.warn('GeminiAssistant library not loaded.');
        return;
    }

    const state = AppStore.getState();
    const playerNamesStr = state.players.map(p => p.name).join(', ');

    window.GeminiAssistant.init({
        title: 'Trợ Lý AI Ghi Điểm',
        brandName: '© 2026 Mr Tiến',
        welcomeMessage: `👋 Xin chào các cơ thủ! Tôi là **Trợ Lý AI Gemini © 2026 Mr Tiến**.\nTôi có thể giúp bạn **ghi điểm và điều khiển ván bài bằng giọng nói 🎙️** hoàn toàn tự động!\n\n💡 **Thử nói hoặc gõ:**\n- *"Ván mới"*\n- *"Tường nhất, Trang nhì, Thư ba, Diễm chót"*\n- *"Tường tới trắng"*\n- *"Tường chặt heo đỏ của Trang"*\n- *"Diễm bị cóng"*\n- *"Ai đang dẫn đầu?"*\n- *"Đặt lại trận đấu"*\n\nBấm nút **Micro 🎙️** bên dưới để ra lệnh bằng giọng nói ngay nhé!`,
        systemInstruction: `Bạn là Trợ Lý AI Ghi Điểm Tiến Lên Miền Nam chuyên nghiệp của ứng dụng POINTINGPOKER © 2026 Mr Tiến.
Danh sách 4 người chơi trên chiếu bài hiện tại là: ${playerNamesStr} (Mặc định: Tường, Trang, Thư, Diễm).

QUY TẮC TÍNH ĐIỂM TIẾN LÊN MIỀN NAM:
- Nhất: +3 điểm | Nhì: +2 điểm | Ba: +1 điểm | Chót: 0 điểm.
- Tới trắng: +9 điểm cho người tới trắng, 3 người thua được 0 điểm.
- Chặt heo đỏ: +2 điểm cho người chặt, -2 điểm cho người bị chặt.
- Chặt heo đen: +1 điểm cho người chặt, -1 điểm cho người bị chặt.
- Cóng: Phạt -6 điểm mỗi người cóng, người Nhất nhận toàn bộ số điểm phạt này. Nếu có người Đền Cóng, người đền gánh thay toàn bộ điểm phạt.

NHIỆM VỤ CỦA BẠN:
1. Lắng nghe câu nói tiếng Việt bằng giọng nói hoặc tin nhắn của người chơi để điều khiển web tự động.
2. Trả lời vui tươi, hào hứng, phong cách sòng bài vui vẻ, có emoji phong phú.
3. Luôn đính kèm MỘT KHỐI JSON DUY NHẤT ở CUỐI câu trả lời với cú pháp:
\`\`\`action
{"type": "TÊN_HÀNH_ĐỘNG", ...tham_số}
\`\`\`

CÁC HÀNH ĐỘNG HỖ TRỢ (tool calling):
- Mở cửa sổ nhập điểm ván mới:
  {"type": "OPEN_ROUND_MODAL"}
- Nhập kết quả ván bài (tự động cộng điểm):
  {"type": "RECORD_ROUND", "ranks": {"Tường": 1, "Trang": 2, "Thư": 3, "Diễm": 4}}
  (Giá trị thứ hạng: 1 là Nhất, 2 là Nhì, 3 là Ba, 4 là Chót)
- Ghi nhận Tới Trắng:
  {"type": "TOI_TRANG", "player": "Tường"}
- Ghi nhận Chặt Heo:
  {"type": "RECORD_CHOP", "chopper": "Tường", "chopped": "Trang", "item": "heo_do" | "heo_den"}
- Ghi nhận Cóng:
  {"type": "RECORD_CONG", "cong": ["Diễm"], "den": null}
- Đặt lại trận đấu / Chơi ván mới:
  {"type": "RESET_GAME"}
- Hoàn tác ván vừa rồi:
  {"type": "UNDO_ROUND"}
- Đọc bảng xếp hạng / điểm số hiện tại:
  {"type": "READ_LEADERBOARD"}
- Sao chép bảng điểm:
  {"type": "SHARE_SUMMARY"}
`,
        quickChips: [
            { label: '🎙️ Tường nhất, Trang nhì...', prompt: 'Tường nhất, Trang nhì, Thư ba, Diễm chót' },
            { label: '🌟 Tường tới trắng', prompt: 'Tường tới trắng ván này' },
            { label: '🔥 Tường chặt heo đỏ Trang', prompt: 'Tường chặt heo đỏ của Trang' },
            { label: '❄️ Diễm bị cóng', prompt: 'Diễm bị cóng ván này' },
            { label: '📊 Ai đang dẫn đầu?', prompt: 'Ai đang dẫn đầu bảng điểm?' },
            { label: '➕ Nhập ván mới', prompt: 'Mở cửa sổ nhập ván mới' },
            { label: '🔄 Đặt lại trận đấu', prompt: 'Đặt lại ván bài' }
        ],
        onAction: function(action) {
            return handleAiAction(action);
        }
    });

    // Quick Voice Mic button on Header
    const headerVoiceBtn = document.getElementById('header-ai-voice-btn');
    if (headerVoiceBtn) {
        headerVoiceBtn.addEventListener('click', () => {
            Sound.playTap();
            window.GeminiAssistant.open();
            // Automatically trigger speech listening for instant voice command!
            setTimeout(() => {
                const micBtn = document.getElementById('geminiMicBtn');
                if (micBtn && !micBtn.classList.contains('recording')) {
                    micBtn.click();
                }
            }, 350);
        });
    }
}

// ==========================================================================
// ==========================================================================
// DESKTOP KEYBOARD SHORTCUTS
// ==========================================================================
function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
        // Ignore if typing in input, textarea, or select
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
            return;
        }

        const state = AppStore.getState();
        const modalsRoot = document.getElementById('modals-root');
        const hasOpenModal = modalsRoot && modalsRoot.children.length > 0;

        // Escape: Close any open modal
        if (e.key === 'Escape' && hasOpenModal) {
            e.preventDefault();
            modalsRoot.innerHTML = '';
            Sound.playTap();
            return;
        }

        // Only in PLAYING state and when no modal is open:
        if (state.gameStatus === 'PLAYING' && !hasOpenModal) {
            // Space: Open Round Input Modal
            if (e.code === 'Space') {
                e.preventDefault();
                Sound.playTap();
                openRoundInputModal();
                return;
            }

            // Ctrl+Z: Undo last round
            if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
                e.preventDefault();
                if (state.rounds.length > 0) {
                    Sound.playTap();
                    const roundNum = state.rounds.length;
                    AppStore.undoLastRound();
                    showToast(`↩️ Đã hoàn tác kết quả Ván ${roundNum}!`);
                }
                return;
            }

            // R: Open Reset Confirm Modal
            if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                Sound.playTap();
                openResetConfirmModal();
                return;
            }

            // V: Trigger Voice Assistant / Direct Mic
            if ((e.key === 'v' || e.key === 'V') && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                Sound.playTap();
                const micBtn = document.getElementById('header-ai-voice-btn');
                if (micBtn) micBtn.click();
                return;
            }
        }
    });
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Sound Toggle in Header
    const soundToggleBtn = document.getElementById('sound-toggle-btn');
    if (soundToggleBtn) {
        soundToggleBtn.addEventListener('click', () => {
            AppStore.toggleSound();
            showToast(AppStore.getState().settings.soundEnabled ? '🔊 Đã bật âm thanh' : '🔇 Đã tắt âm thanh');
        });
    }

    // Share Button in Header
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            Sound.playTap();
            copyMatchSummary();
        });
    }

    // Reset Game Button in Header
    const resetBtn = document.getElementById('reset-game-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            Sound.playTap();
            openResetConfirmModal();
        });
    }

    // Logo Click returns to Dashboard or Setup
    const logoBtn = document.getElementById('logo-btn');
    if (logoBtn) {
        logoBtn.addEventListener('click', () => {
            Sound.playTap();
            renderApp();
        });
    }

    // Setup Desktop Keyboard Shortcuts
    setupKeyboardShortcuts();

    // Subscribe to store updates
    AppStore.subscribe(() => {
        renderApp();
    });

    // Initial render
    renderApp();

    // Khởi tạo Trợ Lý AI Gemini Độc Lập
    initGeminiVoiceAssistant();
});

