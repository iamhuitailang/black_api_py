class Ball {
    constructor(x, y) {
        this.x = x || CONFIG.CANVAS_WIDTH / 2;
        this.y = y || CONFIG.TABLE.NET_Y;
        this.vx = 0;
        this.vy = 0;
        this.radius = CONFIG.BALL.RADIUS;
        this.spin = CONFIG.SPIN.NONE;
        this.spinStrength = 0;
        this.trail = [];
        this.active = false;
        this.lastHitBy = null;
        this.bounceCount = 0;
    }

    update(dt) {
        if (!this.active) return;

        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > CONFIG.BALL.TRAIL_LENGTH) {
            this.trail.shift();
        }

        this.applySpinEffect();

        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > CONFIG.BALL.MAX_SPEED) {
            const scale = CONFIG.BALL.MAX_SPEED / speed;
            this.vx *= scale;
            this.vy *= scale;
        }

        this.x += this.vx;
        this.y += this.vy;

        this.checkTableBounds();
    }

    applySpinEffect() {
        if (this.spin === CONFIG.SPIN.NONE || this.spinStrength === 0) return;

        const effect = this.spinStrength * CONFIG.SPIN.EFFECT;

        switch (this.spin) {
            case CONFIG.SPIN.TOPSPIN:
                this.vy += effect * 0.15;
                break;
            case CONFIG.SPIN.BACKSPIN:
                this.vy -= effect * 0.1;
                break;
            case CONFIG.SPIN.SIDESPIN_LEFT:
                this.vx -= effect * 0.15;
                break;
            case CONFIG.SPIN.SIDESPIN_RIGHT:
                this.vx += effect * 0.15;
                break;
        }

        this.spinStrength *= 0.995;
        if (this.spinStrength < 0.05) {
            this.spin = CONFIG.SPIN.NONE;
            this.spinStrength = 0;
        }
    }

    checkTableBounds() {
        if (this.x - this.radius < CONFIG.TABLE.LEFT) {
            this.x = CONFIG.TABLE.LEFT + this.radius;
            this.vx = Math.abs(this.vx) * 0.9;
            this.spinStrength *= 0.7;
        }
        if (this.x + this.radius > CONFIG.TABLE.RIGHT) {
            this.x = CONFIG.TABLE.RIGHT - this.radius;
            this.vx = -Math.abs(this.vx) * 0.9;
            this.spinStrength *= 0.7;
        }
    }

    hit(angle, speed, spin = CONFIG.SPIN.NONE, spinStrength = 0) {
        const rad = angle * Math.PI / 180;
        this.vx = Math.cos(rad) * speed;
        this.vy = Math.sin(rad) * speed;
        this.spin = spin;
        this.spinStrength = spinStrength;
        this.active = true;
        this.bounceCount = 0;
    }

    serve(fromPlayer = true) {
        this.trail = [];
        if (fromPlayer) {
            this.x = CONFIG.TABLE.LEFT + (CONFIG.TABLE.RIGHT - CONFIG.TABLE.LEFT) / 2;
            this.y = CONFIG.TABLE.BOTTOM - 60;
            const angle = -90 + (Math.random() - 0.5) * 35;
            this.hit(angle, CONFIG.BALL.BASE_SPEED * 0.75);
            this.lastHitBy = 'player';
        } else {
            this.x = CONFIG.TABLE.LEFT + (CONFIG.TABLE.RIGHT - CONFIG.TABLE.LEFT) / 2;
            this.y = CONFIG.TABLE.TOP + 60;
            const angle = 90 + (Math.random() - 0.5) * 35;
            this.hit(angle, CONFIG.BALL.BASE_SPEED * 0.75);
            this.lastHitBy = 'ai';
        }
    }

    isOnPlayerSide() {
        return this.y > CONFIG.TABLE.NET_Y;
    }

    isOnAISide() {
        return this.y < CONFIG.TABLE.NET_Y;
    }

    crossedNet() {
        if (this.lastHitBy === 'player' && this.y < CONFIG.TABLE.NET_Y) {
            return true;
        }
        if (this.lastHitBy === 'ai' && this.y > CONFIG.TABLE.NET_Y) {
            return true;
        }
        return false;
    }

    isOutOfBounds() {
        return this.y < CONFIG.TABLE.TOP - this.radius * 3 || 
               this.y > CONFIG.TABLE.BOTTOM + this.radius * 3;
    }

    checkPaddleCollision(paddle) {
        const paddleLeft = paddle.x - paddle.width / 2;
        const paddleRight = paddle.x + paddle.width / 2;
        const paddleTop = paddle.y - paddle.height / 2;
        const paddleBottom = paddle.y + paddle.height / 2;

        if (this.x + this.radius < paddleLeft || this.x - this.radius > paddleRight) {
            return false;
        }
        if (this.y + this.radius < paddleTop || this.y - this.radius > paddleBottom) {
            return false;
        }

        return true;
    }

    reset() {
        this.x = CONFIG.CANVAS_WIDTH / 2;
        this.y = CONFIG.TABLE.NET_Y;
        this.vx = 0;
        this.vy = 0;
        this.spin = CONFIG.SPIN.NONE;
        this.spinStrength = 0;
        this.trail = [];
        this.active = false;
        this.lastHitBy = null;
        this.bounceCount = 0;
    }

    serialize() {
        return {
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            spin: this.spin,
            spinStrength: this.spinStrength,
            active: this.active,
            lastHitBy: this.lastHitBy,
            bounceCount: this.bounceCount
        };
    }

    static deserialize(data) {
        const ball = new Ball(data.x, data.y);
        ball.vx = data.vx;
        ball.vy = data.vy;
        ball.spin = data.spin;
        ball.spinStrength = data.spinStrength;
        ball.active = data.active;
        ball.lastHitBy = data.lastHitBy;
        ball.bounceCount = data.bounceCount;
        return ball;
    }
}
