class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.PLAYER_WIDTH;
        this.height = CONFIG.PLAYER_HEIGHT;
        this.vx = 0;
        this.vy = 0;
        this.grounded = false;
        this.facingRight = true;

        this.rings = 0;
        this.lives = 3;
        this.score = 0;

        this.isSpinning = false;
        this.spinDashCharge = 0;
        this.isRolling = false;

        this.isSuper = false;
        this.superTimer = 0;

        this.hasShield = false;
        this.shieldType = null;

        this.invincible = false;
        this.invincibleTimer = 0;

        this.hurt = false;
        this.hurtTimer = 0;

        this.animFrame = 0;
        this.animTimer = 0;
        this.trail = [];
    }

    update(input, level) {
        const direction = input.getDirection();

        if (input.down && this.grounded && !this.isSpinning) {
            this.isSpinning = true;
            this.spinDashCharge = 0;
        }

        if (this.isSpinning) {
            if (input.down) {
                this.spinDashCharge = Math.min(
                    this.spinDashCharge + CONFIG.SPIN_DASH_CHARGE,
                    CONFIG.SPIN_DASH_MAX
                );
            } else {
                this.vx = (this.facingRight ? 1 : -1) * this.spinDashCharge;
                this.isSpinning = false;
                this.spinDashCharge = 0;
                this.isRolling = true;
            }
        }

        if (!this.isSpinning) {
            if (direction.x !== 0) {
                this.vx += direction.x * CONFIG.ACCELERATION;
                this.facingRight = direction.x > 0;
            }
        }

        if (input.jump && this.grounded) {
            this.vy = CONFIG.JUMP_FORCE;
            this.grounded = false;
        }

        if (!this.grounded && input.down && this.vy > 0) {
            this.vy = Math.min(this.vy + 1, 20);
            this.isRolling = true;
        }

        if (input.attack && this.grounded) {
            this.isRolling = true;
        }

        if (this.isRolling && this.grounded && Math.abs(this.vx) < 2) {
            this.isRolling = false;
        }

        if (this.isSuper) {
            this.superTimer--;
            if (this.superTimer <= 0) {
                this.isSuper = false;
            }
            if (this.rings > 0) {
                this.rings -= 0.02;
            }
        }

        if (this.invincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }

        if (this.hurt) {
            this.hurtTimer--;
            if (this.hurtTimer <= 0) {
                this.hurt = false;
            }
        }

        const maxSpeed = this.isSuper 
            ? CONFIG.MAX_SPEED * CONFIG.SUPER_SPEED_MULTIPLIER 
            : CONFIG.MAX_SPEED;
        Physics.limitSpeed(this, maxSpeed);
        Physics.applyGravity(this);
        Physics.applyFriction(this);
        Physics.updatePosition(this);

        if (Math.abs(this.vx) > 8 || this.isSuper) {
            this.trail.push({ x: this.x, y: this.y, alpha: 1 });
            if (this.trail.length > 10) {
                this.trail.shift();
            }
        }
        this.trail = this.trail.filter(t => {
            t.alpha -= 0.1;
            return t.alpha > 0;
        });

        this.animTimer++;
        if (this.animTimer > 6) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
    }

    takeDamage() {
        if (this.invincible || this.hurt) return false;

        if (this.hasShield) {
            this.hasShield = false;
            this.shieldType = null;
            this.invincible = true;
            this.invincibleTimer = 30;
            return true;
        }

        if (this.rings > 0) {
            this.rings = 0;
            this.hurt = true;
            this.hurtTimer = CONFIG.RING_LOSS_TIME;
            this.invincible = true;
            this.invincibleTimer = CONFIG.RING_LOSS_TIME;
            return true;
        }

        this.lives--;
        this.hurt = true;
        this.hurtTimer = 60;
        this.invincible = true;
        this.invincibleTimer = 120;

        return this.lives <= 0;
    }

    collectRing() {
        this.rings++;
        this.score += CONFIG.SCORES.RING;
    }

    collectShield(type = 'normal') {
        this.hasShield = true;
        this.shieldType = type;
    }

    collectInvincibility() {
        this.invincible = true;
        this.invincibleTimer = CONFIG.INVINCIBLE_TIME * 3;
    }

    collect1Up() {
        this.lives++;
    }

    goSuper() {
        if (this.rings >= 50) {
            this.isSuper = true;
            this.superTimer = 600;
            this.invincible = true;
            this.invincibleTimer = 600;
        }
    }

    defeatEnemy() {
        this.score += CONFIG.SCORES.ENEMY;
    }

    draw(ctx, cameraX) {
        const drawX = this.x - cameraX;

        for (const t of this.trail) {
            ctx.globalAlpha = t.alpha * 0.5;
            ctx.fillStyle = this.isSuper ? CONFIG.COLORS.sonicSuper : CONFIG.COLORS.sonic;
            ctx.beginPath();
            ctx.ellipse(
                t.x - cameraX + this.width / 2,
                t.y + this.height / 2,
                this.width / 3,
                this.height / 3,
                0, 0, Math.PI * 2
            );
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        if (this.invincible && Math.floor(this.invincibleTimer / 4) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        ctx.save();
        ctx.translate(drawX + this.width / 2, this.y + this.height / 2);

        if (!this.facingRight) {
            ctx.scale(-1, 1);
        }

        const color = this.isSuper ? CONFIG.COLORS.sonicSuper : CONFIG.COLORS.sonic;
        ctx.fillStyle = color;

        if (this.isRolling || this.isSpinning) {
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            const spinAngle = (this.animFrame / 4) * Math.PI * 2;
            for (let i = 0; i < 3; i++) {
                const angle = spinAngle + (i * Math.PI * 2 / 3);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(
                    Math.cos(angle) * this.width / 3,
                    Math.sin(angle) * this.width / 3
                );
                ctx.stroke();
            }
        } else {
            ctx.beginPath();
            ctx.ellipse(0, 5, this.width / 2 - 2, this.height / 2 - 5, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(5, -15, 18, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(-10, -25);
            ctx.quadraticCurveTo(-25, -35, -30, -20);
            ctx.quadraticCurveTo(-20, -25, -10, -20);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(8, -18, 8, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(10, -18, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(11, -20, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.hasShield) {
            ctx.strokeStyle = CONFIG.COLORS.shield;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 100) * 0.2;
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2 + 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        ctx.restore();

        if (this.isSpinning) {
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            const chargePercent = Math.floor((this.spinDashCharge / CONFIG.SPIN_DASH_MAX) * 100);
            ctx.fillText(`蓄力: ${chargePercent}%`, drawX + this.width / 2, this.y - 20);
        }
    }
}
