const AI = {
    decisionTimer: 0,
    decisionInterval: 1000,
    currentAction: null,
    actionTimer: 0,

    update(deltaTime, enemy, player) {
        this.decisionTimer += deltaTime;
        
        if (enemy.state === PLAYER_STATE.PINNED) {
            enemy.escape();
            return;
        }
        
        if (enemy.state === PLAYER_STATE.DOWN || enemy.state === PLAYER_STATE.ATTACKING) {
            return;
        }
        
        if (player.state === PLAYER_STATE.DOWN) {
            const distance = Math.abs(player.x - enemy.x);
            if (distance <= CONFIG.GRAPPLE_DISTANCE) {
                enemy.pin(player);
                return;
            }
        }
        
        if (this.decisionTimer >= this.decisionInterval) {
            this.decisionTimer = 0;
            this.makeDecision(enemy, player);
        }
        
        this.executeAction(deltaTime, enemy, player);
    },
    
    makeDecision(enemy, player) {
        const distance = Math.abs(player.x - enemy.x);
        const healthRatio = enemy.health / enemy.maxHealth;
        
        if (player.state === PLAYER_STATE.DOWN) {
            this.currentAction = 'approach';
            return;
        }
        
        if (distance <= CONFIG.ATTACK_DISTANCE) {
            const rand = Math.random();
            if (rand < 0.3) {
                this.currentAction = 'light_attack';
            } else if (rand < 0.5) {
                this.currentAction = 'heavy_attack';
            } else if (rand < 0.7) {
                this.currentAction = 'throw';
            } else {
                this.currentAction = 'retreat';
            }
        } else if (distance < 200) {
            this.currentAction = Math.random() < 0.7 ? 'approach' : 'maintain';
        } else {
            this.currentAction = 'approach';
        }
        
        if (healthRatio < 0.3 && Math.random() < 0.5) {
            this.currentAction = 'retreat';
        }
    },
    
    executeAction(deltaTime, enemy, player) {
        const distance = player.x - enemy.x;
        const direction = distance > 0 ? 1 : -1;
        
        switch (this.currentAction) {
            case 'approach':
                enemy.move(direction);
                break;
                
            case 'retreat':
                enemy.move(-direction);
                break;
                
            case 'maintain':
                if (Math.abs(distance) > 150) {
                    enemy.move(direction);
                } else if (Math.abs(distance) < 100) {
                    enemy.move(-direction);
                } else {
                    enemy.move(0);
                }
                break;
                
            case 'light_attack':
                enemy.move(0);
                enemy.attack('LIGHT', player);
                break;
                
            case 'heavy_attack':
                enemy.move(0);
                enemy.attack('HEAVY', player);
                break;
                
            case 'throw':
                enemy.move(0);
                enemy.attack('THROW', player);
                break;
                
            default:
                enemy.move(0);
        }
    },
    
    reset() {
        this.decisionTimer = 0;
        this.currentAction = null;
        this.actionTimer = 0;
    }
};