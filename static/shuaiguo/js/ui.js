class UIManager {
    constructor() {
        this.startMenu = document.getElementById('start-menu');
        this.pauseMenu = document.getElementById('pause-menu');
        this.gameOverMenu = document.getElementById('game-over-menu');
        this.gameScreen = document.getElementById('game-screen');
        
        this.timerElement = document.getElementById('timer');
        this.playerBlameBar = document.getElementById('player-blame-bar');
        this.enemyBlameBar = document.getElementById('enemy-blame-bar');
        this.playerBlameValue = document.getElementById('player-blame-value');
        this.enemyBlameValue = document.getElementById('enemy-blame-value');
        this.playerIcon = document.getElementById('player-icon');
        this.enemyIcon = document.getElementById('enemy-icon');
        this.playerName = document.getElementById('player-name');
        this.enemyName = document.getElementById('enemy-name');
        
        this.gameResultTitle = document.getElementById('game-result-title');
        this.gameResultText = document.getElementById('game-result-text');
        
        this.characterCards = document.querySelectorAll('.character-card');
        this.selectedCharacter = 'programmer';
        
        this.bindEvents();
        this.loadSavedCharacter();
    }

    bindEvents() {
        this.characterCards.forEach(card => {
            card.addEventListener('click', () => {
                this.selectCharacter(card.dataset.character);
            });
        });

        document.getElementById('start-btn').addEventListener('click', () => {
            this.onStartGame && this.onStartGame();
        });

        document.getElementById('resume-btn').addEventListener('click', () => {
            this.onResumeGame && this.onResumeGame();
        });

        document.getElementById('pause-btn').addEventListener('click', () => {
            this.onPauseGame && this.onPauseGame();
        });

        document.getElementById('resume-game-btn').addEventListener('click', () => {
            this.onResumeGameFromPause && this.onResumeGameFromPause();
        });

        document.getElementById('restart-game-btn').addEventListener('click', () => {
            this.onRestartGame && this.onRestartGame();
        });

        document.getElementById('exit-game-btn').addEventListener('click', () => {
            this.onExitGame && this.onExitGame();
        });

        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.onRestartGame && this.onRestartGame();
        });

        document.getElementById('back-to-menu-btn').addEventListener('click', () => {
            this.onExitGame && this.onExitGame();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.onPauseGame && this.onPauseGame();
            }
        });
    }

    loadSavedCharacter() {
        const saved = StorageManager.loadSelectedCharacter();
        if (saved) {
            this.selectCharacter(saved);
        }
    }

    selectCharacter(characterId) {
        this.selectedCharacter = characterId;
        StorageManager.saveSelectedCharacter(characterId);
        
        this.characterCards.forEach(card => {
            if (card.dataset.character === characterId) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    }

    showStartMenu(hasSave = false) {
        this.startMenu.classList.add('active');
        this.pauseMenu.classList.remove('active');
        this.gameOverMenu.classList.remove('active');
        
        const resumeBtn = document.getElementById('resume-btn');
        resumeBtn.style.display = hasSave ? 'inline-block' : 'none';
    }

    hideStartMenu() {
        this.startMenu.classList.remove('active');
    }

    showPauseMenu() {
        this.pauseMenu.classList.add('active');
    }

    hidePauseMenu() {
        this.pauseMenu.classList.remove('active');
    }

    showGameOverMenu(winner, reason) {
        if (winner === 'player') {
            this.gameResultTitle.textContent = '🎉 胜利！';
            this.gameResultTitle.style.color = '#27ae60';
        } else {
            this.gameResultTitle.textContent = '😢 失败...';
            this.gameResultTitle.style.color = '#e74c3c';
        }
        this.gameResultText.textContent = reason;
        this.gameOverMenu.classList.add('active');
    }

    hideGameOverMenu() {
        this.gameOverMenu.classList.remove('active');
    }

    showGameScreen() {
        this.gameScreen.style.display = 'flex';
    }

    hideGameScreen() {
        this.gameScreen.style.display = 'none';
    }

    updateTimer(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        this.timerElement.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        if (seconds <= 10) {
            this.timerElement.style.color = '#e74c3c';
        } else if (seconds <= 30) {
            this.timerElement.style.color = '#f39c12';
        } else {
            this.timerElement.style.color = '#fff';
        }
    }

    updatePlayerInfo(player) {
        this.playerIcon.textContent = player.characterData.icon;
        this.playerName.textContent = player.characterData.name;
        this.updateBlameBar(this.playerBlameBar, this.playerBlameValue, player.blame, player.maxBlame);
    }

    updateEnemyInfo(enemy) {
        this.enemyIcon.textContent = enemy.characterData.icon;
        this.enemyName.textContent = enemy.characterData.name;
        this.updateBlameBar(this.enemyBlameBar, this.enemyBlameValue, enemy.blame, enemy.maxBlame);
    }

    updateBlameBar(barElement, valueElement, current, max) {
        const percentage = (current / max) * 100;
        barElement.style.width = `${percentage}%`;
        valueElement.textContent = `${Math.floor(current)}/${max}`;
        
        if (percentage > 80) {
            barElement.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
        } else if (percentage > 50) {
            barElement.style.background = 'linear-gradient(90deg, #f39c12, #e67e22)';
        } else {
            barElement.style.background = barElement === this.playerBlameBar 
                ? 'linear-gradient(90deg, #27ae60, #2ecc71)'
                : 'linear-gradient(90deg, #e74c3c, #c0392b)';
        }
    }

    getSelectedCharacter() {
        return this.selectedCharacter;
    }
}