class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.player.width;
        this.height = CONFIG.player.height;
        this.vx = 0;
        this.vy = 0;
        this.jumpsRemaining = CONFIG.player.maxJumps;
        this.onGround = false;
        this.facingRight = true;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.trailTimer = 0;
        this.spawnX = x;
        this.spawnY = y;
        this.animFrame = 0;
        this.animTimer = 0;
    }
    
    reset() {
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.vx = 0;
        this.vy = 0;
        this.jumpsRemaining = CONFIG.player.maxJumps;
        this.onGround = false;
        this.invincible = true;
        this.invincibleTimer = CONFIG.player.invincibleTime;
    }
    
    update(deltaTime, platforms, levelWidth, levelHeight) {
        if (this.invincible) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }
        
        if (Input.isLeft()) {
            this.vx = -CONFIG.player.speed;
            this.facingRight = false;
        } else if (Input.isRight()) {
            this.vx = CONFIG.player.speed;
            this.facingRight = true;
        } else {
            this.vx *= 0.8;
            if (Math.abs(this.vx) < 0.1) this.vx = 0;
        }
        
        if (Input.consumeJump() && this.jumpsRemaining > 0) {
            this.vy = CONFIG.player.jumpForce;
            this.jumpsRemaining--;
            this.onGround = false;
        }
        
        this.vy += CONFIG.gravity;
        if (this.vy > 15) this.vy = 15;
        
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > levelWidth) this.x = levelWidth - this.width;
        
        this.onGround = false;
        let platformVelocity = { x: 0, y: 0 };
        
        for (const platform of platforms) {
            if (platform.broken) continue;
            
            const collision = this.checkPlatformCollision(platform);
            if (collision) {
                if (collision.side === 'top') {
                    this.y = platform.y - this.height;
                    this.vy = 0;
                    this.onGround = true;
                    this.jumpsRemaining = CONFIG.player.maxJumps;
                    
                    if (platform.type === 'moving') {
                        platformVelocity.x = platform.vx;
                        platformVelocity.y = platform.vy;
                    }
                    
                    if (platform.type === 'fragile') {
                        platform.startBreaking();
                    }
                }
            }
        }
        
        this.x += platformVelocity.x;
        this.y += platformVelocity.y;
        
        this.animTimer += deltaTime;
        if (this.animTimer > 100) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
        
        this.trailTimer += deltaTime;
    }
    
    checkPlatformCollision(platform) {
        const playerBottom = this.y + this.height;
        const playerTop = this.y;
        const playerLeft = this.x;
        const playerRight = this.x + this.width;
        
        const platTop = platform.y;
        const platBottom = platform.y + platform.height;
        const platLeft = platform.x;
        const platRight = platform.x + platform.width;
        
        if (playerRight > platLeft && playerLeft < platRight) {
            if (this.vy >= 0 && playerBottom >= platTop && playerTop < platTop) {
                return { side: 'top' };
            }
        }
        
        return null;
    }
    
    checkEnemyCollision(enemy) {
        if (this.invincible) return false;
        
        const playerCenterX = this.x + this.width / 2;
        const playerCenterY = this.y + this.height / 2;
        const enemyCenterX = enemy.x + enemy.width / 2;
        const enemyCenterY = enemy.y + enemy.height / 2;
        
        const dx = playerCenterX - enemyCenterX;
        const dy = playerCenterY - enemyCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < (this.width + enemy.width) / 2 - 5;
    }
    
    checkTrapCollision(trap) {
        if (this.invincible) return false;
        
        return this.x + this.width > trap.x &&
               this.x < trap.x + trap.width &&
               this.y + this.height > trap.y &&
               this.y < trap.y + trap.height;
    }
    
    checkGoal(goal) {
        return this.x + this.width > goal.x &&
               this.x < goal.x + goal.width &&
               this.y + this.height > goal.y &&
               this.y < goal.y + goal.height;
    }
    
    isFalling(levelHeight) {
        return this.y > levelHeight + 100;
    }
    
    render(ctx, particleSystem) {
        if (this.vy < -5) {
            this.trailTimer = 0;
            particleSystem.emit(
                this.x + this.width / 2,
                this.y + this.height,
                2,
                {
                    color: '#a29bfe',
                    vy: 2,
                    life: 0.5,
                    size: 3,
                    gravity: 0
                }
            );
        }
        
        ctx.save();
        
        if (this.invincible && Math.floor(this.invincibleTimer / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        if (!this.facingRight) {
            ctx.translate(centerX, centerY);
            ctx.scale(-1, 1);
            ctx.translate(-centerX, -centerY);
        }
        
        this.drawKangaroo(ctx, centerX, centerY);
        
        ctx.restore();
    }
    
    drawKangaroo(ctx, cx, cy) {
        const bounceOffset = this.onGround ? Math.sin(this.animFrame * Math.PI / 2) * 2 : 0;
        
        ctx.save();
        ctx.translate(0, -bounceOffset);
        
        ctx.fillStyle = '#d4a574';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffd700';
        
        ctx.beginPath();
        ctx.ellipse(cx, cy + 5, 15, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(cx, cy - 18, 12, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(cx - 8, cy - 32, 4, 8, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 8, cy - 32, 4, 8, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffc0cb';
        ctx.beginPath();
        ctx.ellipse(cx - 8, cy - 32, 2, 5, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 8, cy - 32, 2, 5, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(cx - 5, cy - 20, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 5, cy - 20, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx - 4, cy - 21, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 6, cy - 21, 1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#d4a574';
        ctx.beginPath();
        ctx.arc(cx, cy - 12, 3, 0, Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#f5deb3';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 8, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#d4a574';
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy + 20);
        ctx.quadraticCurveTo(cx - 20, cy + 30, cx - 25, cy + 25);
        ctx.quadraticCurveTo(cx - 15, cy + 20, cx - 5, cy + 22);
        ctx.fill();
        
        const legOffset = this.onGround && Math.abs(this.vx) > 0.5 ? Math.sin(this.animFrame * Math.PI / 2) * 5 : 0;
        
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy + 20);
        ctx.lineTo(cx - 8 - legOffset, cy + 35);
        ctx.lineTo(cx - 2 - legOffset, cy + 35);
        ctx.lineTo(cx, cy + 22);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(cx + 5, cy + 20);
        ctx.lineTo(cx + 8 + legOffset, cy + 35);
        ctx.lineTo(cx + 2 + legOffset, cy + 35);
        ctx.lineTo(cx, cy + 22);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(cx - 12, cy);
        ctx.quadraticCurveTo(cx - 22, cy - 5, cx - 18, cy + 5);
        ctx.quadraticCurveTo(cx - 15, cy + 8, cx - 10, cy + 5);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(cx + 12, cy);
        ctx.quadraticCurveTo(cx + 22, cy - 5, cx + 18, cy + 5);
        ctx.quadraticCurveTo(cx + 15, cy + 8, cx + 10, cy + 5);
        ctx.fill();
        
        ctx.restore();
    }
}
