import { CONFIG, CHARACTER_CONFIGS } from './config_v2.js';

export class Player {
    constructor(characterType, x, y) {
        this.type = characterType;
        this.stats = CHARACTER_CONFIGS[characterType];
        
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 50;
        this.originalHeight = 50;
        this.crouchHeight = 30;
        
        this.vx = 0;
        this.vy = 0;
        
        this.health = this.stats.maxHealth;
        this.maxHealth = this.stats.maxHealth;
        
        this.isGrounded = false;
        this.isCrouching = false;
        this.facingRight = true;
        
        this.jumpCount = 0;
        this.maxJumps = this.stats.canDoubleJump ? 2 : 1;
        
        this.shieldActive = false;
        this.shieldTimer = 0;
        this.shieldCooldown = 0;
        this.shieldDuration = this.stats.shieldDuration;
        
        this.invincible = false;
        this.invincibleTimer = 0;
        
        this.trail = [];
        this.trailMaxLength = 8;
        
        this.animFrame = 0;
        this.animTimer = 0;
    }

    update(input, platforms) {
        if (this.shieldActive) {
            this.shieldTimer -= 16;
            if (this.shieldTimer <= 0) {
                this.shieldActive = false;
                this.shieldCooldown = CONFIG.SHIELD_COOLDOWN;
            }
        }
        
        if (this.shieldCooldown > 0) {
            this.shieldCooldown -= 16;
        }
        
        if (this.invincible) {
            this.invincibleTimer -= 16;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }
        
        const wasCrouching = this.isCrouching;
        this.isCrouching = input.isDown() && this.isGrounded;
        const newHeight = this.isCrouching ? this.crouchHeight : this.originalHeight;
        
        if (wasCrouching !== this.isCrouching && this.isGrounded) {
            this.y += this.height - newHeight;
        }
        this.height = newHeight;
        
        let moveSpeed = this.stats.speed;
        if (this.isCrouching) {
            moveSpeed *= 0.5;
        }
        
        if (input.isLeft()) {
            this.vx = -moveSpeed;
            this.facingRight = false;
        } else if (input.isRight()) {
            this.vx = moveSpeed;
            this.facingRight = true;
        } else {
            this.vx *= CONFIG.FRICTION;
            if (Math.abs(this.vx) < 0.1) this.vx = 0;
        }
        
        if (input.isJumpPressed() && this.jumpCount < this.maxJumps) {
            this.vy = -this.stats.jumpPower;
            this.jumpCount++;
            this.isGrounded = false;
        }
        
        if (input.isActionPressed() && !this.shieldActive && this.shieldCooldown <= 0) {
            this.activateShield();
        }
        
        this.vy += CONFIG.GRAVITY;
        if (this.vy > CONFIG.MAX_FALL_SPEED) {
            this.vy = CONFIG.MAX_FALL_SPEED;
        }
        
        this.x += this.vx;
        this.y += this.vy;
        
        this.isGrounded = false;
        for (const platform of platforms) {
            this.checkPlatformCollision(platform);
        }
        
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > CONFIG.GAME_WIDTH) {
            this.x = CONFIG.GAME_WIDTH - this.width;
        }
        
        if (Math.abs(this.vx) > 0.5 || Math.abs(this.vy) > 1) {
            this.trail.push({ x: this.x + this.width / 2, y: this.y + this.height / 2, alpha: 1 });
            if (this.trail.length > this.trailMaxLength) {
                this.trail.shift();
            }
        } else if (this.trail.length > 0) {
            this.trail.shift();
        }
        
        this.trail.forEach((t, i) => {
            t.alpha = (i + 1) / this.trailMaxLength * 0.4;
        });
        
        this.animTimer += 16;
        if (this.animTimer > 100) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
    }

    checkPlatformCollision(platform) {
        const playerBottom = this.y + this.height;
        const playerRight = this.x + this.width;
        const platformBottom = platform.y + platform.height;
        const platformRight = platform.x + platform.width;
        
        if (this.vy >= 0 &&
            playerBottom >= platform.y &&
            this.y < platform.y &&
            playerRight > platform.x + 5 &&
            this.x < platformRight - 5) {
            this.y = platform.y - this.height;
            this.vy = 0;
            this.isGrounded = true;
            this.jumpCount = 0;
        }
    }

    activateShield() {
        this.shieldActive = true;
        this.shieldTimer = this.shieldDuration;
    }

    takeDamage(amount) {
        if (this.invincible || this.shieldActive) return;
        
        const actualDamage = Math.max(1, amount - this.stats.defense);
        this.health -= actualDamage;
        this.invincible = true;
        this.invincibleTimer = CONFIG.INVINCIBLE_TIME;
        
        return this.health <= 0;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    isDead() {
        return this.health <= 0;
    }

    getShieldPercent() {
        if (this.shieldActive) {
            return this.shieldTimer / this.shieldDuration;
        }
        if (this.shieldCooldown > 0) {
            return 0;
        }
        return 1;
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
        };
    }

    serialize() {
        return {
            type: this.type,
            x: this.x,
            y: this.y,
            health: this.health,
            maxHealth: this.maxHealth,
            shieldCooldown: this.shieldCooldown,
        };
    }

    static deserialize(data) {
        const player = new Player(data.type, data.x, data.y);
        player.health = data.health;
        player.maxHealth = data.maxHealth;
        player.shieldCooldown = data.shieldCooldown || 0;
        return player;
    }
}
