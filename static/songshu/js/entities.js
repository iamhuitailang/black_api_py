class Entity {
    constructor(x, y, width, height) {
        this.id = Utils.generateId();
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.active = true;
        this.onGround = false;
        this.facingRight = true;
    }

    get bounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    intersects(other) {
        return Utils.rectIntersect(this.bounds, other.bounds);
    }

    update(dt) {}
    draw(ctx, cameraX = 0) {}
}

class Player extends Entity {
    constructor(x, y, character = 'qiqi', playerNum = 1) {
        super(x, y, CONFIG.PLAYER.WIDTH, CONFIG.PLAYER.HEIGHT);
        this.playerNum = playerNum;
        this.character = character;
        this.health = CONFIG.PLAYER.MAX_HEALTH;
        this.lives = CONFIG.PLAYER.START_LIVES;
        this.speed = CONFIG.PLAYER.SPEED;
        this.jumpForce = CONFIG.PLAYER.JUMP_FORCE;
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.isCrouching = false;
        this.isHiding = false;
        this.heldItem = null;
        this.isHolding = false;
        this.throwCooldown = 0;
        this.animFrame = 0;
        this.animTimer = 0;
        this.state = 'idle';
        this.flowerCount = 0;
        this.starCount = 0;
        this.isClimbing = false;
        this.ladder = null;
    }

    get colors() {
        if (this.character === 'qiqi') {
            return {
                body: '#8B4513',
                belly: '#DEB887',
                tail: '#654321',
                accent: '#4a2c0a'
            };
        } else {
            return {
                body: '#DEB887',
                belly: '#FFEFD5',
                tail: '#D2B48C',
                accent: '#C4A574'
            };
        }
    }

    update(dt, level) {
        if (!this.active) return;

        const inputDir = Input.getDirection(this.playerNum);
        const isJumping = Input.isJumping(this.playerNum);
        const isAction = Input.isAction(this.playerNum);
        const isCrouching = Input.isCrouching(this.playerNum);
        const isHoldingAction = Input.isHoldingAction(this.playerNum);

        if (this.isInvincible) {
            this.invincibleTimer -= dt;
            if (this.invincibleTimer <= 0) {
                this.isInvincible = false;
            }
        }

        if (this.throwCooldown > 0) {
            this.throwCooldown -= dt;
        }

        this.isCrouching = isCrouching && this.onGround;

        if (!this.isHolding && !this.isHiding) {
            if (inputDir.x !== 0) {
                this.vx = inputDir.x * this.speed;
                this.facingRight = inputDir.x > 0;
                this.state = 'running';
            } else {
                this.vx *= CONFIG.FRICTION;
                if (Math.abs(this.vx) < 0.1) this.vx = 0;
                this.state = this.isCrouching ? 'crouching' : 'idle';
            }
        }

        if (isJumping && this.onGround && !this.isCrouching) {
            this.vy = this.jumpForce;
            this.onGround = false;
            this.state = 'jumping';
            Audio.playJump();
        }

        if (isAction) {
            if (this.heldItem) {
                this.throwItem(level);
            } else if (this.isCrouching) {
                this.hideInBox(level);
            } else {
                this.tryPickupItem(level);
            }
        }

        if (this.isHolding && !isHoldingAction && this.heldItem) {
            this.throwItem(level);
        }

        if (this.isHiding && !isHoldingAction) {
            this.isHiding = false;
        }

        this.vy += CONFIG.GRAVITY;
        this.vy = Math.min(this.vy, CONFIG.MAX_FALL_SPEED);

        this.x += this.vx;
        this.resolveCollisions(level, 'x');
        this.y += this.vy;
        this.resolveCollisions(level, 'y');

        this.x = Utils.clamp(this.x, 0, level.width - this.width);

        if (this.y > level.height + 100) {
            this.takeDamage(this.health);
        }

        if (this.heldItem) {
            this.heldItem.x = this.x + (this.facingRight ? this.width - 5 : -this.heldItem.width + 5);
            this.heldItem.y = this.y - this.heldItem.height + 10;
            this.heldItem.vx = 0;
            this.heldItem.vy = 0;
        }

        this.animTimer += dt;
        if (this.animTimer > 100) {
            this.animFrame = (this.animFrame + 1) % 4;
            this.animTimer = 0;
        }
    }

