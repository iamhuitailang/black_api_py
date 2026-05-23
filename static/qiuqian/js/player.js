class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = GameConfig.player.width;
        this.height = GameConfig.player.height;
        this.velocityX = 0;
        this.velocityY = 0;
        this.health = GameConfig.player.maxHealth;
        this.maxHealth = GameConfig.player.maxHealth;
        this.isOnGround = false;
        this.currentPlatform = null;
        this.facingRight = true;
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.animFrame = 0;
        this.animTimer = 0;
        this.jumpCount = 0;
        this.maxJumps = 2;
        this.chargeProgress = 0;
        this.lastJumpCharged = false;
        this.wasInAir = false;
    }
    
    update(inputManager, canvasWidth, canvasHeight) {
        this.velocityX = 0;
        
        if (!this.isOnGround || this.jumpCount > 0) {
            if (inputManager.isLeft()) {
                this.velocityX = -GameConfig.player.moveSpeed * 0.8;
                this.facingRight = false;
            }
            if (inputManager.isRight()) {
                this.velocityX = GameConfig.player.moveSpeed * 0.8;
                this.facingRight = true;
            }
        } else {
            if (inputManager.isLeft()) {
                this.velocityX = -GameConfig.player.moveSpeed;
                this.facingRight = false;
            }
            if (inputManager.isRight()) {
                this.velocityX = GameConfig.player.moveSpeed;
                this.facingRight = true;
            }
        }
        
        if (this.currentPlatform && this.isOnGround && this.velocityX === 0) {
            this.x += this.currentPlatform.velocityX || 0;
        }
        
        this.animTimer++;
        if (this.animTimer >= 8) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
        
        if (this.isInvincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) {
                this.isInvincible = false;
            }
        }
        
        if (inputManager.isSpacePressed()) {
            const holdTime = inputManager.getSpaceHoldTime();
            this.chargeProgress = Math.min(holdTime / GameConfig.player.maxChargeTime, 1);
        } else {
            this.chargeProgress = 0;
        }
    }
    
    jump(isCharged = false) {
        if (this.jumpCount < this.maxJumps || this.isOnGround) {
            if (this.isOnGround) {
                this.jumpCount = 0;
            }
            
            const jumpForce = isCharged ? 
                GameConfig.player.chargeJumpForce : 
                GameConfig.player.jumpForce;
            
            this.velocityY = -jumpForce;
            this.isOnGround = false;
            this.currentPlatform = null;
            this.jumpCount++;
            this.wasInAir = true;
            
            return { isCharged, jumpForce };
        }
        return null;
    }
    
    takeDamage() {
        if (this.isInvincible) return false;
        
        this.health--;
        this.isInvincible = true;
        this.invincibleTimer = GameConfig.player.invincibleTime / 16;
        return true;
    }
    
    isAlive() {
        return this.health > 0;
    }
    
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.velocityX = 0;
        this.velocityY = 0;
        this.health = this.maxHealth;
        this.isOnGround = false;
        this.currentPlatform = null;
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.jumpCount = 0;
        this.chargeProgress = 0;
    }
    
    draw(ctx) {
        ctx.save();
        
        if (this.isInvincible && Math.floor(this.invincibleTimer / 4) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        ctx.fillStyle = '#FF6B6B';
        Utils.drawRoundedRect(ctx, this.x + 4, this.y + 16, this.width - 8, this.height - 20, 8);
        ctx.fill();
        
        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.arc(centerX, this.y + 12, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#333';
        const eyeOffset = this.facingRight ? 3 : -3;
        ctx.beginPath();
        ctx.arc(centerX + eyeOffset - 4, this.y + 10, 2, 0, Math.PI * 2);
        ctx.arc(centerX + eyeOffset + 4, this.y + 10, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#4ECDC4';
        const legOffset = Math.sin(this.animFrame * Math.PI / 2) * 3;
        Utils.drawRoundedRect(ctx, this.x + 6, this.y + this.height - 8, 10, 8 + legOffset, 3);
        ctx.fill();
        Utils.drawRoundedRect(ctx, this.x + this.width - 16, this.y + this.height - 8, 10, 8 - legOffset, 3);
        ctx.fill();
        
        if (this.chargeProgress > 0) {
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(this.x, this.y - 10, this.width * this.chargeProgress, 5);
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y - 10, this.width, 5);
        }
        
        ctx.restore();
    }
    
    toJSON() {
        return {
            x: this.x,
            y: this.y,
            velocityX: this.velocityX,
            velocityY: this.velocityY,
            health: this.health,
            isOnGround: this.isOnGround,
            facingRight: this.facingRight,
            jumpCount: this.jumpCount
        };
    }
    
    fromJSON(data) {
        this.x = data.x;
        this.y = data.y;
        this.velocityX = data.velocityX;
        this.velocityY = data.velocityY;
        this.health = data.health;
        this.isOnGround = data.isOnGround;
        this.facingRight = data.facingRight;
        this.jumpCount = data.jumpCount;
    }
}

window.Player = Player;
