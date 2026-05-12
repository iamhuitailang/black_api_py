class UIManager {
    constructor(game) {
        this.game = game;
        this.setupEventListeners();
        this.hiddenElements = [];
    }

    setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => {
            this.game.startNewGame();
        });

        document.getElementById('continue-btn').addEventListener('click', () => {
            this.game.continueGame();
        });

        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.game.selectGameMode(mode);
            });
        });

        document.getElementById('back-to-title').addEventListener('click', () => {
            this.showScreen('title-screen');
        });

        document.getElementById('back-to-mode').addEventListener('click', () => {
            this.showScreen('mode-select');
        });

        document.getElementById('pause-btn').addEventListener('click', () => {
            this.game.pauseGame();
        });

        document.getElementById('resume-btn').addEventListener('click', () => {
            this.game.resumeGame();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.game.restartLevel();
        });

        document.getElementById('quit-btn').addEventListener('click', () => {
            this.game.quitToMenu();
        });

        document.getElementById('next-level-btn').addEventListener('click', () => {
            this.game.nextLevel();
        });

        document.getElementById('retry-level-btn').addEventListener('click', () => {
            this.game.restartLevel();
        });

        document.getElementById('exit-level-btn').addEventListener('click', () => {
            this.game.quitToMenu();
        });

        document.getElementById('retry-game-btn').addEventListener('click', () => {
            this.game.startNewGame();
        });

        document.getElementById('exit-game-btn').addEventListener('click', () => {
            this.game.quitToMenu();
        });

        document.getElementById('ending-exit-btn').addEventListener('click', () => {
            this.game.quitToMenu();
        });
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    showLevelSelect() {
        this.showScreen('level-select');
        this.renderLevelGrid();
    }

    renderLevelGrid() {
        const grid = document.getElementById('level-grid');
        grid.innerHTML = '';

        CONFIG.LEVELS.forEach(level => {
            const unlocked = this.game.saveData.unlockedLevels.includes(level.id);
            const card = document.createElement('div');
            card.className = `level-card ${unlocked ? '' : 'locked'}`;
            
            if (unlocked) {
                card.innerHTML = `
                    <div class="level-number">${level.id}</div>
                    <div class="level-name">${level.name}</div>
                `;
                card.addEventListener('click', () => {
                    this.game.startLevel(level.id);
                });
            }

            grid.appendChild(card);
        });

        if (this.game.saveData.chaosEmeralds >= 7) {
            const hiddenCard = document.createElement('div');
            hiddenCard.className = 'level-card';
            hiddenCard.style.background = 'linear-gradient(135deg, #ffd700 0%, #ff6b6b 100%)';
            hiddenCard.innerHTML = `
                <div class="level-number">?</div>
                <div class="level-name">翡翠神殿</div>
            `;
            hiddenCard.addEventListener('click', () => {
                this.game.startLevel('hidden');
            });
            grid.appendChild(hiddenCard);
        }
    }

    showHUD() {
        document.getElementById('hud').classList.remove('hidden');
    }

    hideHUD() {
        document.getElementById('hud').classList.add('hidden');
    }

    updateHUD(player, level) {
        document.getElementById('rings-count').textContent = Math.floor(player.rings);
        document.getElementById('lives-count').textContent = player.lives;
        document.getElementById('emeralds-count').textContent = this.game.saveData.chaosEmeralds;
        document.getElementById('score-display').textContent = player.score;

        const minutes = Math.floor(level.time / 60);
        const seconds = Math.floor(level.time % 60);
        document.getElementById('time-display').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    showPauseMenu() {
        document.getElementById('pause-menu').classList.add('active');
    }

    hidePauseMenu() {
        document.getElementById('pause-menu').classList.remove('active');
    }

    showLevelComplete(level, player) {
        const grade = level.getGrade();
        const score = level.getScore();

        document.getElementById('result-grade').textContent = grade;
        document.getElementById('result-grade').className = `result-grade ${grade}`;
        
        const minutes = Math.floor(level.time / 60);
        const seconds = Math.floor(level.time % 60);
        document.getElementById('result-time').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('result-rings').textContent = 
            `${level.collectedRings}/${level.rings.length}`;
        
        document.getElementById('result-score').textContent = score;

        const bonusesDiv = document.getElementById('result-bonuses');
        bonusesDiv.innerHTML = '';
        
        const timeBonus = Math.max(0, Math.floor(180 - level.time)) * CONFIG.SCORES.TIME_BONUS_PER_SECOND;
        if (timeBonus > 0) {
            this.addBonus(bonusesDiv, `时间奖励: +${timeBonus}`);
        }
        
        if (level.collectedRings === level.rings.length && level.rings.length > 0) {
            this.addBonus(bonusesDiv, `全收集奖励: +${CONFIG.SCORES.ALL_RINGS}`);
        }

        document.getElementById('level-complete').classList.add('active');

        const nextBtn = document.getElementById('next-level-btn');
        const currentLevelIndex = CONFIG.LEVELS.findIndex(l => l.id === level.id);
        if (currentLevelIndex >= CONFIG.LEVELS.length - 1 || 
            (currentLevelIndex === CONFIG.LEVELS.length - 2 && !CONFIG.LEVELS[currentLevelIndex + 1])) {
            nextBtn.style.display = 'none';
        } else {
            nextBtn.style.display = 'block';
        }
    }

    hideLevelComplete() {
        document.getElementById('level-complete').classList.remove('active');
    }

    addBonus(container, text) {
        const bonus = document.createElement('div');
        bonus.className = 'bonus-item';
        bonus.textContent = text;
        container.appendChild(bonus);
    }

    showGameOver(player) {
        document.getElementById('final-score').textContent = player.score;
        document.getElementById('game-over').classList.add('active');
    }

    hideGameOver() {
        document.getElementById('game-over').classList.remove('active');
    }

    showEnding(totalScore, totalTime) {
        const minutes = Math.floor(totalTime / 60);
        const seconds = Math.floor(totalTime % 60);
        
        document.getElementById('total-final-score').textContent = totalScore;
        document.getElementById('total-final-time').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        this.showScreen('ending-screen');
    }

    updateContinueButton() {
        const continueBtn = document.getElementById('continue-btn');
        continueBtn.style.display = storage.hasSavedGame() ? 'block' : 'none';
    }

    hideAllPopups() {
        this.hidePauseMenu();
        this.hideLevelComplete();
        this.hideGameOver();
    }
}
