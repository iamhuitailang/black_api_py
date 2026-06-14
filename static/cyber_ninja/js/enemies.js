class Enemy extends Entity {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.scoreValue = 10;
        this.hitFlashTimer = 0;
        this.screwParticlesSpawned = false;
    }

    update(deltaTime, game) {
        super.update(deltaTime);
        
        if (this.isFlashing) {
            this.hitFlashTimer = 100;
            if (!this.screwParticlesSpawned) {
                this.screwParticlesSpawned = true;
                particleSystem.addScrewParts(this.x + this.width / 2, this.y + this.height / 2, 3);
            }
        }
        
        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= deltaTime;
        } else {
            this.screwParticlesSpawned = false;
        }
    }

    draw(ctx) {
        if (this.isDead) {
            this.drawDeath(ctx);
            return;
        }
    }

    drawDeath(ctx) {
        const progress = 1 - this.deathTimer / 1000;
        
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        ctx.save();
        ctx.rotate(-progress * Math.PI / 4);
        ctx.translate(-this.width / 2, -this.height / 2 - progress * 30);
        this.drawBody(ctx, 0, 0);
        ctx.restore();
        
        ctx.save();
        ctx.rotate(progress * Math.PI / 4);
        ctx.translate(-this.width / 2, progress * 20);
        ctx.globalAlpha = (1 - progress) * 0.7;
        this.drawLowerBody(ctx, 0, 0);
        ctx.restore();
        
        ctx.restore();
        
        if (Math.random() < 0.3) {
            particleSystem.addCircuitSparks(this.x + this.width / 2, this.y + this.height / 2, 1);
        }
    }

    drawBody(ctx, x, y) {
    }

    drawLowerBody(ctx, x, y) {
        ctx.fillStyle = '#333';
        ctx.fillRect(x + 5, y + this.height / 2, this.width - 10, this.height / 2);
    }
}

class Drone extends Enemy {
    constructor(x, y) {
        super(x, y, GameConfig.ENEMIES.DRONE.WIDTH, GameConfig.ENEMIES.DRONE.HEIGHT);
        this.maxHealth = GameConfig.ENEMIES.DRONE.HEALTH;
        this.health = GameConfig.ENEMIES.DRONE.HEALTH;
        this.speed = GameConfig.ENEMIES.DRONE.SPEED;
        this.damage = GameConfig.ENEMIES.DRONE.DAMAGE;
        this.shootCooldown = 0;
        this.bullets = [];
        this.patrolDirection = 1;
        this.patrolStartX = x;
        this.patrolRange = 300;
        this.hoverOffset = 0;
        this.hoverTimer = 0;
        this.scoreValue = 20;
        this.targetY = y;
    }

    update(deltaTime, game) {
        super.update(deltaTime, game);
        
        if (this.isDead) {
            this.updateBullets(deltaTime, game);
            return;
        }
        
        this.hoverTimer += deltaTime;
        this.hoverOffset = Math.sin(this.hoverTimer / 200) * 10;
        
        const player = game.player;
        const dx = player.x - this.x;
        const dy = (player.y + player.height / 2) - (this.y + this.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 500 && distance > 100) {
            this.x += Math.sign(dx) * this.speed * 0.8;
            if (Math.abs(dy) > 30) {
                this.y += Math.sign(dy) * this.speed * 0.5;
            }
        } else {
            this.x += this.speed * this.patrolDirection * 0.5;
            if (this.x > this.patrolStartX + this.patrolRange || this.x < this.patrolStartX - this.patrolRange) {
                this.patrolDirection *= -1;
            }
        }
        
        if (this.x < 20) this.x = 20;
        if (this.x + this.width > GameConfig.CANVAS_WIDTH - 20) this.x = GameConfig.CANVAS_WIDTH - 20 - this.width;
        if (this.y < 50) this.y = 50;
        if (this.y > GameConfig.GROUND_Y - 100) this.y = GameConfig.GROUND_Y - 100;
        
        this.facingRight = game.player.x > this.x;
        
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }
        
        if (this.shootCooldown <= 0 && this.canSeePlayer(game.player)) {
            this.shoot(game.player);
            this.shootCooldown = GameConfig.ENEMIES.DRONE.SHOOT_COOLDOWN;
        }
        
