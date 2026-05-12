class Player extends Entity {
    constructor(state) {
        super(state.x, state.y, CONFIG.PLAYER.WIDTH, CONFIG.PLAYER.HEIGHT);
        this.health = state.health;
        this.maxHealth = CONFIG.PLAYER.MAX_HEALTH;
        this.soul = state.soul;
        this.maxSoul = CONFIG.PLAYER.MAX_SOUL;
        this.attack = state.attack;
        this.speed = state.speed;
        this.jumpPower = state.jumpPower;
        this.facingRight = state.facingRight;
        this.abilities = state.abilities;
        
        this.isAttacking = false;
        this.attackTimer = 0;
        this.lastAttackTime = 0;
        
        this.isDashing = false;
        this.dashTimer = 0;
        this.lastDashTime = 0;
        
        this.isInvincible = false;
        this.invincibleTimer = 0;
        
        this.onWall = false;
        this.wallSide = 0;
        
        this.animationFrame = 0;
        this.animationTimer = 0;
    }

    update(input, platforms, walls, particleSystem) {
        this.handleInput(input, particleSystem);
        this.handleWallSlide(walls);
        
        super.update(platforms, walls);
        
        this.updateTimers();
        
        if (Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1) {
            this.animationTimer++;
            if (this.animationTimer > 8) {
                this.animationFrame = (this.animationFrame + 1) % 4;
                this.animationTimer = 0;
            }
        }
    }

    handleInput(input, particleSystem) {
        if (!this.isDashing) {
            if (input.left) {
                this.vx = -this.speed;
                this.facingRight = false;
            } else if (input.right) {
                this.vx = this.speed;
                this.facingRight = true;
            } else {
                this.vx *= 0.8;
            }
        }

        if (input.jump && (this.onGround || (this.abilities.wallClimb && this.onWall))) {
            this.vy = -this.jumpPower;
            if (this.onWall && !this.onGround) {
                this.vx = this.wallSide * this.speed * 2;
                this.facingRight = this.wallSide > 0;
            }
        }

        if (input.attack && this.abilities.nail && !this.isAttacking) {
            this.performAttack(particleSystem);
        }

        if (input.spell && this.abilities.spell && this.soul >= CONFIG.PLAYER.SPELL_COST) {
            this.performSpell(particleSystem);
        }

        if (input.dash && (this.abilities.dash || this.abilities.shadowDash) && !this.isDashing) {
            this.performDash(particleSystem);
        }
    }

    handleWallSlide(walls) {
        this.onWall = false;
        this.wallSide = 0;
        
        if (!this.abilities.wallClimb) return;
        
        for (const wall of walls) {
            if (this.collidesWith(wall)) {
                if (this.x + this.width > wall.x && this.x < wall.x) {
                    this.onWall = true;
                    this.wallSide = -1;
                } else if (this.x < wall.x + wall.width && this.x + this.width > wall.x + wall.width) {
                    this.onWall = true;
                    this.wallSide = 1;
                }
            }
        }

        if (this.onWall && !this.onGround && this.vy > 0) {
            this.vy *= 0.5;
        }
    }

    performAttack(particleSystem) {
        const now = Date.now();
        if (now - this.lastAttackTime < CONFIG.PLAYER.ATTACK_COOLDOWN) return;
        
        this.isAttacking = true;
        this.attackTimer = 15;
        this.lastAttackTime = now;
        particleSystem.emitAttack(
            this.getCenterX() + (this.facingRight ? 30 : -30),
            this.getCenterY(),
            this.facingRight
        );
    }

    performSpell(particleSystem) {
        this.soul -= CONFIG.PLAYER.SPELL_COST;
        particleSystem.emitSpell(this.getCenterX(), this.getCenterY());
    }

    performDash(particleSystem) {
        const now = Date.now();
        if (now - this.lastDashTime < CONFIG.PLAYER.DASH_COOLDOWN) return;
        
        this.isDashing = true;
        this.dashTimer = CONFIG.PLAYER.DASH_DURATION / 16;
        this.lastDashTime = now;
        this.vx = (this.facingRight ? 1 : -1) * CONFIG.PLAYER.DASH_DISTANCE / 10;
        this.vy = 0;
        
        if (this.abilities.shadowDash) {
            this.isInvincible = true;
            this.invincibleTimer = this.dashTimer;
        }
        
        particleSystem.emitDash(this.getCenterX(), this.getCenterY(), this.facingRight);
    }

    updateTimers() {
        if (this.attackTimer > 0) {
            this.attackTimer--;
            if (this.attackTimer === 0) {
                this.isAttacking = false;
            }
        }

        if (this.dashTimer > 0) {
            this.dashTimer--;
            if (this.dashTimer === 0) {
                this.isDashing = false;
                this.vx *= 0.3;
            }
        }

        if (this.invincibleTimer > 0) {
            this.invincibleTimer--;
            if (this.invincibleTimer === 0) {
                this.isInvincible = false;
            }
        }
    }

    takeDamage(damage, particleSystem) {
        if (this.isInvincible) return false;
        
        this.health--;
        this.isInvincible = true;
        this.invincibleTimer = CONFIG.PLAYER.INVINCIBLE_DURATION / 16;
        particleSystem.emitHit(this.getCenterX(), this.getCenterY());
        
        return this.health <= 0;
    }

    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }

    addSoul(amount) {
        this.soul = Math.min(this.soul + amount, this.maxSoul);
    }

    getAttackHitbox() {
        if (!this.isAttacking) return null;
        
        return {
            x: this.facingRight ? this.x + this.width : this.x - CONFIG.PLAYER.ATTACK_RANGE,
            y: this.y,
            width: CONFIG.PLAYER.ATTACK_RANGE,
            height: this.height
        };
    }

    getSpellHitbox() {
        return {
            x: this.getCenterX() - CONFIG.PLAYER.SPELL_RANGE,
            y: this.getCenterY() - CONFIG.PLAYER.SPELL_RANGE,
            width: CONFIG.PLAYER.SPELL_RANGE * 2,
            height: CONFIG.PLAYER.SPELL_RANGE * 2
        };
    }

    draw(ctx) {
        ctx.save();
        
        if (this.isInvincible && Math.floor(this.invincibleTimer / 3) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        const cx = this.getCenterX();
        const cy = this.getCenterY();
        
        ctx.fillStyle = '#0a0510';
        ctx.strokeStyle = '#d0c8f0';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.ellipse(cx, cy, 11, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy - 18);
        ctx.quadraticCurveTo(cx - 5, cy - 28, cx - 2, cy - 32);
        ctx.quadraticCurveTo(cx, cy - 36, cx + 2, cy - 32);
        ctx.quadraticCurveTo(cx + 5, cy - 28, cx + 8, cy - 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.ellipse(cx - 4, cy - 8, 2.5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 4, cy - 8, 2.5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = '#d0c8f0';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy - 5);
        ctx.quadraticCurveTo(cx - 14, cy + 5, cx - 12, cy + 15);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(cx + 8, cy - 5);
        ctx.quadraticCurveTo(cx + 14, cy + 5, cx + 12, cy + 15);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(cx - 4, cy + 15);
        ctx.lineTo(cx - 6, cy + 28);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(cx + 4, cy + 15);
        ctx.lineTo(cx + 6, cy + 28);
        ctx.stroke();
        
        const nailOffset = this.isAttacking ? (this.facingRight ? 30 : -30) : 0;
        const nailRotation = this.isAttacking ? (this.facingRight ? -0.8 : 0.8) : 0;
        
        ctx.save();
        ctx.translate(cx + (this.facingRight ? 12 : -12) + nailOffset, cy - 5);
        ctx.rotate((this.facingRight ? 0.4 : -0.4) + nailRotation);
        
        ctx.fillStyle = '#807090';
        ctx.strokeStyle = '#b0a0d0';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.moveTo(-2, 10);
        ctx.lineTo(2, 10);
        ctx.lineTo(1.5, -25);
        ctx.lineTo(0, -32);
        ctx.lineTo(-1.5, -25);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#504060';
        ctx.fillRect(-4, 10, 8, 6);
        
        ctx.restore();
        
        if (this.isDashing) {
            ctx.fillStyle = 'rgba(100, 60, 160, 0.4)';
            ctx.strokeStyle = 'rgba(160, 120, 220, 0.3)';
            ctx.lineWidth = 1;
            for (let i = 1; i <= 3; i++) {
                ctx.globalAlpha = 0.4 - i * 0.1;
                ctx.beginPath();
                ctx.ellipse(
                    cx - (this.facingRight ? i * 12 : -i * 12),
                    cy,
                    8 - i * 1.5,
                    14 - i * 2,
                    0, 0, Math.PI * 2
                );
                ctx.fill();
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }

    getState() {
        return {
            x: this.x,
            y: this.y,
            health: this.health,
            soul: this.soul,
            attack: this.attack,
            speed: this.speed,
            jumpPower: this.jumpPower,
            facingRight: this.facingRight,
            abilities: { ...this.abilities }
        };
    }
}