class Opponent extends Character {
    constructor(config, x, y, facingRight = false) {
        super(config, x, y, facingRight);
        this.aiStyle = config.aiStyle;
        this.aggression = config.aggression;
        this.defenseChance = config.defenseChance;
        this.comboChance = config.comboChance;
        this.dodgeChance = config.dodgeChance || 0;
        this.specialChance = config.specialChance || 0;
        
        this.attackCooldown = 0;
        this.thinkTimer = 0;
        this.currentAction = null;
        this.actionTimer = 0;
        this.pendingAttack = null;
    }
    
    update(deltaTime, player) {
        super.update(deltaTime, player);
        this.updateAI(deltaTime, player);
    }
    
    updateAI(deltaTime, player) {
        if (this.state === GameConfig.CHARACTER_STATES.DEAD) return;
        
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        const distance = this.getDistanceToPlayer(player);
        
        if (this.isAttacking()) {
            return;
        }
        
        if (this.hitstunTimer > 0) {
            this.stopMoving();
            return;
        }
        
        this.thinkTimer -= deltaTime;
        if (this.thinkTimer <= 0) {
            this.thinkTimer = 150 + Math.random() * 200;
            this.decideAction(distance, player);
        }
        
        this.executeCurrentAction(deltaTime, player, distance);
    }
    
    getDistanceToPlayer(player) {
        return Math.abs(this.x + this.width / 2 - (player.x + player.width / 2));
    }
    
    decideAction(distance, player) {
        const rand = Math.random();
        
        if (player.isAttacking() && distance < 100) {
            if (rand < this.defenseChance) {
                this.currentAction = 'block';
                this.actionTimer = 300;
                return;
            } else if (rand < this.dodgeChance && this.isGrounded) {
                this.currentAction = 'dodge';
                this.actionTimer = 500;
                return;
            }
        }
        
        const attackRange = 90;
        
        if (distance <= attackRange) {
            if (this.attackCooldown <= 0 && rand < this.aggression) {
                this.currentAction = 'attack';
                this.pendingAttack = this.chooseAttack();
                this.actionTimer = 500;
                return;
            } else if (rand < 0.3) {
                this.currentAction = 'retreat';
                this.actionTimer = 200;
                return;
            }
        } else if (distance < 200) {
            if (rand < this.aggression * 0.9) {
                this.currentAction = 'approach';
                this.actionTimer = 300;
                return;
            }
        } else {
            this.currentAction = 'approach';
            this.actionTimer = 400;
            return;
        }
        
        if (rand < 0.5) {
            this.currentAction = 'approach';
            this.actionTimer = 200;
        } else {
            this.currentAction = 'idle';
            this.actionTimer = 200;
        }
    }
    
    chooseAttack() {
        const rand = Math.random();
        
        if (this.energy >= 100 && rand < this.specialChance) {
            return GameConfig.ATTACK_TYPES.SPECIAL;
        }
        
        if (rand < this.comboChance) {
            return GameConfig.ATTACK_TYPES.LIGHT_PUNCH;
        }
        
        const attacks = [
            GameConfig.ATTACK_TYPES.LIGHT_PUNCH,
            GameConfig.ATTACK_TYPES.LIGHT_PUNCH,
            GameConfig.ATTACK_TYPES.HEAVY_PUNCH,
            GameConfig.ATTACK_TYPES.LIGHT_KICK,
            GameConfig.ATTACK_TYPES.HEAVY_KICK
        ];
        
        return attacks[Math.floor(Math.random() * attacks.length)];
    }
    
    executeCurrentAction(deltaTime, player, distance) {
        if (this.actionTimer > 0) {
            this.actionTimer -= deltaTime;
        }
        
        if (this.currentAction === 'idle' || this.actionTimer <= 0) {
            this.stopMoving();
            return;
        }
        
        switch (this.currentAction) {
            case 'approach':
                this.approachPlayer(player);
                break;
            case 'retreat':
                this.retreatFromPlayer(player);
                break;
            case 'attack':
                this.performAttack(player);
                break;
            case 'block':
                this.startBlock();
                break;
            case 'dodge':
                this.performDodge();
                break;
        }
    }
    
    approachPlayer(player) {
        if (this.canAct() || this.state === GameConfig.CHARACTER_STATES.WALKING) {
            if (this.x < player.x) {
                this.moveRight();
            } else {
                this.moveLeft();
            }
        }
    }
    
    retreatFromPlayer(player) {
        if (this.canAct() || this.state === GameConfig.CHARACTER_STATES.WALKING) {
            if (this.x < player.x) {
                this.moveLeft();
            } else {
                this.moveRight();
            }
        }
    }
    
    performAttack(player) {
        if (this.canAct() && this.pendingAttack) {
            const distance = this.getDistanceToPlayer(player);
            
            if (distance <= 100 || this.pendingAttack === GameConfig.ATTACK_TYPES.SPECIAL) {
                if (this.startAttack(this.pendingAttack)) {
                    this.attackCooldown = 400 + Math.random() * 300;
                    this.pendingAttack = null;
                    this.currentAction = 'idle';
                }
            } else {
                this.approachPlayer(player);
            }
        }
    }
    
    performDodge() {
        if (this.isGrounded && this.canAct()) {
            this.jump();
            this.currentAction = 'idle';
        }
    }
    
    takeDamage(damage, hitstun, knockback, attacker, canBlock = true) {
        const actualDamage = super.takeDamage(damage, hitstun, knockback, attacker, canBlock);
        
        if (actualDamage > 0 && this.state !== GameConfig.CHARACTER_STATES.DEAD) {
            this.currentAction = 'idle';
            this.pendingAttack = null;
        }
        
        return actualDamage;
    }
    
    static createFromConfig(config, round) {
        const x = GameConfig.CANVAS_WIDTH - 150;
        const y = GameConfig.GROUND_Y - config.height;
        
        const opponent = new Opponent(config, x, y, false);
        
        const scaleFactor = 1 + (round - 1) * 0.1;
        opponent.maxHealth = Math.floor(config.maxHealth * scaleFactor);
        opponent.health = opponent.maxHealth;
        opponent.attackPower = Math.floor(config.attackPower * scaleFactor);
        
        return opponent;
    }
    
    serialize() {
        const base = super.serialize();
        return {
            ...base,
            aiStyle: this.aiStyle,
            aggression: this.aggression,
            defenseChance: this.defenseChance,
            comboChance: this.comboChance,
            dodgeChance: this.dodgeChance,
            specialChance: this.specialChance
        };
    }
    
    static deserialize(data) {
        const opponent = new Opponent(data, data.x, data.y, data.facingRight);
        opponent.health = data.health;
        opponent.energy = data.energy;
        opponent.state = data.state;
        opponent.aiStyle = data.aiStyle || opponent.aiStyle;
        opponent.aggression = data.aggression || opponent.aggression;
        opponent.defenseChance = data.defenseChance || opponent.defenseChance;
        opponent.comboChance = data.comboChance || opponent.comboChance;
        opponent.dodgeChance = data.dodgeChance || opponent.dodgeChance;
        opponent.specialChance = data.specialChance || opponent.specialChance;
        return opponent;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Opponent;
}
