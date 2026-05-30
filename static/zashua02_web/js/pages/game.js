const GamePage = {
    gameStarted: false,
    savedState: null,

    render() {
        if (GameEngine.isRunning) {
            GameEngine.stop();
            GameEngine.stopAutoSave();
        }
        const app = document.getElementById('app');
        app.innerHTML = this.renderLayout(this.renderContent());
        this.bindEvents();
        this.initGame();
    },

    renderLayout(content) {
        const user = AuthService.getCurrentUser();
        const currentRoute = Router.getCurrentRoute();

        return `
            <div class="game-layout">
                <header class="game-header">
                    <div class="game-header-left">
                        <div class="game-logo">
                            <span class="icon">🎪</span>
                            <span>杂耍大师</span>
                        </div>
                    </div>
                    <div class="game-header-right">
                        <div class="user-menu" id="userMenu">
                            <div class="user-avatar">${user?.nickname?.[0] || user?.username?.[0] || 'U'}</div>
                            <span>${user?.nickname || user?.username || '玩家'}</span>
                        </div>
                    </div>
                </header>

                <nav class="game-nav">
                    <button class="nav-btn ${currentRoute === 'home' ? 'active' : ''}" data-route="home">🏠 首页</button>
                    <button class="nav-btn ${currentRoute === 'character' ? 'active' : ''}" data-route="character">👤 角色</button>
                    <button class="nav-btn ${currentRoute === 'game' ? 'active' : ''}" data-route="game">🎮 游戏</button>
                    <button class="nav-btn ${currentRoute === 'rank' ? 'active' : ''}" data-route="rank">🏆 排行</button>
                    <button class="nav-btn ${currentRoute === 'settings' ? 'active' : ''}" data-route="settings">⚙️ 设置</button>
                </nav>

                <main class="game-main">
                    <div class="game-content">
                        ${content}
                    </div>
                </main>

                <div class="game-modal" id="gameModal">
                    <div class="modal-content">
                        <div class="modal-icon" id="modalIcon">🎉</div>
                        <div class="modal-title" id="modalTitle">游戏结束</div>
                        <div class="modal-desc" id="modalDesc">感谢游玩！</div>
                        <div class="modal-stats">
                            <div class="modal-stat">
                                <div class="modal-stat-label">得分</div>
                                <div class="modal-stat-value" id="finalScore">0</div>
                            </div>
                            <div class="modal-stat">
                                <div class="modal-stat-label">最高连击</div>
                                <div class="modal-stat-value" id="finalCombo">0</div>
                            </div>
                            <div class="modal-stat">
                                <div class="modal-stat-label">关卡</div>
                                <div class="modal-stat-value" id="finalLevel">1</div>
                            </div>
                            <div class="modal-stat">
                                <div class="modal-stat-label">状态</div>
                                <div class="modal-stat-value" id="finalStatus">结束</div>
                            </div>
                        </div>
                        <div class="modal-buttons">
                            <button class="btn btn-secondary" id="backBtn">返回首页</button>
                            <button class="btn btn-primary" id="restartBtn">再来一局</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderContent() {
        return `
            <div class="game-canvas-container">
                <div class="game-canvas-header">
                    <div class="game-hud">
                        <div class="hud-item">
                            <span class="hud-label">🏆 得分:</span>
                            <span class="hud-value" id="scoreDisplay">0</span>
                        </div>
                        <div class="hud-item">
                            <span class="hud-label">🔥 连击:</span>
                            <span class="hud-value" id="comboDisplay">0</span>
                        </div>
                        <div class="hud-item">
                            <span class="hud-label">📊 关卡:</span>
                            <span class="hud-value" id="levelDisplay">1</span>
                        </div>
                        <div class="hud-item">
                            <span class="hud-label">❤️ 血量:</span>
                            <div class="hp-bar">
                                <div class="hp-fill" id="hpFill" style="width: 100%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="beat-indicator">
                        <span class="beat-label">节拍</span>
                        <div class="beat-circle" id="beatCircle">🥁</div>
                    </div>
                </div>

                <canvas id="gameCanvas" style="width:100%;height:440px;display:block;background:#1a0a2e;"></canvas>

                <div class="game-controls">
                    <div class="control-keys">
                        <span class="key-hint"><span class="key">← →</span> 移动</span>
                        <span class="key-hint"><span class="key">空格</span> 抛道具</span>
                        <span class="key-hint"><span class="key">Shift</span> 接道具</span>
                    </div>
                    <div class="control-buttons">
                        <button class="btn btn-secondary" id="pauseBtn">⏸️ 暂停</button>
                        <button class="btn btn-primary" id="startBtn">▶️ 开始游戏</button>
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.stopGame();
                Router.navigate(btn.dataset.route);
            });
        });

        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });

        document.getElementById('backBtn').addEventListener('click', () => {
            Router.navigate('home');
        });

        document.getElementById('userMenu')?.addEventListener('click', async () => {
            if (confirm('确定要退出登录吗？')) {
                this.stopGame();
                await AuthService.logout();
                Router.navigate('login');
            }
        });

        this._keyHandler = (e) => {
            if (!GameEngine.isRunning || GameEngine.isPaused) return;
            switch (e.code) {
                case 'ArrowLeft':
                    e.preventDefault();
                    GameEngine.movePlayer('left');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    GameEngine.movePlayer('right');
                    break;
                case 'Space':
                    e.preventDefault();
                    GameEngine.handleInput('throw');
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                    e.preventDefault();
                    GameEngine.handleInput('catch');
                    break;
            }
        };
        document.addEventListener('keydown', this._keyHandler);

        window.addEventListener('beforeunload', () => {
            if (GameEngine.isRunning) {
                Storage.setGameState(GameEngine.getState());
                GameEngine.saveGameStateSync();
            }
        });
    },

    async initGame() {
        const settings = Storage.getSettings();
        const user = AuthService.getCurrentUser();

        const canvas = document.getElementById('gameCanvas');
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width || 1000;
        canvas.height = 440;

        GameEngine.init(canvas, {
            difficulty: settings.difficulty,
            characterType: user?.characterType || 'clown'
        });

        let savedState = null;
        try {
            savedState = await GameEngine.loadGameState();
        } catch (e) {}

        if (savedState && savedState.hp > 0) {
            const restored = GameEngine.restoreState(savedState);
            if (restored) {
                GameEngine.isRunning = true;
                GameEngine.isPaused = true;
                GameEngine.lastTime = 0;
                this.gameStarted = true;
                this._pauseOnRestore = true;

                const startBtn = document.getElementById('startBtn');
                const pauseBtn = document.getElementById('pauseBtn');
                if (startBtn) {
                    startBtn.disabled = true;
                    startBtn.innerHTML = '游戏进行中...';
                }
                if (pauseBtn) {
                    pauseBtn.innerHTML = '▶️ 继续';
                }

                this.updateHUD();
                GameEngine.renderCanvas();

                setTimeout(() => {
                    if (GameEngine.isPaused && pauseBtn && pauseBtn.innerHTML !== '▶️ 继续') {
                        pauseBtn.innerHTML = '▶️ 继续';
                    }
                }, 200);

                Toast.info('已恢复上次游戏进度，点击继续开始');
            }
        }

        GameEngine.onScoreUpdate = (score) => {
            document.getElementById('scoreDisplay').textContent = score;
        };

        GameEngine.onComboUpdate = (combo, maxCombo) => {
            document.getElementById('comboDisplay').textContent = combo;
        };

        GameEngine.onHpUpdate = (hp, maxHp) => {
            const percentage = (hp / maxHp) * 100;
            const fill = document.getElementById('hpFill');
            fill.style.width = `${percentage}%`;
            fill.classList.remove('warning', 'danger');
            if (percentage <= 25) fill.classList.add('danger');
            else if (percentage <= 50) fill.classList.add('warning');
        };

        GameEngine.onBeat = (beat) => {
            const circle = document.getElementById('beatCircle');
            circle.classList.add('active');
            setTimeout(() => circle.classList.remove('active'), 150);
        };

        GameEngine.onLevelComplete = (level) => {
            document.getElementById('levelDisplay').textContent = level;
            Toast.success('🎉 进入第 ' + level + ' 关！');
        };

        GameEngine.onGameOver = (passed, stats) => {
            this.showGameOver(passed, stats);
        };

        this.applyTheme();
    },

    updateHUD() {
        document.getElementById('scoreDisplay').textContent = GameEngine.score;
        document.getElementById('comboDisplay').textContent = GameEngine.combo;
        document.getElementById('levelDisplay').textContent = GameEngine.level;
        const pct = (GameEngine.hp / GameEngine.maxHp) * 100;
        document.getElementById('hpFill').style.width = pct + '%';
    },

    applyTheme() {
        const settings = Storage.getSettings();
        document.body.className = '';
        if (settings.theme !== 'circus') {
            document.body.classList.add('theme-' + settings.theme);
        }
    },

    startGame() {
        if (this.gameStarted) return;
        this.gameStarted = true;
        document.getElementById('startBtn').disabled = true;
        document.getElementById('startBtn').innerHTML = '游戏进行中...';
        GameEngine.start();
    },

    togglePause() {
        if (!this.gameStarted) return;
        const btn = document.getElementById('pauseBtn');
        if (GameEngine.isPaused) {
            if (!GameEngine.lastTime) {
                GameEngine.lastTime = performance.now();
                BeatSystem.start((beat) => {
                    GameEngine.handleBeat(beat);
                    if (GameEngine.onBeat) GameEngine.onBeat(beat);
                });
                GameEngine.startAutoSave();
                GameEngine.gameLoop(performance.now());
            } else {
                GameEngine.resume();
            }
            btn.innerHTML = '⏸️ 暂停';
        } else {
            GameEngine.pause();
            btn.innerHTML = '▶️ 继续';
        }
    },

    stopGame() {
        if (GameEngine.isRunning) {
            GameEngine.stop();
            GameEngine.saveGameState();
        }
        this.gameStarted = false;
    },

    restartGame() {
        document.getElementById('gameModal').classList.remove('show');
        GameEngine.stop();
        GameEngine.clearSavedState();

        const settings = Storage.getSettings();
        const user = AuthService.getCurrentUser();
        const canvas = document.getElementById('gameCanvas');

        GameEngine.init(canvas, {
            difficulty: settings.difficulty,
            characterType: user?.characterType || 'clown'
        });

        this.updateHUD();

        this.gameStarted = false;
        document.getElementById('startBtn').disabled = false;
        document.getElementById('startBtn').innerHTML = '▶️ 开始游戏';
        document.getElementById('pauseBtn').innerHTML = '⏸️ 暂停';
    },

    async showGameOver(passed, stats) {
        await GameEngine.saveRecord(passed);
        GameEngine.clearSavedState();

        const modal = document.getElementById('gameModal');
        document.getElementById('modalIcon').textContent = passed ? '🎉' : '😢';
        document.getElementById('modalTitle').textContent = passed ? '恭喜通关！' : '游戏结束';
        document.getElementById('modalDesc').textContent = passed ? '你是真正的杂耍大师！' : '再接再厉，继续加油！';
        document.getElementById('finalScore').textContent = stats.score;
        document.getElementById('finalCombo').textContent = stats.maxCombo;
        document.getElementById('finalLevel').textContent = stats.level;
        document.getElementById('finalStatus').textContent = passed ? '通关' : '失败';

        modal.classList.add('show');

        this.gameStarted = false;
        document.getElementById('startBtn').disabled = false;
        document.getElementById('startBtn').innerHTML = '▶️ 开始游戏';
    }
};

window.GamePage = GamePage;
