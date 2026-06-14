class Player extends Entity {
    constructor(x, y) {
        super(x, y, GameConfig.PLAYER.WIDTH, GameConfig.PLAYER.HEIGHT);
        this.maxHealth = GameConfig.PLAYER.MAX_HEALTH;
        this.health = GameConfig.PLAYER.MAX_HEALTH;
        this.moveSpeed = GameConfig.PLAYER.MOVE_SPEED;
        this.jumpForce = GameConfig.PLAYER.JUMP_FORCE;
        this.maxJumps = GameConfig.PLAYER.MAX_JUMPS;
        this.jumpsRemaining = this.maxJumps;
        this.isGrounded = false;
        this.isSlowed = false;
        this.slowTimer = 0;
        
        this.attackCooldown = 0;
        this.shurikenCooldown = 0;
        this.isAttacking = false;
        this.attackTimer = 0;
        this.attackFrame = 0;
        
        this.invincibleTimer = 0;
        this.isInvincible = false;
        
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.isWalking = false;
        
        this.jumpFrame = 0;
        
        this.buffs = {
            attackSpeed: { active: false, timer: 0, multiplier: 2 },
            moveSpeed: { active: false, timer: 0, multiplier: 1.5 },
            invincible: { active: false, timer: 0 }
        };
        
        this.shurikens = [];
        
        this.stepTimer = 0;
    }

    update(deltaTime, game) {
        super.update(deltaTime);
        
        if (this.isDead) {
            return;
        }
        
        this.updateBuffs(deltaTime);
        
        if (this.isSlowed) {
            this.slowTimer -= deltaTime;
            if (this.slowTimer <= 0) {
                this.isSlowed = false;
            }
        }
        
        if (this.invincibleTimer > 0) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.isInvincible = false;
            }
        }
        
        if (this.attackCooldown > 0) {
            const cooldownMultiplier = this.buffs.attackSpeed.active ? this.buffs.attackSpeed.multiplier : 1;
            this.attackCooldown -= deltaTime * cooldownMultiplier;
        }
        
        if (this.shurikenCooldown > 0) {
            this.shurikenCooldown -= deltaTime;
        }
        
        if (this.isAttacking) {
            this.attackTimer -= deltaTime;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
                this.attackFrame = 0;
            } else {
                this.attackFrame = Math.floor((1 - this.attackTimer / 300) * 3);
            }
        }
        
        this.handleMovement(deltaTime);
        this.handleJumping();
        this.handleAttacking(game);
        
        this.updateShurikens(deltaTime, game);
        
        if (this.isGrounded && this.isWalking) {
            this.walkTimer += deltaTime;
            if (this.walkTimer >= 150) {
                this.walkTimer = 0;
                this.walkFrame = (this.walkFrame + 1) % 4;
                
                this.stepTimer += deltaTime;
                if (this.stepTimer >= 300) {
                    this.stepTimer = 0;
                    audioManager.playStep();
                }
            }
        } else {
            this.walkFrame = 0;
            this.stepTimer = 0;
        }
        
        if (!this.isGrounded) {
            this.jumpFrame = this.vy < 0 ? 0 : 1;
        }
    }

    updateBuffs(deltaTime) {
        for (const key in this.buffs) {
            const buff = this.buffs[key];
            if (buff.active) {
                buff.timer -= deltaTime;
                if (buff.timer <= 0) {
                    buff.active = false;
                }
            }
        }
    }

    handleMovement(deltaTime) {
        let moveSpeed = this.moveSpeed;
        if (this.buffs.moveSpeed.active) {
            moveSpeed *= this.buffs.moveSpeed.multiplier;
        }
        if (this.isSlowed) {
            moveSpeed *= 0.5;
        }
        
        this.vx = 0;
        this.isWalking = false;
        
        if (inputManager.isLeft()) {
            this.vx = -moveSpeed;
            this.facingRight = false;
            this.isWalking = true;
        }
        if (inputManager.isRight()) {
            this.vx = moveSpeed;
            this.facingRight = true;
            this.isWalking = true;
        }
        
        this.x += this.vx;
        this.vy += GameConfig.GRAVITY;
        this.y += this.vy;
        
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > GameConfig.CANVAS_WIDTH) this.x = GameConfig.CANVAS_WIDTH - this.width;
        
        if (this.y + this.height >= GameConfig.GROUND_Y) {
            this.y = GameConfig.GROUND_Y - this.height;
            this.vy = 0;
            if (!this.isGrounded) {
                this.isGrounded = true;
                this.jumpsRemaining = this.maxJumps;
            }
        } else {
            this.isGrounded = false;
        }
    }

    handleJumping() {
        if (inputManager.isJump() && this.jumpsRemaining > 0) {
            this.vy = this.jumpForce;
            this.jumpsRemaining--;
            this.isGrounded = false;
            
            if (this.jumpsRemaining === this.maxJumps - 1) {
                audioManager.playJump();
            } else {
                audioManager.playDoubleJump();
                for (let i = 0; i < 8; i++) {
                    const angle = Math.PI + Math.random() * Math.PI;
                    particleSystem.addParticle(
                        this.x + this.width / 2,
                        this.y + this.height,
                        Math.cos(angle) * 3,
                        Math.sin(angle) * 2,
                        '#00ffff',
                        3,
                        300
                    );
                }
            }
        }
    }

    handleAttacking(game) {
        if (inputManager.isAttack() && this.attackCooldown <= 0) {
            this.attack();
        }
        
        if (inputManager.isShuriken() && this.shurikenCooldown <= 0) {
            this.throwShuriken();
        }
        
        if (this.isAttacking && this.attackFrame === 1) {
            this.checkAttackHit(game);
        }
    }

    attack() {
        this.isAttacking = true;
        this.attackTimer = 300;
        this.attackCooldown = GameConfig.PLAYER.ATTACK_COOLDOWN;
        this.attackFrame = 0;
        audioManager.playSlash();
    }

    throwShuriken() {
        const shuriken = {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            vx: this.facingRight ? GameConfig.PLAYER.SHURIKEN_SPEED : -GameConfig.PLAYER.SHURIKEN_SPEED,
            rotation: 0,
            damage: GameConfig.PLAYER.SHURIKEN_DAMAGE,
            active: true
        };
        this.shurikens.push(shuriken);
        this.shurikenCooldown = GameConfig.PLAYER.SHURIKEN_COOLDOWN;
        audioManager.playShuriken();
    }

    checkAttackHit(game) {
        const attackX = this.facingRight ? this.x + this.width : this.x - GameConfig.PLAYER.ATTACK_RANGE;
        const attackBox = {
            left: attackX,
            right: attackX + GameConfig.PLAYER.ATTACK_RANGE,
            top: this.y + 10,
            bottom: this.y + this.height - 10
        };
        
        game.enemies.forEach(enemy => {
            if (!enemy.isDead && this.boxIntersects(attackBox, enemy.getBounds())) {
                const killed = enemy.takeDamage(GameConfig.PLAYER.ATTACK_DAMAGE);
                audioManager.playHit();
                particleSystem.addSparks(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, this.facingRight ? 0 : Math.PI);
                
                if (killed) {
                    this.onEnemyKilled(enemy, game);
                }
            }
        });
        
        if (game.boss && !game.boss.isDead && this.boxIntersects(attackBox, game.boss.getBounds())) {
            const killed = game.boss.takeDamage(GameConfig.PLAYER.ATTACK_DAMAGE);
            audioManager.playHit();
            particleSystem.addSparks(game.boss.x + game.boss.width / 2, game.boss.y + game.boss.height / 2, this.facingRight ? 0 : Math.PI);
            
            if (killed) {
                game.onBossDefeated();
            }
        }
    }

    boxIntersects(a, b) {
        return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    }

    updateShurikens(deltaTime, game) {
        this.shurikens = this.shurikens.filter(shuriken => {
            if (!shuriken.active) return false;
            
            shuriken.x += shuriken.vx;
            shuriken.rotation += 0.3;
            
            if (shuriken.x < -20 || shuriken.x > GameConfig.CANVAS_WIDTH + 20) {
                return false;
            }
            
            for (const enemy of game.enemies) {
                if (!enemy.isDead && this.pointInBox(shuriken.x, shuriken.y, enemy.getBounds())) {
                    const killed = enemy.takeDamage(shuriken.damage);
                    audioManager.playHit();
                    particleSystem.addSparks(shuriken.x, shuriken.y, shuriken.vx > 0 ? 0 : Math.PI);
                    
                    if (killed) {
                        this.onEnemyKilled(enemy, game);
                    }
                    
                    return false;
                }
            }
            
            if (game.boss && !game.boss.isDead && this.pointInBox(shuriken.x, shuriken.y, game.boss.getBounds())) {
                const killed = game.boss.takeDamage(shuriken.damage);
                audioManager.playHit();
                particleSystem.addSparks(shuriken.x, shuriken.y, shuriken.vx > 0 ? 0 : Math.PI);
                
                if (killed) {
                    game.onBossDefeated();
                }
                
                return false;
            }
            
            return true;
        });
    }

    pointInBox(x, y, box) {
        return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
    }

    onEnemyKilled(enemy, game) {
        audioManager.playEnemyDeath();
        particleSystem.addCircuitSparks(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 20);
        
        game.score += enemy.scoreValue || 10;
        
        if (Math.random() < GameConfig.ITEMS.DROP_CHANCE) {
            game.spawnItem(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
        }
    }

    takeDamage(amount) {
        if (this.isInvincible || this.buffs.invincible.active || this.isDead) {
            return false;
        }
        
        const killed = super.takeDamage(amount);
        audioManager.playHurt();
        this.isInvincible = true;
        this.invincibleTimer = GameConfig.PLAYER.INVINCIBLE_TIME;
        
        return killed;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    applyBuff(type) {
        const buffConfig = GameConfig.ITEMS;
        switch (type) {
            case 'attack_speed':
                this.buffs.attackSpeed.active = true;
                this.buffs.attackSpeed.timer = buffConfig.BUFF_DURATION;
                break;
            case 'move_speed':
                this.buffs.moveSpeed.active = true;
                this.buffs.moveSpeed.timer = buffConfig.BUFF_DURATION;
                break;
            case 'invincible':
                this.buffs.invincible.active = true;
                this.buffs.invincible.timer = buffConfig.INVINCIBLE_BUFF_DURATION;
                this.isInvincible = true;
                break;
        }
        audioManager.playPickup();
    }

    applySlow(duration) {
        this.isSlowed = true;
        this.slowTimer = duration;
    }

    draw(ctx) {
        if (this.isDead) {
            this.drawDeath(ctx);
            return;
        }
        
        const flashAlpha = this.isFlashing && Math.floor(this.flashTimer / 50) % 2 === 0 ? 0.5 : 1;
        const invincibleAlpha = (this.isInvincible || this.buffs.invincible.active) && Math.floor(Date.now() / 100) % 2 === 0 ? 0.5 : 1;
        const alpha = Math.min(flashAlpha, invincibleAlpha);
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        if (!this.facingRight) {
            ctx.translate(this.x + this.width, this.y);
            ctx.scale(-1, 1);
            ctx.translate(-this.x, -this.y);
        }
        
        this.drawNinja(ctx);
        
        ctx.restore();
        
        this.drawShurikens(ctx);
        this.drawAttackEffect(ctx);
    }

    drawNinja(ctx) {
        const x = this.x;
        const y = this.y;
        const w = this.width;
        const h = this.height;
        
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(x + 10, y + 20, w - 20, h - 25);
        
        ctx.fillStyle = '#16213e';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + 15, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(x + w / 2 - 8, y + 10, 16, 6);
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 10;
        ctx.fillRect(x + w / 2 - 8, y + 10, 16, 6);
        ctx.shadowBlur = 0;
        
        const glowColor = this.buffs.attackSpeed.active ? '#ffff00' : '#00ffff';
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 8;
        
        ctx.beginPath();
        ctx.moveTo(x + 15, y + 25);
        ctx.lineTo(x + 15, y + h - 10);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x + w - 15, y + 25);
        ctx.lineTo(x + w - 15, y + h - 10);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x + 15, y + 35);
        ctx.lineTo(x + w - 15, y + 35);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        
        const legOffset = this.isWalking ? Math.sin(this.walkFrame * Math.PI / 2) * 8 : 0;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(x + 12, y + h - 15, 8, 15 + legOffset);
        ctx.fillRect(x + w - 20, y + h - 15, 8, 15 - legOffset);
        
        if (this.isAttacking) {
            this.drawSwordAttack(ctx, x, y, w, h);
        } else {
            this.drawSwordIdle(ctx, x, y, w, h);
        }
        
        if (this.buffs.moveSpeed.active) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
            ctx.setLineDash([]);
        }
        
        if (this.buffs.invincible.active) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h / 2, w / 2 + 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }

    drawSwordIdle(ctx, x, y, w, h) {
        ctx.save();
        ctx.translate(x + w - 5, y + h / 2);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(0, -3, 12, 6);
        
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.fillRect(12, -2, 30, 4);
        
        ctx.restore();
        ctx.shadowBlur = 0;
    }

    drawSwordAttack(ctx, x, y, w, h) {
        const angles = [-Math.PI / 3, 0, Math.PI / 3];
        const angle = angles[this.attackFrame] || 0;
        
        ctx.save();
        ctx.translate(x + w - 5, y + h / 2);
        ctx.rotate(angle);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(0, -3, 12, 6);
        
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20;
        ctx.fillRect(12, -3, 50, 6);
        
        if (this.attackFrame === 1) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(0, 0, 60, -Math.PI / 3, Math.PI / 3);
            ctx.stroke();
        }
        
        ctx.restore();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }

    drawAttackEffect(ctx) {
        if (this.isAttacking && this.attackFrame === 1) {
            const attackX = this.facingRight ? this.x + this.width : this.x;
            const direction = this.facingRight ? 1 : -1;
            
            ctx.save();
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.7;
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 20;
            
            ctx.beginPath();
            ctx.arc(attackX, this.y + this.height / 2, 40, direction > 0 ? -Math.PI / 3 : Math.PI * 2 / 3, direction > 0 ? Math.PI / 3 : Math.PI * 4 / 3);
            ctx.stroke();
            
            ctx.restore();
        }
    }

    drawShurikens(ctx) {
        this.shurikens.forEach(shuriken => {
            ctx.save();
            ctx.translate(shuriken.x, shuriken.y);
            ctx.rotate(shuriken.rotation);
            
            ctx.fillStyle = '#c0c0c0';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 10;
            
            for (let i = 0; i < 4; i++) {
                ctx.save();
                ctx.rotate((Math.PI / 2) * i);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(4, -12);
                ctx.lineTo(-4, -12);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
            
            ctx.fillStyle = '#1a1a2e';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }

    drawDeath(ctx) {
        const progress = 1 - this.deathTimer / 1000;
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(progress * Math.PI / 2);
        
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(-this.width / 2, -this.height / 2 + progress * 20, this.width, this.height);
        
        ctx.restore();
        
        if (this.deathTimer > 0) {
            particleSystem.addCircuitSparks(this.x + this.width / 2, this.y + this.height / 2, 2);
        }
    }

    reset() {
        this.health = this.maxHealth;
        this.isDead = false;
        this.x = 100;
        this.y = GameConfig.GROUND_Y - this.height;
        this.vx = 0;
        this.vy = 0;
        this.facingRight = true;
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.attackCooldown = 0;
        this.shurikenCooldown = 0;
        this.isAttacking = false;
        this.jumpsRemaining = this.maxJumps;
        this.isGrounded = true;
        this.isSlowed = false;
        this.shurikens = [];
        
        for (const key in this.buffs) {
            this.buffs[key].active = false;
            this.buffs[key].timer = 0;
        }
    }
}
