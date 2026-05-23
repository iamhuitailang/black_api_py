class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = GameConfig.PLAYER.WIDTH;
        this.height = GameConfig.PLAYER.HEIGHT;
        this.baseHeight = GameConfig.PLAYER.HEIGHT;
        this.crouchHeight = GameConfig.PLAYER.CROUCH_HEIGHT;
        this.baseSpeed = GameConfig.PLAYER.BASE_SPEED;
        this.crouchSpeed = GameConfig.PLAYER.CROUCH_SPEED;
        
        this.health = GameConfig.PLAYER.MAX_HEALTH;
        this.maxHealth = GameConfig.PLAYER.MAX_HEALTH;
        
        this.velocityX = 0;
        this.velocityY = 0;
        
        this.isCrouching = false;
        this.isMoving = false;
        this.direction = 'down';
        
        this.invincible = false;
        this.invincibleTimer = 0;
        
        this.buffs = {
            speed: { active: false, timer: 0, multiplier: 1 },
            shield: { active: false, timer: 0, charges: 0 }
        };
        
        this.dodgedCount = 0;
        
        this.animFrame = 0;
        this.animTimer = 0;
    }
    
    update(deltaTime, input, scene, crowdManager) {
        this.updateCrouch(input);
        this.updateMovement(input, scene, crowdManager);
        this.updateBuffs(deltaTime);
        this.updateInvincibility(deltaTime);
        this.updateAnimation(deltaTime);
        
        this.x = Utils.clamp(this.x, 0, GameConfig.CANVAS_WIDTH - this.width);
        this.y = Utils.clamp(this.y, 0, GameConfig.CANVAS_HEIGHT - this.height);
    }
    
    updateCrouch(input) {
        this.isCrouching = input.isKeyDown('Space');
        this.height = this.isCrouching ? this.crouchHeight : this.baseHeight;
    }
    
    updateMovement(input, scene, crowdManager) {
        let dx = 0;
        let dy = 0;
        
        if (input.isKeyDown('ArrowUp') || input.isKeyDown('KeyW')) dy -= 1;
        if (input.isKeyDown('ArrowDown') || input.isKeyDown('KeyS')) dy += 1;
        if (input.isKeyDown('ArrowLeft') || input.isKeyDown('KeyA')) dx -= 1;
        if (input.isKeyDown('ArrowRight') || input.isKeyDown('KeyD')) dx += 1;
        
        this.isMoving = (dx !== 0 || dy !== 0);
        
        if (this.isMoving) {
            const normalized = Utils.normalize(dx, dy);
            let speed = this.isCrouching ? this.crouchSpeed : this.baseSpeed;
            
            if (this.buffs.speed.active) {
                speed *= this.buffs.speed.multiplier;
            }
            
            const crowdSlowFactor = crowdManager ? crowdManager.getCrowdSlowFactor(this.x + this.width / 2, this.y + this.height / 2) : 1;
            speed *= crowdSlowFactor;
            
            this.velocityX = normalized.x * speed;
            this.velocityY = normalized.y * speed;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                this.direction = dx > 0 ? 'right' : 'left';
            } else {
                this.direction = dy > 0 ? 'down' : 'up';
            }
        } else {
            this.velocityX = 0;
            this.velocityY = 0;
        }
        
        const newX = this.x + this.velocityX;
        const newY = this.y + this.velocityY;
        
        if (!scene.checkObstacleCollision({ x: newX, y: this.y, w: this.width, h: this.height }) &&
            !this.checkNPCCollision(newX, this.y, crowdManager)) {
            this.x = newX;
        }
        if (!scene.checkObstacleCollision({ x: this.x, y: newY, w: this.width, h: this.height }) &&
            !this.checkNPCCollision(this.x, newY, crowdManager)) {
            this.y = newY;
        }
    }
    
    checkNPCCollision(newX, newY, crowdManager) {
        if (!crowdManager) return false;
        
        const playerRect = {
            x: newX,
            y: newY,
            w: this.width,
            h: this.height
        };
        
        return crowdManager.checkPlayerCollision(playerRect);
    }
    
    updateBuffs(deltaTime) {
        if (this.buffs.speed.active) {
            this.buffs.speed.timer -= deltaTime;
            if (this.buffs.speed.timer <= 0) {
                this.buffs.speed.active = false;
                this.buffs.speed.multiplier = 1;
            }
        }
        
        if (this.buffs.shield.active) {
            this.buffs.shield.timer -= deltaTime;
            if (this.buffs.shield.timer <= 0) {
                this.buffs.shield.active = false;
            }
        }
    }
    
    updateInvincibility(deltaTime) {
        if (this.invincible) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }
    }
    
    updateAnimation(deltaTime) {
        if (this.isMoving) {
            this.animTimer += deltaTime;
            if (this.animTimer > 150) {
                this.animTimer = 0;
                this.animFrame = (this.animFrame + 1) % 4;
            }
        } else {
            this.animFrame = 0;
        }
    }
    
    takeDamage(amount) {
        if (this.invincible) return false;
        
        if (this.buffs.shield.active && this.buffs.shield.charges > 0) {
            this.buffs.shield.charges--;
            if (this.buffs.shield.charges <= 0) {
                this.buffs.shield.active = false;
            }
            this.dodgedCount++;
            return false;
        }
        
        if (this.isCrouching) {
            amount = Math.floor(amount * 0.5);
        }
        
        this.health -= amount;
        this.invincible = true;
        this.invincibleTimer = GameConfig.PLAYER.INVINCIBLE_TIME;
        
        if (this.health < 0) this.health = 0;
        
        return true;
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    applySpeedBoost(duration, multiplier) {
        this.buffs.speed.active = true;
        this.buffs.speed.timer = duration;
        this.buffs.speed.multiplier = multiplier;
    }
    
    applyShield(duration) {
        this.buffs.shield.active = true;
        this.buffs.shield.timer = duration;
        this.buffs.shield.charges = 3;
    }
    
    getCenterX() {
        return this.x + this.width / 2;
    }
    
    getCenterY() {
        return this.y + this.height / 2;
    }
    
    getRect() {
        return {
            x: this.x,
            y: this.y,
            w: this.width,
            h: this.height
        };
    }
    
    getActiveBuffs() {
        const buffs = [];
        if (this.buffs.speed.active) {
            buffs.push({
                type: 'speed',
                name: '加速',
                color: '#3498db',
                time: Math.ceil(this.buffs.speed.timer / 1000)
            });
        }
        if (this.buffs.shield.active) {
            buffs.push({
                type: 'shield',
                name: '防护',
                color: '#9b59b6',
                time: Math.ceil(this.buffs.shield.timer / 1000),
                charges: this.buffs.shield.charges
            });
        }
        return buffs;
    }
    
    isDead() {
        return this.health <= 0;
    }
    
    render(ctx) {
        ctx.save();
        
        if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        if (this.buffs.shield.active) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, this.width * 0.8, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(155, 89, 182, 0.5)';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = 'rgba(155, 89, 182, 0.1)';
            ctx.fill();
        }
        
        ctx.fillStyle = '#f39c12';
        Utils.drawRoundedRect(ctx, this.x + 5, this.y + 10, this.width - 10, this.height - 15, 5);
        ctx.fill();
        
        ctx.fillStyle = '#e67e22';
        ctx.beginPath();
        ctx.arc(centerX, this.y + 8, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        const eyeOffset = this.direction === 'left' ? -3 : this.direction === 'right' ? 3 : 0;
        ctx.beginPath();
        ctx.arc(centerX - 4 + eyeOffset, this.y + 6, 2, 0, Math.PI * 2);
        ctx.arc(centerX + 4 + eyeOffset, this.y + 6, 2, 0, Math.PI * 2);
        ctx.fill();
        
        if (this.isMoving && !this.isCrouching) {
            const legOffset = Math.sin(this.animFrame * Math.PI / 2) * 5;
            ctx.fillStyle = '#d35400';
            ctx.fillRect(this.x + 8, this.y + this.height - 8, 5, 8 + legOffset);
            ctx.fillRect(this.x + this.width - 13, this.y + this.height - 8, 5, 8 - legOffset);
        } else if (this.isCrouching) {
            ctx.fillStyle = '#d35400';
            ctx.fillRect(this.x + 8, this.y + this.height - 5, 5, 5);
            ctx.fillRect(this.x + this.width - 13, this.y + this.height - 5, 5, 5);
        } else {
            ctx.fillStyle = '#d35400';
            ctx.fillRect(this.x + 8, this.y + this.height - 8, 5, 8);
            ctx.fillRect(this.x + this.width - 13, this.y + this.height - 8, 5, 8);
        }
        
        ctx.restore();
    }
}
