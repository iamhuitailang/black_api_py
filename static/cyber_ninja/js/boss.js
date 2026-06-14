class Boss extends Entity {
    constructor(x, y) {
        super(x, y, GameConfig.BOSS.WIDTH, GameConfig.BOSS.HEIGHT);
        this.maxHealth = GameConfig.BOSS.HEALTH;
        this.health = GameConfig.BOSS.HEALTH;
        this.attackCooldown = 0;
        this.currentAttack = 0;
        this.attackState = 'idle';
        this.attackTimer = 0;
        this.attackPatterns = ['punch', 'heavy_punch', 'laser'];
        this.laserActive = false;
        this.laserWarning = false;
        this.laserTimer = 0;
        this.walkDirection = 0;
        this.walkTimer = 0;
        this.stepTimer = 0;
        this.scoreValue = 200;
        this.isBoss = true;
    }

    update(deltaTime, game) {
        super.update(deltaTime);
        
        if (this.isDead) return;
        
        const player = game.player;
        this.facingRight = player.x > this.x;
        
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        if (this.laserWarning) {
            this.laserTimer -= deltaTime;
            if (Math.floor(this.laserTimer / 200) % 2 === 0) {
                audioManager.playWarning();
            }
            if (this.laserTimer <= 0) {
                this.laserWarning = false;
                this.laserActive = true;
                this.laserTimer = GameConfig.BOSS.LASER_DURATION;
                audioManager.playLaser();
            }
        } else if (this.laserActive) {
            this.laserTimer -= deltaTime;
            
            const laserBox = this.getLaserBox();
            if (laserBox && !player.isDead) {
                const playerBox = player.getBounds();
                if (this.boxIntersects(laserBox, playerBox)) {
                    if (this.laserTimer % 500 < deltaTime) {
                        player.takeDamage(GameConfig.BOSS.LASER_DAMAGE);
                    }
                }
            }
            
            if (this.laserTimer <= 0) {
                this.laserActive = false;
                this.attackState = 'idle';
                this.attackCooldown = GameConfig.BOSS.ATTACK_COOLDOWN;
            }
        } else if (this.attackState === 'punch' || this.attackState === 'heavy_punch') {
            this.attackTimer -= deltaTime;
            if (this.attackTimer <= 0) {
                this.performAttack(game);
                this.attackState = 'idle';
                this.attackCooldown = GameConfig.BOSS.ATTACK_COOLDOWN;
            }
        } else if (this.attackCooldown <= 0) {
            this.startNextAttack(game);
        } else {
            this.updateMovement(deltaTime);
        }
        
        if (this.y + this.height < GameConfig.GROUND_Y) {
            this.y += GameConfig.GRAVITY * 2;
        } else {
            this.y = GameConfig.GROUND_Y - this.height;
        }
        
        if (this.x < 200) this.x = 200;
        if (this.x + this.width > GameConfig.CANVAS_WIDTH) this.x = GameConfig.CANVAS_WIDTH - this.width;
    }

    updateMovement(deltaTime) {
        this.walkTimer += deltaTime;
        if (this.walkTimer >= 1000) {
            this.walkTimer = 0;
            this.walkDirection = Math.random() > 0.5 ? 1 : -1;
        }
        
        const speed = 1.5;
        this.x += this.walkDirection * speed;
        
        this.stepTimer += deltaTime;
        if (this.stepTimer >= 500) {
            this.stepTimer = 0;
            audioManager.playMechStep();
        }
    }

    startNextAttack(game) {
        this.currentAttack = (this.currentAttack + 1) % this.attackPatterns.length;
        const pattern = this.attackPatterns[this.currentAttack];
        
        audioManager.playBossAttack();
        
        switch (pattern) {
            case 'punch':
                this.attackState = 'punch';
                this.attackTimer = 500;
                break;
            case 'heavy_punch':
                this.attackState = 'heavy_punch';
                this.attackTimer = 800;
                break;
            case 'laser':
                this.attackState = 'laser';
                this.laserWarning = true;
                this.laserTimer = GameConfig.BOSS.LASER_WARNING_TIME;
                break;
        }
    }

    performAttack(game) {
        const player = game.player;
        if (player.isDead) return;
        
        const bossBox = this.getBounds();
        const playerBox = player.getBounds();
        
        if (this.attackState === 'punch') {
            const attackRange = GameConfig.BOSS.PUNCH_RANGE;
            const attackBox = {
                left: this.facingRight ? bossBox.right : bossBox.left - attackRange,
                right: this.facingRight ? bossBox.right + attackRange : bossBox.left,
                top: bossBox.top + 20,
                bottom: bossBox.bottom - 40
            };
            
            if (this.boxIntersects(attackBox, playerBox)) {
                player.takeDamage(GameConfig.BOSS.PUNCH_DAMAGE);
            }
            
            particleSystem.addExplosion(
                this.facingRight ? bossBox.right + 30 : bossBox.left - 30,
                bossBox.top + 50,
                ['#ff8800', '#ffff00', '#888888'],
                15
            );
        } else if (this.attackState === 'heavy_punch') {
            const attackRange = GameConfig.BOSS.HEAVY_PUNCH_RANGE;
            const attackBox = {
                left: this.facingRight ? bossBox.right : bossBox.left - attackRange,
                right: this.facingRight ? bossBox.right + attackRange : bossBox.left,
                top: bossBox.top + 40,
                bottom: bossBox.bottom
            };
            
            if (this.boxIntersects(attackBox, playerBox)) {
                player.takeDamage(GameConfig.BOSS.HEAVY_PUNCH_DAMAGE);
            }
            
            particleSystem.addExplosion(
                this.facingRight ? bossBox.right + 20 : bossBox.left - 20,
                bossBox.bottom - 20,
                ['#ff0000', '#ff4400', '#ffff00'],
                25
            );
            
            audioManager.playExplosion();
        }
    }

    getLaserBox() {
        if (!this.laserActive) return null;
        
        const bossBox = this.getBounds();
        return {
            left: this.facingRight ? bossBox.right - 10 : 0,
            right: this.facingRight ? GameConfig.CANVAS_WIDTH : bossBox.left + 10,
            top: bossBox.top + 30,
            bottom: bossBox.top + 50
        };
    }

    boxIntersects(a, b) {
        return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    }

    takeDamage(amount) {
        const killed = super.takeDamage(amount);
        if (killed) {
            audioManager.playExplosion();
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    particleSystem.addExplosion(
                        this.x + Math.random() * this.width,
                        this.y + Math.random() * this.height,
                        ['#ff0000', '#ff8800', '#ffff00', '#00ffff', '#ff00ff'],
                        20
                    );
                }, i * 200);
            }
        }
        return killed;
    }

    draw(ctx) {
        if (this.isDead) {
            this.drawDeath(ctx);
            return;
        }
        
        const flashColor = this.isFlashing && Math.floor(this.flashTimer / 50) % 2 === 0 ? '#ff4444' : null;
        
        ctx.save();
        
        if (!this.facingRight) {
            ctx.translate(this.x + this.width, this.y);
            ctx.scale(-1, 1);
            ctx.translate(-this.x, -this.y);
        }
        
        this.drawBody(ctx, flashColor);
        this.drawArms(ctx, flashColor);
        this.drawHead(ctx, flashColor);
        this.drawLegs(ctx, flashColor);
        
        if (this.laserActive || this.laserWarning) {
            this.drawLaser(ctx);
        }
        
        ctx.restore();
    }

    drawBody(ctx, flashColor) {
        ctx.fillStyle = flashColor || '#2a2a4a';
        ctx.fillRect(this.x + 20, this.y + 40, this.width - 40, this.height - 80);
        
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 15;
        ctx.strokeRect(this.x + 20, this.y + 40, this.width - 40, this.height - 80);
        ctx.shadowBlur = 0;
        
        const coreGlow = this.laserWarning || this.laserActive;
        ctx.fillStyle = coreGlow ? '#ff0000' : '#4444ff';
        ctx.shadowColor = coreGlow ? '#ff0000' : '#00ffff';
        ctx.shadowBlur = coreGlow ? 30 : 15;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + 70, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = flashColor || '#1a1a3a';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(this.x + 30 + i * 25, this.y + 100, 20, 30);
        }
    }

    drawArms(ctx, flashColor) {
        const leftPunching = this.attackState === 'punch';
        const rightPunching = this.attackState === 'heavy_punch';
        const punchProgress = leftPunching || rightPunching ? 1 - this.attackTimer / (leftPunching ? 500 : 800) : 0;
        
        ctx.fillStyle = flashColor || '#2a2a4a';
        ctx.save();
        ctx.translate(this.x + 20, this.y + 55);
        if (leftPunching) {
            ctx.translate(-punchProgress * 60, 0);
        }
        ctx.fillRect(-15, -10, 25, 20);
        ctx.fillRect(-30, -15, 20, 30);
        ctx.restore();
        
        ctx.fillStyle = flashColor || '#3a3a5a';
        ctx.save();
        ctx.translate(this.x + this.width - 20, this.y + 55);
        if (rightPunching) {
            ctx.translate(punchProgress * 80, 10);
        }
        ctx.fillRect(-10, -15, 35, 30);
        ctx.fillRect(20, -20, 25, 40);
        ctx.restore();
        
        if (rightPunching && punchProgress > 0.5) {
            ctx.fillStyle = '#ff8800';
            ctx.shadowColor = '#ff4400';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(this.x + this.width + 20 + punchProgress * 40, this.y + 75, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    drawHead(ctx, flashColor) {
        ctx.fillStyle = flashColor || '#1a1a3a';
        ctx.fillRect(this.x + 35, this.y, this.width - 70, 45);
        
        ctx.fillStyle = flashColor || '#2a2a4a';
        ctx.fillRect(this.x + 45, this.y + 5, this.width - 90, 25);
        
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 15;
        ctx.fillRect(this.x + 50, this.y + 12, this.width - 100, 10);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#444';
        ctx.fillRect(this.x + 30, this.y + 40, 10, 10);
        ctx.fillRect(this.x + this.width - 40, this.y + 40, 10, 10);
    }

    drawLegs(ctx, flashColor) {
        const stepOffset = Math.sin(this.stepTimer / 250) * 5;
        
        ctx.fillStyle = flashColor || '#1a1a3a';
        ctx.fillRect(this.x + 25, this.y + this.height - 45, 25, 45 + stepOffset);
        ctx.fillRect(this.x + this.width - 50, this.y + this.height - 45, 25, 45 - stepOffset);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x + 20, this.y + this.height - 5, 35, 5);
        ctx.fillRect(this.x + this.width - 55, this.y + this.height - 5, 35, 5);
    }

    drawLaser(ctx) {
        const laserBox = this.getLaserBox();
        if (!laserBox) {
            if (this.laserWarning) {
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 2;
                ctx.setLineDash([10, 10]);
                ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.5;
                ctx.beginPath();
                ctx.moveTo(this.x + this.width - 10, this.y + 40);
                ctx.lineTo(GameConfig.CANVAS_WIDTH, this.y + 40);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.globalAlpha = 1;
            }
            return;
        }
        
        const laserY = laserBox.top + (laserBox.bottom - laserBox.top) / 2;
        const laserWidth = laserBox.right - laserBox.left;
        
        ctx.fillStyle = '#ff0000';
        ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 50) * 0.2;
        ctx.fillRect(laserBox.left, laserBox.top - 5, laserWidth, laserBox.bottom - laserBox.top + 10);
        ctx.globalAlpha = 1;
        
        ctx.fillStyle = '#ff4444';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 20;
        ctx.fillRect(laserBox.left, laserBox.top, laserWidth, laserBox.bottom - laserBox.top);
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(laserBox.left, laserY - 3, laserWidth, 6);
        ctx.shadowBlur = 0;
    }

    drawDeath(ctx) {
        const progress = 1 - this.deathTimer / 1000;
        
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(progress * Math.PI / 6);
        
        ctx.fillStyle = '#2a2a4a';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        ctx.restore();
        
        if (Math.random() < 0.5) {
            particleSystem.addCircuitSparks(
                this.x + Math.random() * this.width,
                this.y + Math.random() * this.height,
                3
            );
        }
    }
}
