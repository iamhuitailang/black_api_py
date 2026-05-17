class UIManager {
    constructor() {
        this.screens = {};
        this.currentScreen = 'loading';
        this.initScreens();
    }

    initScreens() {
        this.screens = {
            loading: document.getElementById('loading-screen'),
            menu: document.getElementById('menu-screen'),
            character: document.getElementById('character-select'),
            level: document.getElementById('level-select'),
            howto: document.getElementById('how-to-play'),
            pause: document.getElementById('pause-menu'),
            gameover: document.getElementById('game-over'),
            complete: document.getElementById('level-complete')
        };

        document.getElementById('high-score-value').textContent = Storage.getHighScore();
    }

    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            if (screen) screen.classList.remove('active');
        });
        
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
            this.currentScreen = screenName;
        }
    }

    hideAllScreens() {
        Object.values(this.screens).forEach(screen => {
            if (screen) screen.classList.remove('active');
        });
        this.currentScreen = null;
    }

    updateHighScore() {
        document.getElementById('high-score-value').textContent = Storage.getHighScore();
    }

    showPauseMenu() {
        this.showScreen('pause');
    }

    hidePauseMenu() {
        this.hideAllScreens();
    }

    showGameOver(game) {
        document.getElementById('final-score').textContent = game.score;
        document.getElementById('final-kills').textContent = game.killCount;
        document.getElementById('final-time').textContent = Utils.formatTime(game.totalTime);
        this.showScreen('gameover');
    }

    showLevelComplete(game) {
        document.getElementById('level-score').textContent = game.score;
        document.getElementById('level-kills').textContent = game.killCount;
        document.getElementById('level-time').textContent = Utils.formatTime(game.levelTime);
        document.getElementById('level-rank').textContent = Utils.calculateRank(game.score, game.levelTime, game.killCount);
        this.showScreen('complete');
    }

    updateHUD(game) {
        const player1 = game.players[0];
        if (player1) {
            this.updatePlayerHearts('player1', player1.health);
            document.getElementById('player1-lives').textContent = player1.lives;
        }

        if (game.mode === 'coop' && game.players[1]) {
            document.getElementById('player2-stats').style.display = 'flex';
            this.updatePlayerHearts('player2', game.players[1].health);
            document.getElementById('player2-lives').textContent = game.players[1].lives;
        } else {
            document.getElementById('player2-stats').style.display = 'none';
        }

        document.getElementById('score-value').textContent = game.score;
        document.getElementById('level-value').textContent = game.currentLevel;
        document.getElementById('timer-value').textContent = Utils.formatTime(game.levelTime);
        
        if (player1) {
            document.getElementById('flower-count').textContent = player1.flowerCount;
            document.getElementById('star-count').textContent = player1.starCount;
        }
    }

    updatePlayerHearts(playerId, health) {
        const heartsContainer = document.getElementById(`${playerId}-hearts`);
        if (!heartsContainer) return;
        
        heartsContainer.innerHTML = '';
        for (let i = 0; i < CONFIG.PLAYER.MAX_HEALTH; i++) {
            const heart = document.createElement('div');
            heart.className = `heart ${i < health ? '' : 'empty'}`;
            heartsContainer.appendChild(heart);
        }
    }

    generateLevelButtons(maxLevel) {
        const grid = document.getElementById('level-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        for (let i = 1; i <= LEVELS.length; i++) {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            btn.textContent = i;
            
            const isUnlocked = Storage.isLevelUnlocked(i) || i <= maxLevel;
            const isCompleted = Storage.isLevelCompleted(i);
            
            if (!isUnlocked) {
                btn.disabled = true;
                btn.textContent = '🔒';
            } else if (isCompleted) {
                btn.classList.add('completed');
                const stats = Storage.getLevelStats(i);
                if (stats) {
                    btn.title = `最高分: ${stats.score}\n评价: ${stats.rank}`;
                }
            }
            
            btn.addEventListener('click', () => {
                if (isUnlocked) {
                    Audio.playMenuSelect();
                    this.onLevelSelect?.(i);
                }
            });
            
            grid.appendChild(btn);
        }
    }

    setMenuButtonHandlers(handlers) {
        document.getElementById('btn-start').addEventListener('click', () => {
            Audio.playMenuSelect();
            handlers.onStart?.();
        });

        document.getElementById('btn-continue').addEventListener('click', () => {
            Audio.playMenuSelect();
            handlers.onContinue?.();
        });

        document.getElementById('btn-how-to-play').addEventListener('click', () => {
            Audio.playMenuSelect();
            this.showScreen('howto');
        });

        document.getElementById('btn-back-menu').addEventListener('click', () => {
            Audio.playMenuSelect();
            this.showScreen('menu');
        });

        document.getElementById('btn-back-menu2').addEventListener('click', () => {
            Audio.playMenuSelect();
            this.showScreen('menu');
        });

        document.getElementById('btn-back-char').addEventListener('click', () => {
            Audio.playMenuSelect();
            this.showScreen('character');
        });

        document.getElementById('btn-start-game').addEventListener('click', () => {
            Audio.playMenuSelect();
            handlers.onStartGame?.();
        });

        document.getElementById('btn-resume').addEventListener('click', () => {
            Audio.playMenuSelect();
            handlers.onResume?.();
        });

        document.getElementById('btn-restart').addEventListener('click', () => {
            Audio.playMenuSelect();
            handlers.onRestart?.();
        });

        document.getElementById('btn-quit').addEventListener('click', () => {
            Audio.playMenuSelect();
            handlers.onQuit?.();
        });

        document.getElementById('btn-retry').addEventListener('click', () => {
            Audio.playMenuSelect();
            handlers.onRetry?.();
        });

        document.getElementById('btn-gameover-quit').addEventListener('click', () => {
            Audio.playMenuSelect();
            handlers.onQuit?.();
        });

        document.getElementById('btn-next-level').addEventListener('click', () => {
            Audio.playMenuSelect();
            handlers.onNextLevel?.();
        });

        document.getElementById('btn-pause').addEventListener('click', () => {
            Audio.playMenuSelect();
            handlers.onPause?.();
        });

        this.setupCharacterSelect();
        this.setupModeSelect();
        this.setupDifficultySelect();
    }

    setupCharacterSelect() {
        const cards = document.querySelectorAll('.character-card');
        let selectedCharacter = 'qiqi';

        cards.forEach(card => {
            card.addEventListener('click', () => {
                Audio.playMenuSelect();
                cards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedCharacter = card.dataset.character;
                this.onCharacterSelect?.(selectedCharacter);
            });
        });

        cards[0].classList.add('selected');
        this.onCharacterSelect?.(selectedCharacter);
    }

    setupModeSelect() {
        const buttons = document.querySelectorAll('.mode-btn');
        let selectedMode = 'single';

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                Audio.playMenuSelect();
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedMode = btn.dataset.mode;
                this.onModeSelect?.(selectedMode);
            });
        });

        this.onModeSelect?.(selectedMode);
    }

    setupDifficultySelect() {
        const buttons = document.querySelectorAll('.diff-btn');
        let selectedDifficulty = 'normal';

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                Audio.playMenuSelect();
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedDifficulty = btn.dataset.difficulty;
                this.onDifficultySelect?.(selectedDifficulty);
            });
        });

        this.onDifficultySelect?.(selectedDifficulty);
    }

    showHUD() {
        document.getElementById('game-hud').style.display = 'flex';
    }

    hideHUD() {
        document.getElementById('game-hud').style.display = 'none';
    }

    updateContinueButton() {
        const btn = document.getElementById('btn-continue');
        if (btn) {
            btn.style.display = Storage.hasSavedGame() ? 'block' : 'none';
        }
    }
}

const UI = new UIManager();
