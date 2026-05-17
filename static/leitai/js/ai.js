class AI {
    constructor(paddle) {
        this.paddle = paddle;
        this.targetX = paddle.x;
        this.reactionTime = 100;
        this.reactionTimer = 0;
        this.accuracy = 0.85;
        this.aggression = 0.55;
        this.hitCooldown = 0;
    }

    update(dt, ball) {
        if (!ball.active) return;

        this.reactionTimer -= dt;
        if (this.hitCooldown > 0) {
            this.hitCooldown -= dt;
        }

        if (ball.isOnAISide() && ball.vy < 0) {
            this.updateDefense(dt, ball);
            this.checkAIShot(ball);
        } else if (ball.isOnPlayerSide() && ball.vy > 0) {
            this.updatePositioning(dt);
        }
    }

    updateDefense(dt, ball) {
        if (this.reactionTimer > 0) return;

        const predictedX = this.predictBallX(ball);
        const error = (1 - this.accuracy) * (Math.random() - 0.5) * 100;
        this.targetX = predictedX + error;

        const dx = this.targetX - this.paddle.x;
        if (Math.abs(dx) > 3) {
            const moveSpeed = Math.min(this.paddle.speed * 0.9, Math.abs(dx));
            this.paddle.x += Math.sign(dx) * moveSpeed;
        }

        const minX = CONFIG.TABLE.LEFT + this.paddle.width / 2;
        const maxX = CONFIG.TABLE.RIGHT - this.paddle.width / 2;
        this.paddle.x = Math.max(minX, Math.min(maxX, this.paddle.x));
    }

    updatePositioning(dt) {
        const centerX = (CONFIG.TABLE.LEFT + CONFIG.TABLE.RIGHT) / 2;
        const dx = centerX - this.paddle.x;
        if (Math.abs(dx) > 8) {
            this.paddle.x += Math.sign(dx) * 2;
        }
    }

    predictBallX(ball) {
        const timeToReach = (this.paddle.y - ball.y) / ball.vy;
        if (timeToReach <= 0) return ball.x;

        let predictedX = ball.x + ball.vx * timeToReach;
        let tempVx = ball.vx;

        for (let t = 0; t < timeToReach; t += 16) {
            if (ball.spin === CONFIG.SPIN.SIDESPIN_LEFT) {
                tempVx -= ball.spinStrength * CONFIG.SPIN.EFFECT * 0.15;
            } else if (ball.spin === CONFIG.SPIN.SIDESPIN_RIGHT) {
                tempVx += ball.spinStrength * CONFIG.SPIN.EFFECT * 0.15;
            }
            predictedX += tempVx * (16 / 1000);

            if (predictedX < CONFIG.TABLE.LEFT + ball.radius) {
                predictedX = CONFIG.TABLE.LEFT + ball.radius;
                tempVx = Math.abs(tempVx);
            }
            if (predictedX > CONFIG.TABLE.RIGHT - ball.radius) {
                predictedX = CONFIG.TABLE.RIGHT - ball.radius;
                tempVx = -Math.abs(tempVx);
            }
        }

        return predictedX;
    }

    checkAIShot(ball) {
        if (this.hitCooldown > 0) return;
        if (!this.checkCollision(ball)) return;

        this.paddle.hitEffect = 1;
        this.hitCooldown = 150;
        this.reactionTimer = this.reactionTime;

        const shotType = this.chooseShotType(ball);
        this.performAIShot(ball, shotType);
    }

    checkCollision(ball) {
        const paddleLeft = this.paddle.x - this.paddle.width / 2;
        const paddleRight = this.paddle.x + this.paddle.width / 2;
        const paddleTop = this.paddle.y - this.paddle.height / 2;
        const paddleBottom = this.paddle.y + this.paddle.height / 2;

        const ballLeft = ball.x - ball.radius;
        const ballRight = ball.x + ball.radius;
        const ballTop = ball.y - ball.radius;
        const ballBottom = ball.y + ball.radius;

        if (ballRight < paddleLeft || ballLeft > paddleRight) return false;
        if (ballBottom < paddleTop || ballTop > paddleBottom) return false;

        return true;
    }

    chooseShotType(ball) {
        const roll = Math.random();
        const ballSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);

        if (ballSpeed > CONFIG.BALL.BASE_SPEED * 1.5) {
            if (roll < 0.7) return CONFIG.SHOT.CHOP;
            return CONFIG.SHOT.NORMAL;
        }

        if (this.aggression > 0.6 && roll < 0.35) {
            return CONFIG.SHOT.SMASH;
        }

        if (roll < 0.2) {
            return CONFIG.SHOT.TOPSPIN_LOOP;
        }

        if (roll < 0.45) {
            return CONFIG.SHOT.FLICK;
        }

        return CONFIG.SHOT.NORMAL;
    }

    performAIShot(ball, shotType) {
        const hitPos = (ball.x - this.paddle.x) / (this.paddle.width / 2);
        let angle, speed, spin, spinStrength;

        switch (shotType) {
            case CONFIG.SHOT.NORMAL:
                angle = 90 + hitPos * 35;
                speed = CONFIG.BALL.BASE_SPEED * 1.25;
                spin = CONFIG.SPIN.NONE;
                spinStrength = 0;
                break;

            case CONFIG.SHOT.SMASH:
                angle = 90 + hitPos * 20;
                speed = CONFIG.BALL.MAX_SPEED * 0.8;
                spin = CONFIG.SPIN.TOPSPIN;
                spinStrength = 3.5;
                break;

            case CONFIG.SHOT.CHOP:
                angle = 90 + hitPos * 50;
                speed = CONFIG.BALL.BASE_SPEED * 0.85;
                spin = CONFIG.SPIN.BACKSPIN;
                spinStrength = 4.5;
                break;

            case CONFIG.SHOT.FLICK:
                angle = 90 + hitPos * 15;
                speed = CONFIG.BALL.BASE_SPEED * 1.5;
                spin = CONFIG.SPIN.NONE;
                spinStrength = 0;
                break;

            case CONFIG.SHOT.TOPSPIN_LOOP:
                angle = 90 + hitPos * 25;
                speed = CONFIG.BALL.BASE_SPEED * 1.4;
                spin = CONFIG.SPIN.TOPSPIN;
                spinStrength = 5;
                break;

            default:
                angle = 90;
                speed = CONFIG.BALL.BASE_SPEED;
                spin = CONFIG.SPIN.NONE;
                spinStrength = 0;
        }

        ball.y = this.paddle.y + this.paddle.height / 2 + ball.radius + 2;
        ball.hit(angle, speed, spin, spinStrength);
        ball.lastHitBy = 'ai';
    }

    serve() {
        const serveType = Math.random();
        let angle, speed, spin, spinStrength;

        if (serveType < 0.3) {
            angle = 90 + (Math.random() - 0.5) * 40;
            speed = CONFIG.BALL.BASE_SPEED * 0.8;
            spin = CONFIG.SPIN.SIDESPIN_LEFT;
            spinStrength = 3;
        } else if (serveType < 0.6) {
            angle = 90 + (Math.random() - 0.5) * 40;
            speed = CONFIG.BALL.BASE_SPEED * 0.8;
            spin = CONFIG.SPIN.SIDESPIN_RIGHT;
            spinStrength = 3;
        } else {
            angle = 90 + (Math.random() - 0.5) * 25;
            speed = CONFIG.BALL.BASE_SPEED * 0.95;
            spin = CONFIG.SPIN.NONE;
            spinStrength = 0;
        }

        this.paddle.x = (CONFIG.TABLE.LEFT + CONFIG.TABLE.RIGHT) / 2 + (Math.random() - 0.5) * 100;
        
        return { angle, speed, spin, spinStrength };
    }
}