    resolveCollisions(level, axis) {
        const tiles = level.getTilesNear(this.x, this.y, this.width, this.height);
        
        for (const tile of tiles) {
            if (tile.solid && Utils.rectIntersect(this.bounds, tile.bounds)) {
                if (axis === 'x') {
                    if (this.vx > 0) {
                        this.x = tile.x - this.width;
                    } else if (this.vx < 0) {
                        this.x = tile.x + tile.width;
                    }
                    this.vx = 0;
                } else {
                    if (this.vy > 0) {
                        this.y = tile.y - this.height;
                        this.vy = 0;
                        this.onGround = true;
                    } else if (this.vy < 0) {
                        this.y = tile.y + tile.height;
                        this.vy = 0;
                    }
                }
            }
        }

        if (axis === 'y' && this.vy > 0.5) {
            this.onGround = false;
        }
    }

    tryPickupItem(level) {
        const pickupRange = {
            x: this.x - 10,
            y: this.y - 10,
            width: this.width + 20,
            height: this.height + 10
        };

        for (const item of level.items) {
            if (item.active && item.pickupable && Utils.rectIntersect(pickupRange, item.bounds)) {
                if (item.type === 'flower' || item.type === 'star' || item.type === 'pinecone') {
                    this.collectItem(item);
                    level.removeItem(item);
                    Audio.playPickup();
                } else {
                    this.heldItem = item;
                    this.isHolding = true;
                    item.isHeld = true;
                    this.state = 'holding';
                    Audio.playPickup();
                }
                break;
            }
        }
    }

    throwItem(level) {
        if (!this.heldItem || this.throwCooldown > 0) return;

        const item = this.heldItem;
        item.isHeld = false;
        item.x = this.x + (this.facingRight ? this.width : -item.width);
        item.y = this.y + 5;
        item.vx = (this.facingRight ? 1 : -1) * CONFIG.PLAYER.THROW_POWER;
        item.vy = CONFIG.PLAYER.THROW_ANGLE * CONFIG.PLAYER.THROW_POWER;
        item.isThrown = true;
        item.thrownBy = this;
        item.throwTime = 0;

        this.heldItem = null;
        this.isHolding = false;
        this.throwCooldown = 200;
        this.state = 'idle';
        Audio.playThrow();
    }

    hideInBox(level) {
        const nearbyBox = level.items.find(item => 
            item.active && 
            (item.type === 'wood_box' || item.type === 'iron_box') &&
            Utils.distance(this.x + this.width/2, this.y + this.height/2, 
                          item.x + item.width/2, item.y + item.height/2) < 50
        );

        if (nearbyBox) {
            this.isHiding = true;
            this.state = 'hiding';
        }
    }

    collectItem(item) {
        if (item.type === 'flower') {
            this.flowerCount++;
            if (this.flowerCount >= 50) {
                this.flowerCount = 0;
                this.lives++;
            }
        } else if (item.type === 'star') {
            this.starCount++;
            if (this.starCount >= 10) {
                this.starCount = 0;
                this.lives++;
            }
        } else if (item.type === 'pinecone') {
            this.health = Math.min(this.health + 1, CONFIG.PLAYER.MAX_HEALTH);
        }
    }

    takeDamage(amount = 1) {
        if (this.isInvincible || this.isHiding) return;

        this.health -= amount;
        this.isInvincible = true;
        this.invincibleTimer = CONFIG.PLAYER.INVINCIBLE_TIME;
        Audio.playPlayerHurt();

        if (this.heldItem) {
            this.heldItem.isHeld = false;
            this.heldItem = null;
            this.isHolding = false;
        }

        if (this.health <= 0) {
            this.lives--;
            if (this.lives > 0) {
                this.health = CONFIG.PLAYER.MAX_HEALTH;
                this.respawn();
            } else {
                this.active = false;
            }
        }
    }

    respawn() {
        this.x = 100;
        this.y = 100;
        this.vx = 0;
        this.vy = 0;
        this.isInvincible = true;
        this.invincibleTimer = 3000;
    }

