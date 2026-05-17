class Paddle {
    constructor(x, y, isPlayer = true) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.PADDLE.WIDTH;
        this.height = CONFIG.PADDLE.HEIGHT;
        this.isPlayer = isPlayer;
        this.color = isPlayer ? CONFIG.PADDLE.COLOR : CONFIG.PADDLE.AI_COLOR;
        this.speed = CONFIG.PADDLE.SPEED;
        this.isChopping = false;
        this.chopTimer = 0;
        this.hitEffect = 0;
        this.hitCooldown = 0;
    }

    update(dt) {
        if (this.isPlayer) {
            this.updatePlayer();
        }

        if (this.isChopping) {
            this.chopTimer -= dt;
            if (this.chopTimer <= 0) {
                this.isChopping = false;
            }
        }

        if (this.hitEffect > 0) {
            this.hitEffect -= dt * 4;
            if (this.hitEffect < 0) this.hitEffect = 0;
        }

        if (this.hitCooldown > 0) {
            this.hitCooldown -= dt;
        }
    }

    updatePlayer() {
        if (Input.getLeft()) {
            this.x -= this.speed;
        }
        if (Input.getRight()) {
            this.x += this.speed;
        }

        if (Input.isKeyPressed('ArrowDown') || Input.isKeyPressed('KeyS')) {
            this.isChopping = true;
            this.chopTimer = 350;
        }

        const minX = CONFIG.TABLE.LEFT + this.width / 2;
        const maxX = CONFIG.TABLE.RIGHT - this.width / 2;
        this.x = Math.max(minX, Math.min(maxX, this.x));
    }

    checkShot(ball) {
        if (!this.isPlayer) return null;
        if (this.hitCooldown > 0) return null;

        let shotType = null;

        if (Input.checkTopspinSequence()) {
            shotType = CONFIG.SHOT.TOPSPIN_LOOP;
        } else if (Input.getSmash()) {
            shotType = CONFIG.SHOT.SMASH;
        } else if (Input.getFlick()) {
            shotType = CONFIG.SHOT.FLICK;
        } else if (Input.getNormalShot()) {
            shotType = this.isChopping ? CONFIG.SHOT.CHOP : CONFIG.SHOT.NORMAL;
        }

        if (shotType) {
            return this.performShot(ball, shotType);
        }

        return null;
    }

    performShot(ball, shotType) {
        if (!ball.active) return null;
        if (!this.checkCollision(ball)) return null;

        this.hitEffect = 1;
        this.hitCooldown = 120;

        const hitPos = (ball.x - this.x) / (this.width / 2);
        let angle, speed, spin, spinStrength;

        switch (shotType) {
            case CONFIG.SHOT.NORMAL:
                angle = -90 + hitPos * 35;
                speed = CONFIG.BALL.BASE_SPEED * 1.2;
                spin = CONFIG.SPIN.NONE;
                spinStrength = 0;
                break;

            case CONFIG.SHOT.SMASH:
                angle = -90 + hitPos * 20;
                speed = CONFIG.BALL.MAX_SPEED * 0.8;
                spin = CONFIG.SPIN.TOPSPIN;
                spinStrength = 4;
                break;

            case CONFIG.SHOT.CHOP:
                angle = -90 + hitPos * 50;
                speed = CONFIG.BALL.BASE_SPEED * 0.9;
                spin = CONFIG.SPIN.BACKSPIN;
                spinStrength = 5;
                break;

            case CONFIG.SHOT.FLICK:
                angle = -90 + hitPos * 15;
                speed = CONFIG.BALL.BASE_SPEED * 1.5;
                spin = CONFIG.SPIN.NONE;
                spinStrength = 0;
                break;

            case CONFIG.SHOT.TOPSPIN_LOOP:
                angle = -90 + hitPos * 25;
                speed = CONFIG.BALL.BASE_SPEED * 1.4;
                spin = CONFIG.SPIN.TOPSPIN;
                spinStrength = 6;
                break;

            default:
                angle = -90;
                speed = CONFIG.BALL.BASE_SPEED;
                spin = CONFIG.SPIN.NONE;
                spinStrength = 0;
        }

        ball.y = this.y - this.height / 2 - ball.radius - 2;
        ball.hit(angle, speed, spin, spinStrength);
        ball.lastHitBy = 'player';

        return {
            type: shotType,
            x: ball.x,
            y: ball.y
        };
    }

    checkCollision(ball) {
        const paddleLeft = this.x - this.width / 2;
        const paddleRight = this.x + this.width / 2;
        const paddleTop = this.y - this.height / 2;
        const paddleBottom = this.y + this.height / 2;

        const ballLeft = ball.x - ball.radius;
        const ballRight = ball.x + ball.radius;
        const ballTop = ball.y - ball.radius;
        const ballBottom = ball.y + ball.radius;

        if (ballRight < paddleLeft || ballLeft > paddleRight) return false;
        if (ballBottom < paddleTop || ballTop > paddleBottom) return false;

        return true;
    }

    serialize() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            isPlayer: this.isPlayer
        };
    }

    static deserialize(data) {
        const paddle = new Paddle(data.x, data.y, data.isPlayer);
        paddle.width = data.width;
        paddle.height = data.height;
        return paddle;
    }
}
