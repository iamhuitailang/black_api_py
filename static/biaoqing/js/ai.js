class AIController {
    constructor(character, player) {
        this.character = character;
        this.player = player;
        this.reactionTime = 200;
        this.lastDecisionTime = 0;
        this.currentAction = null;
        this.actionTimer = 0;
        
        this.attackCooldown = 0;
        this.minAttackInterval = 800;
    }

    update(deltaTime) {
        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
        
        if (this.actionTimer > 0) {
            this.actionTimer -= deltaTime;
            return;
        }
        
        const now = Date.now();
        if (now - this.lastDecisionTime < this.reactionTime) {
            return;
        }
        
        this.lastDecisionTime = now;
        this.makeDecision();
    }

    makeDecision() {
        const distance = Math.abs(this.player.x - this.character.x);
        const playerDirection = this.player.x > this.character.x ? 1 : -1;
        
        this.character.facing = playerDirection;
        
        if (this.character.isAttacking) return;
        
        if (distance > 200) {
            this.moveTowardsPlayer(playerDirection);
        } else if (distance < 100) {
            if (Math.random() < 0.3) {
                this.moveAwayFromPlayer(-playerDirection);
            } else if (this.attackCooldown <= 0) {
                this.attack();
            }
        } else {
            const choice = Math.random();
            if (choice < 0.4 && this.attackCooldown <= 0) {
                this.attack();
            } else if (choice < 0.6) {
                this.moveTowardsPlayer(playerDirection);
            } else if (choice < 0.8) {
                this.jump();
            } else {
                this.crouch();
            }
        }
    }

    moveTowardsPlayer(direction) {
        this.character.stopMove();
        if (direction > 0) {
            this.character.moveRight();
        } else {
            this.character.moveLeft();
        }
        this.actionTimer = 200 + Math.random() * 300;
        
        setTimeout(() => {
            this.character.stopMove();
        }, this.actionTimer);
    }

    moveAwayFromPlayer(direction) {
        this.character.stopMove();
        if (direction > 0) {
            this.character.moveRight();
        } else {
            this.character.moveLeft();
        }
        this.actionTimer = 150 + Math.random() * 200;
        
        setTimeout(() => {
            this.character.stopMove();
        }, this.actionTimer);
    }

    attack() {
        const attacks = ['lightPunch', 'heavyPunch', 'lightKick', 'heavyKick'];
        const weights = [0.4, 0.2, 0.3, 0.1];
        
        let random = Math.random();
        let attackIndex = 0;
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                attackIndex = i;
                break;
            }
        }
        
        const success = this.character.attack(attacks[attackIndex]);
        if (success) {
            this.attackCooldown = this.minAttackInterval;
        }
    }

    jump() {
        this.character.jump();
        this.actionTimer = 500;
    }

    crouch() {
        this.character.crouch();
        this.actionTimer = 300;
        
        setTimeout(() => {
            this.character.standUp();
        }, 300);
    }
}