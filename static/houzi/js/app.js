const App = {
    game: null,
    characterSelect: null,
    currentScreen: 'start',

    init() {
        Input.init();
        
        const canvas = document.getElementById('game-canvas');
        this.game = new Game(canvas);
        
        this.characterSelect = new CharacterSelect((character) => {
            this.startGame(character);
        });
        
        this.characterSelect.init();
        
        this.bindEvents();
        
        this.checkSavedGame();
        
        this.game.start();
    },

    bindEvents() {
        document.getElementById('btn-start').addEventListener('click', () => {
            this.showScreen('character_select');
        });

        document.getElementById('btn-continue').addEventListener('click', () => {
            this.continueGame();
        });

        document.getElementById('btn-quick-start').addEventListener('click', () => {
            this.startGame(GameConfig.CHARACTERS[0]);
        });

        document.getElementById('btn-how').addEventListener('click', () => {
            this.showScreen('how');
        });

        document.getElementById('btn-back-start').addEventListener('click', () => {
            this.showScreen('start');
        });

        document.getElementById('btn-back-start2').addEventListener('click', () => {
            this.showScreen('start');
        });

        document.getElementById('btn-restart').addEventListener('click', () => {
            this.showScreen('character_select');
        });

        document.getElementById('btn-back-menu').addEventListener('click', () => {
            this.showScreen('start');
        });

        window.addEventListener('keydown', (e) => {
            if (this.currentScreen === 'playing') {
                if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
                    this.game.togglePause();
                }
            }
        });

        window.addEventListener('beforeunload', () => {
            if (this.game.state === GameConfig.GAME.STATE.PLAYING) {
                this.game.saveGame();
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.game.state === GameConfig.GAME.STATE.PLAYING) {
                this.game.saveGame();
            }
        });
    },

    checkSavedGame() {
        try {
            const savedData = localStorage.getItem(GameConfig.STORAGE_KEY);
            const btnContinue = document.getElementById('btn-continue');
            
            console.log('checkSavedGame:', savedData ? 'has data' : 'no data');
            
            if (btnContinue) {
                if (savedData) {
                    const parsed = JSON.parse(savedData);
                    console.log('checkSavedGame parsed:', JSON.stringify(parsed));
                    if (parsed && parsed.gameState === GameConfig.GAME.STATE.PLAYING) {
                        btnContinue.style.display = 'block';
                        console.log('checkSavedGame: showing continue button');
                        return;
                    }
                }
                btnContinue.style.display = 'none';
                console.log('checkSavedGame: hiding continue button');
            }
        } catch (e) {
            console.error('检查游戏状态失败:', e);
        }
    },

    showScreen(screenName) {
        this.currentScreen = screenName;
        
        document.querySelectorAll('.screen').forEach(screen => {
            screen.style.display = 'none';
        });

        switch (screenName) {
            case 'start':
                document.getElementById('start-screen').style.display = 'flex';
                this.checkSavedGame();
                break;
            case 'character_select':
                document.getElementById('character-screen').style.display = 'flex';
                break;
            case 'how':
                document.getElementById('how-screen').style.display = 'flex';
                break;
            case 'playing':
                break;
            case 'game_over':
                document.getElementById('game-over-screen').style.display = 'flex';
                break;
        }
    },

    startGame(character) {
        this.showScreen('playing');
        this.game.reset();
        this.game.init(character);
    },

    continueGame() {
        const savedState = Storage.loadGameState();
        if (savedState) {
            this.showScreen('playing');
            this.game.reset();
            this.game.init(null, savedState);
        } else {
            this.showScreen('character_select');
        }
    },

    showGameOver(result, game) {
        this.showScreen('game_over');
        
        const title = document.getElementById('game-over-title');
        const text = document.getElementById('result-text');
        const stats = document.getElementById('result-stats');
        
        switch (result) {
            case 'win':
                title.textContent = '🎉 胜利！';
                text.textContent = '恭喜你赢得了比赛！';
                text.className = 'result-text';
                break;
            case 'lose':
                title.textContent = '😢 失败';
                text.textContent = '再接再厉，继续加油！';
                text.className = 'result-text lose';
                break;
            case 'draw':
                title.textContent = '🤝 平局';
                text.textContent = '势均力敌，再来一局！';
                text.className = 'result-text';
                break;
        }
        
        stats.innerHTML = `
            <div class="stat-item">
                <div class="stat-label">你的香蕉</div>
                <div class="stat-value">🍌 ${game.player.bananaCount}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">对手香蕉</div>
                <div class="stat-value">🙊 ${game.ai.bananaCount}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">剩余体力</div>
                <div class="stat-value">❤️ ${game.player.hp}</div>
            </div>
        `;
    }
};

window.addEventListener('DOMContentLoaded', () => {
    App.init();
});
