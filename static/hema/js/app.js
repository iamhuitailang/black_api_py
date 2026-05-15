const App = {
    init() {
        Game.init();
        this.setupEventListeners();
        
        if (Game.hasSavedState()) {
            if (confirm('发现未完成的游戏，是否继续？')) {
                if (Game.loadState()) {
                    this.showGameScreen();
                    Game.isRunning = true;
                    Game.lastTime = performance.now();
                    Game.gameLoop();
                }
            }
        }
    },
    
    setupEventListeners() {
        const startScreen = document.getElementById('start-screen');
        const pauseScreen = document.getElementById('pause-screen');
        const gameUI = document.getElementById('game-ui');
        
        document.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
            });
        });
        
        document.getElementById('start-btn').addEventListener('click', () => {
            const selectedCard = document.querySelector('.character-card.selected');
            const hippoType = selectedCard.dataset.type;
            
            this.showGameScreen();
            Game.start(hippoType);
        });
        
        document.getElementById('pause-btn').addEventListener('click', () => {
            Game.pause();
            pauseScreen.classList.remove('hidden');
        });
        
        document.getElementById('resume-btn').addEventListener('click', () => {
            pauseScreen.classList.add('hidden');
            Game.resume();
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            pauseScreen.classList.add('hidden');
            Game.restart();
        });
        
        document.getElementById('quit-btn').addEventListener('click', () => {
            pauseScreen.classList.add('hidden');
            gameUI.classList.add('hidden');
            startScreen.classList.remove('hidden');
            Game.isRunning = false;
            Storage.clear();
        });
        
        document.getElementById('retry-btn').addEventListener('click', () => {
            document.getElementById('gameover-screen').classList.add('hidden');
            Game.restart();
        });
        
        document.getElementById('home-btn').addEventListener('click', () => {
            document.getElementById('gameover-screen').classList.add('hidden');
            gameUI.classList.add('hidden');
            startScreen.classList.remove('hidden');
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (Game.isRunning && !Game.isPaused) {
                    Game.pause();
                    pauseScreen.classList.remove('hidden');
                } else if (Game.isPaused) {
                    pauseScreen.classList.add('hidden');
                    Game.resume();
                }
            }
        });
    },
    
    showGameScreen() {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('gameover-screen').classList.add('hidden');
        document.getElementById('pause-screen').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});