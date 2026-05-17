class UIManager {
    constructor(game) {
        this.game = game;
        this.screens = {
            start: document.getElementById('start-screen'),
            launcher: document.getElementById('launcher-screen'),
            howToPlay: document.getElementById('how-to-play-screen'),
            pause: document.getElementById('pause-screen'),
            levelComplete: document.getElementById('level-complete-screen'),
            gameOver: document.getElementById('game-over-screen')
        };
        
        this.hud = {
            container: document.getElementById('game-hud'),
            level: document.getElementById('hud-level'),
            score: document.getElementById('hud-score'),
            target: document.getElementById('hud-target'),
            nextBubble: document.getElementById('next-bubble'),
            specialBubble: document.getElementById('special-bubble'),
            chargeBar: document.getElementById('charge-bar')
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateSelectedLauncherUI();
    }
    
    bindEvents() {
        document.getElementById('btn-start').addEventListener('click', () => this.startGame());
        document.getElementById('btn-select-launcher').addEventListener('click', () => this.showScreen('launcher'));
        document.getElementById('btn-how-to-play').addEventListener('click', () => this.showScreen('howToPlay'));
        document.getElementById('btn-back-launcher').addEventListener('click', () => this.showScreen('start'));
        document.getElementById('btn-back-help').addEventListener('click', () => this.showScreen('start'));
        
        document.querySelectorAll('.launcher-card').forEach(card => {
            card.addEventListener('click', () => {
                const launcherId = card.dataset.launcher;
                this.selectLauncher(launcherId);
            });
        });
        
        document.getElementById('btn-pause').addEventListener('click', () => this.game.pauseGame());
        document.getElementById('btn-resume').addEventListener('click', () => this.game.resumeGame());
        document.getElementById('btn-restart').addEventListener('click', () => this.game.restartLevel());
        document.getElementById('btn-quit').addEventListener('click', () => this.game.quitToMenu());
        
        document.getElementById('btn-next-level').addEventListener('click', () => this.game.nextLevel());
        document.getElementById('btn-restart-level').addEventListener('click', () => this.game.restartLevel());
        document.getElementById('btn-quit-to-menu').addEventListener('click', () => this.game.quitToMenu());
        
        document.getElementById('btn-retry').addEventListener('click', () => this.game.startNewGame());
        document.getElementById('btn-gameover-quit').addEventListener('click', () => this.game.quitToMenu());
    }
    
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => screen.classList.add('hidden'));
        this.hud.container.classList.add('hidden');
        
        if (screenName && this.screens[screenName]) {
            this.screens[screenName].classList.remove('hidden');
        }
    }
    
    showHUD() {
        Object.values(this.screens).forEach(screen => screen.classList.add('hidden'));
        this.hud.container.classList.remove('hidden');
    }
    
    hideAll() {
        Object.values(this.screens).forEach(screen => screen.classList.add('hidden'));
        this.hud.container.classList.add('hidden');
    }
    
    startGame() {
        const hasSavedGame = Storage.loadGameState();
        if (hasSavedGame) {
            if (confirm('是否继续之前的游戏？')) {
                this.game.continueGame();
            } else {
                this.game.startNewGame();
            }
        } else {
            this.game.startNewGame();
        }
    }
    
    selectLauncher(launcherId) {
        Storage.setSelectedLauncher(launcherId);
        this.updateSelectedLauncherUI();
    }
    
    updateSelectedLauncherUI() {
        const selected = Storage.getSelectedLauncher();
        document.querySelectorAll('.launcher-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.launcher === selected);
        });
    }
    
    updateHUD(gameState) {
        if (!gameState) return;
        
        this.hud.level.textContent = gameState.level;
        this.hud.score.textContent = Helpers.formatNumber(gameState.score);
        this.hud.target.textContent = Helpers.formatNumber(gameState.levelConfig.targetScore);
        
        if (gameState.launcher && gameState.launcher.nextBubble) {
            this.hud.nextBubble.innerHTML = this.createBubblePreview(gameState.launcher.nextBubble);
        }
        
        if (gameState.launcher && gameState.launcher.specialBubble) {
            this.hud.specialBubble.innerHTML = this.createBubblePreview(gameState.launcher.specialBubble);
            this.hud.specialBubble.title = `x${gameState.launcher.specialBubbleCount}`;
        } else {
            this.hud.specialBubble.innerHTML = '';
        }
        
        if (gameState.launcher) {
            this.hud.chargeBar.style.width = `${gameState.launcher.chargeLevel * 100}%`;
        }
    }
    
    createBubblePreview(bubble) {
        const color = bubble.displayColor;
        const icon = bubble.config.icon;
        return `<div style="width: 40px; height: 40px; border-radius: 50%; background: radial-gradient(circle at 30% 30%, ${Helpers.lightenColor(color, 30)}, ${color}, ${Helpers.darkenColor(color, 20)}); display: flex; justify-content: center; align-items: center; font-size: 20px;">${icon}</div>`;
    }
    
    showLevelComplete(gameState) {
        document.getElementById('complete-score').textContent = Helpers.formatNumber(gameState.score);
        document.getElementById('complete-highscore').textContent = Helpers.formatNumber(Storage.getHighScore());
        this.showScreen('levelComplete');
    }
    
    showGameOver(gameState) {
        document.getElementById('final-score').textContent = Helpers.formatNumber(gameState.score);
        document.getElementById('final-level').textContent = gameState.level;
        this.showScreen('gameOver');
    }
    
    showPause() {
        this.showScreen('pause');
    }
}
