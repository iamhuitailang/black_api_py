class App {
    constructor() {
        this.game = null;
        this.selectedCharacter = 'clown';
        this.selectedTheme = 'hell';
        this.aiCount = 1;
        
        this.init();
    }
    
    init() {
        this.setupCharacterSelect();
        this.setupEventListeners();
        this.checkSavedGame();
    }
    
    setupCharacterSelect() {
        const container = document.getElementById('character-select');
        
        Object.entries(GameConfig.CHARACTERS).forEach(([type, config]) => {
            const card = document.createElement('div');
            card.className = 'character-card' + (type === 'clown' ? ' selected' : '');
            card.dataset.type = type;
            card.innerHTML = `
                <h4>${config.emoji} ${config.name}</h4>
                <p>${config.description}</p>
                <p style="color:#888; font-size:0.75rem; margin-top:5px;">
                    特技: ${config.skillName} - ${config.skillDesc}
                </p>
            `;
            card.addEventListener('click', () => this.selectCharacter(type));
            container.appendChild(card);
        });
    }
    
    selectCharacter(type) {
        this.selectedCharacter = type;
        
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.type === type);
        });
    }
    
    setupEventListeners() {
        document.querySelectorAll('input[name="ai-count"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.aiCount = parseInt(e.target.value);
            });
        });
        
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectedTheme = e.target.dataset.theme;
                
                document.querySelectorAll('.theme-btn').forEach(b => {
                    b.classList.toggle('active', b === e.target);
                });
                
                this.updateThemePreview();
            });
        });
        
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startNewGame();
        });
        
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.resumeGame();
        });
        
        document.getElementById('pause-btn').addEventListener('click', () => {
            if (this.game) {
                this.game.togglePause();
            }
        });
        
        document.getElementById('resume-game-btn').addEventListener('click', () => {
            if (this.game) {
                this.game.togglePause();
            }
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('quit-btn').addEventListener('click', () => {
            this.quitToMenu();
        });
        
        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('back-menu-btn').addEventListener('click', () => {
            this.quitToMenu();
        });
    }
    
    updateThemePreview() {
        const startScreen = document.getElementById('start-screen');
        startScreen.classList.remove('theme-circus', 'theme-street');
        
        if (this.selectedTheme === 'circus') {
            startScreen.classList.add('theme-circus');
        } else if (this.selectedTheme === 'street') {
            startScreen.classList.add('theme-street');
        }
    }
    
    checkSavedGame() {
        const hasSaved = StorageManager.hasSavedState();
        const resumeBtn = document.getElementById('resume-btn');
        
        if (hasSaved) {
            resumeBtn.style.display = 'block';
        } else {
            resumeBtn.style.display = 'none';
        }
    }
    
    startNewGame() {
        StorageManager.clearState();
        this.createGame();
    }
    
    resumeGame() {
        const savedState = StorageManager.loadState();
        if (!savedState) {
            this.startNewGame();
            return;
        }
        
        const canvas = document.getElementById('game-canvas');
        this.game = new Game(canvas);
        
        StorageManager.restoreGameState(savedState, this.game);
        
        this.game.groundY = canvas.height - 100;
        this.game.renderer.setTheme(this.game.theme);
        this.game.renderer.groundY = this.game.groundY;
        
        InputManager.init(this.game);
        this.game.startGameLoop();
        this.game.startAutoSave();
        
        if (this.game.items.length === 0) {
            setTimeout(() => {
                if (!this.game.isPaused && !this.game.isGameOver) {
                    this.game.spawnItem();
                }
            }, 1000);
        }
        
        this.showGameScreen();
    }
    
    createGame() {
        const canvas = document.getElementById('game-canvas');
        this.game = new Game(canvas);
        
        InputManager.init(this.game);
        
        this.game.init({
            characterType: this.selectedCharacter,
            aiCount: this.aiCount,
            theme: this.selectedTheme
        });
        
        this.showGameScreen();
    }
    
    showGameScreen() {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('pause-screen').classList.add('hidden');
    }
    
    showStartScreen() {
        document.getElementById('start-screen').classList.remove('hidden');
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('pause-screen').classList.add('hidden');
        
        this.checkSavedGame();
    }
    
    restartGame() {
        if (this.game) {
            this.game.destroy();
            this.game = null;
        }
        
        StorageManager.clearState();
        
        document.getElementById('pause-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        
        this.createGame();
    }
    
    quitToMenu() {
        if (this.game) {
            if (!this.game.isGameOver) {
                const state = StorageManager.buildGameState(this.game);
                StorageManager.saveState(state);
            }
            this.game.destroy();
            this.game = null;
        }
        
        this.showStartScreen();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});