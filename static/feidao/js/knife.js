class Knife {
    constructor(x, y, angle, power, typeId) {
        const config = GameData.getKnifeConfig(typeId);
        this.x = x;
        this.y = y;
        this.initialX = x;
        this.initialY = y;
        this.angle = angle * Math.PI / 180;
        this.power = power;
        this.typeId = typeId;
        this.config = config;
        this.speedMultiplier = config.speedMultiplier;
        this.gravityMultiplier = config.gravityMultiplier;
        this.damage = config.damage;
        this.color = config.color;
        this.bladeColor = config.bladeColor;
        this.boomerang = config.boomerang || false;
        
        const throwConfig = GameData.getThrowConfig('medium');
        const baseSpeed = throwConfig.speed * (power / 50);
        this.vx = Math.cos(this.angle) * baseSpeed * this.speedMultiplier;
        this.vy = -Math.sin(this.angle) * baseSpeed * this.speedMultiplier;
        
        this.isFlying = true;
        this.isStuck = false;
        this.stuckTarget = null;
        this.rotation = 0;
        this.rotationSpeed = 0.3;
        this.length = 40;
        this.width = 8;
        this.trail = [];
        this.maxTrailLength = 10;
        this.boomerangPhase = 0;
        this.boomerangReturned = false;
    }

    update(gravity) {
        if (!this.isFlying || this.isStuck) return;

        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        if (this.boomerang) {
            this.boomerangPhase += 0.05;
            if (this.boomerangPhase > Math.PI && !this.boomerangReturned) {
                this.boomerangReturned = true;
                this.vx *= -0.8;
                this.vy *= -0.5;
            }
        }

        this.vy += gravity * this.gravityMultiplier;
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;

        if (this.x < -50 || this.x > GameConfig.CANVAS_WIDTH + 50 ||
            this.y < -50 || this.y > GameConfig.CANVAS_HEIGHT + 50) {
            this.isFlying = false;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const angle = Math.atan2(this.vy, this.vx);
        ctx.rotate(angle);

        if (this.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x - this.x, this.trail[0].y - this.y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x - this.x, this.trail[i].y - this.y);
            }
            ctx.strokeStyle = this.bladeColor + '40';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        ctx.fillStyle = this.bladeColor;
        ctx.beginPath();
        ctx.moveTo(this.length / 2, 0);
        ctx.lineTo(0, -this.width / 2);
        ctx.lineTo(-this.length / 2, -this.width / 3);
        ctx.lineTo(-this.length / 2, this.width / 3);
        ctx.lineTo(0, this.width / 2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = this.color;
        ctx.fillRect(-this.length / 2 - 10, -this.width / 2, 12, this.width);

        ctx.fillStyle = '#FFD700';
        ctx.fillRect(-this.length / 2 - 12, -this.width / 2 - 2, 4, this.width + 4);

        ctx.restore();
    }

    getBounds() {
        return {
            x: this.x - this.length / 2,
            y: this.y - this.width / 2,
            width: this.length,
            height: this.width
        };
    }

    stickToTarget(target, hitX, hitY) {
        this.isStuck = true;
        this.isFlying = false;
        this.stuckTarget = target;
        this.stickOffsetX = hitX - target.x;
        this.stickOffsetY = hitY - target.y;
        this.stickAngle = Math.atan2(this.vy, this.vx);
    }

    updateStuckPosition() {
        if (this.isStuck && this.stuckTarget) {
            const angle = this.stuckTarget.angle || 0;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const rotatedX = this.stickOffsetX * cos - this.stickOffsetY * sin;
            const rotatedY = this.stickOffsetX * sin + this.stickOffsetY * cos;
            this.x = this.stuckTarget.x + rotatedX;
            this.y = this.stuckTarget.y + rotatedY;
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Knife;
}
