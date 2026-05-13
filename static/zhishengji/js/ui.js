class UIManager {
    constructor(game) {
        this.game = game;
        this.mainMenu = document.getElementById('main-menu');
        this.pauseMenu = document.getElementById('pause-menu');
        this.gameOverMenu = document.getElementById('game-over-menu');
        this.hud = document.getElementById('hud');
        this.virtualControls = document.getElementById('virtual-controls');
        
        this.levelDisplay = document.getElementById('level-display');
        this.scoreDisplay = document.getElementById('score-display');
        this.timeDisplay = document.getElementById('time-display');
        this.fuelFill = document.getElementById('fuel-fill');
        this.rescuedDisplay = document.getElementById('rescued-display');
        this.totalDisplay = document.getElementById('total-display');
        
        this.gameOverTitle = document.getElementById('game-over-title');
        this.gameOverStats = document.getElementById('game-over-stats');
        
        this.setupButtons();
    }

    setupButtons() {
        document.getElementById('start-btn').addEventListener('click', () => {
            this.game.startGame();
        });

        document.getElementById('continue-btn').addEventListener('click', () => {
            this.game.continueGame();
        });

        document.getElementById('resume-btn').addEventListener('click', () => {
            this.game.resumeGame();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.game.restartGame();
        });

        document.getElementById('quit-btn').addEventListener('click', () => {
            this.game.quitToMenu();
        });

        document.getElementById('next-level-btn').addEventListener('click', () => {
            this.game.nextLevel();
        });

        document.getElementById('retry-btn').addEventListener('click', () => {
            this.game.restartGame();
        });

        document.getElementById('menu-btn').addEventListener('click', () => {
            this.game.quitToMenu();
        });

        document.getElementById('pause-hud-btn').addEventListener('click', () => {
            this.game.pauseGame();
        });

        document.querySelectorAll('.helicopter-option').forEach(option => {
            option.addEventListener('click', () => {
                if (!option.classList.contains('locked')) {
                    document.querySelectorAll('.helicopter-option').forEach(o => {
                        o.classList.remove('selected');
                    });
                    option.classList.add('selected');
                    this.game.selectedHelicopter = option.dataset.type;
                }
            });
        });
    }

    updateLevelSelect(unlockedLevels, completedLevels) {
        const levelOptions = document.getElementById('level-options');
        levelOptions.innerHTML = '';

        for (let i = 1; i <= 5; i++) {
            const levelBtn = document.createElement('div');
            levelBtn.className = 'level-option';
            levelBtn.textContent = i;
            
            if (i > unlockedLevels) {
                levelBtn.classList.add('locked');
                levelBtn.textContent = '🔒';
            } else {
                if (completedLevels.includes(i)) {
                    levelBtn.classList.add('completed');
                }
                if (i === this.game.currentLevel) {
                    levelBtn.classList.add('selected');
                }
                levelBtn.addEventListener('click', () => {
                    this.game.currentLevel = i;
                    this.updateLevelSelect(unlockedLevels, completedLevels);
                });
            }
            
            levelOptions.appendChild(levelBtn);
        }
    }

    updateHelicopterSelect(unlockedHelicopters) {
        document.querySelectorAll('.helicopter-option').forEach(option => {
            const type = option.dataset.type;
            if (unlockedHelicopters.includes(type)) {
                option.classList.remove('locked');
                if (type === this.game.selectedHelicopter) {
                    option.classList.add('selected');
                }
            } else {
                option.classList.add('locked');
                option.classList.remove('selected');
            }
        });
    }

    showMainMenu(hasSave) {
        this.mainMenu.style.display = 'flex';
        this.pauseMenu.style.display = 'none';
        this.gameOverMenu.style.display = 'none';
        this.hud.style.display = 'none';
        this.virtualControls.style.display = 'none';
        
        const continueBtn = document.getElementById('continue-btn');
        continueBtn.style.display = hasSave ? 'inline-block' : 'none';
    }

    showPauseMenu() {
        this.mainMenu.style.display = 'none';
        this.pauseMenu.style.display = 'flex';
        this.gameOverMenu.style.display = 'none';
    }

    hidePauseMenu() {
        this.pauseMenu.style.display = 'none';
    }

    showGameOver(isVictory, stats) {
        this.gameOverMenu.style.display = 'flex';
        this.virtualControls.style.display = 'none';
        
        this.gameOverTitle.textContent = isVictory ? '🏆 任务完成！' : '💥 任务失败';
        this.gameOverTitle.style.color = isVictory ? '#00FF00' : '#FF0000';
        
        let statsHtml = `
            <p>🎯 关卡: ${stats.level}</p>
            <p>⭐ 得分: ${stats.score}</p>
            <p>👥 救援人数: ${stats.rescued}/${stats.total}</p>
            <p>⏱️ 剩余时间: ${stats.timeRemaining}秒</p>
            <p>⛽ 剩余燃油: ${Math.round(stats.fuelRemaining)}%</p>
        `;
        
        this.gameOverStats.innerHTML = statsHtml;
        
        const nextLevelBtn = document.getElementById('next-level-btn');
        nextLevelBtn.style.display = isVictory && stats.level < 5 ? 'inline-block' : 'none';
    }

    hideGameOver() {
        this.gameOverMenu.style.display = 'none';
    }

    showGameUI() {
        this.mainMenu.style.display = 'none';
        this.pauseMenu.style.display = 'none';
        this.gameOverMenu.style.display = 'none';
        this.hud.style.display = 'block';
        this.virtualControls.style.display = 'block';
    }

    updateHUD(stats) {
        this.levelDisplay.textContent = stats.level;
        this.scoreDisplay.textContent = stats.score;
        this.timeDisplay.textContent = stats.time;
        this.fuelFill.style.width = `${stats.fuel}%`;
        this.rescuedDisplay.textContent = stats.rescued;
        this.totalDisplay.textContent = stats.total;

        if (stats.fuel < 20) {
            this.fuelFill.style.background = 'linear-gradient(90deg, #FF0000, #FF6347)';
        } else if (stats.fuel < 50) {
            this.fuelFill.style.background = 'linear-gradient(90deg, #FFA500, #FFD700)';
        } else {
            this.fuelFill.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
        }
    }
}