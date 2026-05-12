class Physics {
    constructor() {
        this.gravity = 0.5;
    }

    updateClimb(deltaTime) {
        if (gameState.monkeyIsClimbing) {
            gameState.monkeyClimbProgress += deltaTime / CONSTANTS.CLIMB_DURATION;
            
            if (gameState.monkeyClimbProgress >= 1) {
                gameState.monkeyIsClimbing = false;
                gameState.monkeyClimbProgress = 0;
                gameState.monkeySide = gameState.monkeyTargetSide;
            }
        }
    }
    
    updateAnimations(deltaTime) {
        const transitionSpeed = 0.15;
        if (gameState.monkeySideTransition < 1) {
            gameState.monkeySideTransition += transitionSpeed;
            if (gameState.monkeySideTransition > 1) {
                gameState.monkeySideTransition = 1;
            }
        }
        
        if (gameState.monkeySide !== gameState.monkeyTargetSide && !gameState.monkeyIsClimbing) {
            gameState.monkeySide = gameState.monkeyTargetSide;
            gameState.monkeySideTransition = 0;
        }
    }

    checkCollisions() {
        const monkeyHeight = gameState.height;
        const monkeyHitbox = {
            top: monkeyHeight - 30,
            bottom: monkeyHeight + 10,
            left: -30,
            right: 30
        };

        for (const obstacle of gameState.obstacles) {
            if (this.checkObstacleCollision(monkeyHitbox, obstacle)) {
                if (obstacle.type === CONSTANTS.OBSTACLE_TYPES.WEB) {
                    gameState.slowMotion = true;
                    gameState.slowMotionEndTime = Date.now() + 3000;
                } else {
                    if (gameState.useShield()) {
                        audioManager.playCollect();
                    } else {
                        this.triggerGameOver();
                        return;
                    }
                }
            }
        }

        for (let i = gameState.items.length - 1; i >= 0; i--) {
            const item = gameState.items[i];
            if (this.checkItemCollision(monkeyHitbox, item)) {
                this.collectItem(item);
                gameState.items.splice(i, 1);
            }
        }
    }

    checkObstacleCollision(monkeyHitbox, obstacle) {
        const obstacleY = obstacle.height;
        const monkeyY = gameState.height;
        
        const distanceY = Math.abs(obstacleY - monkeyY);
        const verticalOverlap = distanceY < 30;
        
        if (!verticalOverlap) return false;
        
        const currentSide = gameState.monkeySide + (gameState.monkeyTargetSide - gameState.monkeySide) * gameState.monkeySideTransition;
        
        if (obstacle.type === CONSTANTS.OBSTACLE_TYPES.BRANCH) {
            const sameSide = (obstacle.side > 0 && currentSide > 0) || 
                           (obstacle.side < 0 && currentSide < 0);
            return sameSide;
        }
        
        return true;
    }

    checkItemCollision(monkeyHitbox, item) {
        const itemY = item.height;
        const monkeyY = gameState.height;
        
        const distanceY = Math.abs(itemY - monkeyY);
        const verticalOverlap = distanceY < 40;
        
        if (!verticalOverlap) return false;
        
        if (gameState.powerups.magnet) {
            return true;
        }
        
        const currentSide = gameState.monkeySide + (gameState.monkeyTargetSide - gameState.monkeySide) * gameState.monkeySideTransition;
        const sameSide = (item.side > 0 && currentSide > 0) || (item.side < 0 && currentSide < 0);
        
        return sameSide;
    }

    collectItem(item) {
        audioManager.playCollect();
        
        switch (item.type) {
            case CONSTANTS.ITEM_TYPES.BANANA:
                gameState.addScore(CONSTANTS.SCORES.BANANA);
                uiManager.showFloatingText('+10', item.height, item.side * 80);
                break;
            case CONSTANTS.ITEM_TYPES.SPEED_BANANA:
                gameState.activatePowerup(item.type);
                uiManager.showFloatingText('⚡加速!', item.height, item.side * 80);
                break;
            case CONSTANTS.ITEM_TYPES.SHIELD_LEAF:
                gameState.activatePowerup(item.type);
                uiManager.showFloatingText('🛡️护盾!', item.height, item.side * 80);
                break;
            case CONSTANTS.ITEM_TYPES.MAGNET:
                gameState.activatePowerup(item.type);
                uiManager.showFloatingText('🧲磁铁!', item.height, item.side * 80);
                break;
            case CONSTANTS.ITEM_TYPES.SPRING_SHOES:
                gameState.activatePowerup(item.type);
                uiManager.showFloatingText('👟弹跳!', item.height, item.side * 80);
                break;
        }
    }

    triggerGameOver() {
        gameState.isPlaying = false;
        gameState.isGameOver = true;
        audioManager.playHit();
        audioManager.playGameOver();
        uiManager.shakeScreen();
        uiManager.showGameOver();
        storageManager.clearSave();
    }

    updateObstacles(deltaTime) {
        gameState.obstacles.forEach(obstacle => {
            if (obstacle.type === CONSTANTS.OBSTACLE_TYPES.BUG) {
                obstacle.offset = Math.sin(Date.now() / 300) * 20;
            }
            if (obstacle.type === CONSTANTS.OBSTACLE_TYPES.WOODPECKER) {
                obstacle.offset = Math.sin(Date.now() / 200) * 40;
            }
            if (obstacle.type === CONSTANTS.OBSTACLE_TYPES.MUSHROOM && obstacle.growth < 1) {
                obstacle.growth += deltaTime / 3000;
            }
        });

        gameState.obstacles = gameState.obstacles.filter(obstacle => 
            obstacle.height > gameState.height - 300
        );
    }

    updateItems(deltaTime) {
        gameState.items = gameState.items.filter(item => 
            item.height > gameState.height - 300
        );
    }
}

const physics = new Physics();
