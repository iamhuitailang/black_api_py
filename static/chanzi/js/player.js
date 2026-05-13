class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 48;
        this.vx = 0;
        this.vy = 0;
        this.speed = 5;
        this.jumpForce = -14;
        this.gravity = 0.6;
        this.maxFallSpeed = 15;
        
        this.health = 5;
        this.maxHealth = 5;
        this.mana = 100;
        this.maxMana = 100;
        
        this.facingRight = true;
        this.grounded = false;
        this.crouching = false;
        this.invincible = false;
        this.invincibleTimer = 0;
        
        this.attacking = false;
        this.attackTimer = 0;
        this.attackDuration = 15;
        this.attackCooldown = 0;
        
        this.bouncing = false;
        this.bounceTimer = 0;
        
        this.checkpointX = x;
        this.checkpointY = y;
        
        this.animFrame = 0;
        this.animTimer = 0;
    }
    
    restoreState(state) {
        Object.assign(this, state);
    }
    
    getState() {
        return {
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            health: this.health,
            mana: this.mana,
            facingRight: this.facingRight,
            checkpointX: this.checkpointX,
            checkpointY: this.checkpointY
        };
    }
    
    update(level, enemies, traps, items) {
        if (this.invincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }
        
        if (this.bouncing) {
            this.bounceTimer--;
            if (this.bounceTimer <= 0) {
                this.bouncing = false;
            }
        }
        
        if (this.attacking) {
            this.attackTimer--;
            if (this.attackTimer <= 0) {
                this.attacking = false;
            }
        }
        
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }
        
        this.handleMovement(level);
        this.handleJump(level);
        this.handleAttack(level, enemies);
        this.handleCrouch(level);
        
        this.applyGravity(level);
        
        this.checkCollisions(level, enemies, traps, items);
        
        if (this.mana < this.maxMana) {
            this.mana += 0.05;
        }
        
        this.updateAnimation();
    }
    
    handleMovement(level) {
        if (this.bouncing) return;
        
        if (Input.left()) {
            this.vx = -this.speed;
            this.facingRight = false;
        } else if (Input.right()) {
            this.vx = this.speed;
            this.facingRight = true;
        } else {
            this.vx = 0;
        }
        
        const newX = this.x + this.vx;
        if (!this.isCollidingWithTiles(newX, this.y, level)) {
            this.x = newX;
        }
    }
    
    handleJump(level) {
        if ((Input.jumpJustPressed() || (Input.jump() && this.grounded)) && !this.crouching) {
            this.vy = this.jumpForce;
            this.grounded = false;
        }
    }
    
    handleAttack(level, enemies) {
        if (Input.attackJustPressed() && this.attackCooldown <= 0) {
            this.attacking = true;
            this.attackTimer = this.attackDuration;
            this.attackCooldown = 25;
            
            const attackBox = this.getAttackBox();
            
            let hitEnemy = false;
            enemies.forEach(enemy => {
                if (!enemy.dead && Utils.rectCollision(attackBox, enemy)) {
                    if (this.isPogoAttack()) {
                        enemy.takeDamage(2, this.facingRight);
                        this.pogoBounce();
                        hitEnemy = true;
                        AudioSystem.shovelBounce();
                    } else {
                        enemy.takeDamage(1, this.facingRight);
                        hitEnemy = true;
                        AudioSystem.shovelHit();
                    }
                }
            });
            
            level.damageBlocks(attackBox);
            
            if (!hitEnemy) {
                AudioSystem.shovelHit();
            }
        }
    }
    
    handleCrouch(level) {
        if (Input.down() && this.grounded) {
            this.crouching = true;
            this.height = 32;
        } else {
            this.crouching = false;
            this.height = 48;
        }
    }
    
    isPogoAttack() {
        return !this.grounded && Input.down();
    }
    
    pogoBounce() {
        this.vy = -12;
        this.bouncing = true;
        this.bounceTimer = 10;
    }
    
    getAttackBox() {
        const attackWidth = 40;
        const attackHeight = 30;
        let attackX, attackY;
        
        if (this.isPogoAttack()) {
            attackX = this.x - 5;
            attackY = this.y + this.height;
            return {
                x: attackX,
                y: attackY - 10,
                width: this.width + 10,
                height: 20
            };
        }
        
        if (this.facingRight) {
            attackX = this.x + this.width;
        } else {
            attackX = this.x - attackWidth;
        }
        attackY = this.y + 10;
        
        return { x: attackX, y: attackY, width: attackWidth, height: attackHeight };
    }
    
    applyGravity(level) {
        this.vy += this.gravity;
        if (this.vy > this.maxFallSpeed) {
            this.vy = this.maxFallSpeed;
        }
        
        const newY = this.y + this.vy;
        
        if (this.vy > 0) {
            this.grounded = false;
            const groundY = this.findGroundY(newY, level);
            if (groundY !== null) {
                this.y = groundY - this.height;
                this.vy = 0;
                this.grounded = true;
            } else {
                this.y = newY;
            }
        } else {
            if (!this.isCollidingWithTiles(this.x, newY, level)) {
                this.y = newY;
            } else {
                this.vy = 0;
            }
        }
    }
    
    isCollidingWithTiles(x, y, level) {
        const left = Math.floor(x / level.tileSize);
        const right = Math.floor((x + this.width - 1) / level.tileSize);
        const top = Math.floor(y / level.tileSize);
        const bottom = Math.floor((y + this.height - 1) / level.tileSize);
        
        for (let ty = top; ty <= bottom; ty++) {
            for (let tx = left; tx <= right; tx++) {
                if (level.isSolid(tx, ty)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    findGroundY(newY, level) {
        const left = Math.floor(this.x / level.tileSize);
        const right = Math.floor((this.x + this.width - 1) / level.tileSize);
        const bottomTile = Math.floor((newY + this.height - 1) / level.tileSize);
        
        for (let tx = left; tx <= right; tx++) {
            if (level.isSolid(tx, bottomTile)) {
                return bottomTile * level.tileSize;
            }
        }
        return null;
    }
    
    checkCollisions(level, enemies, traps, items) {
        enemies.forEach(enemy => {
            if (!enemy.dead && !this.invincible && Utils.rectCollision(this, enemy)) {
                this.takeDamage(1);
            }
        });
        
        traps.forEach(trap => {
            if (trap.isActive && Utils.rectCollision(this, trap)) {
                if (trap.type === 'spike' || trap.type === 'saw') {
                    this.die();
                } else if (trap.type === 'fire' && !this.invincible) {
                    this.takeDamage(1);
                }
            }
        });
        
        items.forEach((item, index) => {
            if (!item.collected && Utils.rectCollision(this, item)) {
                item.collect(this);
            }
        });
        
        if (this.y > level.height + 100) {
            this.die();
        }
    }
    
    takeDamage(amount) {
        if (this.invincible) return;
        
        this.health -= amount;
        this.invincible = true;
        this.invincibleTimer = 60;
        
        AudioSystem.playerHurt();
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        AudioSystem.playerDeath();
        this.health = 0;
        this.respawn();
    }
    
    respawn() {
        this.x = this.checkpointX;
        this.y = this.checkpointY;
        this.vx = 0;
        this.vy = 0;
        this.health = this.maxHealth;
        this.mana = this.maxMana;
        this.invincible = true;
        this.invincibleTimer = 90;
    }
    
    setCheckpoint(x, y) {
        this.checkpointX = x;
        this.checkpointY = y;
    }
    
    updateAnimation() {
        this.animTimer++;
        if (this.animTimer >= 8) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
    }
    
    draw(ctx, camera) {
        ctx.save();
        
        if (this.invincible && Math.floor(this.invincibleTimer / 4) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        const x = this.x;
        const y = this.y;
        
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(x + 4, y + (this.crouching ? 8 : 0), 24, this.height - (this.crouching ? 8 : 0));
        
        ctx.fillStyle = '#ff00ff';
        ctx.beginPath();
        ctx.arc(x + 16, y + 12, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        const eyeX = this.facingRight ? x + 20 : x + 8;
        ctx.beginPath();
        ctx.arc(eyeX, y + 10, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(eyeX + (this.facingRight ? 1 : -1), y + 10, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.save();
        const shovelX = this.facingRight ? x + 28 : x + 4;
        const shovelY = y + 25;
        ctx.translate(shovelX, shovelY);
        
        if (this.attacking) {
            const swingProgress = 1 - this.attackTimer / this.attackDuration;
            const swingAngle = this.facingRight ? 
                -Math.PI / 2 + swingProgress * Math.PI * 0.8 :
                Math.PI / 2 - swingProgress * Math.PI * 0.8;
            ctx.rotate(swingAngle);
        } else if (this.isPogoAttack()) {
            ctx.rotate(this.facingRight ? Math.PI / 2 : -Math.PI / 2);
        } else {
            ctx.rotate(this.facingRight ? 0 : Math.PI);
        }
        
        ctx.fillStyle = '#888888';
        ctx.fillRect(0, -3, 25, 6);
        
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(25, -8, 8, 16);
        
        ctx.restore();
        
        ctx.restore();
    }
    
    drawAttack(ctx) {
        if (this.attacking) {
            const attackBox = this.getAttackBox();
            ctx.save();
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(attackBox.x, attackBox.y, attackBox.width, attackBox.height);
            ctx.restore();
        }
    }
}