        this.updateBullets(deltaTime, game);
    }

    canSeePlayer(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 500;
    }

    shoot(player) {
        const dx = player.x + player.width / 2 - (this.x + this.width / 2);
        const dy = player.y + player.height / 2 - (this.y + this.height / 2 + this.hoverOffset);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const bullet = {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2 + this.hoverOffset,
            vx: (dx / distance) * GameConfig.ENEMIES.DRONE.BULLET_SPEED,
            vy: (dy / distance) * GameConfig.ENEMIES.DRONE.BULLET_SPEED,
            damage: this.damage,
            active: true
        };
        
        this.bullets.push(bullet);
        audioManager.playTone(300, 0.1, 'square', 0.15);
    }

    updateBullets(deltaTime, game) {
        this.bullets = this.bullets.filter(bullet => {
            if (!bullet.active) return false;
            
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            
            if (bullet.x < -20 || bullet.x > GameConfig.CANVAS_WIDTH + 20 ||
                bullet.y < -20 || bullet.y > GameConfig.CANVAS_HEIGHT + 20) {
                return false;
            }
            
            const playerBox = game.player.getBounds();
            if (bullet.x > playerBox.left && bullet.x < playerBox.right &&
                bullet.y > playerBox.top && bullet.y < playerBox.bottom) {
                game.player.takeDamage(bullet.damage);
                particleSystem.addSparks(bullet.x, bullet.y, Math.atan2(bullet.vy, bullet.vx));
                return false;
            }
            
            return true;
        });
    }

    draw(ctx) {
        if (this.isDead) {
            this.drawDeath(ctx);
            this.drawBullets(ctx);
            return;
        }
        
        const flashColor = this.hitFlashTimer > 0 && Math.floor(this.hitFlashTimer / 30) % 2 === 0 ? '#ff4444' : null;
        
        ctx.save();
        
        const y = this.y + this.hoverOffset;
        
        ctx.fillStyle = flashColor || '#2a2a4a';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, y + this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = flashColor || '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, y + this.height / 2, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        const rotorAngle = this.hoverTimer / 50;
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + 5, y);
        ctx.lineTo(this.x + 5 + Math.cos(rotorAngle) * 15, y + Math.sin(rotorAngle) * 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x + this.width - 5, y);
        ctx.lineTo(this.x + this.width - 5 + Math.cos(rotorAngle + Math.PI) * 15, y + Math.sin(rotorAngle + Math.PI) * 5);
        ctx.stroke();
        
        ctx.restore();
        
        this.drawBullets(ctx);
        this.drawHealthBar(ctx, -10);
    }

    drawBody(ctx, x, y) {
        ctx.fillStyle = '#2a2a4a';
        ctx.beginPath();
        ctx.ellipse(x + this.width / 2, y + this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(x + this.width / 2, y + this.height / 2, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBullets(ctx) {
        this.bullets.forEach(bullet => {
            ctx.fillStyle = '#ff4444';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        });
    }
}

class Mech extends Enemy {
    constructor(x, y) {
        super(x, y, GameConfig.ENEMIES.MECH.WIDTH, GameConfig.ENEMIES.MECH.HEIGHT);
        this.maxHealth = GameConfig.ENEMIES.MECH.HEALTH;
        this.health = GameConfig.ENEMIES.MECH.HEALTH;
        this.speed = GameConfig.ENEMIES.MECH.SPEED;
        this.damage = GameConfig.ENEMIES.MECH.DAMAGE;
        this.attackRange = GameConfig.ENEMIES.MECH.ATTACK_RANGE;
        this.attackCooldown = 0;
        this.isAttacking = false;
        this.attackTimer = 0;
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.stepTimer = 0;
        this.scoreValue = 30;
    }

    update(deltaTime, game) {
        super.update(deltaTime, game);
        
        if (this.isDead) return;
        
        const player = game.player;
        const dx = player.x - this.x;
        const distance = Math.abs(dx);
        
        this.facingRight = dx > 0;
        
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        if (this.isAttacking) {
            this.attackTimer -= deltaTime;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
                if (distance < this.attackRange + this.width) {
                    if (!player.isDead) {
                        player.takeDamage(this.damage);
                        audioManager.playHit();
                    }
                }
            }
        } else if (distance < this.attackRange + 20 && this.attackCooldown <= 0) {
            this.isAttacking = true;
            this.attackTimer = 300;
            this.attackCooldown = GameConfig.ENEMIES.MECH.ATTACK_COOLDOWN;
            audioManager.playBossAttack();
        } else if (distance > this.attackRange) {
            this.x += this.facingRight ? this.speed * 1.2 : -this.speed * 1.2;
            
            this.walkTimer += deltaTime;
            if (this.walkTimer >= 200) {
                this.walkTimer = 0;
                this.walkFrame = (this.walkFrame + 1) % 4;
            }
            
            this.stepTimer += deltaTime;
            if (this.stepTimer >= 400) {
                this.stepTimer = 0;
                audioManager.playMechStep();
                for (let i = 0; i < 3; i++) {
                    particleSystem.addParticle(
                        this.x + this.width / 2 + (Math.random() - 0.5) * 30,
                        this.y + this.height,
                        (Math.random() - 0.5) * 2,
                        -Math.random() * 2,
                        '#888888',
                        2,
                        300
                    );
                }
            }
        }
        
        if (this.y + this.height < GameConfig.GROUND_Y) {
            this.y += GameConfig.GRAVITY * 2;
        } else {
            this.y = GameConfig.GROUND_Y - this.height;
        }
        
        if (this.x < 10) this.x = 10;
        if (this.x + this.width > GameConfig.CANVAS_WIDTH - 10) this.x = GameConfig.CANVAS_WIDTH - 10 - this.width;
    }

    draw(ctx) {
        if (this.isDead) {
            this.drawDeath(ctx);
            return;
        }
        
        const flashColor = this.hitFlashTimer > 0 && Math.floor(this.hitFlashTimer / 30) % 2 === 0 ? '#ff4444' : null;
        
        ctx.save();
        
        if (!this.facingRight) {
            ctx.translate(this.x + this.width, this.y);
            ctx.scale(-1, 1);
            ctx.translate(-this.x, -this.y);
        }
        
        ctx.fillStyle = flashColor || '#3a3a5a';
        ctx.fillRect(this.x + 5, this.y + 15, this.width - 10, this.height - 25);
        
        ctx.fillStyle = flashColor || '#4a4a6a';
        ctx.fillRect(this.x + 10, this.y, this.width - 20, 20);
        
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 10;
        ctx.fillRect(this.x + 15, this.y + 8, this.width - 30, 4);
        ctx.shadowBlur = 0;
        
        const armAngle = this.isAttacking ? -Math.PI / 3 + (1 - this.attackTimer / 300) * Math.PI / 2 : 0;
        ctx.save();
        ctx.translate(this.x + this.width - 5, this.y + 30);
        ctx.rotate(armAngle);
        
        ctx.fillStyle = flashColor || '#3a3a5a';
        ctx.fillRect(0, -5, 30, 10);
        
        ctx.fillStyle = flashColor || '#5a5a7a';
        ctx.fillRect(25, -8, 15, 16);
        
        ctx.restore();
        
        const legOffset = Math.sin(this.walkFrame * Math.PI / 2) * 10;
        ctx.fillStyle = flashColor || '#2a2a4a';
        ctx.fillRect(this.x + 8, this.y + this.height - 20, 12, 20 + legOffset);
        ctx.fillRect(this.x + this.width - 20, this.y + this.height - 20, 12, 20 - legOffset);
        
        ctx.fillStyle = '#666';
        ctx.fillRect(this.x + 5, this.y + this.height - 5, 18, 5);
        ctx.fillRect(this.x + this.width - 23, this.y + this.height - 5, 18, 5);
        
        ctx.restore();
        
        this.drawHealthBar(ctx, -8);
    }

    drawBody(ctx, x, y) {
        ctx.fillStyle = '#3a3a5a';
        ctx.fillRect(x + 5, y + 15, this.width - 10, this.height / 2 - 10);
        
        ctx.fillStyle = '#4a4a6a';
        ctx.fillRect(x + 10, y, this.width - 20, 20);
        
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x + 15, y + 8, this.width - 30, 4);
    }
}

