class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.currentLevel = 1;
        this.gameState = 'menu';
        this.isPaused = false;

        this.gameMap = null;
        this.player = null;
        this.enemyManager = new EnemyManager();

        this.elapsedTime = 0;
        this.deathCount = 0;
        this.purificationFound = 0;
        this.purificationTotal = 0;

        this.lastFrameTime = 0;
        this.animationFrameId = null;

        this.playerProgress = null;
        this.completedLevels = new Set();

        this.init();
    }

    async init() {
        Effects.init();
        this.setupEventListeners();
        this.renderLevelSelect();
        await this.loadProgress();
    }

    async loadProgress() {
        try {
            const progressResult = await GameAPI.getProgress();
            if (progressResult && progressResult.code === 0 && progressResult.data) {
                this.playerProgress = progressResult.data;
                document.getElementById('unlocked-levels').textContent = this.playerProgress.unlocked_level || 1;
                document.getElementById('total-completions').textContent = this.playerProgress.total_completions || 0;
            }
        } catch (e) {
            console.error('loadProgress error:', e);
        }

        try {
            const completedResult = await GameAPI.getCompletedLevels();
            if (Array.isArray(completedResult)) {
                this.completedLevels = new Set(completedResult);
            }
        } catch (e) {
            console.error('getCompletedLevels error:', e);
        }

        this.renderLevelSelect();
    }

    renderLevelSelect() {
        const levelGrid = document.getElementById('level-grid');
        if (!levelGrid) return;
        levelGrid.innerHTML = '';

        const unlockedLevel = this.playerProgress ? this.playerProgress.unlocked_level : 1;

        for (let i = 1; i <= CONFIG.TOTAL_LEVELS; i++) {
            const btn = document.createElement('button');
            btn.className = 'level-btn';

            if (i > unlockedLevel) {
                btn.classList.add('locked');
                btn.disabled = true;
            }

            if (this.completedLevels.has(i)) {
                btn.classList.add('completed');
            }

            btn.innerHTML = `<span>${i}</span>`;
            const level = i;
            btn.addEventListener('click', () => this.startLevel(level));
            levelGrid.appendChild(btn);
        }
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        document.querySelectorAll('.d-btn').forEach(btn => {
            const dir = btn.dataset.dir;
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleMobileControl(dir, true);
            });
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handleMobileControl(dir, false);
            });
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.handleMobileControl(dir, true);
            });
            btn.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.handleMobileControl(dir, false);
            });
        });

        const antidoteBtn = document.getElementById('antidote-btn');
        if (antidoteBtn) antidoteBtn.addEventListener('click', () => this.useAntidote());
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.togglePause());

        const resumeBtn = document.getElementById('resume-btn');
        if (resumeBtn) resumeBtn.addEventListener('click', () => this.togglePause());
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) restartBtn.addEventListener('click', () => this.restartLevel());
        const quitBtn = document.getElementById('quit-btn');
        if (quitBtn) quitBtn.addEventListener('click', () => this.returnToMenu());

        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextLevel());
        const replayBtn = document.getElementById('replay-btn');
        if (replayBtn) replayBtn.addEventListener('click', () => this.restartLevel());
        const menuBtn = document.getElementById('menu-btn');
        if (menuBtn) menuBtn.addEventListener('click', () => this.returnToMenu());

        const reviveBtn = document.getElementById('revive-btn');
        if (reviveBtn) reviveBtn.addEventListener('click', () => this.restartLevel());
    }

    handleMobileControl(direction, pressed) {
        if (this.gameState !== 'playing' || this.isPaused) return;
        if (this.player) this.player.setMovement(direction, pressed);
    }

    handleKeyDown(e) {
        if (this.gameState !== 'playing') {
            if (e.key === 'Escape' && this.gameState === 'paused') {
                this.togglePause();
            }
            return;
        }

        if (!this.player) return;

        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                e.preventDefault();
                this.player.setMovement('up', true);
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                e.preventDefault();
                this.player.setMovement('down', true);
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                e.preventDefault();
                this.player.setMovement('left', true);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                this.player.setMovement('right', true);
                break;
            case ' ':
                e.preventDefault();
                this.useAntidote();
                break;
            case 'Escape':
                e.preventDefault();
                this.togglePause();
                break;
        }
    }

    handleKeyUp(e) {
        if (this.gameState !== 'playing' || !this.player) return;

        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.player.setMovement('up', false);
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                this.player.setMovement('down', false);
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.player.setMovement('left', false);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.player.setMovement('right', false);
                break;
        }
    }

    startLevel(level) {
        this.currentLevel = level;
        this.deathCount = 0;
        this.elapsedTime = 0;

        const levelConfig = CONFIG.LEVELS[level - 1];
        this.purificationTotal = levelConfig.purificationStations;
        this.purificationFound = 0;

        this.gameMap = new GameMap(levelConfig);
        this.player = new Player(this.gameMap.entry.x, this.gameMap.entry.y);
        this.enemyManager.generateEnemies(levelConfig, this.gameMap);

        Effects.reset();

        this.gameState = 'playing';
        this.isPaused = false;

        this.showScreen('game-screen');
        this.updateUI();
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }

    restartLevel() {
        this.hideAllOverlays();
        this.startLevel(this.currentLevel);
    }

    nextLevel() {
        if (this.currentLevel < CONFIG.TOTAL_LEVELS) {
            this.startLevel(this.currentLevel + 1);
        } else {
            this.returnToMenu();
        }
    }

    returnToMenu() {
        this.gameState = 'menu';
        this.isPaused = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.hideAllOverlays();
        this.loadProgress();
        this.showScreen('start-screen');
    }

    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.isPaused = true;
            this.showScreen('pause-screen', true);
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.isPaused = false;
            this.hideScreen('pause-screen');
            this.lastFrameTime = performance.now();
            this.gameLoop();
        }
    }

    showScreen(screenId, overlay = false) {
        if (overlay) {
            document.getElementById(screenId).classList.add('active');
        } else {
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById(screenId).classList.add('active');
        }
    }

    hideScreen(screenId) {
        document.getElementById(screenId).classList.remove('active');
    }

    hideAllOverlays() {
        document.querySelectorAll('.screen.overlay').forEach(s => s.classList.remove('active'));
    }

    useAntidote() {
        if (this.gameState !== 'playing' || this.isPaused || !this.player) return;
        const btn = document.getElementById('antidote-btn');
        if (btn && btn.disabled) return;

        if (this.player.useAntidote()) {
            this.updateUI();
            Effects.showHealOverlay();
            if (btn) {
                btn.classList.add('active');
                setTimeout(() => btn.classList.remove('active'), 500);
            }
        }
    }

    gameLoop(currentTime = 0) {
        if (this.gameState !== 'playing') return;

        const deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1);
        this.lastFrameTime = currentTime;

        this.update(deltaTime);
        this.render();

        this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(deltaTime) {
        if (!this.player || !this.gameMap) return;

        this.elapsedTime += deltaTime;

        this.player.update(deltaTime, this.gameMap);
        this.enemyManager.update(deltaTime, this.player, this.gameMap);
        this.gameMap.update(deltaTime);
        Effects.update(deltaTime, this.gameMap);

        const station = this.gameMap.checkPurificationCollision(this.player.x, this.player.y);
        if (station) {
            station.used = true;
            station.glows = 0.5;
            this.purificationFound++;
            this.player.applyPurification(CONFIG.PURIFICATION_HEAL, CONFIG.PURIFICATION_IMMUNE_TIME);
        }

        if (this.gameMap.checkExitCollision(this.player.x, this.player.y)) {
            if (this.player.hp > 0) {
                this.completeLevel();
                return;
            }
        }

        if (this.player.isDead()) {
            this.playerDeath();
            return;
        }

        this.updateUI();
    }

    render() {
        if (!this.gameMap || !this.player) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.gameMap.render(this.ctx, this.player.x, this.player.y);
        this.enemyManager.render(this.ctx, this.player.x, this.player.y, this.gameMap);
        this.player.render(this.ctx);
        Effects.render(this.ctx, this.player.x, this.player.y, this.gameMap);
        Effects.renderFog(this.ctx, this.player.x, this.player.y, this.gameMap);
    }

    updateUI() {
        if (!this.player || !this.gameMap) return;

        document.getElementById('current-hp').textContent = Math.ceil(this.player.hp);
        document.getElementById('max-hp').textContent = this.player.maxHp;

        const hpPercent = this.player.getHpPercent();
        const healthFill = document.getElementById('health-fill');
        healthFill.style.width = `${hpPercent}%`;

        if (hpPercent < 30) {
            healthFill.classList.add('low');
        } else {
            healthFill.classList.remove('low');
        }

        document.getElementById('current-level').textContent = this.currentLevel;
        document.getElementById('antidote-count').textContent = this.player.antidoteCount;
        const antidoteBtn = document.getElementById('antidote-btn');
        if (antidoteBtn) antidoteBtn.disabled = this.player.antidoteCount <= 0;

        document.getElementById('purification-found').textContent = this.purificationFound;
        document.getElementById('purification-total').textContent = this.purificationTotal;

        const zone = this.gameMap.getZone(this.player.x);
        const zoneIndicator = document.getElementById('zone-indicator');
        zoneIndicator.className = 'zone-indicator';
        if (zone === 'entry') {
            zoneIndicator.classList.add('zone-entry');
            zoneIndicator.textContent = '入口区';
        } else if (zone === 'middle') {
            zoneIndicator.classList.add('zone-middle');
            zoneIndicator.textContent = '中段';
        } else {
            zoneIndicator.classList.add('zone-exit');
            zoneIndicator.textContent = '出口区';
        }

        const minutes = Math.floor(this.elapsedTime / 60);
        const seconds = Math.floor(this.elapsedTime % 60);
        document.getElementById('game-timer').textContent =
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        const immuneStatus = document.getElementById('immune-status');
        if (this.player.immuneTime > 0) {
            immuneStatus.classList.remove('hidden');
            document.getElementById('immune-timer').textContent = `${Math.ceil(this.player.immuneTime)}s`;
        } else {
            immuneStatus.classList.add('hidden');
        }

        const poisonBoostStatus = document.getElementById('poison-boost-status');
        if (this.player.poisonBoostTime > 0) {
            poisonBoostStatus.classList.remove('hidden');
            document.getElementById('poison-boost-timer').textContent = `${Math.ceil(this.player.poisonBoostTime)}s`;
        } else {
            poisonBoostStatus.classList.add('hidden');
        }
    }

    async completeLevel() {
        this.gameState = 'completed';
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        let submitResult = { code: 1, data: null };
        try {
            submitResult = await GameAPI.submitRecord(
                this.currentLevel,
                Math.round(this.elapsedTime * 10) / 10,
                this.purificationFound,
                this.purificationTotal,
                this.deathCount
            );
        } catch (e) {
            console.error('submitRecord error:', e);
        }

        let isBestRecord = false;
        try {
            const bestResult = await GameAPI.getBestRecord(this.currentLevel);
            if (bestResult.code === 0 && bestResult.data && submitResult.data) {
                if (bestResult.data.id === submitResult.data.id) {
                    isBestRecord = true;
                }
            }
        } catch (e) {
            console.error('getBestRecord error:', e);
        }

        this.completedLevels.add(this.currentLevel);

        const titleEl = document.getElementById('result-title');
        titleEl.textContent = '通关成功!';
        titleEl.className = 'result-title victory';

        const minutes = Math.floor(this.elapsedTime / 60);
        const seconds = Math.floor(this.elapsedTime % 60);
        document.getElementById('result-time').textContent =
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        const discoveryRate = this.purificationTotal > 0
            ? Math.round((this.purificationFound / this.purificationTotal) * 100)
            : 0;
        document.getElementById('result-discovery').textContent = `${discoveryRate}%`;
        document.getElementById('result-deaths').textContent = this.deathCount;

        const bestRecordEl = document.getElementById('best-record');
        if (isBestRecord) {
            bestRecordEl.classList.remove('hidden');
        } else {
            bestRecordEl.classList.add('hidden');
        }

        const nextBtn = document.getElementById('next-btn');
        if (this.currentLevel >= CONFIG.TOTAL_LEVELS) {
            nextBtn.textContent = '完成全部关卡!';
            nextBtn.disabled = false;
        } else {
            nextBtn.textContent = '下一关';
            nextBtn.disabled = false;
        }

        this.showScreen('result-screen', true);
    }

    playerDeath() {
        this.gameState = 'dead';
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        this.deathCount++;
        this.showScreen('death-screen', true);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
