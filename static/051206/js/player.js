import { MARIO_STATES, TILE_SIZE, SCORES } from './config.js';
import { MarioSprite, MushroomSprite, FlowerSprite, StarSprite } from './sprite.js';
import { Physics } from './physics.js';

export class Player {
    constructor(ctx, x, y) {
        this.ctx = ctx;
        this.sprite = new MarioSprite(ctx, x, y, MARIO_STATES.SMALL);
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.speed = 5;
        this.jumpForce = -12;
        this.gravity = 0.5;
        this.onGround = false;
        this.facingRight = true;
        this.state = MARIO_STATES.SMALL;
        this.isInvincible = false;
        this.invincibleTime = 0;
        this.isStarPower = false;
        this.starPowerTime = 0;
        this.blinkTimer = 0;
        this.isWalking = false;
    }

    get width() {
        return this.sprite.width;
    }

    get height() {
        return this.sprite.height;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    setState(state) {
        this.state = state;
        this.sprite.setState(state);
    }

    moveLeft() {
        this.vx = -this.speed;
        this.facingRight = false;
        this.isWalking = true;
    }

    moveRight() {
        this.vx = this.speed;
        this.facingRight = true;
        this.isWalking = true;
    }

    jump() {
        if (this.onGround) {
            this.vy = this.jumpForce;
            this.onGround = false;
        }
    }

    update(blocks, level) {
        if (!this.isWalking) {
            this.vx *= 0.8;
            if (Math.abs(this.vx) < 0.1) this.vx = 0;
        }
        this.isWalking = false;

        this.vy += this.gravity;
        if (this.vy > 15) this.vy = 15;

        this.x += this.vx;
        this.handleHorizontalCollisions(blocks);

        this.y += this.vy;
        this.handleVerticalCollisions(blocks, level);

        if (this.x < 0) this.x = 0;

        if (this.isInvincible) {
            this.invincibleTime--;
            this.blinkTimer++;
            if (this.invincibleTime <= 0) {
                this.isInvincible = false;
            }
        }

        if (this.isStarPower) {
            this.starPowerTime--;
            this.blinkTimer++;
            if (this.starPowerTime <= 0) {
                this.isStarPower = false;
            }
        }
    }

    handleHorizontalCollisions(blocks) {
        for (const block of blocks) {
            if (!block.solid) continue;

            if (this.checkCollision(block)) {
                if (this.vx > 0) {
                    this.x = block.x - this.width;
                } else if (this.vx < 0) {
                    this.x = block.x + block.width;
                }
                this.vx = 0;
            }
        }
    }

    handleVerticalCollisions(blocks, level) {
        this.onGround = false;

        for (const block of blocks) {
            if (!block.solid) continue;

            if (this.checkCollision(block)) {
                if (this.vy > 0) {
                    this.y = block.y - this.height;
                    this.vy = 0;
                    this.onGround = true;
                } else if (this.vy < 0) {
                    this.y = block.y + block.height;
                    this.vy = 0;
                    this.handleBlockHit(block, level);
                }
            }
        }
    }

    handleBlockHit(block, level) {
        if (block.type === 'question' && !block.used) {
            block.used = true;
            
            const itemX = block.x;
            const itemY = block.y - TILE_SIZE;
            
            switch (block.item) {
                case 'coin':
                    level.game.addScore(SCORES.COIN);
                    level.game.addCoin();
                    break;
                case 'mushroom':
                    const mushroom = new MushroomSprite(this.ctx, itemX, itemY, 'mushroom');
                    level.addItem(mushroom);
                    break;
                case 'flower':
                    const flower = new FlowerSprite(this.ctx, itemX, itemY);
                    level.addItem(flower);
                    break;
                case 'star':
                    const star = new StarSprite(this.ctx, itemX, itemY);
                    level.addItem(star);
                    break;
            }
        } else if (block.type === 'brick') {
            if (this.state !== MARIO_STATES.SMALL) {
                level.removeBlock(block);
                level.game.addScore(50);
            }
        }
    }

    checkCollision(obj) {
        return this.x < obj.x + obj.width &&
               this.x + this.width > obj.x &&
               this.y < obj.y + obj.height &&
               this.y + this.height > obj.y;
    }

    takeDamage() {
        if (this.isInvincible || this.isStarPower) return false;

        if (this.state === MARIO_STATES.SMALL) {
            return true;
        } else if (this.state === MARIO_STATES.FIRE) {
            this.setState(MARIO_STATES.BIG);
        } else {
            this.setState(MARIO_STATES.SMALL);
        }

        this.isInvincible = true;
        this.invincibleTime = 120;
        return false;
    }

    collectPowerUp(item, level) {
        level.removeItem(item);
        
        if (item instanceof MushroomSprite) {
            if (item.type === 'mushroom') {
                if (this.state === MARIO_STATES.SMALL) {
                    this.setState(MARIO_STATES.BIG);
                    this.y -= TILE_SIZE;
                }
                level.game.addScore(SCORES.MUSHROOM);
            } else if (item.type === 'oneup') {
                level.game.addLife();
            }
        } else if (item instanceof FlowerSprite) {
            this.setState(MARIO_STATES.FIRE);
            level.game.addScore(SCORES.FLOWER);
        } else if (item instanceof StarSprite) {
            this.isStarPower = true;
            this.starPowerTime = 600;
            level.game.addScore(SCORES.STAR);
        }
    }

    stompEnemy(enemy, level) {
        if (enemy instanceof GoombaSprite) {
            enemy.dead = true;
            enemy.deadTimer = 60;
            setTimeout(() => {
                level.removeEnemy(enemy);
            }, 1000);
        } else if (enemy instanceof KoopaSprite && !enemy.shellMode) {
            enemy.shellMode = true;
            enemy.shellVelocity = this.facingRight ? 8 : -8;
        } else if (enemy instanceof KoopaSprite && enemy.shellMode) {
            enemy.shellVelocity = this.facingRight ? 8 : -8;
        }

        this.vy = -8;
        level.game.addScore(SCORES.GOOMBA);
    }

    draw(drawX) {
        const ctx = this.ctx;
        const x = drawX;
        const y = this.y;

        if (this.isInvincible || this.isStarPower) {
            if (this.blinkTimer % 8 < 4) {
                this.drawMario(x, y);
            }
        } else {
            this.drawMario(x, y);
        }
    }

    drawMario(x, y) {
        const ctx = this.ctx;
        ctx.save();
        
        if (!this.facingRight) {
            ctx.translate(x + this.width, y);
            ctx.scale(-1, 1);
            ctx.translate(-x, -y);
        }

        if (this.state === 'small') {
            this.drawSmallMario(x, y);
        } else {
            this.drawBigMario(x, y);
        }

        ctx.restore();
    }

    drawSmallMario(x, y) {
        const ctx = this.ctx;

        ctx.fillStyle = '#e52521';
        ctx.fillRect(x + 2, y + 8, 12, 12);
        
        ctx.fillStyle = '#ffa07a';
        ctx.fillRect(x + 4, y, 10, 10);
        
        ctx.fillStyle = '#e52521';
        ctx.fillRect(x + 2, y - 2, 12, 4);
        
        ctx.fillStyle = '#000';
        ctx.fillRect(x + 10, y + 2, 2, 2);
        
        ctx.fillStyle = '#4a2800';
        ctx.fillRect(x + 6, y + 6, 6, 2);
        
        ctx.fillStyle = '#0000ff';
        ctx.fillRect(x + 2, y + 18, 5, 10);
        ctx.fillRect(x + 9, y + 18, 5, 10);
        
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x, y + 26, 7, 4);
        ctx.fillRect(x + 9, y + 26, 7, 4);
    }

