const Game = {
    gameState: 'menu',
    player: null,
    enemy: null,
    attackEffects: [],
    damageNumbers: [],
    timeRemaining: 180,
    lastTime: 0,
    saveInterval: null,
    ultimateActive: false,
    ultimateCharacter: null,
    ultimateSkillName: '',
    ultimateTimer: 0,
    
    init() {
        Renderer.init();
        InputManager.init();
        UIManager.init();
        
        const savedState = StorageManager.load();
        if (savedState && savedState.gameState === 'playing') {
            this.loadState(savedState);
        } else {
            UIManager.showMenuOverlay();
        }
        
        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
        
        this.saveInterval = setInterval(() => {
            if (this.gameState === 'playing') {
                this.saveState();
            }
        }, 5000);
        
        document.addEventListener('click', (e) => {
            if (this.gameState === 'playing' && 
                !e.target.closest('.menu') && 
                !e.target.closest('.skill-btn') &&
                !e.target.closest('.pause-btn') &&
                e.target.tagName !== 'BUTTON') {
                InputManager.focus();
            }
        });
    },
    
    startGame(playerChar) {
        this.player = CharacterFactory.create(playerChar, true, Renderer.width);
        const enemyChars = ['龙', '凤', '儒', '烈'].filter(c => c !== playerChar);
        const enemyChar = enemyChars[Math.floor(Math.random() * enemyChars.length)];
        this.enemy = CharacterFactory.create(enemyChar, false, Renderer.width);
        
        this.attackEffects = [];
        this.damageNumbers = [];
        this.timeRemaining = 180;
        this.ultimateActive = false;
        
        UIManager.lastDisplayedTime = -1;
        UIManager.lastPlayerHealth = -1;
        UIManager.lastEnemyHealth = -1;
        UIManager.lastSkillCooldowns = {};
        
        this.gameState = 'playing';
        UIManager.hideAllMenus();
        UIManager.showHUD();
        
        EnemyAI.reset();
        InputManager.clear();
        setTimeout(() => InputManager.focus(), 100);
        
        this.saveState();
    },
    
    pauseGame() {
        if (this.gameState !== 'playing') return;
        this.gameState = 'paused';
        UIManager.showMenu('pause-menu');
    },
    
    resumeGame() {
        if (this.gameState !== 'paused') return;
        this.gameState = 'playing';
        UIManager.hideAllMenus();
        UIManager.showHUD();
        setTimeout(() => InputManager.focus(), 100);
    },
    
    restartGame() {
        const playerChar = this.player ? this.player.char : UIManager.selectedChar;
        this.startGame(playerChar);
    },
    
    quitToMenu() {
        this.gameState = 'menu';
        this.player = null;
        this.enemy = null;
        StorageManager.clear();
        UIManager.hideHUD();
        UIManager.showMenu('start-menu');
    },
    
    triggerAttack(attackType, text) {
        if (this.gameState !== 'playing' || this.player.isAttacking) return;
        
        this.player.isAttacking = true;
        this.player.attackType = attackType;
        this.player.attackFrame = 0;
        
        const effect = CombatSystem.createAttackEffect(this.player, attackType, text);
        this.attackEffects.push(effect);
    },
    
    triggerEnemyAttack(attackType, text) {
        if (this.gameState !== 'playing' || this.enemy.isAttacking) return;
        
        this.enemy.isAttacking = true;
        this.enemy.attackType = attackType;
        this.enemy.attackFrame = 0;
        
        const effect = CombatSystem.createAttackEffect(this.enemy, attackType, text);
        this.attackEffects.push(effect);
    },
    
    useUltimate(skillKey) {
        if (this.gameState !== 'playing' || this.ultimateActive) return;
        if (!CombatSystem.useSkill(this.player, skillKey)) return;
        
        const skill = this.player.skills[skillKey];
        this.ultimateActive = true;
        this.ultimateCharacter = this.player;
        this.ultimateSkillName = skill.name;
        this.ultimateTimer = 60;
        
        const damage = skill.damage;
        CombatSystem.applyDamage(this.enemy, damage);
        this.damageNumbers.push(
            CombatSystem.createDamageNumber(this.enemy.x, this.enemy.y - 30, damage)
        );
        
        if (skill.heal) {
            CombatSystem.applyHeal(this.player, skill.heal);
            this.damageNumbers.push(
                CombatSystem.createDamageNumber(this.player.x, this.player.y - 30, skill.heal, true)
            );
        }
        
        this.checkGameOver();
    },
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        this.updateTimer(deltaTime);
        this.updateCharacterAttacks(this.player, this.enemy, deltaTime);
        this.updateCharacterAttacks(this.enemy, this.player, deltaTime);
        this.updateAttackEffects();
        this.updateDamageNumbers();
        
        if (this.ultimateActive) {
            this.ultimateTimer--;
            if (this.ultimateTimer <= 0) {
                this.ultimateActive = false;
                this.ultimateCharacter = null;
            }
        }
        
        EnemyAI.update(deltaTime, this.enemy, this.player);
        
        CombatSystem.updateSkillCooldowns(this.player, deltaTime);
        
        UIManager.updateHealthBars(this.player, this.enemy);
        UIManager.updateTimer(this.timeRemaining);
        UIManager.updateSkillButtons(this.player);
        
        this.checkGameOver();
    },
    
    updateTimer(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        this.timeRemaining -= deltaTime / 1000;
        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.endGameByTime();
        }
    },
    
    endGameByTime() {
        const playerWon = this.player.health > this.enemy.health;
        this.gameState = 'gameover';
        UIManager.showGameOver(playerWon);
        StorageManager.clear();
    },
    
    updateCharacterAttacks(attacker, defender, deltaTime) {
        if (!attacker.isAttacking) {
            if (attacker.isHit) {
                attacker.hitFrame++;
            }
            return;
        }
        
        attacker.attackFrame++;
        
        const attackInfo = AttackTypes[attacker.attackType];
        
        if (attacker.attackFrame >= attackInfo.frameCount) {
            attacker.isAttacking = false;
            attacker.attackFrame = 0;
            
            const damage = CombatSystem.calculateDamage(attacker, defender, attacker.attackType);
            CombatSystem.applyDamage(defender, damage);
            
            this.damageNumbers.push(
                CombatSystem.createDamageNumber(defender.x, defender.y - 30, damage)
            );
        }
    },
    
    updateAttackEffects() {
        for (let i = this.attackEffects.length - 1; i >= 0; i--) {
            this.attackEffects[i].progress += 0.05;
            if (this.attackEffects[i].progress >= 1) {
                this.attackEffects.splice(i, 1);
            }
        }
    },
    
    updateDamageNumbers() {
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            this.damageNumbers[i].life--;
            this.damageNumbers[i].y += this.damageNumbers[i].velocityY;
            if (this.damageNumbers[i].life <= 0) {
                this.damageNumbers.splice(i, 1);
            }
        }
    },
    
    checkGameOver() {
        if (this.player.health <= 0) {
            this.gameState = 'gameover';
            UIManager.showGameOver(false);
            StorageManager.clear();
        } else if (this.enemy.health <= 0) {
            this.gameState = 'gameover';
            UIManager.showGameOver(true);
            StorageManager.clear();
        }
    },
    
    saveState() {
        const state = {
            gameState: this.gameState,
            player: this.player,
            enemy: this.enemy,
            timeRemaining: this.timeRemaining,
            inputValue: InputManager.getInput()
        };
        StorageManager.save(state);
    },
    
    loadState(state) {
        this.gameState = state.gameState;
        this.player = state.player;
        this.enemy = state.enemy;
        this.timeRemaining = state.timeRemaining;
        this.attackEffects = [];
        this.damageNumbers = [];
        
        UIManager.lastDisplayedTime = -1;
        UIManager.lastPlayerHealth = -1;
        UIManager.lastEnemyHealth = -1;
        UIManager.lastSkillCooldowns = {};
        
        UIManager.hideAllMenus();
        UIManager.showHUD();
        UIManager.updateHealthBars(this.player, this.enemy);
        UIManager.updateTimer(this.timeRemaining);
        UIManager.updateSkillButtons(this.player);
        
        if (state.inputValue) {
            InputManager.setInput(state.inputValue);
        }
        
        setTimeout(() => InputManager.focus(), 100);
    },
    
    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        Renderer.render(this);
        
        requestAnimationFrame(this.gameLoop);
    }
};

window.addEventListener('DOMContentLoaded', () => {
    window.game = Game;
    Game.init();
});

window.addEventListener('beforeunload', () => {
    if (Game.gameState === 'playing') {
        Game.saveState();
    }
});
