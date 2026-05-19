const UI = {
    elements: {},

    init() {
        this.elements = {
            mainMenu: document.getElementById('main-menu'),
            pauseMenu: document.getElementById('pause-menu'),
            gameOver: document.getElementById('game-over'),
            startBtn: document.getElementById('start-btn'),
            continueBtn: document.getElementById('continue-btn'),
            resumeBtn: document.getElementById('resume-btn'),
            restartBtn: document.getElementById('restart-btn'),
            quitBtn: document.getElementById('quit-btn'),
            playAgainBtn: document.getElementById('play-again-btn'),
            backMenuBtn: document.getElementById('back-menu-btn'),
            resultTitle: document.getElementById('result-title'),
            resultText: document.getElementById('result-text'),
            characterCards: document.querySelectorAll('.character-card')
        };

        this.selectedCharacter = 'monk';
        this.bindEvents();
        this.checkSavedGame();
    },

    bindEvents() {
        this.elements.characterCards.forEach(card => {
            card.addEventListener('click', () => {
                this.selectCharacter(card.dataset.character);
            });
        });

        this.elements.startBtn.addEventListener('click', () => {
            if (this.onStartGame) {
                this.onStartGame(this.selectedCharacter);
            }
        });

        this.elements.continueBtn.addEventListener('click', () => {
            if (this.onContinueGame) {
                this.onContinueGame();
            }
        });

        this.elements.resumeBtn.addEventListener('click', () => {
            if (this.onResume) {
                this.onResume();
            }
        });

        this.elements.restartBtn.addEventListener('click', () => {
            if (this.onRestart) {
                this.onRestart();
            }
        });

        this.elements.quitBtn.addEventListener('click', () => {
            if (this.onQuit) {
                this.onQuit();
            }
        });

        this.elements.playAgainBtn.addEventListener('click', () => {
            if (this.onPlayAgain) {
                this.onPlayAgain();
            }
        });

        this.elements.backMenuBtn.addEventListener('click', () => {
            if (this.onBackToMenu) {
                this.onBackToMenu();
            }
        });
    },

    selectCharacter(charId) {
        this.selectedCharacter = charId;
        this.elements.characterCards.forEach(card => {
            card.classList.toggle('selected', card.dataset.character === charId);
        });
    },

    checkSavedGame() {
        if (Storage.hasSavedGame()) {
            this.elements.continueBtn.style.display = 'block';
        } else {
            this.elements.continueBtn.style.display = 'none';
        }
    },

    showMainMenu() {
        this.elements.mainMenu.classList.remove('hidden');
        this.elements.pauseMenu.classList.add('hidden');
        this.elements.gameOver.classList.add('hidden');
        this.checkSavedGame();
    },

    hideMainMenu() {
        this.elements.mainMenu.classList.add('hidden');
    },

    showPauseMenu() {
        this.elements.pauseMenu.classList.remove('hidden');
    },

    hidePauseMenu() {
        this.elements.pauseMenu.classList.add('hidden');
    },

    showGameOver(playerWon, playerHealth, opponentHealth) {
        this.elements.gameOver.classList.remove('hidden');
        
        if (playerWon) {
            this.elements.resultTitle.textContent = '胜利！';
            this.elements.resultTitle.style.color = '#ffd700';
            this.elements.resultText.innerHTML = `
                恭喜你击败了对手！<br>
                剩余生命值: ${playerHealth}<br>
                对手生命值: ${opponentHealth}
            `;
        } else {
            this.elements.resultTitle.textContent = '失败';
            this.elements.resultTitle.style.color = '#e74c3c';
            this.elements.resultText.innerHTML = `
                你被击败了...<br>
                剩余生命值: ${playerHealth}<br>
                对手生命值: ${opponentHealth}
            `;
        }
    },

    hideGameOver() {
        this.elements.gameOver.classList.add('hidden');
    }
};
