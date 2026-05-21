class AIController {
    constructor(character) {
        this.character = character;
        this.decisionTimer = 0;
        this.decisionInterval = 0.5;
        this.currentAction = null;
        this.actionTimer = 0;
        
        this.difficulty = 1;
        this.reactionTime = 0.3;
        
        this.lastHealth = character.health;
        this.aggression = 0.5;
    }
    
    update(deltaTime, player) {
        this.updateFacing(player);
        
        this.decisionTimer += deltaTime;
        
        if (this.decisionTimer >= this.decisionInterval) {
            this.decisionTimer = 0;
            this.makeDecision(player);
        }
        
        this.executeAction(deltaTime, player);
        
        this.lastHealth = this.character.health;
    }
    
    updateFacing(player) {
        this.character.facingRight = player.x > this.character.x;
    }
    
    makeDecision(player) {
        const distance = Math.abs(this.character.x - player.x);
        const healthRatio = this.character.health / this.character.maxHealth;
        const playerHealthRatio = player.health / player.maxHealth;
        
        if (healthRatio < 0.3 && playerHealthRatio > 0.5) {
            this.aggression = Math.max(0.2, this.aggression - 0.1);
        } else if (playerHealthRatio < 0.3) {
            this.aggression = Math.min(0.9, this.aggression + 0.1);
        }
        
        const random = Math.random();
        
        if (player.isAttacking && this.shouldDodge(player)) {
            this.currentAction = this.chooseDodge(player);
            return;
        }
        
        if (distance > GameConfig.ATTACK_RANGES['far']) {
            if (random < this.aggression + 0.2) {
                this.currentAction = 'approach';
            } else {
                this.currentAction = 'wait';
            }
        } else if (distance > GameConfig.ATTACK_RANGES['medium']) {
            if (random < this.aggression) {
                this.currentAction = this.chooseRangedAttack();
            } else if (random < 0.7) {
                this.currentAction = 'approach';
            } else {
                this.currentAction = 'wait';
            }
        } else if (distance > GameConfig.ATTACK_RANGES['close']) {
            if (random < this.aggression + 0.1) {
                this.currentAction = this.chooseMediumAttack();
            } else if (random < 0.6) {
                this.currentAction = 'block';
            } else {
                this.currentAction = 'wait';
            }
        } else {
            if (random < this.aggression + 0.2) {
                this.currentAction = this.chooseCloseAttack();
            } else if (random < 0.7) {
                this.currentAction = 'block';
            } else {
                this.currentAction = 'retreat';
            }
        }
    }
    
    shouldDodge(player) {
        const move = player.currentAttack;
        if (!move) return false;
        
        const distance = Math.abs(this.character.x - player.x);
        const range = GameConfig.ATTACK_RANGES[move.range];
        
        return distance < range && Math.random() < 0.6;
    }
    
    chooseDodge(player) {
        const dodges = ['jump', 'crouch', 'retreat'];
        return dodges[Math.floor(Math.random() * dodges.length)];
    }
    
    chooseRangedAttack() {
        const attacks = ['special', 'heavyAirKick'];
        return attacks[Math.floor(Math.random() * attacks.length)];
    }
    
    chooseMediumAttack() {
        const attacks = ['heavyStage', 'lightKick', 'heavyAirKick'];
        return attacks[Math.floor(Math.random() * attacks.length)];
    }
    
    chooseCloseAttack() {
        const attacks = ['lightJuggle', 'lightKick', 'heavyStage', 'special'];
        const weights = [0.35, 0.3, 0.25, 0.1];
        
        let random = Math.random();
        for (let i = 0; i < attacks.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return attacks[i];
            }
        }
        
        return attacks[0];
    }
    
    executeAction(deltaTime, player) {
        if (!this.currentAction) return;
        
        this.actionTimer += deltaTime;
        
        switch (this.currentAction) {
            case 'approach':
                this.approach(player);
                break;
            case 'retreat':
                this.retreat(player);
                break;
            case 'wait':
                this.wait();
                break;
            case 'block':
                this.block();
                break;
            case 'jump':
                this.jump();
                break;
            case 'crouch':
                this.crouch();
                break;
            case 'lightJuggle':
            case 'heavyStage':
            case 'lightKick':
            case 'heavyAirKick':
            case 'special':
                this.attack(this.currentAction);
                break;
        }
        
        if (this.actionTimer >= 0.8) {
            this.actionTimer = 0;
            this.currentAction = null;
            this.character.crouch(false);
            this.character.block(false);
        }
    }
    
    approach(player) {
        if (this.character.x < player.x - 50) {
            this.character.moveRight();
        } else if (this.character.x > player.x + 50) {
            this.character.moveLeft();
        } else {
            this.currentAction = null;
        }
    }
    
    retreat(player) {
        if (this.character.x < player.x) {
            this.character.moveLeft();
        } else {
            this.character.moveRight();
        }
    }
    
    wait() {
    }
    
    block() {
        this.character.block(true);
    }
    
    jump() {
        this.character.jump();
        this.currentAction = null;
    }
    
    crouch() {
        this.character.crouch(true);
    }
    
    attack(moveId) {
        if (this.character.startAttack(moveId)) {
            this.currentAction = null;
            this.actionTimer = 0;
        }
    }
}
