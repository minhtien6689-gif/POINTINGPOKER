/**
 * ==========================================================================
 * POINTINGPOKER — HIỆU ỨNG NỀN ĐỘNG TƯƠNG TÁC SAO NHẤP NHÁY (STARFIELD FX)
 * Hệ thống hạt vũ trụ tương tác đa lớp: Sao 4 cánh lấp lánh (✦), Sao Băng (Meteors),
 * Bụi sao phát sáng (Stardust), Chòm sao liên kết (Constellations)
 * & Vệt tương tác ngón tay / chuột di động (Interactive Particle Trails)
 * Thiết kế chuẩn phong cách Pastel Neumorphism © 2026 Mr Tiến
 * ==========================================================================
 */

(function () {
    'use strict';

    class InteractiveStarfield {
        constructor() {
            this.canvas = document.getElementById('starfield-canvas');
            if (!this.canvas) return;

            this.ctx = this.canvas.getContext('2d');
            this.width = 0;
            this.height = 0;
            this.dpr = Math.min(window.devicePixelRatio || 1, 2);

            // Palette màu ánh sáng hòa quyện với phong cách pastel cam & hồng Mr Tiến
            this.colors = [
                { r: 255, g: 255, b: 255, hex: '#FFFFFF' }, // Diamond White
                { r: 255, g: 179, b: 0,   hex: '#FFB300' }, // Gold Sparkle
                { r: 255, g: 112, b: 67,  hex: '#FF7043' }, // Warm Tangerine
                { r: 255, g: 77,  b: 141, hex: '#FF4D8D' }, // Prism Rose Pink
                { r: 167, g: 139, b: 250, hex: '#A78BFA' }, // Aurora Violet
                { r: 38,  g: 198, b: 160, hex: '#26C6A0' }  // Emerald Mint
            ];

            this.stars = [];
            this.sparkles = []; // Hạt tương tác theo chuột / chạm tay
            this.meteors = [];  // Sao băng
            this.maxSparkles = 80;

            // Mouse / Touch Tracking
            this.mouse = {
                x: -9999,
                y: -9999,
                lastX: -9999,
                lastY: -9999,
                isDown: false,
                lastMoved: 0
            };

            // Timing
            this.lastMeteorTime = Date.now();
            this.meteorInterval = 3800; // Cứ mỗi ~3.8s bắn 1 sao băng
            this.rafId = null;

            this.init();
        }

        init() {
            this.resize();
            this.createStars();
            this.attachEvents();
            this.animate();
        }

        resize() {
            this.width = window.innerWidth;
            this.height = window.innerHeight;

            this.canvas.width = Math.floor(this.width * this.dpr);
            this.canvas.height = Math.floor(this.height * this.dpr);
            this.canvas.style.width = this.width + 'px';
            this.canvas.style.height = this.height + 'px';

            this.ctx.scale(this.dpr, this.dpr);

            // Re-populate stars when resized significantly
            if (this.stars.length === 0) {
                this.createStars();
            }
        }

        createStars() {
            const isMobile = this.width < 768;
            // Số lượng sao tối ưu: mobile ~55 sao, desktop ~110 sao
            const starCount = isMobile ? 55 : 110;

            this.stars = [];
            for (let i = 0; i < starCount; i++) {
                const colorObj = this.colors[Math.floor(Math.random() * this.colors.length)];
                const isDiamond = Math.random() < 0.38; // 38% là sao 4 cánh lấp lánh ✦

                this.stars.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    baseRadius: isDiamond ? (1.5 + Math.random() * 2.2) : (0.8 + Math.random() * 1.6),
                    radius: 1,
                    alpha: 0.2 + Math.random() * 0.8,
                    baseAlpha: 0.2 + Math.random() * 0.7,
                    twinkleSpeed: 0.015 + Math.random() * 0.035,
                    twinklePhase: Math.random() * Math.PI * 2,
                    color: colorObj,
                    isDiamond: isDiamond,
                    spikeLength: isDiamond ? (5 + Math.random() * 7) : 0,
                    rotation: Math.random() * Math.PI,
                    rotSpeed: (Math.random() - 0.5) * 0.008,
                    vx: (Math.random() - 0.5) * 0.2, // Trôi nhẹ
                    vy: (Math.random() - 0.5) * 0.2,
                    originX: 0,
                    originY: 0
                });
            }
        }

        // Vẽ ngôi sao 4 cánh kim cương (✦) với hào quang tỏa sáng lộng lẫy
        drawDiamondStar(x, y, radius, spikeLen, rot, color, alpha) {
            const ctx = this.ctx;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rot);

            // Hào quang tỏa tròn xung quanh (Glow Halo)
            const glowR = spikeLen * 1.5;
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, glowR);
            grad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.85})`);
            grad.addColorStop(0.35, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.35})`);
            grad.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, glowR, 0, Math.PI * 2);
            ctx.fill();

            // 4 Cánh sao nhọn (Spike Cross)
            ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${Math.min(1, alpha * 1.2)})`;
            ctx.beginPath();
            // Cánh dọc
            ctx.moveTo(0, -spikeLen);
            ctx.quadraticCurveTo(0, 0, radius * 0.8, 0);
            ctx.quadraticCurveTo(0, 0, 0, spikeLen);
            ctx.quadraticCurveTo(0, 0, -radius * 0.8, 0);
            ctx.quadraticCurveTo(0, 0, 0, -spikeLen);
            ctx.fill();

            // Cánh ngang
            ctx.beginPath();
            ctx.moveTo(-spikeLen, 0);
            ctx.quadraticCurveTo(0, 0, 0, radius * 0.8);
            ctx.quadraticCurveTo(0, 0, spikeLen, 0);
            ctx.quadraticCurveTo(0, 0, 0, -radius * 0.8);
            ctx.quadraticCurveTo(0, 0, -spikeLen, 0);
            ctx.fill();

            // Tâm sao trắng sáng rực rỡ (White Hot Center)
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, alpha * 1.4)})`;
            ctx.beginPath();
            ctx.arc(0, 0, radius * 0.75, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        // Vẽ đốm sao tròn phát sáng
        drawDotStar(x, y, radius, color, alpha) {
            const ctx = this.ctx;
            const glowR = radius * 3.5;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, glowR);
            grad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`);
            grad.addColorStop(0.4, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.4})`);
            grad.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, glowR, 0, Math.PI * 2);
            ctx.fill();

            // Lõi sao
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Bắn sao băng (Shooting Star / Meteor)
        spawnMeteor() {
            const startX = Math.random() * (this.width * 0.8) + (this.width * 0.1);
            const startY = Math.random() * (this.height * 0.35);
            const length = 120 + Math.random() * 140;
            const angle = (Math.PI / 4) + (Math.random() - 0.5) * 0.3; // Chéo ~45 độ
            const speed = 12 + Math.random() * 8;
            const colorObj = this.colors[Math.floor(Math.random() * this.colors.length)];

            this.meteors.push({
                x: startX,
                y: startY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                length: length,
                thickness: 1.8 + Math.random() * 1.5,
                color: colorObj,
                alpha: 1,
                life: 1,
                decay: 0.02 + Math.random() * 0.015
            });
        }

        // Tạo vụ nổ hạt bụi sao lung linh khi chạm tay hoặc click chuột (Nova Burst)
        createBurst(x, y, count = 14) {
            for (let i = 0; i < count; i++) {
                if (this.sparkles.length >= this.maxSparkles) {
                    this.sparkles.shift();
                }
                const angle = Math.random() * Math.PI * 2;
                const speed = 1.5 + Math.random() * 4.5;
                const colorObj = this.colors[Math.floor(Math.random() * this.colors.length)];

                this.sparkles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 2 + Math.random() * 3,
                    color: colorObj,
                    alpha: 1,
                    decay: 0.02 + Math.random() * 0.025,
                    isDiamond: Math.random() < 0.45,
                    rot: Math.random() * Math.PI,
                    rotSpeed: (Math.random() - 0.5) * 0.15
                });
            }
        }

        // Vệt bụi sao theo con trỏ chuột / ngón tay (Stardust Trail)
        addTrailSparkle(x, y) {
            if (this.sparkles.length >= this.maxSparkles) {
                this.sparkles.shift();
            }
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 2;
            const colorObj = this.colors[Math.floor(Math.random() * this.colors.length)];

            this.sparkles.push({
                x: x + (Math.random() - 0.5) * 8,
                y: y + (Math.random() - 0.5) * 8,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 0.6, // Bay nhẹ lên trên
                size: 1.8 + Math.random() * 2.2,
                color: colorObj,
                alpha: 0.95,
                decay: 0.025 + Math.random() * 0.02,
                isDiamond: Math.random() < 0.4,
                rot: Math.random() * Math.PI,
                rotSpeed: (Math.random() - 0.5) * 0.1
            });
        }

        attachEvents() {
            // Resize handler with debounce
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => this.resize(), 150);
            }, { passive: true });

            // Mouse events
            window.addEventListener('mousemove', (e) => {
                const dist = Math.hypot(e.clientX - this.mouse.lastX, e.clientY - this.mouse.lastY);
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
                this.mouse.lastMoved = Date.now();

                // Tạo vệt sao khi di chuyển chuột
                if (dist > 18) {
                    this.addTrailSparkle(e.clientX, e.clientY);
                    this.mouse.lastX = e.clientX;
                    this.mouse.lastY = e.clientY;
                }
            }, { passive: true });

            // Touch events for mobile
            window.addEventListener('touchmove', (e) => {
                if (e.touches && e.touches[0]) {
                    const t = e.touches[0];
                    const dist = Math.hypot(t.clientX - this.mouse.lastX, t.clientY - this.mouse.lastY);
                    this.mouse.x = t.clientX;
                    this.mouse.y = t.clientY;
                    this.mouse.lastMoved = Date.now();

                    if (dist > 16) {
                        this.addTrailSparkle(t.clientX, t.clientY);
                        this.mouse.lastX = t.clientX;
                        this.mouse.lastY = t.clientY;
                    }
                }
            }, { passive: true });

            // Click / Tap burst (Tương tác nổ chòm sao lấp lánh)
            window.addEventListener('pointerdown', (e) => {
                this.createBurst(e.clientX, e.clientY, 12);
            }, { passive: true });
        }

        animate() {
            this.rafId = requestAnimationFrame(() => this.animate());

            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.width, this.height);

            const now = Date.now();
            const mouseActive = (now - this.mouse.lastMoved) < 1800;

            // 1. Kiểm tra kích hoạt sao băng định kỳ
            if (now - this.lastMeteorTime > this.meteorInterval) {
                this.spawnMeteor();
                this.lastMeteorTime = now + (Math.random() - 0.5) * 1200; // Ngẫu nhiên chút
            }

            // 2. Vẽ đường nối các chòm sao gần nhau (Constellation Lines - Tinh tế, mờ nhẹ)
            const maxConnectDist = this.width < 768 ? 65 : 85;
            for (let i = 0; i < this.stars.length; i++) {
                for (let j = i + 1; j < this.stars.length; j++) {
                    const dx = this.stars[i].x - this.stars[j].x;
                    const dy = this.stars[i].y - this.stars[j].y;
                    const dist = Math.hypot(dx, dy);

                    if (dist < maxConnectDist) {
                        const lineAlpha = (1 - dist / maxConnectDist) * 0.16 * Math.min(this.stars[i].alpha, this.stars[j].alpha);
                        ctx.strokeStyle = `rgba(255, 112, 67, ${lineAlpha})`;
                        ctx.lineWidth = 0.75;
                        ctx.beginPath();
                        ctx.moveTo(this.stars[i].x, this.stars[i].y);
                        ctx.lineTo(this.stars[j].x, this.stars[j].y);
                        ctx.stroke();
                    }
                }
            }

            // 3. Cập nhật và vẽ từng ngôi sao
            for (let i = 0; i < this.stars.length; i++) {
                const s = this.stars[i];

                // Chuyển động nhấp nháy tuần hoàn mượt mà (Sinusoidal Twinkle)
                s.twinklePhase += s.twinkleSpeed;
                const twinkleFactor = (Math.sin(s.twinklePhase) + 1) / 2; // 0 .. 1
                s.alpha = s.baseAlpha * 0.4 + twinkleFactor * s.baseAlpha * 0.6;
                s.rotation += s.rotSpeed;

                // Trôi nhẹ trong không gian
                s.x += s.vx;
                s.y += s.vy;
                if (s.x < 0) s.x = this.width;
                if (s.x > this.width) s.x = 0;
                if (s.y < 0) s.y = this.height;
                if (s.y > this.height) s.y = 0;

                // Tương tác hút nhẹ từ trường chuột khi con trỏ ở gần (Magnetic Starlight)
                if (mouseActive) {
                    const mdx = this.mouse.x - s.x;
                    const mdy = this.mouse.y - s.y;
                    const mdist = Math.hypot(mdx, mdy);
                    const magnetRadius = 130;

                    if (mdist < magnetRadius && mdist > 1) {
                        const pull = (1 - mdist / magnetRadius) * 0.8;
                        s.x += (mdx / mdist) * pull;
                        s.y += (mdy / mdist) * pull;
                        s.alpha = Math.min(1, s.alpha + 0.4); // Sáng bừng lên khi gần chuột
                    }
                }

                // Vẽ sao
                if (s.isDiamond) {
                    const curSpike = s.spikeLength * (0.7 + twinkleFactor * 0.4);
                    this.drawDiamondStar(s.x, s.y, s.baseRadius, curSpike, s.rotation, s.color, s.alpha);
                } else {
                    const curR = s.baseRadius * (0.8 + twinkleFactor * 0.4);
                    this.drawDotStar(s.x, s.y, curR, s.color, s.alpha);
                }
            }

            // 4. Cập nhật và vẽ các Sao Băng (Meteors)
            for (let i = this.meteors.length - 1; i >= 0; i--) {
                const m = this.meteors[i];
                m.x += m.vx;
                m.y += m.vy;
                m.alpha -= m.decay;

                if (m.alpha <= 0 || m.x > this.width + 100 || m.y > this.height + 100) {
                    this.meteors.splice(i, 1);
                    continue;
                }

                const tailX = m.x - (m.vx / Math.hypot(m.vx, m.vy)) * m.length;
                const tailY = m.y - (m.vy / Math.hypot(m.vx, m.vy)) * m.length;

                const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
                grad.addColorStop(0, `rgba(${m.color.r}, ${m.color.g}, ${m.color.b}, 0)`);
                grad.addColorStop(0.65, `rgba(${m.color.r}, ${m.color.g}, ${m.color.b}, ${m.alpha * 0.6})`);
                grad.addColorStop(1, `rgba(255, 255, 255, ${m.alpha})`);

                ctx.save();
                ctx.strokeStyle = grad;
                ctx.lineWidth = m.thickness;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(tailX, tailY);
                ctx.lineTo(m.x, m.y);
                ctx.stroke();

                // Đầu sao băng sáng chói
                ctx.fillStyle = `rgba(255, 255, 255, ${m.alpha})`;
                ctx.beginPath();
                ctx.arc(m.x, m.y, m.thickness * 1.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            }

            // 5. Cập nhật và vẽ các hạt tương tác vệt bụi sao (Sparkles / Stardust)
            for (let i = this.sparkles.length - 1; i >= 0; i--) {
                const sp = this.sparkles[i];
                sp.x += sp.vx;
                sp.y += sp.vy;
                sp.vy += 0.04; // Trọng lực nhẹ
                sp.vx *= 0.98;
                sp.vy *= 0.98;
                sp.alpha -= sp.decay;
                sp.rot += sp.rotSpeed;

                if (sp.alpha <= 0) {
                    this.sparkles.splice(i, 1);
                    continue;
                }

                if (sp.isDiamond) {
                    this.drawDiamondStar(sp.x, sp.y, sp.size * 0.5, sp.size * 2, sp.rot, sp.color, sp.alpha);
                } else {
                    this.drawDotStar(sp.x, sp.y, sp.size * 0.7, sp.color, sp.alpha);
                }
            }
        }
    }

    // Tự động khởi chạy ngay khi trang sẵn sàng
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.StarfieldInstance = new InteractiveStarfield();
        });
    } else {
        window.StarfieldInstance = new InteractiveStarfield();
    }
})();