    draw(ctx, cameraX = 0) {
        if (!this.active) return;

        const screenX = this.x - cameraX;
        const screenY = this.y;

        if (this.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
            return;
        }

        ctx.save();
        
        if (!this.facingRight) {
            ctx.translate(screenX + this.width / 2, 0);
            ctx.scale(-1, 1);
            ctx.translate(-(screenX + this.width / 2), 0);
        }

        if (this.isHiding) {
            ctx.fillStyle = CONFIG.COLORS.neonBlue;
            ctx.shadowColor = CONFIG.COLORS.neonBlue;
            ctx.shadowBlur = 10;
            ctx.fillRect(screenX, screenY + 10, this.width, this.height - 10);
            ctx.shadowBlur = 0;
            ctx.restore();
            return;
        }

        const colors = this.colors;
        
        ctx.fillStyle = colors.body;
        ctx.shadowColor = CONFIG.COLORS.neonPink;
        ctx.shadowBlur = 5;
        
        const bodyY = this.isCrouching ? screenY + 10 : screenY;
        const bodyHeight = this.isCrouching ? this.height - 10 : this.height;
        
        Utils.drawRoundedRect(ctx, screenX + 4, bodyY + 8, this.width - 8, bodyHeight - 12, 8);
        ctx.fill();

        ctx.fillStyle = colors.belly;
        ctx.shadowBlur = 0;
        Utils.drawRoundedRect(ctx, screenX + 8, bodyY + 20, this.width - 16, bodyHeight - 28, 6);
        ctx.fill();

        ctx.fillStyle = colors.body;
        ctx.beginPath();
        ctx.arc(screenX + this.width / 2, bodyY + 8, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colors.accent;
        ctx.beginPath();
        ctx.ellipse(screenX + 8, bodyY + 2, 4, 6, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(screenX + this.width - 8, bodyY + 2, 4, 6, 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(screenX + this.width / 2 - 4, bodyY + 6, 3, 0, Math.PI * 2);
        ctx.arc(screenX + this.width / 2 + 4, bodyY + 6, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(screenX + this.width / 2 - 3, bodyY + 6, 1.5, 0, Math.PI * 2);
        ctx.arc(screenX + this.width / 2 + 5, bodyY + 6, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(screenX + this.width / 2, bodyY + 12, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colors.tail;
        ctx.shadowColor = CONFIG.COLORS.neonBlue;
        ctx.shadowBlur = 8;
        const tailWag = Math.sin(this.animFrame * 0.8) * 3;
        ctx.beginPath();
        ctx.moveTo(screenX + 2, bodyY + 20);
        ctx.quadraticCurveTo(screenX - 10 + tailWag, bodyY + 15, screenX - 8 + tailWag, bodyY + 5);
        ctx.quadraticCurveTo(screenX - 5, bodyY, screenX, bodyY + 15);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (this.state === 'running' && this.onGround) {
            const legOffset = Math.sin(this.animFrame * Math.PI / 2) * 4;
            ctx.fillStyle = colors.accent;
            ctx.fillRect(screenX + 6, bodyY + bodyHeight - 8, 6, 8 + legOffset);
            ctx.fillRect(screenX + this.width - 12, bodyY + bodyHeight - 8, 6, 8 - legOffset);
        } else {
            ctx.fillStyle = colors.accent;
            ctx.fillRect(screenX + 6, bodyY + bodyHeight - 8, 6, 8);
            ctx.fillRect(screenX + this.width - 12, bodyY + bodyHeight - 8, 6, 8);
        }

        ctx.restore();

        if (this.heldItem) {
            this.heldItem.draw(ctx, cameraX);
        }
    }
}

class Enemy extends Entity {
    constructor(x, y, type) {
        const config = CONFIG.ENEMIES[type];
        super(x, y, config.width, config.height);
        this.type = type;
        this.health = config.health;
        this.maxHealth = config.health;
        this.speed = config.speed;
        this.damage = config.damage;
        this.score = config.score;
        this.color = config.color;
        this.flying = config.flying || false;
        this.patrolLeft = x - 100;
        this.patrolRight = x + 100;
        this.direction = 1;
        this.animFrame = 0;
        this.animTimer = 0;
        this.isDead = false;
        this.deathTimer = 0;
        this.attackCooldown = 0;
        this.startY = y;
    }

    update(dt, level, players) {
        if (this.isDead) {
            this.deathTimer += dt;
            this.y -= 2;
            if (this.deathTimer > 500) {
                this.active = false;
            }
            return;
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }

        if (this.flying) {
            this.vy = Math.sin(Date.now() / 500) * 1.5;
            this.x += this.vx;
            this.y += this.vy;
        } else {
            this.vy += CONFIG.GRAVITY;
            this.vy = Math.min(this.vy, CONFIG.MAX_FALL_SPEED);
            
            this.x += this.vx;
            this.y += this.vy;

            const groundY = level.getGroundY(this.x + this.width / 2);
            if (groundY !== null && this.y + this.height > groundY) {
                this.y = groundY - this.height;
                this.vy = 0;
                this.onGround = true;
            } else {
                this.onGround = false;
            }
        }

        this.patrol(level);

        const tiles = level.getTilesNear(this.x, this.y, this.width, this.height);
        for (const tile of tiles) {
            if (tile.solid && Utils.rectIntersect(this.bounds, tile.bounds)) {
                if (this.vx > 0) {
                    this.x = tile.x - this.width;
                    this.direction = -1;
                } else if (this.vx < 0) {
                    this.x = tile.x + tile.width;
                    this.direction = 1;
                }
                this.vx = 0;
            }
        }

        for (const player of players) {
            if (player.active && this.intersects(player)) {
                if (player.vy > 0 && player.y + player.height < this.y + this.height / 2) {
                    this.takeDamage(1);
                    player.vy = -8;
                } else {
                    player.takeDamage(this.damage);
                }
            }
        }

        this.animTimer += dt;
        if (this.animTimer > 150) {
            this.animFrame = (this.animFrame + 1) % 4;
            this.animTimer = 0;
        }
    }

    patrol(level) {
        const difficulty = level.difficultyMultiplier || 1;
        this.vx = this.direction * this.speed * difficulty;
        this.facingRight = this.direction > 0;

        if (this.x <= this.patrolLeft) {
            this.direction = 1;
        } else if (this.x >= this.patrolRight) {
            this.direction = -1;
        }

        if (!this.flying && this.onGround) {
            const nextX = this.x + this.vx + (this.direction > 0 ? this.width : 0);
            const groundAhead = level.getGroundY(nextX);
            if (groundAhead === null || this.y + this.height < groundAhead - 10) {
                this.direction *= -1;
            }
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        Audio.playHit();
        
        if (this.health <= 0) {
            this.isDead = true;
            this.deathTimer = 0;
            Audio.playEnemyDeath();
        }
    }

    draw(ctx, cameraX = 0) {
        const screenX = this.x - cameraX;
        const screenY = this.y;

        ctx.save();

        if (this.isDead) {
            ctx.globalAlpha = Math.max(0, 1 - this.deathTimer / 500);
        }

        if (!this.facingRight) {
            ctx.translate(screenX + this.width / 2, 0);
            ctx.scale(-1, 1);
            ctx.translate(-(screenX + this.width / 2), 0);
        }

        ctx.fillStyle = this.color;
        ctx.shadowColor = CONFIG.COLORS.neonRed;
        ctx.shadowBlur = 8;

        switch (this.type) {
            case 'rat':
                this.drawRat(ctx, screenX, screenY);
                break;
            case 'dog':
                this.drawDog(ctx, screenX, screenY);
                break;
            case 'bee':
                this.drawBee(ctx, screenX, screenY);
                break;
            case 'eagle':
                this.drawEagle(ctx, screenX, screenY);
                break;
            case 'tank':
                this.drawTank(ctx, screenX, screenY);
                break;
            case 'boss_cat':
                this.drawBossCat(ctx, screenX, screenY);
                break;
        }

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    drawRat(ctx, x, y) {
        Utils.drawRoundedRect(ctx, x, y + 5, this.width, this.height - 5, 5);
        ctx.fill();
        
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.arc(x + 5, y + 3, 5, 0, Math.PI * 2);
        ctx.arc(x + this.width - 5, y + 3, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(x + this.width - 8, y + 10, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#696969';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y + 15);
        ctx.quadraticCurveTo(x - 10, y + 10, x - 15, y + 15);
        ctx.stroke();
    }

    drawDog(ctx, x, y) {
        Utils.drawRoundedRect(ctx, x, y + 8, this.width, this.height - 8, 6);
        ctx.fill();
        
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(x + this.width - 10, y + 8, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.moveTo(x + this.width - 15, y);
        ctx.lineTo(x + this.width - 5, y - 5);
        ctx.lineTo(x + this.width - 5, y + 5);
        ctx.fill();
        
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(x + this.width - 8, y + 6, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBee(ctx, x, y) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(x + this.width / 2, y + this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.fillRect(x + 5, y + 5, this.width - 10, 4);
        ctx.fillRect(x + 5, y + 12, this.width - 10, 4);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        const wingOffset = Math.sin(this.animFrame * Math.PI / 2) * 2;
        ctx.beginPath();
        ctx.ellipse(x + this.width / 2 - 5, y - 5 + wingOffset, 8, 5, -0.5, 0, Math.PI * 2);
        ctx.ellipse(x + this.width / 2 + 5, y - 5 - wingOffset, 8, 5, 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawEagle(ctx, x, y) {
        ctx.fillStyle = '#4682B4';
        ctx.beginPath();
        ctx.ellipse(x + this.width / 2, y + this.height / 2, this.width / 2, this.height / 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const wingY = Math.sin(this.animFrame * Math.PI / 2) * 5;
        ctx.beginPath();
        ctx.moveTo(x + 5, y + 15);
        ctx.lineTo(x - 15, y + 5 + wingY);
        ctx.lineTo(x + 10, y + 20);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(x + this.width - 5, y + 15);
        ctx.lineTo(x + this.width + 15, y + 5 - wingY);
        ctx.lineTo(x + this.width - 10, y + 20);
        ctx.fill();
        
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(x + this.width - 15, y + 12, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(x + this.width - 8, y + 10);
        ctx.lineTo(x + this.width + 5, y + 12);
        ctx.lineTo(x + this.width - 8, y + 14);
        ctx.fill();
    }

    drawTank(ctx, x, y) {
        ctx.fillStyle = '#2F4F2F';
        ctx.fillRect(x, y + 15, this.width, this.height - 15);
        
        ctx.fillStyle = '#556B2F';
        Utils.drawRoundedRect(ctx, x + 10, y, this.width - 20, 20, 5);
        ctx.fill();
        
        ctx.fillStyle = '#2F4F2F';
        ctx.fillRect(x + this.width - 10, y + 8, 20, 6);
        
        ctx.fillStyle = '#000';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(x + 5 + i * 10, y + this.height - 3, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawBossCat(ctx, x, y) {
        ctx.fillStyle = '#FF8C00';
        Utils.drawRoundedRect(ctx, x, y, this.width, this.height, 20);
        ctx.fill();
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(x + 10, y);
        ctx.lineTo(x + 20, y - 20);
        ctx.lineTo(x + 30, y);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(x + this.width - 10, y);
        ctx.lineTo(x + this.width - 20, y - 20);
        ctx.lineTo(x + this.width - 30, y);
        ctx.fill();
        
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(x + 25, y + 30, 8, 0, Math.PI * 2);
        ctx.arc(x + this.width - 25, y + 30, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + 25, y + 30, 4, 0, Math.PI * 2);
        ctx.arc(x + this.width - 25, y + 30, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#8B0000';
        ctx.beginPath();
        ctx.ellipse(x + this.width / 2, y + 45, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 5, y + 50);
        ctx.lineTo(x + 30, y + 55);
        ctx.moveTo(x + 5, y + 60);
        ctx.lineTo(x + 30, y + 60);
        ctx.moveTo(x + this.width - 5, y + 50);
        ctx.lineTo(x + this.width - 30, y + 55);
        ctx.moveTo(x + this.width - 5, y + 60);
        ctx.lineTo(x + this.width - 30, y + 60);
        ctx.stroke();

        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y - 15, this.width, 8);
        ctx.fillStyle = healthPercent > 0.3 ? CONFIG.COLORS.neonGreen : CONFIG.COLORS.neonRed;
        ctx.fillRect(x, y - 15, this.width * healthPercent, 8);
    }
}

class Item extends Entity {
    constructor(x, y, type) {
        const sizes = {
            wood_box: { w: 32, h: 32 },
            iron_box: { w: 36, h: 36 },
            apple: { w: 24, h: 24 },
            bomb: { w: 28, h: 28 },
            flower: { w: 20, h: 20 },
            star: { w: 22, h: 22 },
            pinecone: { w: 22, h: 24 }
        };
        const size = sizes[type] || { w: 30, h: 30 };
        super(x, y, size.w, size.h);
        
        this.type = type;
        this.config = CONFIG.ITEMS[type] || {};
        this.pickupable = true;
        this.isHeld = false;
        this.isThrown = false;
        this.thrownBy = null;
        this.throwTime = 0;
        this.exploded = false;
        this.explodeTimer = type === 'bomb' ? 3000 : 0;
        this.animFrame = 0;
        this.animTimer = 0;
        this.bobOffset = 0;
    }

    update(dt, level, players) {
        if (!this.active || this.isHeld) return;

        this.animTimer += dt;
        if (this.animTimer > 200) {
            this.animFrame = (this.animFrame + 1) % 2;
            this.animTimer = 0;
        }

        this.bobOffset = Math.sin(Date.now() / 300) * 3;

        if (this.isThrown) {
            this.throwTime += dt;
            
            this.vy += CONFIG.GRAVITY;
            this.x += this.vx;
            this.y += this.vy;
            
            const tiles = level.getTilesNear(this.x, this.y, this.width, this.height);
            for (const tile of tiles) {
                if (tile.solid && Utils.rectIntersect(this.bounds, tile.bounds)) {
                    if (this.type === 'bomb') {
                        this.explode(level);
                        return;
                    }
                    this.vx = 0;
                    this.vy = 0;
                    this.isThrown = false;
                    break;
                }
            }

            for (const enemy of level.enemies) {
                if (enemy.active && !enemy.isDead && this.intersects(enemy)) {
                    const damage = this.config.damage || 1;
                    enemy.takeDamage(damage);
                    
                    if (this.type === 'bomb') {
                        this.explode(level);
                        return;
                    }
                    
                    this.isThrown = false;
                    this.vx = 0;
                    this.vy = 0;
                    break;
                }
            }

            if (this.throwTime > 2000) {
                this.isThrown = false;
                this.vx = 0;
                this.vy = 0;
            }
        } else if (this.type !== 'flower' && this.type !== 'star' && this.type !== 'pinecone') {
            this.vy += CONFIG.GRAVITY;
            this.y += this.vy;
            
            const groundY = level.getGroundY(this.x + this.width / 2);
            if (groundY !== null && this.y + this.height > groundY) {
                this.y = groundY - this.height;
                this.vy = 0;
            }
        }

        if (this.type === 'bomb' && this.explodeTimer > 0) {
            this.explodeTimer -= dt;
            if (this.explodeTimer <= 0 && !this.exploded) {
                this.explode(level);
            }
        }

        if (this.type === 'flower' || this.type === 'star' || this.type === 'pinecone') {
            for (const player of players) {
                if (player.active && this.intersects(player)) {
                    player.collectItem(this);
                    this.active = false;
                    Audio.playPickup();
                    break;
                }
            }
        }
    }

    explode(level) {
        if (this.exploded) return;
        
        this.exploded = true;
        this.active = false;
        Audio.playExplosion();

        const explosionRadius = 80;
        for (const enemy of level.enemies) {
            if (enemy.active && !enemy.isDead) {
                const dist = Utils.distance(
                    this.x + this.width / 2, this.y + this.height / 2,
                    enemy.x + enemy.width / 2, enemy.y + enemy.height / 2
                );
                if (dist < explosionRadius) {
                    enemy.takeDamage(3);
                }
            }
        }

        for (const player of level.players) {
            if (player.active && player !== this.thrownBy) {
                const dist = Utils.distance(
                    this.x + this.width / 2, this.y + this.height / 2,
                    player.x + player.width / 2, player.y + player.height / 2
                );
                if (dist < explosionRadius) {
                    player.takeDamage(1);
                }
            }
        }

        level.addParticles(Utils.particleBurst(
            this.x + this.width / 2,
            this.y + this.height / 2,
            CONFIG.COLORS.neonOrange || '#ff6600',
            20
        ));
    }

    draw(ctx, cameraX = 0) {
        if (!this.active) return;

        const screenX = this.x - cameraX;
        const screenY = this.y + this.bobOffset;

        ctx.save();

        switch (this.type) {
            case 'wood_box':
                this.drawWoodBox(ctx, screenX, screenY);
                break;
            case 'iron_box':
                this.drawIronBox(ctx, screenX, screenY);
                break;
            case 'apple':
                this.drawApple(ctx, screenX, screenY);
                break;
            case 'bomb':
                this.drawBomb(ctx, screenX, screenY);
                break;
            case 'flower':
                this.drawFlower(ctx, screenX, screenY);
                break;
            case 'star':
                this.drawStar(ctx, screenX, screenY);
                break;
            case 'pinecone':
                this.drawPinecone(ctx, screenX, screenY);
                break;
        }

        ctx.restore();
    }

    drawWoodBox(ctx, x, y) {
        ctx.fillStyle = '#8B4513';
        ctx.shadowColor = CONFIG.COLORS.neonOrange || '#ff8800';
        ctx.shadowBlur = 8;
        ctx.fillRect(x, y, this.width, this.height);
        
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, this.width - 4, this.height - 4);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + this.width, y + this.height);
        ctx.moveTo(x + this.width, y);
        ctx.lineTo(x, y + this.height);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    drawIronBox(ctx, x, y) {
        const gradient = ctx.createLinearGradient(x, y, x, y + this.height);
        gradient.addColorStop(0, '#A0A0A0');
        gradient.addColorStop(0.5, '#708090');
        gradient.addColorStop(1, '#505050');
        
        ctx.fillStyle = gradient;
        ctx.shadowColor = CONFIG.COLORS.neonBlue;
        ctx.shadowBlur = 10;
        ctx.fillRect(x, y, this.width, this.height);
        
        ctx.strokeStyle = '#C0C0C0';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, this.width - 4, this.height - 4);
        
        ctx.fillStyle = '#404040';
        const boltSize = 4;
        ctx.fillRect(x + 4, y + 4, boltSize, boltSize);
        ctx.fillRect(x + this.width - 8, y + 4, boltSize, boltSize);
        ctx.fillRect(x + 4, y + this.height - 8, boltSize, boltSize);
        ctx.fillRect(x + this.width - 8, y + this.height - 8, boltSize, boltSize);
        ctx.shadowBlur = 0;
    }

    drawApple(ctx, x, y) {
        ctx.fillStyle = '#FF6347';
        ctx.shadowColor = CONFIG.COLORS.neonRed;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x + this.width / 2, y + this.height / 2 + 2, this.width / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#228B22';
        ctx.fillRect(x + this.width / 2 - 1, y, 3, 8);
        
        ctx.fillStyle = '#32CD32';
        ctx.beginPath();
        ctx.ellipse(x + this.width / 2 + 5, y + 5, 6, 3, 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(x + this.width / 2 - 4, y + this.height / 2 - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    drawBomb(ctx, x, y) {
        ctx.fillStyle = '#2F4F4F';
        ctx.shadowColor = CONFIG.COLORS.neonRed;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x + this.width / 2, y + this.height / 2 + 3, this.width / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#404040';
        ctx.fillRect(x + this.width / 2 - 3, y, 6, 8);
        
        const spark = this.animFrame % 2 === 0;
        ctx.fillStyle = spark ? '#FF4500' : '#FFD700';
        ctx.shadowColor = spark ? '#FF4500' : '#FFD700';
        ctx.beginPath();
        ctx.arc(x + this.width / 2, y - 3, spark ? 5 : 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(x + this.width / 2 - 5, y + this.height / 2 - 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    drawFlower(ctx, x, y) {
        const petalColor = '#FF69B4';
        const centerColor = '#FFD700';
        
        ctx.shadowColor = CONFIG.COLORS.neonPink;
        ctx.shadowBlur = 10;
        
        ctx.fillStyle = petalColor;
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5 + this.animFrame * 0.5;
            const px = x + this.width / 2 + Math.cos(angle) * 6;
            const py = y + this.height / 2 + Math.sin(angle) * 6;
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = centerColor;
        ctx.shadowColor = CONFIG.COLORS.neonYellow;
        ctx.beginPath();
        ctx.arc(x + this.width / 2, y + this.height / 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    drawStar(ctx, x, y) {
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = CONFIG.COLORS.neonYellow;
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const outerAngle = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const innerAngle = outerAngle + Math.PI / 5;
            
            const outerX = x + this.width / 2 + Math.cos(outerAngle) * 10;
            const outerY = y + this.height / 2 + Math.sin(outerAngle) * 10;
            const innerX = x + this.width / 2 + Math.cos(innerAngle) * 4;
            const innerY = y + this.height / 2 + Math.sin(innerAngle) * 4;
            
            if (i === 0) {
                ctx.moveTo(outerX, outerY);
            } else {
                ctx.lineTo(outerX, outerY);
            }
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    drawPinecone(ctx, x, y) {
        ctx.fillStyle = '#8B4513';
        ctx.shadowColor = '#8B4513';
        ctx.shadowBlur = 8;
        
        ctx.beginPath();
        ctx.ellipse(x + this.width / 2, y + this.height / 2, this.width / 2 - 2, this.height / 2 - 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#654321';
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 3; col++) {
                const px = x + 4 + col * 6 + (row % 2) * 3;
                const py = y + 4 + row * 5;
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.shadowBlur = 0;
    }
}

class Particle {
    constructor(x, y, vx, vy, color, size, life, decay) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = life;
        this.decay = decay;
        this.active = true;
    }

    update(dt) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1;
        this.life -= this.decay;
        
        if (this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx, cameraX = 0) {
        if (!this.active) return;
        
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(this.x - cameraX, this.y, this.size * this.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Tile {
    constructor(x, y, width, height, type = 'solid') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.solid = type === 'solid' || type === 'platform';
        this.passable = type === 'platform';
    }

    get bounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    draw(ctx, cameraX, theme) {
        const screenX = this.x - cameraX;
        
        ctx.save();
        
        switch (theme) {
            case 'garden':
                this.drawGarden(ctx, screenX);
                break;
            case 'kitchen':
                this.drawKitchen(ctx, screenX);
                break;
            case 'toyroom':
                this.drawToyRoom(ctx, screenX);
                break;
            case 'lab':
                this.drawLab(ctx, screenX);
                break;
            case 'factory':
                this.drawFactory(ctx, screenX);
                break;
            case 'casino':
                this.drawCasino(ctx, screenX);
                break;
            case 'boss':
                this.drawBoss(ctx, screenX);
                break;
            default:
                this.drawDefault(ctx, screenX);
        }
        
        ctx.restore();
    }

    drawGarden(ctx, x) {
        const gradient = ctx.createLinearGradient(x, this.y, x, this.y + this.height);
        gradient.addColorStop(0, '#2d5a27');
        gradient.addColorStop(0.3, '#1e3d1a');
        gradient.addColorStop(1, '#0f1f0d');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, this.y, this.width, this.height);
        
        ctx.fillStyle = '#3d7a37';
        for (let i = 0; i < this.width; i += 8) {
            ctx.fillRect(x + i, this.y, 2, 5);
        }
    }

    drawKitchen(ctx, x) {
        const gradient = ctx.createLinearGradient(x, this.y, x, this.y + this.height);
        gradient.addColorStop(0, '#e8dcc8');
        gradient.addColorStop(0.5, '#c9b896');
        gradient.addColorStop(1, '#a08060');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, this.y, this.width, this.height);
        
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 1;
        for (let i = 0; i < this.width; i += 20) {
            ctx.beginPath();
            ctx.moveTo(x + i, this.y);
            ctx.lineTo(x + i, this.y + this.height);
            ctx.stroke();
        }
    }

    drawToyRoom(ctx, x) {
        const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181'];
        ctx.fillStyle = colors[Math.floor((this.x + this.y) / 40) % colors.length];
        ctx.fillRect(x, this.y, this.width, this.height);
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, this.y + 2, this.width - 4, this.height - 4);
    }

    drawLab(ctx, x) {
        const gradient = ctx.createLinearGradient(x, this.y, x, this.y + this.height);
        gradient.addColorStop(0, '#4a5568');
        gradient.addColorStop(0.5, '#2d3748');
        gradient.addColorStop(1, '#1a202c');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, this.y, this.width, this.height);
        
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 5;
        ctx.fillRect(x, this.y, this.width, 2);
        ctx.fillRect(x, this.y + this.height - 2, this.width, 2);
        ctx.shadowBlur = 0;
    }

    drawFactory(ctx, x) {
        const gradient = ctx.createLinearGradient(x, this.y, x, this.y + this.height);
        gradient.addColorStop(0, '#6b7280');
        gradient.addColorStop(0.5, '#4b5563');
        gradient.addColorStop(1, '#374151');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, this.y, this.width, this.height);
        
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 1;
        for (let i = 0; i < this.height; i += 10) {
            ctx.beginPath();
            ctx.moveTo(x, this.y + i);
            ctx.lineTo(x + this.width, this.y + i);
            ctx.stroke();
        }
    }

    drawCasino(ctx, x) {
        const isRed = Math.floor((this.x + this.y) / 40) % 2 === 0;
        ctx.fillStyle = isRed ? '#991b1b' : '#1f2937';
        ctx.fillRect(x, this.y, this.width, this.height);
        
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 3;
        ctx.fillRect(x + 2, this.y + 2, 2, 2);
        ctx.fillRect(x + this.width - 4, this.y + 2, 2, 2);
        ctx.shadowBlur = 0;
    }

    drawBoss(ctx, x) {
        const gradient = ctx.createLinearGradient(x, this.y, x, this.y + this.height);
        gradient.addColorStop(0, '#4c1d95');
        gradient.addColorStop(0.5, '#2e1065');
        gradient.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, this.y, this.width, this.height);
        
        ctx.strokeStyle = '#a855f7';
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 5;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 3, this.y + 3, this.width - 6, this.height - 6);
        ctx.shadowBlur = 0;
    }

    drawDefault(ctx, x) {
        ctx.fillStyle = CONFIG.COLORS.ground;
        ctx.fillRect(x, this.y, this.width, this.height);
        
        ctx.fillStyle = CONFIG.COLORS.platform;
        ctx.fillRect(x, this.y, this.width, 4);
    }
}
