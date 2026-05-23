class Game {
    constructor(canvas, ctx, width, height, dpr) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.dpr = dpr;
        
        this.player = new Player(width, height);
        this.itemManager = new ItemManager(width, height);
        this.ui = new UI(width, height);
        
        this.score = 0;
        this.highScore = Storage.getHighScore();
        this.highCombo = Storage.getHighCombo();
        this.elapsedTime = 0;
        this.currentTheme = Storage.getTheme();
        
        this.state = 'start';
        this.lastTime = 0;
        this.isRunning = false;
        
        this.keys = { left: false, right: false };
        
        this.themeButtons = this.createThemeButtons();
        this.difficultyNotice = { text: '', alpha: 0, timer: 0 };
        this.stateSaveTimer = 0;
        
        this.setupEventListeners();
        this.setupHtmlButtons();
        this.loadGameState();
    }

    createThemeButtons() {
        const themes = Object.keys(GameConfig.THEMES);
        const bw = 180, bh = 50, sy = 180, sp = 70;
        return themes.map((t, i) => ({
            theme: t,
            x: (this.width - bw) / 2,
            y: sy + i * sp,
            width: bw,
            height: bh,
            hover: false
        }));
    }

    setupHtmlButtons() {
        const centerBtn = document.getElementById('centerBtn');
        const themeBtn = document.getElementById('themeBtn');
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');

        if (centerBtn) {
            centerBtn.addEventListener('click', () => {
                this.player.centerPlayer();
            });
        }

        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                if (this.state === 'playing' || this.state === 'paused') {
                    this.state = 'theme';
                }
            });
        }

        const pressLeft = () => { this.keys.left = true; this.player.moveLeft(); };
        const pressRight = () => { this.keys.right = true; this.player.moveRight(); };
        const releaseAll = () => {
            this.keys.left = false;
            this.keys.right = false;
            this.player.stopMoving();
        };

        if (leftBtn) {
            leftBtn.addEventListener('touchstart', e => { e.preventDefault(); pressLeft(); }, { passive: false });
            leftBtn.addEventListener('touchend', e => { e.preventDefault(); releaseAll(); }, { passive: false });
            leftBtn.addEventListener('mousedown', pressLeft);
            leftBtn.addEventListener('mouseup', releaseAll);
            leftBtn.addEventListener('mouseleave', releaseAll);
        }

        if (rightBtn) {
            rightBtn.addEventListener('touchstart', e => { e.preventDefault(); pressRight(); }, { passive: false });
            rightBtn.addEventListener('touchend', e => { e.preventDefault(); releaseAll(); }, { passive: false });
            rightBtn.addEventListener('mousedown', pressRight);
            rightBtn.addEventListener('mouseup', releaseAll);
            rightBtn.addEventListener('mouseleave', releaseAll);
        }
    }

    setupEventListeners() {
        document.addEventListener('keydown', e => this.onKeyDown(e));
        document.addEventListener('keyup', e => this.onKeyUp(e));
        this.canvas.addEventListener('mousemove', e => this.onMouseMove(e));
        this.canvas.addEventListener('click', e => this.onClick(e));
        this.canvas.addEventListener('touchstart', e => this.onTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchend', e => this.onTouchEnd(e), { passive: false });
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.state === 'playing') {
                this.state = 'paused';
                this.saveGameState();
            }
        });
        
        window.addEventListener('beforeunload', () => this.saveGameState());
    }

    getCanvasPoint(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (this.width / rect.width),
            y: (e.clientY - rect.top) * (this.height / rect.height)
        };
    }

    onKeyDown(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            this.keys.left = true;
            this.player.moveLeft();
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            this.keys.right = true;
            this.player.moveRight();
        }
        if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            this.player.centerPlayer();
        }
        if (e.key === 'p' || e.key === 'P') {
            if (this.state === 'playing') { this.state = 'paused'; this.saveGameState(); }
            else if (this.state === 'paused') { this.state = 'playing'; }
        }
        if (e.key === 'Escape' && this.state === 'theme') {
            this.state = 'start';
        }
    }

    onKeyUp(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = false;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = false;
        if (!this.keys.left && !this.keys.right) this.player.stopMoving();
    }

    onMouseMove(e) {
        if (this.state === 'theme') {
            const { x, y } = this.getCanvasPoint(e);
            this.themeButtons.forEach(b => b.hover = this.inRect(x, y, b));
        }
    }

    onTouchStart(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        for (const t of e.touches) {
            const x = (t.clientX - rect.left) * (this.width / rect.width);
            const y = (t.clientY - rect.top) * (this.height / rect.height);
            this.handleClick(x, y);
        }
    }

    onTouchEnd(e) {
        e.preventDefault();
    }

    onClick(e) {
        const { x, y } = this.getCanvasPoint(e);
        this.handleClick(x, y);
    }

    handleClick(x, y) {
        if (this.state === 'theme') {
            for (const b of this.themeButtons) {
                if (this.inRect(x, y, b)) {
                    this.currentTheme = b.theme;
                    Storage.setTheme(b.theme);
                    this.state = 'start';
                    return;
                }
            }
            return;
        }
        if (this.state === 'start') this.startGame();
        else if (this.state === 'gameover') { this.resetGame(); this.state = 'start'; }
    }

    inRect(x, y, r) {
        return x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
    }

    startGame() {
        this.resetGame();
        this.state = 'playing';
        this.isRunning = true;
    }

    resetGame() {
        this.score = 0;
        this.elapsedTime = 0;
        this.player.reset();
        this.itemManager.reset();
        this.ui.reset();
        this.difficultyNotice = { text: '', alpha: 0, timer: 0 };
        Storage.clearGameState();
    }

    addScore(points) {
        this.score += points;
        if (this.player.combo > this.highCombo) {
            this.highCombo = this.player.combo;
            Storage.setHighCombo(this.highCombo);
        }
    }

    onItemPicked(item, score) {
        this.ui.addScorePopup(item.x, item.y, score, this.player.combo >= 5);
    }

    onPlayerHit(item, scoreLoss) {
        this.ui.addFloatingText(`${scoreLoss}`, item.x, item.y, '#FF6B6B');
    }

    onGameOver() {
        this.state = 'gameover';
        this.isRunning = false;
        Storage.setHighScore(this.score);
        if (this.score > this.highScore) this.highScore = this.score;
        Storage.clearGameState();
    }

    showDifficultyNotice(stage) {
        const notices = ['', '速度提升!', '难度增加!', '杂物增多!', '极限挑战!'];
        if (stage > 0 && stage < notices.length) {
            this.difficultyNotice = { text: notices[stage], alpha: 1, timer: 3000 };
        }
    }

    update(dt) {
        if (this.state !== 'playing') return;
        
        this.elapsedTime += dt * 1000;
        
        const oldStage = this.itemManager.currentStage;
        this.itemManager.updateDifficulty(this.elapsedTime);
        if (this.itemManager.currentStage !== oldStage) {
            this.showDifficultyNotice(this.itemManager.currentStage);
        }
        
        if (this.difficultyNotice.timer > 0) {
            this.difficultyNotice.timer -= dt * 1000;
            this.difficultyNotice.alpha = Math.min(1, this.difficultyNotice.timer / 1000);
        }
        
        this.player.update(dt);
        this.itemManager.update(dt, this.player, this);
        this.ui.update(dt);
        
        this.stateSaveTimer += dt * 1000;
        if (this.stateSaveTimer >= 2000) {
            this.stateSaveTimer = 0;
            this.saveGameState();
        }
    }

    draw() {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.scale(this.dpr, this.dpr);
        
        this.ui.drawBackground(this.ctx, this.currentTheme, this.elapsedTime);
        
        if (this.state === 'playing' || this.state === 'paused') {
            this.itemManager.draw(this.ctx);
            this.player.draw(this.ctx, this.currentTheme);
            this.ui.drawHUD(this.ctx, this, this.player);
            this.ui.drawScorePopups(this.ctx);
            this.ui.drawFloatingTexts(this.ctx);
            this.drawDifficultyNotice(this.ctx);
        }
        
        if (this.state === 'start') this.ui.drawStartScreen(this.ctx, this);
        else if (this.state === 'paused') this.ui.drawPauseScreen(this.ctx);
        else if (this.state === 'gameover') {
            this.itemManager.draw(this.ctx);
            this.player.draw(this.ctx, this.currentTheme);
            this.ui.drawGameOverScreen(this.ctx, this, this.player);
        } else if (this.state === 'theme') {
            this.ui.drawThemeSelector(this.ctx, this, this.themeButtons);
        }
        
        this.ctx.restore();
    }

    drawDifficultyNotice(ctx) {
        if (this.difficultyNotice.alpha <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.difficultyNotice.alpha;
        ctx.font = 'bold 24px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
        ctx.fillStyle = '#E67E22';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 8;
        ctx.fillText(this.difficultyNotice.text, this.width / 2, 110);
        ctx.restore();
    }

    gameLoop(ct) {
        if (!this.lastTime) this.lastTime = ct;
        const dt = Math.min((ct - this.lastTime) / 1000, 0.05);
        this.lastTime = ct;
        this.update(dt);
        this.draw();
        requestAnimationFrame(t => this.gameLoop(t));
    }

    start() { this.gameLoop(0); }

    saveGameState() {
        if (this.state !== 'playing') return;
        Storage.saveGameState({
            score: this.score,
            elapsedTime: this.elapsedTime,
            currentTheme: this.currentTheme,
            player: this.player.getState(),
            items: this.itemManager.getState(),
            savedAt: Date.now()
        });
    }

    loadGameState() {
        const s = Storage.loadGameState();
        if (!s) return;
        if (Date.now() - (s.savedAt || 0) > 120000) {
            Storage.clearGameState();
            return;
        }
        this.score = s.score || 0;
        this.elapsedTime = s.elapsedTime || 0;
        this.currentTheme = s.currentTheme || 'sunny';
        this.player.loadState(s.player);
        this.itemManager.loadState(s.items);
        this.state = 'paused';
        this.isRunning = true;
    }
}
