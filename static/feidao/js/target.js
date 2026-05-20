class Target {
    constructor(x, y, radius, state, speed) {
        this.x = x;
        this.y = y;
        this.initialX = x;
        this.initialY = y;
        this.radius = radius;
        this.state = state;
        this.speed = speed;
        this.angle = 0;
        this.moveDirection = 1;
        this.moveRange = 100;
        this.hits = 0;
        this.maxHits = 5;
        this.scoreZones = GameData.getTargetScoreZones();
        this.flashTimer = 0;
        this.visible = true;
        this.shakeOffset = { x: 0, y: 0 };
        this.stuckKnives = [];
    }

    update(deltaTime) {
        switch (this.state) {
            case 'static':
                break;
            case 'moving':
                this.x += this.speed * this.moveDirection;
                if (this.x > this.initialX + this.moveRange || this.x < this.initialX - this.moveRange) {
                    this.moveDirection *= -1;
                }
                break;
            case 'rotating':
                this.angle += 0.02 * this.speed;
                break;
            case 'shaking':
                this.shakeOffset.x = (Math.random() - 0.5) * 10 * this.speed;
                this.shakeOffset.y = (Math.random() - 0.5) * 10 * this.speed;
                break;
            case 'flashing':
                this.flashTimer++;
                if (this.flashTimer > 60) {
                    this.flashTimer = 0;
                    this.visible = !this.visible;
                    if (this.visible) {
                        this.x = this.initialX + (Math.random() - 0.5) * 200;
                        this.y = this.initialY + (Math.random() - 0.5) * 100;
                    }
                }
                break;
        }

        this.stuckKnives.forEach(knife => knife.updateStuckPosition());
    }

    draw(ctx) {
        if (!this.visible) return;

        ctx.save();
        ctx.translate(this.x + (this.shakeOffset.x || 0), this.y + (this.shakeOffset.y || 0));
        ctx.rotate(this.angle);

        for (let i = this.scoreZones.length - 1; i >= 0; i--) {
            const zone = this.scoreZones[i];
            ctx.beginPath();
            ctx.arc(0, 0, zone.radius, 0, Math.PI * 2);
            ctx.fillStyle = zone.color;
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#FF0000';
        ctx.fill();

        ctx.restore();

        this.stuckKnives.forEach(knife => knife.draw(ctx));
    }

    checkCollision(knife) {
        if (!this.visible) return null;

        const dx = knife.x - this.x;
        const dy = knife.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= this.radius + 10) {
            for (let i = 0; i < this.scoreZones.length; i++) {
                const zone = this.scoreZones[i];
                if (distance <= zone.radius) {
                    this.hits++;
                    knife.stickToTarget(this, knife.x, knife.y);
                    this.stuckKnives.push(knife);
                    return {
                        score: zone.score,
                        zoneName: zone.name,
                        distance: distance
                    };
                }
            }
        }
        return null;
    }

    getDrawPosition() {
        return {
            x: this.x + (this.shakeOffset.x || 0),
            y: this.y + (this.shakeOffset.y || 0)
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Target;
}
