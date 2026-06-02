class PinballGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.w = this.canvas.width;
        this.h = this.canvas.height;

        this.physics = new Physics(this.w, this.h);
        this.score = 0;
        this.ballsLeft = 3;
        this.combo = 0;
        this.maxCombo = 0;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.hitCount = 0;
        this.hitDetails = [];
        this.itemHits = {};
        this.playTime = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.gameOver = false;
        this.levelId = 0;
        this.levelConfig = null;

        this.lastTime = 0;
        this.animId = null;

        this.onScoreUpdate = null;
        this.onComboUpdate = null;
        this.onBallLost = null;
        this.onGameOver = null;
        this.onGameStart = null;

        this._kd = this._onKeyDown.bind(this);
        this._ku = this._onKeyUp.bind(this);

        this.setupControls();
        this.setupDefault();
    }

    _onKeyDown(e) {
        if (!this.isPlaying || this.isPaused) return;
        switch (e.key.toLowerCase()) {
            case 'a': case 'arrowleft':
                e.preventDefault();
                this.physics.leftUp();
                break;
            case 'd': case 'arrowright':
                e.preventDefault();
                this.physics.rightUp();
                break;
            case ' ':
                e.preventDefault();
                this.launch();
                break;
        }
    }

    _onKeyUp(e) {
        switch (e.key.toLowerCase()) {
            case 'a': case 'arrowleft':
                this.physics.leftDown();
                break;
            case 'd': case 'arrowright':
                this.physics.rightDown();
                break;
        }
    }

    setupControls() {
        document.addEventListener('keydown', this._kd);
        document.addEventListener('keyup', this._ku);
    }

    setupDefault() {
        this.physics.clear();

        const W = this.w;
        const H = this.h;
        const cx = W / 2;
        const flipY = H - 90;
        const flipLen = 75;
        const gap = 25;

        const lx = cx - gap - flipLen;
        const rx = cx + gap;

        this.physics.setupFlippers(lx, flipY, rx, flipY, flipLen);

        this.physics.addWall(25, flipY + 20, lx - 8, flipY - 35, 0.55);
        this.physics.addWall(W - 25, flipY + 20, rx + flipLen + 8, flipY - 35, 0.55);

        this.physics.addWall(25, H - 25, 25, flipY + 20, 0.55);
        this.physics.addWall(W - 25, H - 25, W - 25, flipY + 20, 0.55);

        this.physics.addWall(25, 85, 95, 25, 0.8);
        this.physics.addWall(W - 25, 85, W - 95, 25, 0.8);

        this.physics.addBumper(cx, 190, 28, 100, '#ff6b6b');
        this.physics.addBumper(cx - 95, 270, 25, 100, '#ff6b6b');
        this.physics.addBumper(cx + 95, 270, 25, 100, '#ff6b6b');
        this.physics.addBumper(cx - 45, 370, 22, 150, '#ffd93d');
        this.physics.addBumper(cx + 45, 370, 22, 150, '#ffd93d');

        this.physics.addTarget(cx - 135, 190, 18, 500, '#4ecdc4');
        this.physics.addTarget(cx + 135, 190, 18, 500, '#4ecdc4');
        this.physics.addTarget(cx, 120, 22, 1000, '#ffe66d');

        this.physics.setGravity(0, 0.18);
        this.physics.setFriction(0.999);
    }

    loadLevel(cfg) {
        this.levelConfig = cfg;
        this.levelId = cfg.id || 0;
        this.ballsLeft = cfg.ball_count || 3;

        this.physics.clear();
        this.physics.setGravity(0, cfg.gravity || 0.18);
        this.physics.setFriction(cfg.friction || 0.999);

        const W = this.w;
        const H = this.h;
        const cx = W / 2;
        const flipY = H - 90;
        const flipLen = 75;
        const gap = 25;

        const lx = cx - gap - flipLen;
        const rx = cx + gap;

        this.physics.setupFlippers(lx, flipY, rx, flipY, flipLen);

        this.physics.addWall(25, flipY + 20, lx - 8, flipY - 35, 0.55);
        this.physics.addWall(W - 25, flipY + 20, rx + flipLen + 8, flipY - 35, 0.55);

        this.physics.addWall(25, H - 25, 25, flipY + 20, 0.55);
        this.physics.addWall(W - 25, H - 25, W - 25, flipY + 20, 0.55);

        this.physics.addWall(25, 85, 95, 25, 0.8);
        this.physics.addWall(W - 25, 85, W - 95, 25, 0.8);

        const bs = cfg.bumper_score || 100;
        this.physics.addBumper(cx, 190, 28, bs, '#ff6b6b');
        this.physics.addBumper(cx - 95, 270, 25, bs, '#ff6b6b');
        this.physics.addBumper(cx + 95, 270, 25, bs, '#ff6b6b');
        this.physics.addBumper(cx - 45, 370, 22, bs * 1.5, '#ffd93d');
        this.physics.addBumper(cx + 45, 370, 22, bs * 1.5, '#ffd93d');

        this.physics.addTarget(cx - 135, 190, 18, 500, '#4ecdc4');
        this.physics.addTarget(cx + 135, 190, 18, 500, '#4ecdc4');
        this.physics.addTarget(cx, 120, 22, 1000, '#ffe66d');
    }

    start() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.hitCount = 0;
        this.hitDetails = [];
        this.itemHits = {};
        this.playTime = 0;
        this.gameOver = false;
        this.isPlaying = true;
        this.isPaused = false;

        if (this.levelConfig) {
            this.ballsLeft = this.levelConfig.ball_count || 3;
        }

        this.physics.balls = [];
        this.physics.resetTargets();
        this.spawnBall();

        this.lastTime = performance.now();
        this.loop();

        if (this.onGameStart) this.onGameStart();
    }

    spawnBall() {
        const x = this.w - 45;
        const y = this.h - 140;
        this.physics.addBall(x, y, 7);
    }

    launch() {
        if (!this.isPlaying || this.gameOver) return;

        const active = this.physics.balls.filter(b => b.active);
        const last = active[active.length - 1];

        if (last && last.position.y > this.h - 160) {
            this.physics.launchBall(20);
        }
    }

    loop() {
        if (!this.isPlaying) return;

        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 16.67, 3);
        this.lastTime = now;

        if (!this.isPaused) this.update(dt);
        this.render();

        this.animId = requestAnimationFrame(() => this.loop());
    }

    update(dt) {
        this.playTime += dt / 60;

        const r = this.physics.update(dt);

        if (r.hits > 0) {
            this.combo++;
            this.comboCount++;
            this.comboTimer = 120;

            if (this.combo > this.maxCombo) {
                this.maxCombo = this.combo;
            }

            const mul = 1 + (this.combo - 1) * 0.1;
            const pts = Math.floor((r.score + r.comboAdd) * mul);
            this.score += pts;
            this.hitCount += r.hits;

            this.hitDetails.push({
                time: this.playTime,
                score: pts,
                combo: this.combo
            });

            if (this.onScoreUpdate) {
                this.onScoreUpdate(this.score, this.combo);
            }
        }

        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                if (this.combo > 0 && this.onComboUpdate) {
                    this.onComboUpdate(0, this.maxCombo);
                }
                this.combo = 0;
            }
        }

        const active = this.physics.balls.filter(b => b.active);
        if (active.length === 0 && this.isPlaying && !this.gameOver) {
            this.ballsLeft--;

            if (this.ballsLeft > 0) {
                setTimeout(() => {
                    if (this.isPlaying && !this.gameOver) {
                        this.spawnBall();
                        this.physics.resetTargets();
                    }
                }, 400);
            } else {
                this.end();
            }

            if (this.onBallLost) this.onBallLost(this.ballsLeft);
        }
    }

    render() {
        const ctx = this.ctx;
        if (!ctx) return;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, this.w, this.h);

        ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, this.w - 4, this.h - 4);

        this.renderWalls();
        this.renderBumpers();
        this.renderTargets();
        this.renderFlippers();
        this.renderBalls();
        this.renderLauncher();
        this.renderDrain();
    }

    renderWalls() {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';

        for (const w of this.physics.walls) {
            ctx.beginPath();
            ctx.moveTo(w.x1, w.y1);
            ctx.lineTo(w.x2, w.y2);
            ctx.stroke();
        }
    }

    renderDrain() {
        const ctx = this.ctx;
        const cx = this.w / 2;

        if (this.physics.leftFlipper && this.physics.rightFlipper) {
            const le = this.physics.leftFlipper.getEnd();
            const re = this.physics.rightFlipper.getEnd();

            ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
            ctx.beginPath();
            ctx.moveTo(le.x, le.y);
            ctx.lineTo(re.x, re.y);
            ctx.lineTo(cx, this.h);
            ctx.closePath();
            ctx.fill();
        }
    }

    renderBumpers() {
        const ctx = this.ctx;
        for (const b of this.physics.bumpers) {
            const s = 1 + b.hitAnim * 0.3;
            const r = b.radius * s;

            const g = ctx.createRadialGradient(
                b.position.x, b.position.y, 0,
                b.position.x, b.position.y, r
            );
            g.addColorStop(0, b.color);
            g.addColorStop(1, this.adjColor(b.color, -50));

            ctx.beginPath();
            ctx.arc(b.position.x, b.position.y, r, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(b.score, b.position.x, b.position.y);
        }
    }

    renderTargets() {
        const ctx = this.ctx;
        for (const t of this.physics.targets) {
            if (!t.active && t.hitAnim <= 0) continue;

            const alpha = t.active ? 1 : t.hitAnim;
            const s = t.active ? 1 : 1 + (1 - t.hitAnim) * 0.5;
            const r = t.radius * s;

            ctx.globalAlpha = alpha;

            const g = ctx.createRadialGradient(
                t.position.x, t.position.y, 0,
                t.position.x, t.position.y, r
            );
            g.addColorStop(0, t.color);
            g.addColorStop(0.7, this.adjColor(t.color, -30));
            g.addColorStop(1, this.adjColor(t.color, -60));

            ctx.beginPath();
            ctx.arc(t.position.x, t.position.y, r, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(t.position.x, t.position.y, r * 0.6, 0, Math.PI * 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(t.position.x, t.position.y, r * 0.2, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            ctx.globalAlpha = 1;
        }
    }

    renderFlippers() {
        if (this.physics.leftFlipper) {
            this.renderFlip(this.physics.leftFlipper, '#6366f1');
        }
        if (this.physics.rightFlipper) {
            this.renderFlip(this.physics.rightFlipper, '#ec4899');
        }
    }

    renderFlip(f, color) {
        const ctx = this.ctx;
        const end = f.getEnd();

        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.ang);

        const w = 14;
        const g = ctx.createLinearGradient(0, -w / 2, 0, w / 2);
        g.addColorStop(0, color);
        g.addColorStop(0.5, this.adjColor(color, 30));
        g.addColorStop(1, this.adjColor(color, -30));

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.roundRect(0, -w / 2, f.len, w, w / 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#334155';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    renderBalls() {
        const ctx = this.ctx;
        for (const b of this.physics.balls) {
            if (!b.active) continue;

            const g = ctx.createRadialGradient(
                b.position.x - 2, b.position.y - 2, 0,
                b.position.x, b.position.y, b.radius
            );
            g.addColorStop(0, '#ffffff');
            g.addColorStop(0.3, '#e2e8f0');
            g.addColorStop(1, '#94a3b8');

            ctx.beginPath();
            ctx.arc(b.position.x, b.position.y, b.radius, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(b.position.x - 2, b.position.y - 2, 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fill();
        }
    }

    renderLauncher() {
        const ctx = this.ctx;
        const x = this.w - 45;
        const y1 = this.h - 190;
        const y2 = this.h - 25;

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x - 15, y1, 30, y2 - y1);

        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 15, y1, 30, y2 - y1);

        ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
        ctx.fillRect(x - 10, y1 + 10, 20, y2 - y1 - 20);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SPACE', x, y2 - 5);
    }

    adjColor(c, amt) {
        const h = c.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(h.substr(0, 2), 16) + amt));
        const g = Math.max(0, Math.min(255, parseInt(h.substr(2, 2), 16) + amt));
        const b = Math.max(0, Math.min(255, parseInt(h.substr(4, 2), 16) + amt));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    pause() { this.isPaused = true; }
    resume() { this.isPaused = false; this.lastTime = performance.now(); }

    renderIdle() {
        this.render();
    }

    async end() {
        this.isPlaying = false;
        this.gameOver = true;

        if (this.animId) {
            cancelAnimationFrame(this.animId);
            this.animId = null;
        }

        const res = {
            level_id: this.levelId,
            score: this.score,
            combo_max: this.maxCombo,
            combo_count: this.comboCount,
            balls_used: this.levelConfig ? this.levelConfig.ball_count || 3 : 3,
            play_duration: Math.floor(this.playTime),
            hit_count: this.hitCount,
            hit_details: this.hitDetails,
            item_hits: this.itemHits
        };

        if (this.onGameOver) this.onGameOver(res);
    }

    restart() {
        this.physics.clear();
        if (this.levelConfig) {
            this.loadLevel(this.levelConfig);
        } else {
            this.setupDefault();
        }
        this.start();
    }

    destroy() {
        this.isPlaying = false;
        if (this.animId) {
            cancelAnimationFrame(this.animId);
            this.animId = null;
        }
        document.removeEventListener('keydown', this._kd);
        document.removeEventListener('keyup', this._ku);
    }

    saveState() {
        const s = {
            score: this.score,
            ballsLeft: this.ballsLeft,
            combo: this.combo,
            maxCombo: this.maxCombo,
            comboCount: this.comboCount,
            comboTimer: this.comboTimer,
            hitCount: this.hitCount,
            hitDetails: this.hitDetails.slice(-50),
            itemHits: this.itemHits,
            playTime: this.playTime,
            gameOver: this.gameOver,
            levelId: this.levelId,
            levelConfig: this.levelConfig,
            savedAt: Date.now()
        };
        Storage.set('danzhu_game_state', s);
        return s;
    }

    restoreState(s) {
        if (!s) return false;

        this.score = s.score || 0;
        this.ballsLeft = s.ballsLeft ?? 3;
        this.combo = s.combo || 0;
        this.maxCombo = s.maxCombo || 0;
        this.comboCount = s.comboCount || 0;
        this.comboTimer = s.comboTimer || 0;
        this.hitCount = s.hitCount || 0;
        this.hitDetails = s.hitDetails || [];
        this.itemHits = s.itemHits || {};
        this.playTime = s.playTime || 0;
        this.gameOver = s.gameOver || false;
        this.levelId = s.levelId || 0;
        this.levelConfig = s.levelConfig || null;

        if (this.levelConfig) {
            this.loadLevel(this.levelConfig);
        } else {
            this.setupDefault();
        }

        this.physics.balls = [];
        this.spawnBall();

        this.isPlaying = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        this.loop();

        if (this.onScoreUpdate) this.onScoreUpdate(this.score, this.combo);
        if (this.onBallLost) this.onBallLost(this.ballsLeft);

        return true;
    }

    clearSavedState() { Storage.remove('danzhu_game_state'); }

    static hasSavedState() {
        const s = Storage.get('danzhu_game_state');
        if (!s) return false;
        if (s.gameOver) return false;
        const age = Date.now() - (s.savedAt || 0);
        return age < 30 * 60 * 1000;
    }
}
