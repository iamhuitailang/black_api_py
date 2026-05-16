const GameUI = {
    elements: {},
    isInitialized: false,

    init(game) {
        this.game = game;
        if (!this.isInitialized) {
            this.cacheElements();
            this.bindEvents();
            this.isInitialized = true;
        }
        this.updateResumeButton();
    },

    cacheElements() {
        this.elements = {
            screens: {
                start: document.getElementById('start-screen'),
                game: document.getElementById('game-screen'),
                pause: document.getElementById('pause-screen'),
                end: document.getElementById('end-screen')
            },
            buttons: {
                start: document.getElementById('start-btn'),
                resume: document.getElementById('resume-btn'),
                pause: document.getElementById('pause-btn'),
                resumeGame: document.getElementById('resume-game-btn'),
                restart: document.getElementById('restart-btn'),
                quit: document.getElementById('quit-btn'),
                playAgain: document.getElementById('play-again-btn'),
                backToMenu: document.getElementById('back-to-menu-btn')
            },
            unitButtons: document.querySelectorAll('.unit-btn'),
            display: {
                playerGold: document.getElementById('player-gold'),
                playerHp: document.getElementById('player-hp'),
                enemyGold: document.getElementById('enemy-gold'),
                enemyHp: document.getElementById('enemy-hp'),
                gameTime: document.getElementById('game-time'),
                endTitle: document.getElementById('end-title'),
                endMessage: document.getElementById('end-message'),
                endTime: document.getElementById('end-time')
            }
        };
    },

    bindEvents() {
        this.elements.buttons.start.addEventListener('click', () => this.game.startGame());
        this.elements.buttons.resume.addEventListener('click', () => this.game.resumeGame());
        this.elements.buttons.pause.addEventListener('click', () => this.game.pauseGame());
        this.elements.buttons.resumeGame.addEventListener('click', () => this.game.resumeFromPause());
        this.elements.buttons.restart.addEventListener('click', () => this.game.restartGame());
        this.elements.buttons.quit.addEventListener('click', () => this.game.quitGame());
        this.elements.buttons.playAgain.addEventListener('click', () => this.game.restartGame());
        this.elements.buttons.backToMenu.addEventListener('click', () => this.game.quitGame());

        this.elements.unitButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const unitType = btn.dataset.unit;
                this.spawnUnit(unitType);
            });
        });
    },

    spawnUnit(unitType) {
        const cost = GameData.UNIT_TYPES[unitType].cost;
        const gameState = this.game.gameState;
        
        if (gameState.player.gold >= cost && !gameState.isPaused && !gameState.isGameOver) {
            gameState.player.gold -= cost;
            
            const x = GameData.BASE.WIDTH + 40;
            const canvasHeight = gameState.canvas.height || 600;
            const y = canvasHeight / 2 + (Math.random() - 0.5) * 80;
            
            const unit = new Unit(unitType, 'player', x, y);
            gameState.units.push(unit);
            
            this.updateUI();
        }
    },

    showScreen(screenName) {
        Object.values(this.elements.screens).forEach(screen => {
            if (screen) screen.classList.remove('active');
        });
        
        this.elements.screens.pause.classList.remove('active');
        this.elements.screens.end.classList.remove('active');
        
        if (this.elements.screens[screenName]) {
            this.elements.screens[screenName].classList.add('active');
        }
        if (screenName === 'start') {
            this.updateResumeButton();
        }
    },

    showPauseScreen() {
        if (this.elements.screens.pause) {
            this.elements.screens.pause.classList.add('active');
        }
    },

    hidePauseScreen() {
        if (this.elements.screens.pause) {
            this.elements.screens.pause.classList.remove('active');
        }
    },

    showEndScreen(victory, gameTime) {
        if (victory) {
            this.elements.display.endTitle.textContent = '🎉 胜利！';
            this.elements.display.endTitle.className = 'victory';
            this.elements.display.endMessage.textContent = '你成功摧毁了敌方基地！';
        } else {
            this.elements.display.endTitle.textContent = '💀 失败';
            this.elements.display.endTitle.className = 'defeat';
            this.elements.display.endMessage.textContent = '你的基地被摧毁了...';
        }
        this.elements.display.endTime.textContent = this.formatTime(gameTime);
        if (this.elements.screens.end) {
            this.elements.screens.end.classList.add('active');
        }
    },

    hideEndScreen() {
        if (this.elements.screens.end) {
            this.elements.screens.end.classList.remove('active');
        }
    },

    updateUI() {
        const gameState = this.game.gameState;
        
        this.elements.display.playerGold.textContent = Math.floor(gameState.player.gold);
        this.elements.display.playerHp.textContent = Math.floor(gameState.player.baseHp);
        this.elements.display.enemyGold.textContent = Math.floor(gameState.enemy.gold);
        this.elements.display.enemyHp.textContent = Math.floor(gameState.enemy.baseHp);
        this.elements.display.gameTime.textContent = this.formatTime(gameState.gameTime);

        this.elements.unitButtons.forEach(btn => {
            const unitType = btn.dataset.unit;
            const cost = GameData.UNIT_TYPES[unitType].cost;
            btn.disabled = gameState.player.gold < cost || gameState.isPaused || gameState.isGameOver;
        });
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    updateResumeButton() {
        const hasSaved = GameStorage.hasSavedState();
        this.elements.buttons.resume.style.display = hasSaved ? 'block' : 'none';
    },

    forceEnableButtons() {
        this.elements.unitButtons.forEach(btn => {
            btn.disabled = false;
        });
    },

    forceClearOverlays() {
        this.elements.screens.pause.classList.remove('active');
        this.elements.screens.end.classList.remove('active');
    }
};