    drawBigMario(x, y) {
        const ctx = this.ctx;

        ctx.fillStyle = '#e52521';
        ctx.fillRect(x + 2, y + 14, 12, 16);
        
        ctx.fillStyle = '#ffa07a';
        ctx.fillRect(x + 4, y + 4, 10, 12);
        
        ctx.fillStyle = '#e52521';
        ctx.fillRect(x + 2, y + 2, 12, 4);
        
        ctx.fillStyle = '#000';
        ctx.fillRect(x + 10, y + 7, 2, 2);
        
        ctx.fillStyle = '#4a2800';
        ctx.fillRect(x + 6, y + 10, 6, 2);
        
        ctx.fillStyle = '#0000ff';
        ctx.fillRect(x, y + 28, 7, 16);
        ctx.fillRect(x + 9, y + 28, 7, 16);
        
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x - 2, y + 42, 8, 4);
        ctx.fillRect(x + 8, y + 42, 8, 4);
        
        if (this.state === 'fire') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x + 2, y + 16, 4, 4);
            ctx.fillRect(x + 10, y + 20, 4, 4);
        }
    }

    getState() {
        return {
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            state: this.state,
            isInvincible: this.isInvincible,
            invincibleTime: this.invincibleTime,
            isStarPower: this.isStarPower,
            starPowerTime: this.starPowerTime,
            facingRight: this.facingRight
        };
    }

    restoreState(state) {
        this.x = state.x;
        this.y = state.y;
        this.vx = state.vx;
        this.vy = state.vy;
        this.setState(state.state);
        this.isInvincible = state.isInvincible;
        this.invincibleTime = state.invincibleTime;
        this.isStarPower = state.isStarPower;
        this.starPowerTime = state.starPowerTime;
        this.facingRight = state.facingRight;
    }
}