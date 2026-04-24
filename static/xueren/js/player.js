class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.PLAYER.WIDTH;
        this.height = CONFIG.PLAYER.HEIGHT;
        
        this.velocityX = 0;
        this.velocityY = 0;
        this.gravity = CONFIG.GRAVITY;
        this.speed = CONFIG.PLAYER.SPEED;
        this.jumpForce = CONFIG.PLAYER.JUMP_FORCE;
        
        this.acceleration = CONFIG.PLAYER.ACCELERATION;
        this.deceleration = CONFIG.PLAYER.DECELERATION;
        this.maxSpeed = CONFIG.PLAYER.MAX_SPEED;
        
        this.facingRight = true;
        this.isJumping = false;
        this.isOnGround = false;
        
        this.lastShootTime = 0;
        this.shootCooldown = CONFIG.PLAYER.SHOOT_COOLDOWN;
        
        this.isInvincible = false;
        this.invincibleEndTime = 0;
        this.hasBigShot = false;
        this.speedMultiplier = 1;
        
        this.isDead = false;
        this.deathTimer = 0;
        
        this.walkFrame = 0;
        this.walkTimer = 0;
    }
    
    getCollisionRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    getMouthPosition() {
        return {
            x: this.x + (this.facingRight ? this.width : 0),
            y: this.y + this.height * 0.35
        };
    }
    
    moveLeft() {
        const targetSpeed = -this.maxSpeed * this.speedMultiplier;
        this.velocityX = Math.max(this.velocityX - this.acceleration, targetSpeed);
        this.facingRight = false;
    }
    
    moveRight() {
        const targetSpeed = this.maxSpeed * this.speedMultiplier;
        this.velocityX = Math.min(this.velocityX + this.acceleration, targetSpeed);
        this.facingRight = true;
    }
    
    stopMoving() {
        if (this.velocityX > 0) {
            this.velocityX = Math.max(0, this.velocityX * this.deceleration);
            if (this.velocityX < 0.1) this.velocityX = 0;
        } else if (this.velocityX < 0) {
            this.velocityX = Math.min(0, this.velocityX * this.deceleration);
            if (this.velocityX > -0.1) this.velocityX = 0;
        }
    }
    
    jump() {
        if (this.isOnGround) {
            this.velocityY = this.jumpForce;
            this.isJumping = true;
            this.isOnGround = false;
        }
    }
    
    canShoot() {
        const now = Date.now();
        return now - this.lastShootTime >= this.shootCooldown;
    }
    
    shoot() {
        if (!this.canShoot()) return null;
        
        this.lastShootTime = Date.now();
        const mouthPos = this.getMouthPosition();
        
        return new Projectile(
            mouthPos.x,
            mouthPos.y,
            this.facingRight,
            this.hasBigShot
        );
    }
    
    takeDamage(game) {
        if (this.isInvincible || this.isDead) return false;
        
        game.lives--;
        game.updateUI();
        
        if (game.lives <= 0) {
            this.isDead = true;
            this.deathTimer = 60;
            return true;
        }
        
        this.isInvincible = true;
        this.invincibleEndTime = Date.now() + 2000;
        
        return false;
    }
    
    update(keys, platforms, snowballs, game) {
        if (this.isDead) {
            this.deathTimer--;
            if (this.deathTimer <= 0) {
                game.gameOver();
            }
            return;
        }
        
        if (this.isInvincible && Date.now() >= this.invincibleEndTime) {
            this.isInvincible = false;
        }
        
        let isMoving = false;
        if (keys['KeyA'] || keys['ArrowLeft']) {
            this.moveLeft();
            isMoving = true;
        } else if (keys['KeyD'] || keys['ArrowRight']) {
            this.moveRight();
            isMoving = true;
        } else {
            this.stopMoving();
        }
        
        if (isMoving && this.isOnGround) {
            this.walkTimer++;
            if (this.walkTimer > 8) {
                this.walkTimer = 0;
                this.walkFrame = (this.walkFrame + 1) % 4;
            }
        } else {
            this.walkFrame = 0;
        }
        
        if (keys['KeyW'] || keys['ArrowUp'] || keys['Space']) {
            this.jump();
        }
        
        this.velocityY += this.gravity;
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        this.isOnGround = false;
        
        platforms.forEach(platform => {
            if (Utils.rectCollision(this.getCollisionRect(), platform.getCollisionRect())) {
                if (this.velocityY > 0 && this.y + this.height - this.velocityY <= platform.y + 5) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.isOnGround = true;
                    this.isJumping = false;
                }
                else if (this.velocityY < 0 && this.y - this.velocityY >= platform.y + platform.height - 5) {
                    this.y = platform.y + platform.height;
                    this.velocityY = 0;
                }
                else {
                    if (this.velocityX > 0 && this.x + this.width - this.velocityX <= platform.x + 5) {
                        this.x = platform.x - this.width;
                        this.velocityX = 0;
                    } else if (this.velocityX < 0 && this.x - this.velocityX >= platform.x + platform.width - 5) {
                        this.x = platform.x + platform.width;
                        this.velocityX = 0;
                    }
                }
            }
        });
        
        if (this.y + this.height > CONFIG.CANVAS_HEIGHT) {
            this.y = CONFIG.CANVAS_HEIGHT - this.height;
            this.velocityY = 0;
            this.isOnGround = true;
            this.isJumping = false;
        }
        
        if (this.x < 0) {
            this.x = 0;
            this.velocityX = 0;
        } else if (this.x + this.width > CONFIG.CANVAS_WIDTH) {
            this.x = CONFIG.CANVAS_WIDTH - this.width;
            this.velocityX = 0;
        }
        
        this.checkSnowballInteraction(snowballs);
    }
    
    checkSnowballInteraction(snowballs) {
        const playerRect = this.getCollisionRect();
        
        snowballs.forEach(snowball => {
            if (!snowball.active) return;
            
            const snowballRect = snowball.getCollisionRect();
            
            if (Utils.rectCollision(playerRect, snowballRect)) {
                if (!snowball.isRolling) {
                    const playerBottom = this.y + this.height;
                    const snowballBottom = snowball.y + snowball.height;
                    
                    const verticalDiff = Math.abs(playerBottom - snowballBottom);
                    
                    if (verticalDiff < 30) {
                        const playerCenter = this.x + this.width / 2;
                        const snowballCenter = snowball.x + snowball.width / 2;
                        
                        const direction = playerCenter < snowballCenter ? 1 : -1;
                        
                        snowball.y = playerBottom - snowball.height;
                        
                        snowball.startRolling(direction);
                    }
                }
            }
        });
    }
    
    draw(ctx) {
        Utils.drawSnowman(
            ctx,
            this.x,
            this.y,
            this.width,
            this.height,
            this.facingRight,
            this.isInvincible,
            this.isDead,
            this.walkFrame,
            this.isJumping
        );
        
        if (this.hasBigShot) {
            ctx.save();
            ctx.strokeStyle = 'rgba(78, 205, 196, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.width / 2 + 10,
                0, Math.PI * 2
            );
            ctx.stroke();
            ctx.restore();
        }
        
        if (this.speedMultiplier > 1) {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 230, 109, 0.3)';
            for (let i = 0; i < 3; i++) {
                const offsetX = (this.facingRight ? -1 : 1) * (i * 10 + 5);
                ctx.beginPath();
                ctx.arc(
                    this.x + this.width / 2 + offsetX,
                    this.y + this.height / 2,
                    5 - i,
                    0, Math.PI * 2
                );
                ctx.fill();
            }
            ctx.restore();
        }
    }
}
