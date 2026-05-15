const AI = {
    decisionTimer: 0,
    currentAction: null,
    actionDuration: 0,

    update(enemy, player) {
        this.decisionTimer--;
        
        if (this.decisionTimer <= 0) {
            this.makeDecision(enemy, player);
        }
        
        this.executeAction(enemy, player);
        
        this.avoidBoundaries(enemy);
    },

    makeDecision(enemy, player) {
        const distance = Physics.getHorizontalDistance(enemy, player);
        const playerAttacking = player.state === 'attack' || player.specialActive;
        const isPlayerInFront = Physics.isInDirection(enemy, player, enemy.facing);
        
        this.decisionTimer = Math.floor(Math.random() * 30) + 10;
        
        if (distance > 300) {
            this.currentAction = 'approach';
            this.actionDuration = 30;
        } else if (distance < 80) {
            if (playerAttacking && Math.random() < 0.6) {
                this.currentAction = 'backoff';
                this.actionDuration = 20;
            } else if (Math.random() < 0.7) {
                this.currentAction = 'attack';
                this.actionDuration = 15;
            } else {
                this.currentAction = 'crouch';
                this.actionDuration = 20;
            }
        } else {
            const rand = Math.random();
            if (rand < 0.4) {
                this.currentAction = 'approach';
                this.actionDuration = 20;
            } else if (rand < 0.7) {
                this.currentAction = 'attack';
                this.actionDuration = 15;
            } else if (rand < 0.85) {
                this.currentAction = 'jump';
                this.actionDuration = 10;
            } else {
                this.currentAction = 'idle';
                this.actionDuration = 20;
            }
        }
        
        if (!isPlayerInFront && distance < 400) {
            enemy.facing = enemy.facing === 1 ? -1 : 1;
        }
    },

    executeAction(enemy, player) {
        this.actionDuration--;
        
        if (this.actionDuration <= 0) {
            this.currentAction = 'idle';
        }
        
        switch (this.currentAction) {
            case 'approach':
                this.approach(enemy, player);
                break;
            case 'backoff':
                this.backoff(enemy, player);
                break;
            case 'attack':
                this.attack(enemy, player);
                break;
            case 'jump':
                this.jump(enemy);
                break;
            case 'crouch':
                enemy.crouch();
                break;
            default:
                enemy.standUp();
        }
    },

    approach(enemy, player) {
        enemy.standUp();
        if (Physics.isInDirection(enemy, player, 1)) {
            enemy.moveRight();
        } else {
            enemy.moveLeft();
        }
    },

    backoff(enemy, player) {
        enemy.standUp();
        if (Physics.isInDirection(enemy, player, 1)) {
            enemy.moveLeft();
        } else {
            enemy.moveRight();
        }
    },

    attack(enemy, player) {
        enemy.standUp();
        
        if (enemy.attackCooldown > 0) return;
        
        const distance = Physics.getHorizontalDistance(enemy, player);
        
        if (distance < 100) {
            if (enemy.special >= CONFIG.SPECIAL_COST && Math.random() < 0.3) {
                enemy.specialAttack();
            } else if (Math.random() < 0.6) {
                enemy.lightAttack();
            } else {
                enemy.heavyAttack();
            }
        } else {
            this.approach(enemy, player);
        }
    },

    jump(enemy) {
        enemy.jump();
    },

    avoidBoundaries(enemy) {
        const leftDanger = enemy.x < CONFIG.BOUNDARY_LEFT + 50;
        const rightDanger = enemy.x > CONFIG.BOUNDARY_RIGHT - enemy.width - 50;
        
        if (leftDanger) {
            enemy.vx += 2;
        }
        if (rightDanger) {
            enemy.vx -= 2;
        }
    },

    reset() {
        this.decisionTimer = 0;
        this.currentAction = null;
        this.actionDuration = 0;
    }
};