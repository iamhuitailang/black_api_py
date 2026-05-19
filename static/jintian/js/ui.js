const UIManager = {
    elements: {},
    
    init() {
        this.elements = {
            startMenu: document.getElementById('start-menu'),
            pauseMenu: document.getElementById('pause-menu'),
            gameOverMenu: document.getElementById('game-over-menu'),
            pauseBtn: document.getElementById('pause-btn'),
            startBtn: document.getElementById('start-btn'),
            resumeBtn: document.getElementById('resume-btn'),
            restartBtn: document.getElementById('restart-btn'),
            quitBtn: document.getElementById('quit-btn'),
            playAgainBtn: document.getElementById('play-again-btn'),
            backMenuBtn: document.getElementById('back-menu-btn'),
            resultText: document.getElementById('result-text'),
            resultDesc: document.getElementById('result-desc'),
            playerHealth: document.getElementById('player-health'),
            playerEnergy: document.getElementById('player-energy'),
            playerFace: document.getElementById('player-face'),
            enemyHealth: document.getElementById('enemy-health'),
            enemyEnergy: document.getElementById('enemy-energy'),
            enemyFace: document.getElementById('enemy-face'),
            roundIndicator: document.getElementById('round-indicator'),
            timer: document.getElementById('timer'),
            characterOptions: document.querySelectorAll('.character-option')
        };
    },
    
    showStartMenu() {
        this.elements.startMenu.classList.remove('hidden');
        this.elements.pauseMenu.classList.add('hidden');
        this.elements.gameOverMenu.classList.add('hidden');
        this.elements.pauseBtn.classList.add('hidden');
    },
    
    showPauseMenu() {
        this.elements.pauseMenu.classList.remove('hidden');
        this.elements.pauseBtn.classList.add('hidden');
    },
    
    hidePauseMenu() {
        this.elements.pauseMenu.classList.add('hidden');
        this.elements.pauseBtn.classList.remove('hidden');
    },
    
    showGameOver(playerWon) {
        this.elements.gameOverMenu.classList.remove('hidden');
        this.elements.pauseBtn.classList.add('hidden');
        
        if (playerWon) {
            this.elements.resultText.textContent = '胜利！';
            this.elements.resultDesc.textContent = '你击败了对手！';
        } else {
            this.elements.resultText.textContent = '失败！';
            this.elements.resultDesc.textContent = '你被对手击败了...';
        }
    },
    
    hideAllMenus() {
        this.elements.startMenu.classList.add('hidden');
        this.elements.pauseMenu.classList.add('hidden');
        this.elements.gameOverMenu.classList.add('hidden');
        this.elements.pauseBtn.classList.remove('hidden');
    },
    
    updateHealthBars(player, enemy) {
        if (player) {
            const playerHealthPercent = (player.health / player.maxHealth) * 100;
            this.elements.playerHealth.style.width = playerHealthPercent + '%';
        }
        
        if (enemy) {
            const enemyHealthPercent = (enemy.health / enemy.maxHealth) * 100;
            this.elements.enemyHealth.style.width = enemyHealthPercent + '%';
        }
    },
    
    updateEnergyBars(player, enemy) {
        if (player) {
            const playerEnergyPercent = (player.energy / player.maxEnergy) * 100;
            this.elements.playerEnergy.style.width = playerEnergyPercent + '%';
            
            if (player.energy >= player.maxEnergy) {
                this.elements.playerEnergy.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8)';
            } else {
                this.elements.playerEnergy.style.boxShadow = '0 0 10px rgba(68, 136, 255, 0.5)';
            }
        }
        
        if (enemy) {
            const enemyEnergyPercent = (enemy.energy / enemy.maxEnergy) * 100;
            this.elements.enemyEnergy.style.width = enemyEnergyPercent + '%';
            
            if (enemy.energy >= enemy.maxEnergy) {
                this.elements.enemyEnergy.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8)';
            } else {
                this.elements.enemyEnergy.style.boxShadow = '0 0 10px rgba(68, 136, 255, 0.5)';
            }
        }
    },
    
    updateFaceIndicators(player, enemy) {
        if (player) {
            this.elements.playerFace.textContent = player.getCurrentFaceName();
            this.elements.playerFace.style.color = player.getCurrentFaceColor();
        }
        
        if (enemy) {
            this.elements.enemyFace.textContent = enemy.getCurrentFaceName();
            this.elements.enemyFace.style.color = enemy.getCurrentFaceColor();
        }
    },
    
    updateRound(round) {
        this.elements.roundIndicator.textContent = '第 ' + round + ' 局';
    },
    
    updateTimer(timer) {
        this.elements.timer.textContent = Math.ceil(timer);
    },
    
    updateCharacterNames(playerType, enemyType) {
        const playerName = GameConfig.CHARACTERS[playerType]?.name || '武生';
        const enemyName = GameConfig.CHARACTERS[enemyType]?.name || '花脸';
        
        document.querySelector('#player-hud .character-name').textContent = playerName;
        document.querySelector('#enemy-hud .character-name').textContent = enemyName;
    },
    
    getSelectedCharacter() {
        const selected = document.querySelector('.character-option.selected');
        return selected ? selected.dataset.type : 'wusheng';
    },
    
    setupCharacterSelect() {
        this.elements.characterOptions.forEach(option => {
            option.addEventListener('click', () => {
                this.elements.characterOptions.forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
            });
        });
    }
};
