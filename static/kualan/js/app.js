const App = (function() {
    let selectedMode = 1;
    let uiUpdateInterval = null;

    function init() {
        Game.init();
        setupEventListeners();
        Input.init(Game.handleAccelerate, Game.handleJump);
        Renderer.init(document.getElementById('gameCanvas'));
        
        if (Game.hasSavedGame()) {
            if (confirm('检测到未完成的游戏，是否继续？')) {
                Game.loadGame();
                showScreen('gameScreen');
                startUIUpdate();
            }
        }
    }

    function setupEventListeners() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                selectMode(parseInt(btn.dataset.mode));
            });
        });

        document.querySelector('.mode-btn[data-mode="1"]').classList.add('selected');

        document.getElementById('startBtn').addEventListener('click', () => {
            startGame();
        });

        document.getElementById('pauseBtn').addEventListener('click', () => {
            pauseGame();
        });

        document.getElementById('resumeBtn').addEventListener('click', () => {
            resumeGame();
        });

        document.getElementById('restartBtn').addEventListener('click', () => {
            restartGame();
        });

        document.getElementById('quitBtn').addEventListener('click', () => {
            quitGame();
        });

        document.getElementById('playAgainBtn').addEventListener('click', () => {
            startGame();
        });

        document.getElementById('backToMenuBtn').addEventListener('click', () => {
            showScreen('startScreen');
        });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                const state = Game.getState();
                if (state.status === 'playing') {
                    pauseGame();
                } else if (state.status === 'paused') {
                    resumeGame();
                }
            }
        });

        window.addEventListener('beforeunload', () => {
            const state = Game.getState();
            if (state.status === 'playing') {
                Game.saveGame();
            }
        });

        window.addEventListener('unload', () => {
            const state = Game.getState();
            if (state.status === 'playing') {
                Game.saveGame();
            }
        });
    }

    function selectMode(mode) {
        selectedMode = mode;
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (parseInt(btn.dataset.mode) === mode) {
                btn.classList.add('selected');
            }
        });
    }

    function startGame() {
        Game.startGame(selectedMode);
        showScreen('gameScreen');
        startUIUpdate();
    }

    function pauseGame() {
        Game.pauseGame();
        document.getElementById('pauseMenu').classList.remove('hidden');
        stopUIUpdate();
    }

    function resumeGame() {
        Game.resumeGame();
        document.getElementById('pauseMenu').classList.add('hidden');
        startUIUpdate();
    }

    function restartGame() {
        Game.restartGame();
        document.getElementById('pauseMenu').classList.add('hidden');
        startUIUpdate();
    }

    function quitGame() {
        Game.quitGame();
        document.getElementById('pauseMenu').classList.add('hidden');
        stopUIUpdate();
        showScreen('startScreen');
    }

    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        document.getElementById(screenId).classList.remove('hidden');
    }

    function startUIUpdate() {
        stopUIUpdate();
        uiUpdateInterval = setInterval(updateUI, 50);
    }

    function stopUIUpdate() {
        if (uiUpdateInterval) {
            clearInterval(uiUpdateInterval);
            uiUpdateInterval = null;
        }
    }

    function updateUI() {
        const state = Game.getState();
        
        if (state.status === 'finished') {
            stopUIUpdate();
            showResults();
            return;
        }

        document.getElementById('timeDisplay').textContent = state.raceTime.toFixed(2) + 's';
        document.getElementById('distanceDisplay').textContent = Math.max(0, state.raceDistance - state.player.x).toFixed(1) + 'm';
        document.getElementById('perfectDisplay').textContent = state.player.perfectHurdles;
        document.getElementById('rankDisplay').textContent = state.finalRank;
        document.getElementById('weatherDisplay').textContent = state.weather.emoji;
    }

    function showResults() {
        const results = Game.getResults();
        
        document.getElementById('finalTime').textContent = results.time + 's';
        document.getElementById('finalRank').textContent = results.rank;
        document.getElementById('finalPerfect').textContent = results.perfect;
        document.getElementById('baseScore').textContent = results.baseScore;
        document.getElementById('bonusScore').textContent = results.bonusScore;
        document.getElementById('totalScore').textContent = results.totalScore;
        
        showScreen('resultScreen');
    }

    return {
        init
    };
})();

document.addEventListener('DOMContentLoaded', App.init);