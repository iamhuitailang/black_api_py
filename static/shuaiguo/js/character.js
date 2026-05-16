class Character {
    constructor(characterData, isPlayer = true) {
        this.characterData = characterData;
        this.isPlayer = isPlayer;
        
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        
        this.width = GameData.gameConfig.characterWidth;
        this.height = GameData.gameConfig.characterHeight;
        
        this.blame = 0;
        this.maxBlame = characterData.maxBlame;
        this.defense = characterData.defense;
        
        this.state = 'idle';
        this.facing = isPlayer ? 1 : -1;
        
        this.isDefending = false;
        this.isJumping = false;
        this.isAttacking = false;
        this.currentAttack = null;
        this.attackTimer = 0;
        this.attackCooldowns = {};
        
        this.aiState = 'idle';
        this.aiTimer = 0;
        this.aiTargetX = 0;
        
        this.floatingTexts = [];
        this.effects = [];
        
        this.jumpCooldown = 0;
    }

    init(canvasWidth, canvasHeight) {
        const groundY = canvasHeight * GameData.gameConfig.groundY;
        this.y = groundY - this.height;
        
        if (this.isPlayer) {
            this.x = canvasWidth * GameData.gameConfig.playerStartX;
        } else {
            this.x = canvasWidth * GameData.gameConfig.enemyStartX;
        }
    }

    update(deltaTime, canvasWidth, canvasHeight, opponent) {
        this.updatePhysics(deltaTime, canvasWidth, canvasHeight);
        this.updateAttack(deltaTime);
        this.updateCooldowns(deltaTime);
        this.updateEffects(deltaTime);
        this.updateFloatingTexts(deltaTime);
        
        if (this.jumpCooldown > 0) {
            this.jumpCooldown -= deltaTime;
        }
        
        if (!this.isPlayer) {
            this.updateAI(deltaTime, opponent);
        }
    }

    updatePhysics(deltaTime, canvasWidth, canvasHeight) {
        const groundY = canvasHeight * GameData.gameConfig.groundY;
        
        this.vy += GameData.gameConfig.gravity;
        
        this.x += this.vx * deltaTime * 60;
        this.y += this.vy * deltaTime * 60;
        
        if (this.y + this.height > groundY) {
            this.y = groundY - this.height;
            this.vy = 0;
            this.isJumping = false;
        }
        
        const minX = 20;
        const maxX = canvasWidth - this.width - 20;
        this.x = Math.max(minX, Math.min(maxX, this.x));
        
        if (Math.abs(this.vx) > 0.1) {
            this.facing = this.vx > 0 ? 1 : -1;
        }
    }

    updateAttack(deltaTime) {
        if (!this.isAttacking || !this.currentAttack) return;
        
        this.attackTimer += deltaTime;
        
        const attack = this.currentAttack;
        const totalTime = attack.startup + attack.recovery;
        
        if (this.attackTimer >= totalTime) {
            this.isAttacking = false;
            this.currentAttack = null;
            this.attackTimer = 0;
            this.state = 'idle';
        }
    }

    updateEffects(deltaTime) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            this.effects[i].life -= deltaTime;
            if (this.effects[i].life <= 0) {
                this.effects.splice(i, 1);
            }
        }
    }

    updateFloatingTexts(deltaTime) {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const text = this.floatingTexts[i];
            text.y -= 30 * deltaTime;
            text.alpha -= deltaTime * 0.5;
            if (text.alpha <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    moveLeft() {
        if (this.isAttacking) return;
        this.vx = -this.characterData.moveSpeed;
        this.state = 'walking';
    }

    moveRight() {
        if (this.isAttacking) return;
        this.vx = this.characterData.moveSpeed;
        this.state = 'walking';
    }

    stopMoving() {
        if (!this.isAttacking) {
            this.vx = 0;
            if (!this.isDefending) {
                this.state = 'idle';
            }
        }
    }

    jump() {
        if (this.isJumping || this.isAttacking || this.jumpCooldown > 0) return;
        this.vy = -GameData.gameConfig.jumpForce;
        this.isJumping = true;
        this.jumpCooldown = 0.3;
        this.state = 'jumping';
    }

    defend(active) {
        if (this.isAttacking) return;
        this.isDefending = active;
        if (active) {
            this.state = 'defending';
            this.vx = 0;
        } else if (!this.isAttacking) {
            this.state = 'idle';
        }
    }

    attack(attackId) {
        if (this.isAttacking || this.isDefending) return false;
        
        const cooldown = this.attackCooldowns[attackId] || 0;
        if (cooldown > 0) return false;
        
        const attack = GameData.attacks[attackId];
        if (!attack) return false;
        
        this.isAttacking = true;
        this.currentAttack = attack;
        this.attackTimer = 0;
        this.state = 'attacking';
        this.attackCooldowns[attackId] = attack.cooldown;
        
        this.addFloatingText(
            GameData.attackTexts[attackId][Math.floor(Math.random() * GameData.attackTexts[attackId].length)],
            attack.color
        );
        
        return true;
    }

    updateCooldowns(deltaTime) {
        for (const attackId in this.attackCooldowns) {
            if (this.attackCooldowns[attackId] > 0) {
                this.attackCooldowns[attackId] -= deltaTime;
                if (this.attackCooldowns[attackId] < 0) {
                    this.attackCooldowns[attackId] = 0;
                }
            }
        }
    }

    isAttackActive() {
        if (!this.isAttacking || !this.currentAttack) return false;
        return this.attackTimer >= this.currentAttack.startup && 
               this.attackTimer < this.currentAttack.startup + this.currentAttack.recovery * 0.5;
    }

    addFloatingText(text, color = '#fff') {
        this.floatingTexts.push({
            text: text,
            x: this.x + this.width / 2,
            y: this.y,
            color: color,
            alpha: 1
        });
    }

    addBlame(amount) {
        const actualDamage = this.isDefending ? Math.max(1, amount - this.defense) : amount;
        this.blame = Math.min(this.maxBlame, this.blame + actualDamage);
        
        this.addFloatingText(`+${actualDamage} 背锅!`, this.isDefending ? '#95a5a6' : '#e74c3c');
        
        return actualDamage;
    }

    isDefeated() {
        return this.blame >= this.maxBlame;
    }

    updateAI(deltaTime, opponent) {
        this.aiTimer -= deltaTime;
        
        if (this.aiTimer <= 0) {
            this.aiTimer = GameData.aiConfig.reactionTime;
            this.makeAIDecision(opponent);
        }
        
        this.executeAIMovement(opponent);
    }

    makeAIDecision(opponent) {
        const distance = Math.abs(this.x - opponent.x);
        const random = Math.random();
        
        if (opponent.isAttackActive() && random < GameData.aiConfig.defendChance) {
            this.defend(true);
            setTimeout(() => this.defend(false), 500);
            return;
        }
        
        this.defend(false);
        
        if (random < GameData.aiConfig.attackChance) {
            const attacks = ['lightThrow', 'heavyThrow', 'roast', 'deskSlap'];
            const attackId = attacks[Math.floor(Math.random() * attacks.length)];
            this.attack(attackId);
            return;
        }
        
        if (random < GameData.aiConfig.moveChance) {
            if (distance > 200) {
                this.aiTargetX = opponent.x + (this.x < opponent.x ? -150 : 150);
            } else if (distance < 100) {
                this.aiTargetX = this.x + (this.x < opponent.x ? -100 : 100);
            } else {
                this.aiTargetX = this.x + (Math.random() - 0.5) * 200;
            }
        }
    }

    executeAIMovement(opponent) {
        const diff = this.aiTargetX - this.x;
        
        if (Math.abs(diff) > 10) {
            if (diff > 0) {
                this.moveRight();
            } else {
                this.moveLeft();
            }
        } else {
            this.stopMoving();
        }
        
        if (this.x < opponent.x) {
            this.facing = 1;
        } else {
            this.facing = -1;
        }
    }

    getState() {
        return {
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            blame: this.blame,
            state: this.state,
            facing: this.facing,
            isDefending: this.isDefending,
            isJumping: this.isJumping,
            isAttacking: this.isAttacking,
            currentAttackId: this.currentAttack ? this.currentAttack.id : null,
            attackTimer: this.attackTimer,
            attackCooldowns: { ...this.attackCooldowns },
            floatingTexts: [...this.floatingTexts],
            effects: [...this.effects]
        };
    }

    loadState(state) {
        this.x = state.x;
        this.y = state.y;
        this.vx = state.vx;
        this.vy = state.vy;
        this.blame = state.blame;
        this.state = state.state;
        this.facing = state.facing;
        this.isDefending = state.isDefending;
        this.isJumping = state.isJumping;
        this.isAttacking = state.isAttacking;
        this.currentAttack = state.currentAttackId ? GameData.attacks[state.currentAttackId] : null;
        this.attackTimer = state.attackTimer;
        this.attackCooldowns = { ...state.attackCooldowns };
        this.floatingTexts = [...state.floatingTexts];
        this.effects = [...state.effects];
    }
}