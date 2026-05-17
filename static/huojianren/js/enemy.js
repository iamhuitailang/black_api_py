class EnemyAI {
    constructor(player) {
        this.player = player;
        this.state = 'idle';
        this.stateTimer = 0;
        this.decisionTimer = 0;
        this.aimAngle = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.dodgeTimer = 0;
        this.attackTimer = 0;
        this.moveDirection = 0;
        this.difficulty = 1;
        this.chargeHoldTime = 0;
    }

    update(playerX, playerY, enemy) {
        this.stateTimer++;
        this.decisionTimer++;
        this.attackTimer++;
        this.dodgeTimer--;

        const distance = Math.abs(enemy.x - playerX);

        if (this.decisionTimer > 60) {
            this.decisionTimer = 0;
            this.makeDecision(distance, playerX, playerY, enemy);
        }

        if (enemy.isCharging) {
            this.chargeHoldTime++;
            if (this.chargeHoldTime > 15 + Math.random() * 20) {
                const shot = enemy.releaseCharge();
                this.chargeHoldTime = 0;
                if (shot) {
                    enemy.attackCooldown = 60;
                    return shot;
                }
            }
            return null;
        }

        switch (this.state) {
            case 'idle':
                enemy.velocityX = 0;
                enemy.isMoving = false;
                break;
                
            case 'move':
                enemy.velocityX = this.moveDirection * enemy.moveSpeed * 0.7;
                enemy.isMoving = true;
                enemy.facingRight = this.moveDirection > 0;
                break;
                
            case 'dodge':
                if (this.dodgeTimer > 0) {
                    enemy.isCrouching = true;
                    enemy.velocityX = this.moveDirection * enemy.moveSpeed;
                } else {
                    enemy.isCrouching = false;
                    this.state = 'idle';
                }
                break;
                
            case 'aim':
                enemy.velocityX = 0;
                enemy.isMoving = false;
                break;
        }

        this.updateAim(playerX, playerY, enemy);

        if (this.attackTimer > 40 && !enemy.isCharging && distance < 1000 && enemy.attackCooldown <= 0) {
            if (Math.random() < 0.08 * this.difficulty) {
                this.startAttack(enemy);
            }
        }

        return null;
    }

    makeDecision(distance, playerX, playerY, enemy) {
        const rand = Math.random();

        if (distance < 200) {
            this.state = 'move';
            this.moveDirection = enemy.x > playerX ? 1 : -1;
            return;
        }

        if (distance > 900) {
            this.state = 'move';
            this.moveDirection = enemy.x > playerX ? -1 : 1;
            return;
        }

        if (rand < 0.2) {
            this.state = 'idle';
        } else if (rand < 0.5) {
            this.state = 'move';
            this.moveDirection = Math.random() < 0.5 ? -1 : 1;
        } else if (rand < 0.7) {
            this.state = 'aim';
        } else if (rand < 0.85) {
            this.state = 'dodge';
            this.dodgeTimer = 30;
            this.moveDirection = Math.random() < 0.5 ? -1 : 1;
        } else {
            this.state = 'idle';
        }
    }

    updateAim(playerX, playerY, enemy) {
        this.targetX = playerX + (Math.random() - 0.5) * 30;
        this.targetY = playerY - 40 + (Math.random() - 0.5) * 20;
        
        const dx = this.targetX - enemy.x;
        const dy = this.targetY - (enemy.y - 40);
        this.aimAngle = Math.atan2(dy, dx);
        enemy.shootAngle = this.aimAngle;
        enemy.bowDraw = enemy.isCharging ? Math.min(1, enemy.chargeTime / 60) : 0;
    }

    startAttack(enemy) {
        this.attackTimer = 0;
        this.chargeHoldTime = 0;
        
        const rand = Math.random();
        let chargeType;
        if (rand < 0.7) {
            chargeType = 'normal';
        } else if (rand < 0.9) {
            chargeType = 'charged';
        } else if (enemy.specialCooldownRemaining <= 0) {
            chargeType = 'special';
        } else {
            chargeType = 'normal';
        }
        
        enemy.startCharge(chargeType);
        enemy.attackCooldown = 60;
    }

    serialize() {
        return {
            state: this.state,
            stateTimer: this.stateTimer,
            decisionTimer: this.decisionTimer,
            aimAngle: this.aimAngle,
            targetX: this.targetX,
            targetY: this.targetY,
            dodgeTimer: this.dodgeTimer,
            attackTimer: this.attackTimer,
            moveDirection: this.moveDirection,
            difficulty: this.difficulty,
            chargeHoldTime: this.chargeHoldTime
        };
    }

    static deserialize(data, player) {
        const ai = new EnemyAI(player);
        ai.state = data.state;
        ai.stateTimer = data.stateTimer;
        ai.decisionTimer = data.decisionTimer;
        ai.aimAngle = data.aimAngle;
        ai.targetX = data.targetX;
        ai.targetY = data.targetY;
        ai.dodgeTimer = data.dodgeTimer;
        ai.attackTimer = data.attackTimer;
        ai.moveDirection = data.moveDirection;
        ai.difficulty = data.difficulty;
        ai.chargeHoldTime = data.chargeHoldTime || 0;
        return ai;
    }
}
