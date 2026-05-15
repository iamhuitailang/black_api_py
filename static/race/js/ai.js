class AIBoat extends Boat {
    constructor(difficulty, color) {
        super(false, color);
        this.difficulty = difficulty;
        this.difficultySettings = GAME_CONSTANTS.DIFFICULTY[difficulty];
        this.aiSpeedMultiplier = this.difficultySettings.speedMultiplier;
        this.decisionTimer = 0;
        this.targetLane = GAME_CONSTANTS.CANVAS_WIDTH / 2;
        this.progress = 0;
    }

    getActualSpeed() {
        let speed = GAME_CONSTANTS.BASE_SPEED * this.aiSpeedMultiplier + this.currentSpeedBonus;
        
        if (this.nitroActive) {
            speed *= 1.5;
        }
        
        return Utils.clamp(speed, GAME_CONSTANTS.MIN_SPEED, GAME_CONSTANTS.MAX_SPEED);
    }

    update(keys, track, deltaTime, playerProgress = null) {
        this.decisionTimer += deltaTime;
        
        if (this.decisionTimer > 200) {
            this.makeDecision(track, playerProgress);
            this.decisionTimer = 0;
        }
        
        this.updateAI(deltaTime);
        
        this.updatePowerups(deltaTime);
        
        if (this.collisionCooldown > 0) {
            this.collisionCooldown -= deltaTime;
        }
        
        if (this.speedRecoveryTime > 0) {
            this.speedRecoveryTime -= deltaTime;
            if (this.speedRecoveryTime <= 0) {
                this.currentSpeedBonus = 0;
            }
        }
        
        this.tilt = Utils.lerp(this.tilt, this.targetTilt, 0.1);
        this.targetTilt *= 0.9;
        
        this.checkCollisions(track, playerProgress);
        
        const actualSpeed = this.getActualSpeed();
        this.progress += actualSpeed;
        
        return actualSpeed;
    }

    checkCollisions(track, playerProgress = null) {
        const progress = playerProgress !== null ? playerProgress : 0;
        const collisionY = progress + this.y + this.height / 2 - this.progress;
        
        track.getObstaclesInRange(collisionY, 150).forEach(obstacle => {
            const obstacleId = `${obstacle.type}-${obstacle.x}-${obstacle.y}`;
            
            if (this.collidedObstacles.has(obstacleId)) return;
            
            const obstacleScreenY = obstacle.y - progress + this.progress;
            
            const boatRect = {
                x: this.x + 8,
                y: this.y + 15,
                width: this.width - 16,
                height: this.height - 30
            };
            
            const obstacleRect = {
                x: obstacle.x,
                y: obstacleScreenY,
                width: obstacle.width,
                height: obstacle.height
            };
            
            if (Utils.rectCollision(boatRect, obstacleRect)) {
                this.collidedObstacles.add(obstacleId);
                this.handleObstacleCollision(obstacle);
                
                setTimeout(() => {
                    this.collidedObstacles.delete(obstacleId);
                }, 1000);
            }
        });
        
        track.getPowerupsInRange(collisionY, 150).forEach(powerup => {
            if (powerup.collected) return;
            const powerupScreenY = powerup.y - progress + this.progress;
            
            const boatRect = {
                x: this.x + 5,
                y: this.y + 10,
                width: this.width - 10,
                height: this.height - 20
            };
            
            const powerupRect = {
                x: powerup.x,
                y: powerupScreenY,
                width: powerup.width,
                height: powerup.height
            };
            
            if (Utils.rectCollision(boatRect, powerupRect)) {
                this.handlePowerupCollect(powerup);
            }
        });
    }

    makeDecision(track, playerProgress) {
        const progress = playerProgress !== null ? playerProgress : 0;
        const lookAhead = progress + this.y - this.progress;
        
        const obstacles = track.getObstaclesInRange(lookAhead, 400);
        const powerups = track.getPowerupsInRange(lookAhead, 400);
        
        let bestLane = this.findBestLane(obstacles, powerups);
        
        if (Math.random() < this.difficultySettings.mistakeRate * 0.1) {
            bestLane += Utils.random(-50, 50);
        }
        
        this.targetLane = Utils.clamp(
            bestLane,
            GAME_CONSTANTS.TRACK_LEFT + 30,
            GAME_CONSTANTS.TRACK_RIGHT - this.width - 30
        );
        
        if (this.heldPowerup && Math.random() < 0.3) {
            this.usePowerup();
        }
    }

    findBestLane(obstacles, powerups) {
        const lanes = [
            GAME_CONSTANTS.TRACK_LEFT + 60,
            GAME_CONSTANTS.CANVAS_WIDTH / 2,
            GAME_CONSTANTS.TRACK_RIGHT - 80
        ];
        
        let bestScore = -Infinity;
        let bestLane = lanes[1];
        
        lanes.forEach(lane => {
            let score = 0;
            
            obstacles.forEach(obs => {
                const dist = Math.abs(obs.x + obs.width / 2 - lane);
                if (dist < 60) {
                    if (obs.type === 'speedUp') {
                        score += 100;
                    } else if (obs.type === 'slowDown') {
                        score -= 200;
                    } else if (obs.type === 'buoy' || obs.type === 'rock') {
                        score -= 150;
                    }
                }
            });
            
            powerups.forEach(p => {
                const dist = Math.abs(p.x + 25 - lane);
                if (dist < 60) {
                    score += 80;
                }
            });
            
            if (score > bestScore) {
                bestScore = score;
                bestLane = lane;
            }
        });
        
        return bestLane;
    }

    updateAI(deltaTime) {
        const moveSpeed = 5 * this.aiSpeedMultiplier;
        
        if (this.x < this.targetLane - 10) {
            this.x += moveSpeed;
            this.targetTilt = 0.12;
        } else if (this.x > this.targetLane + 10) {
            this.x -= moveSpeed;
            this.targetTilt = -0.12;
        } else {
            this.targetTilt = 0;
        }
        
        this.x = Utils.clamp(
            this.x,
            GAME_CONSTANTS.TRACK_LEFT + 10,
            GAME_CONSTANTS.TRACK_RIGHT - this.width - 10
        );
    }

    render(ctx, playerProgress = null) {
        let renderY = this.y;
        
        if (playerProgress !== null) {
            renderY = this.y - (playerProgress - this.progress);
        }
        
        if (renderY < -100 || renderY > GAME_CONSTANTS.CANVAS_HEIGHT + 100) {
            return;
        }
        
        ctx.save();
        ctx.translate(this.x + this.width / 2, renderY + this.height / 2);
        ctx.rotate(this.tilt);
        
        if (this.collisionCooldown > 0 && Math.floor(this.collisionCooldown / 100) % 2 === 0) {
            ctx.globalAlpha = 0.6;
        }
        
        this.renderBoatBody(ctx);
        
        if (this.shieldActive) {
            this.renderShield(ctx);
        }
        
        ctx.restore();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.difficulty.toUpperCase(), this.x + this.width / 2, renderY - 12);
    }
}