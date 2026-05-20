class Player {
    constructor(characterId, canvasHeight) {
        const char = CHARACTERS[characterId];
        this.character = characterId;
        this.width = 60;
        this.height = 60;
        this.x = 100;
        this.groundY = canvasHeight - 60 - this.height;
        this.y = this.groundY;
        this.velocityX = 0;
        this.velocityY = 0;
        this.health = char.maxHealth;
        this.maxHealth = char.maxHealth;
        this.moveSpeed = char.moveSpeed;
        this.jumpHeight = char.jumpHeight;
        this.doubleJumpCooldown = char.doubleJumpCooldown;
        this.scoreMultiplier = char.scoreMultiplier;
        this.isGrounded = true;
        this.isJumping = false;
        this.isDucking = false;
        this.canDoubleJump = false;
        this.hasDoubleJumped = false;
        this.doubleJumpTimer = 0;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.jumpPhase = 0;
        this.animFrame = 0;
    }
    
    update(dt, input, canvasWidth, canvasHeight) {
        this.groundY = canvasHeight - 60 - this.height;
        
        if (this.invincible) {
            this.invincibleTimer -= dt;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }
        
        if (this.doubleJumpTimer > 0) {
            this.doubleJumpTimer -= dt;
            if (this.doubleJumpTimer <= 0) {
                this.canDoubleJump = true;
            }
        }
        
        this.velocityX = 0;
        if (input.isLeft()) {
            this.velocityX = -this.moveSpeed * 60 * dt;
        }
        if (input.isRight()) {
            this.velocityX = this.moveSpeed * 60 * dt;
        }
        
        this.isDucking = input.isDuck() && this.isGrounded;
        
        if (input.consumeJump()) {
            if (this.isGrounded) {
                this.jump();
            } else if (this.canDoubleJump && !this.hasDoubleJumped) {
                this.doubleJump();
            }
        }
        
        if (!this.isGrounded) {
            this.velocityY += 25 * dt;
        }
        
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        this.x = Helpers.clamp(this.x, 0, canvasWidth - this.width);
        
        const minY = 20;
        if (this.y < minY) {
            this.y = minY;
            if (this.velocityY < 0) {
                this.velocityY = 0;
            }
        }
        
        if (this.y >= this.groundY) {
            this.y = this.groundY;
            this.velocityY = 0;
            this.isGrounded = true;
            this.isJumping = false;
            this.hasDoubleJumped = false;
            this.canDoubleJump = false;
            this.doubleJumpTimer = this.doubleJumpCooldown;
        }
        
        if (this.isJumping) {
            this.jumpPhase += dt * 5;
        }
        
        this.animFrame += dt * 10;
    }
    
    jump() {
        this.velocityY = -this.jumpHeight;
        this.isGrounded = false;
        this.isJumping = true;
        this.jumpPhase = 0;
        this.hasDoubleJumped = false;
        this.doubleJumpTimer = this.doubleJumpCooldown;
    }
    
    doubleJump() {
        this.velocityY = -this.jumpHeight * 0.7;
        this.hasDoubleJumped = true;
        this.canDoubleJump = false;
    }
    
    takeDamage(amount) {
        if (this.invincible) return false;
        
        this.health -= amount;
        this.invincible = true;
        this.invincibleTimer = 0.8;
        
        if (this.velocityY < 0) {
            this.velocityY = 5;
        }
        
        return this.health <= 0;
    }
    
    getHitbox() {
        if (this.isDucking) {
            return {
                x: this.x + 5,
                y: this.y + this.height * 0.3,
                width: this.width - 10,
                height: this.height * 0.7
            };
        }
        return {
            x: this.x + 5,
            y: this.y + 2,
            width: this.width - 10,
            height: this.height - 4
        };
    }
    
    draw(ctx, renderer) {
        if (this.invincible && Math.floor(this.invincibleTimer * 10) % 2 === 0) {
            return;
        }
        
        renderer.drawPlayer(this);
    }
    
    reset(canvasHeight) {
        const char = CHARACTERS[this.character];
        this.y = canvasHeight - 60 - this.height;
        this.velocityX = 0;
        this.velocityY = 0;
        this.health = char.maxHealth;
        this.isGrounded = true;
        this.isJumping = false;
        this.isDucking = false;
        this.canDoubleJump = false;
        this.hasDoubleJumped = false;
        this.doubleJumpTimer = 0;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.x = 100;
    }
}
