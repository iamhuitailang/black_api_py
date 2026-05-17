import { CONFIG, MONSTER_TYPES, MONSTER_CONFIGS } from './config_v2.js';

export class Monster {
    constructor(type, x, y, platform) {
        this.type = type;
        this.stats = MONSTER_CONFIGS[type];
        
        this.x = x;
        this.y = y;
        this.width = this.stats.width;
        this.height = this.stats.height;
        
        this.vx = 0;
        this.vy = 0;
        
        this.health = this.stats.health;
        this.maxHealth = this.stats.health;
        this.damage = this.stats.damage;
        
        this.platform = platform;
        this.startX = x;
        this.patrolRange = this.stats.patrolRange || 150;
        this.facingRight = Math.random() > 0.5;
        
        this.state = 'patrol';
        this.chaseTarget = null;
        this.chaseRange = this.stats.chaseRange || 250;
        
        this.animFrame = 0;
        this.animTimer = 0;
        this.hitFlash = 0;
    }

    update(player, platforms) {
        const playerDist = Math.abs(player.x - this.x);
        const playerYDist = Math.abs(player.y - this.y);
        
        if (this.type === 'chaser' && playerDist < this.chaseRange && playerYDist < 100) {
            this.state = 'chase';
            this.chaseTarget = player;
        } else if (playerDist > this.chaseRange * 1.5) {
            this.state = 'patrol';
            this.chaseTarget = null;
        }
        
        if (this.state === 'chase' && this.chaseTarget) {
            if (this.chaseTarget.x > this.x + this.width / 2) {
                this.vx = this.stats.speed;
                this.facingRight = true;
            } else {
                this.vx = -this.stats.speed;
                this.facingRight = false;
            }
        } else {
            if (this.facingRight) {
                this.vx = this.stats.speed * 0.6;
                if (this.x - this.startX > this.patrolRange) {
                    this.facingRight = false;
                }
            } else {
                this.vx = -this.stats.speed * 0.6;
                if (this.startX - this.x > this.patrolRange) {
                    this.facingRight = true;
                }
            }
        }
        
        if (this.platform) {
            const leftEdge = this.platform.x;
            const rightEdge = this.platform.x + this.platform.width;
            
            if (this.x <= leftEdge) {
                this.x = leftEdge;
                this.facingRight = true;
                this.vx = Math.abs(this.vx);
            } else if (this.x + this.width >= rightEdge) {
                this.x = rightEdge - this.width;
                this.facingRight = false;
                this.vx = -Math.abs(this.vx);
            }
        }
        
        this.vy += CONFIG.GRAVITY;
        if (this.vy > CONFIG.MAX_FALL_SPEED) {
            this.vy = CONFIG.MAX_FALL_SPEED;
        }
        
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.platform) {
            if (this.y + this.height >= this.platform.y && this.vy >= 0) {
                this.y = this.platform.y - this.height;
                this.vy = 0;
            }
        }
        
        this.animTimer += 16;
        if (this.animTimer > 150) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
        
        if (this.hitFlash > 0) {
            this.hitFlash -= 16;
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        this.hitFlash = 200;
        return this.health <= 0;
    }

    checkCollisionWithPlayer(player) {
        const bounds = player.getBounds();
        return this.x < bounds.x + bounds.width &&
               this.x + this.width > bounds.x &&
               this.y < bounds.y + bounds.height &&
               this.y + this.height > bounds.y;
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
            startX: this.startX,
            facingRight: this.facingRight,
            state: this.state,
        };
    }

    static deserialize(data, platform) {
        const monster = new Monster(data.type, data.x, data.y, platform);
        monster.health = data.health;
        monster.startX = data.startX;
        monster.facingRight = data.facingRight;
        monster.state = data.state || 'patrol';
        return monster;
    }
}
