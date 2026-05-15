class Boat {
    constructor(isPlayer = true, color = '#4a90d9') {
        this.isPlayer = isPlayer;
        this.color = color;
        
        this.width = GAME_CONSTANTS.BOAT_WIDTH;
        this.height = GAME_CONSTANTS.BOAT_HEIGHT;
        
        this.x = GAME_CONSTANTS.CANVAS_WIDTH / 2 - this.width / 2;
        this.y = GAME_CONSTANTS.CANVAS_HEIGHT - 150;
        
        this.speed = GAME_CONSTANTS.BASE_SPEED;
        this.currentSpeedBonus = 0;
        this.speedRecoveryTime = 0;
        
        this.targetX = this.x;
        
        this.activePowerups = [];
        this.heldPowerup = null;
        
        this.shieldActive = false;
        this.magnetActive = false;
        this.nitroActive = false;
        
        this.tilt = 0;
        this.targetTilt = 0;
        
        this.collisionCooldown = 0;
        this.collidedObstacles = new Set();
    }

    update(keys, track, deltaTime, playerProgress = null) {
        if (this.isPlayer) {
            this.updatePlayer(keys, deltaTime);
        }
        
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
        
        return this.getActualSpeed();
    }

    getActualSpeed() {
        let speed = GAME_CONSTANTS.BASE_SPEED + this.currentSpeedBonus;
        
        if (this.nitroActive) {
            speed *= 1.5;
        }
        
        return Utils.clamp(speed, GAME_CONSTANTS.MIN_SPEED, GAME_CONSTANTS.MAX_SPEED);
    }

    updatePlayer(keys, deltaTime) {
        const moveSpeed = 6;
        
        if (keys.left) {
            this.targetX -= moveSpeed;
            this.targetTilt = -0.15;
        }
        if (keys.right) {
            this.targetX += moveSpeed;
            this.targetTilt = 0.15;
        }
        
        this.targetX = Utils.clamp(
            this.targetX,
            GAME_CONSTANTS.TRACK_LEFT + 10,
            GAME_CONSTANTS.TRACK_RIGHT - this.width - 10
        );
        
        this.x = Utils.lerp(this.x, this.targetX, 0.2);
    }

    updatePowerups(deltaTime) {
        this.activePowerups = this.activePowerups.filter(p => {
            p.remaining -= deltaTime;
            return p.remaining > 0;
        });
        
        this.shieldActive = this.activePowerups.some(p => p.type === 'shield');
        this.magnetActive = this.activePowerups.some(p => p.type === 'magnet');
        this.nitroActive = this.activePowerups.some(p => p.type === 'nitro');
        
        this.speed = this.getActualSpeed();
    }

    checkCollisions(track, playerProgress = null) {
        if (!this.isPlayer && playerProgress === null) return;
        
        const progress = this.isPlayer ? track.playerProgress : playerProgress;
        const collisionY = progress + this.y + this.height / 2;
        
        track.getObstaclesInRange(collisionY, 150).forEach(obstacle => {
            const obstacleId = `${obstacle.type}-${obstacle.x}-${obstacle.y}`;
            
            if (this.collidedObstacles.has(obstacleId)) return;
            
            const obstacleScreenY = obstacle.y - progress;
            
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
        
        if (this.magnetActive) {
            track.getPowerupsInRange(collisionY, 400).forEach(powerup => {
                if (powerup.collected) return;
                const powerupScreenY = powerup.y - progress;
                const dx = (this.x + this.width / 2) - (powerup.x + 25);
                const dy = (this.y + this.height / 2) - powerupScreenY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 200 && dist > 30) {
                    powerup.x += dx * 0.08;
                    powerup.y -= dy * 0.05;
                }
            });
        }
        
        track.getPowerupsInRange(collisionY, 150).forEach(powerup => {
            if (powerup.collected) return;
            const powerupScreenY = powerup.y - progress;
            
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

    handleObstacleCollision(obstacle) {
        if (this.shieldActive && (obstacle.type === 'buoy' || obstacle.type === 'rock')) {
            return;
        }
        
        if (this.collisionCooldown > 0) return;
        
        switch (obstacle.type) {
            case GAME_CONSTANTS.OBSTACLE_TYPES.SPEED_UP:
                this.currentSpeedBonus = 3;
                this.speedRecoveryTime = 4000;
                this.collisionCooldown = 500;
                break;
                
            case GAME_CONSTANTS.OBSTACLE_TYPES.SLOW_DOWN:
                this.currentSpeedBonus = -2;
                this.speedRecoveryTime = 3000;
                this.collisionCooldown = 500;
                break;
                
            case GAME_CONSTANTS.OBSTACLE_TYPES.BUOY:
                this.currentSpeedBonus = -1.5;
                this.speedRecoveryTime = 2000;
                this.collisionCooldown = 800;
                break;
                
            case GAME_CONSTANTS.OBSTACLE_TYPES.ROCK:
                this.currentSpeedBonus = -2.5;
                this.speedRecoveryTime = 2500;
                this.collisionCooldown = 1000;
                break;
        }
    }

    handlePowerupCollect(powerup) {
        powerup.collected = true;
        
        if (!this.heldPowerup) {
            this.heldPowerup = powerup.type;
        }
    }

    usePowerup() {
        if (!this.heldPowerup) return null;
        
        const type = this.heldPowerup;
        const effect = GAME_CONSTANTS.POWERUP_EFFECTS[type];
        
        this.activePowerups.push({
            type: type,
            remaining: effect.duration
        });
        
        this.heldPowerup = null;
        
        return { type, score: effect.score || 0 };
    }

    render(ctx, playerProgress = null) {
        let renderY = this.y;
        
        if (!this.isPlayer && playerProgress !== null) {
            // 只在AI render时计算相对位置
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
    }

    renderBoatBody(ctx) {
        const boatColor = this.isPlayer ? GAME_CONSTANTS.COLORS.boatBody : this.color;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.moveTo(5, -this.height / 2 + 10);
        ctx.quadraticCurveTo(this.width / 2 - 8, -this.height / 4 + 10, this.width / 2 - 15, 10);
        ctx.quadraticCurveTo(this.width / 2 - 8, this.height / 4 + 10, 5, this.height / 2 + 5);
        ctx.quadraticCurveTo(-this.width / 2 + 12, this.height / 4 + 10, -this.width / 2 + 17, 10);
        ctx.quadraticCurveTo(-this.width / 2 + 12, -this.height / 4 + 10, 5, -this.height / 2 + 10);
        ctx.fill();
        
        ctx.fillStyle = boatColor;
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.quadraticCurveTo(this.width / 2 - 5, -this.height / 4, this.width / 2 - 12, 0);
        ctx.quadraticCurveTo(this.width / 2 - 5, this.height / 4, 0, this.height / 2);
        ctx.quadraticCurveTo(-this.width / 2 + 5, this.height / 4, -this.width / 2 + 12, 0);
        ctx.quadraticCurveTo(-this.width / 2 + 5, -this.height / 4, 0, -this.height / 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(-8, -this.height / 4, 6, 15, -0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = GAME_CONSTANTS.COLORS.boatAccent;
        ctx.beginPath();
        ctx.moveTo(-12, -this.height / 3);
        ctx.lineTo(12, -this.height / 3);
        ctx.lineTo(8, this.height / 3);
        ctx.lineTo(-8, this.height / 3);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = boatColor;
        ctx.fillRect(-6, -this.height / 3 + 5, 12, this.height * 2 / 3 - 10);
        
        if (this.isPlayer) {
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (this.nitroActive) {
            const gradient = ctx.createLinearGradient(0, this.height / 2, 0, this.height / 2 + 40);
            gradient.addColorStop(0, '#ff6600');
            gradient.addColorStop(0.5, '#ffaa00');
            gradient.addColorStop(1, 'rgba(255, 200, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(-12, this.height / 2);
            ctx.quadraticCurveTo(0, this.height / 2 + 35 + Math.random() * 15, 12, this.height / 2);
            ctx.closePath();
            ctx.fill();
        }
    }

    renderShield(ctx) {
        const time = Date.now() / 100;
        const pulseSize = Math.sin(time) * 3;
        
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.7)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2 + 12 + pulseSize, this.height / 2 + 12 + pulseSize, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(0, 255, 136, 0.15)';
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(0, 255, 200, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2 + 8, this.height / 2 + 8, 0, 0, Math.PI * 2);
        ctx.stroke();
    }

    getActivePowerupDisplay() {
        if (this.heldPowerup) {
            return {
                type: this.heldPowerup,
                icon: GAME_CONSTANTS.POWERUP_EFFECTS[this.heldPowerup].icon,
                timer: null
            };
        }
        
        if (this.activePowerups.length > 0) {
            const active = this.activePowerups[0];
            return {
                type: active.type,
                icon: GAME_CONSTANTS.POWERUP_EFFECTS[active.type].icon,
                timer: Math.ceil(active.remaining / 1000)
            };
        }
        
        return null;
    }

    reset() {
        this.x = GAME_CONSTANTS.CANVAS_WIDTH / 2 - this.width / 2;
        this.y = GAME_CONSTANTS.CANVAS_HEIGHT - 150;
        this.speed = GAME_CONSTANTS.BASE_SPEED;
        this.currentSpeedBonus = 0;
        this.speedRecoveryTime = 0;
        this.targetX = this.x;
        this.activePowerups = [];
        this.heldPowerup = null;
        this.shieldActive = false;
        this.magnetActive = false;
        this.nitroActive = false;
        this.tilt = 0;
        this.targetTilt = 0;
        this.collisionCooldown = 0;
        this.collidedObstacles.clear();
        if (this.progress !== undefined) {
            this.progress = 0;
        }
    }
}