class Spider extends Enemy {
    constructor(x, y) {
        super(x, y, GameConfig.ENEMIES.SPIDER.WIDTH, GameConfig.ENEMIES.SPIDER.HEIGHT);
        this.maxHealth = GameConfig.ENEMIES.SPIDER.HEALTH;
        this.health = GameConfig.ENEMIES.SPIDER.HEALTH;
        this.speed = GameConfig.ENEMIES.SPIDER.SPEED;
        this.damage = GameConfig.ENEMIES.SPIDER.DAMAGE;
        this.explodeRange = GameConfig.ENEMIES.SPIDER.EXPLODE_RANGE;
        this.isExploding = false;
        this.explodeWarningTimer = 0;
        this.hasExploded = false;
        this.legAngle = 0;
        this.scoreValue = 15;
    }

    update(deltaTime, game) {
        super.update(deltaTime, game);
        
        if (this.isDead) return;
        
        const player = game.player;
        const dx = player.x + player.width / 2 - (this.x + this.width / 2);
        const dy = player.y + player.height / 2 - (this.y + this.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.facingRight = dx > 0;
        
        if (this.isExploding) {
            this.explodeWarningTimer -= deltaTime;
            
            if (Math.floor(this.explodeWarningTimer / 100) % 2 === 0) {
                audioManager.playWarning();
            }
            
            if (this.explodeWarningTimer <= 0 && !this.hasExploded) {
                this.explode(game);
            }
        } else if (distance < this.explodeRange) {
            this.isExploding = true;
            this.explodeWarningTimer = GameConfig.ENEMIES.SPIDER.EXPLODE_WARNING_TIME;
        } else {
            this.x += (dx > 0 ? this.speed : -this.speed);
            this.legAngle += 0.3;
        }
        
        if (this.y + this.height < GameConfig.GROUND_Y) {
            this.y += GameConfig.GRAVITY * 2;
        } else {
            this.y = GameConfig.GROUND_Y - this.height;
        }
        
        if (this.x < 5) this.x = 5;
        if (this.x + this.width > GameConfig.CANVAS_WIDTH - 5) this.x = GameConfig.CANVAS_WIDTH - 5 - this.width;
    }

    explode(game) {
        this.hasExploded = true;
        this.isDead = true;
        this.deathTimer = 500;
        
        audioManager.playExplosion();
        
        const colors = ['#ff4400', '#ff8800', '#ffff00', '#ff0000'];
        particleSystem.addExplosion(this.x + this.width / 2, this.y + this.height / 2, colors, 20);
        
        const player = game.player;
        const dx = player.x + player.width / 2 - (this.x + this.width / 2);
        const dy = player.y + player.height / 2 - (this.y + this.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.explodeRange) {
            player.takeDamage(this.damage);
        }
    }

    draw(ctx) {
        if (this.isDead && this.hasExploded) {
            if (this.deathTimer > 400) {
                const progress = 1 - (this.deathTimer - 400) / 100;
                ctx.save();
                ctx.globalAlpha = 1 - progress;
                ctx.fillStyle = '#ff8800';
                ctx.shadowColor = '#ff4400';
                ctx.shadowBlur = 30;
                ctx.beginPath();
                ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.explodeRange * progress, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            return;
        }
        
        const warningFlash = this.isExploding && Math.floor(this.explodeWarningTimer / 100) % 2 === 0;
        const bodyColor = warningFlash ? '#ff0000' : '#2a2a3a';
        const glowColor = warningFlash ? '#ff0000' : '#00ffff';
        
        ctx.save();
        
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const side = i < 2 ? -1 : 1;
            const legIdx = i % 2;
            const baseX = this.x + this.width / 2 + side * 10;
            const baseY = this.y + this.height / 2;
            const offset = Math.sin(this.legAngle + i) * 5;
            
            ctx.beginPath();
            ctx.moveTo(baseX, baseY);
            ctx.lineTo(baseX + side * (15 + offset), baseY + 15 + Math.abs(offset));
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(baseX + side * (15 + offset), baseY + 15 + Math.abs(offset));
            ctx.lineTo(baseX + side * (25 + offset), baseY + this.height - 5);
            ctx.stroke();
        }
        
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = warningFlash ? 20 : 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 10;
        for (let i = 0; i < 4; i++) {
            const ex = this.x + this.width / 2 + (i % 2 === 0 ? -6 : 6);
            const ey = this.y + this.height / 2 - 5 + Math.floor(i / 2) * 8;
            ctx.beginPath();
            ctx.arc(ex, ey, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
        
        ctx.restore();
        
        this.drawHealthBar(ctx, -8);
    }

    drawBody(ctx, x, y) {
        ctx.fillStyle = '#2a2a3a';
        ctx.beginPath();
        ctx.ellipse(x + this.width / 2, y + this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}
