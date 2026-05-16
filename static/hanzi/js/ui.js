const UIManager = {
    selectedChar: '龙',
    lastDisplayedTime: -1,
    lastPlayerHealth: -1,
    lastEnemyHealth: -1,
    lastSkillCooldowns: {},
    
    init() {
        this.bindEvents();
        this.selectCharacter('龙');
    },
    
    bindEvents() {
        document.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', () => {
                const char = card.dataset.char;
                this.selectCharacter(char);
            });
        });
        
        document.getElementById('startBtn').addEventListener('click', () => {
            window.game.startGame(this.selectedChar);
        });
        
        document.getElementById('pauseBtn').addEventListener('click', () => {
            window.game.pauseGame();
        });
        
        document.getElementById('resumeBtn').addEventListener('click', () => {
            window.game.resumeGame();
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            window.game.restartGame();
        });
        
        document.getElementById('quitBtn').addEventListener('click', () => {
            window.game.quitToMenu();
        });
        
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            window.game.restartGame();
        });
        
        document.getElementById('backToMenuBtn').addEventListener('click', () => {
            window.game.quitToMenu();
        });
        
        document.querySelectorAll('.skill-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const skill = btn.dataset.skill;
                window.game.useUltimate(skill);
            });
        });
    },
    
    selectCharacter(char) {
        this.selectedChar = char;
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
            if (card.dataset.char === char) {
                card.classList.add('selected');
            }
        });
    },
    
    showMenuOverlay() {
        document.getElementById('menu-overlay').classList.remove('hidden');
    },
    
    hideMenuOverlay() {
        document.getElementById('menu-overlay').classList.add('hidden');
    },
    
    showMenu(menuId) {
        this.showMenuOverlay();
        document.querySelectorAll('.menu').forEach(menu => {
            menu.classList.add('hidden');
        });
        document.getElementById(menuId).classList.remove('hidden');
    },
    
    hideAllMenus() {
        this.hideMenuOverlay();
        document.querySelectorAll('.menu').forEach(menu => {
            menu.classList.add('hidden');
        });
    },
    
    showHUD() {
        document.getElementById('hud').classList.remove('hidden');
    },
    
    hideHUD() {
        document.getElementById('hud').classList.add('hidden');
    },
    
    updateHealthBars(player, enemy) {
        if (this.lastPlayerHealth === player.health && this.lastEnemyHealth === enemy.health) {
            return;
        }
        
        this.lastPlayerHealth = player.health;
        this.lastEnemyHealth = enemy.health;
        
        const playerFill = document.getElementById('playerHealthFill');
        const playerValue = document.getElementById('playerHealthValue');
        const enemyFill = document.getElementById('enemyHealthFill');
        const enemyValue = document.getElementById('enemyHealthValue');
        
        const playerPercent = (player.health / player.maxHealth) * 100;
        const enemyPercent = (enemy.health / enemy.maxHealth) * 100;
        
        playerFill.style.width = playerPercent + '%';
        playerValue.textContent = `${player.health}/${player.maxHealth}`;
        
        enemyFill.style.width = enemyPercent + '%';
        enemyValue.textContent = `${enemy.health}/${enemy.maxHealth}`;
    },
    
    updateTimer(seconds) {
        const displaySeconds = Math.ceil(seconds);
        if (this.lastDisplayedTime === displaySeconds) {
            return;
        }
        this.lastDisplayedTime = displaySeconds;
        
        const mins = Math.floor(displaySeconds / 60);
        const secs = displaySeconds % 60;
        document.getElementById('gameTimer').textContent = 
            `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    updateSkillButtons(player) {
        document.querySelectorAll('.skill-btn').forEach(btn => {
            const skillKey = btn.dataset.skill;
            const cooldown = player.skillCooldowns[skillKey];
            const displayCooldown = Math.ceil(cooldown / 1000);
            
            if (this.lastSkillCooldowns[skillKey] === displayCooldown) {
                return;
            }
            this.lastSkillCooldowns[skillKey] = displayCooldown;
            
            const skill = player.skills[skillKey];
            
            if (cooldown > 0) {
                btn.classList.add('cooldown');
                btn.querySelector('.skill-name').textContent = displayCooldown + 's';
            } else {
                btn.classList.remove('cooldown');
                btn.querySelector('.skill-name').textContent = skill.name;
            }
        });
    },
    
    showGameOver(playerWon) {
        this.hideHUD();
        this.showMenu('game-over');
        
        const resultText = document.getElementById('result-text');
        const resultSeal = document.getElementById('result-seal');
        
        if (playerWon) {
            resultText.textContent = '胜利！';
            resultSeal.textContent = '胜';
        } else {
            resultText.textContent = '失败...';
            resultSeal.textContent = '败';
        }
    }
};
