class App {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.game = new Game(this.canvas);
        this.currentDifficulty = 'medium';
        
        this.setupUI();
        this.loadSavedState();
    }

    setupUI() {
        document.getElementById('btn-start').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('btn-difficulty').addEventListener('click', () => {
            this.cycleDifficulty();
        });

        document.getElementById('btn-records').addEventListener('click', () => {
            this.showRecords();
        });

        document.getElementById('btn-back').addEventListener('click', () => {
            this.hideRecords();
        });

        document.getElementById('btn-pause').addEventListener('click', () => {
            this.pauseGame();
        });

        document.getElementById('btn-resume').addEventListener('click', () => {
            this.resumeGame();
        });

        document.getElementById('btn-restart').addEventListener('click', () => {
            this.restartGame();
        });

        document.getElementById('btn-quit').addEventListener('click', () => {
            this.quitGame();
        });

        document.getElementById('btn-again').addEventListener('click', () => {
            this.playAgain();
        });

        document.getElementById('btn-home').addEventListener('click', () => {
            this.goHome();
        });

        this.updateDifficultyText();
    }

    loadSavedState() {
        const savedState = Storage.getLastGameState();
        if (savedState && savedState.savedAt) {
            const timePassed = Utils.now() - savedState.savedAt;
            if (timePassed < 3600000) {
                if (confirm('发现未完成的游戏，是否继续？')) {
                    this.resumeSavedGame(savedState);
                }
            }
        }
    }

    startGame() {
        document.getElementById('start-menu').classList.add('hidden');
        document.getElementById('game-hud').classList.remove('hidden');
        this.game.start(this.currentDifficulty);
    }

    resumeSavedGame(state) {
        document.getElementById('start-menu').classList.add('hidden');
        document.getElementById('game-hud').classList.remove('hidden');
        this.currentDifficulty = state.difficulty;
        this.updateDifficultyText();
        this.game.resumeFromSave(state);
    }

    cycleDifficulty() {
        const difficulties = ['easy', 'medium', 'hard'];
        const currentIndex = difficulties.indexOf(this.currentDifficulty);
        this.currentDifficulty = difficulties[(currentIndex + 1) % difficulties.length];
        this.updateDifficultyText();
        Storage.saveDifficulty(this.currentDifficulty);
    }

    updateDifficultyText() {
        const names = {
            easy: '简单',
            medium: '中等',
            hard: '困难'
        };
        document.getElementById('difficulty-text').textContent = names[this.currentDifficulty];
    }

    showRecords() {
        const records = Storage.getRecords();
        const recordsList = document.getElementById('records-list');
        
        if (records.length === 0) {
            recordsList.innerHTML = '<p style="color: #fff; text-align: center; padding: 20px;">暂无记录</p>';
        } else {
            recordsList.innerHTML = records.map((record, index) => `
                <div class="record-item">
                    <span>#${index + 1}</span>
                    <span>${Utils.formatTime(record.time)}</span>
                    <span>第${record.rank}名</span>
                    <span>${record.score}分</span>
                </div>
            `).join('');
        }
        
        document.getElementById('start-menu').classList.add('hidden');
        document.getElementById('records-menu').classList.remove('hidden');
    }

    hideRecords() {
        document.getElementById('records-menu').classList.add('hidden');
        document.getElementById('start-menu').classList.remove('hidden');
    }

    pauseGame() {
        this.game.pause();
        document.getElementById('pause-menu').classList.remove('hidden');
    }

    resumeGame() {
        document.getElementById('pause-menu').classList.add('hidden');
        this.game.resume();
    }

    restartGame() {
        document.getElementById('pause-menu').classList.add('hidden');
        this.game.restart();
    }

    quitGame() {
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('game-hud').classList.add('hidden');
        document.getElementById('start-menu').classList.remove('hidden');
        this.game.quit();
    }

    playAgain() {
        document.getElementById('finish-menu').classList.add('hidden');
        document.getElementById('game-hud').classList.remove('hidden');
        this.game.start(this.currentDifficulty);
    }

    goHome() {
        document.getElementById('finish-menu').classList.add('hidden');
        document.getElementById('game-hud').classList.add('hidden');
        document.getElementById('start-menu').classList.remove('hidden');
        this.game.state = 'menu';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
});