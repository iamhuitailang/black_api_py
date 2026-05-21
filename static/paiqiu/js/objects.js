class Ball {
    constructor(x, y) {
        this.x = x || CONFIG.NET.X;
        this.y = y || CONFIG.NET.TOP;
        this.vx = 0;
        this.vy = 0;
        this.radius = CONFIG.BALL.RADIUS;
        this.trail = [];
        this.isSpiking = false;
        this.lastHitBy = null;
    }

    update(environment) {
        this.vy += CONFIG.BALL.GRAVITY;
        
        if (environment && environment.effect === 'wind') {
            this.vx += (Math.random() - 0.5) * 0.3;
        }
        
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > CONFIG.BALL.MAX_SPEED) {
            this.vx = (this.vx / speed) * CONFIG.BALL.MAX_SPEED;
            this.vy = (this.vy / speed) * CONFIG.BALL.MAX_SPEED;
        }
        
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.isSpiking) {
            this.trail.unshift({ x: this.x, y: this.y, alpha: 1 });
            if (this.trail.length > 10) {
                this.trail.pop();
            }
            this.trail.forEach((t, i) => {
                t.alpha = 1 - (i / this.trail.length);
            });
        } else {
            this.trail = [];
        }
        
        this.boundaryCheck();
    }

    boundaryCheck() {
        const court = CONFIG.COURT;
        const groundY = court.Y + court.HEIGHT;
        
        if (this.x < court.X + this.radius) {
            this.x = court.X + this.radius;
            this.vx = -this.vx * CONFIG.BALL.BOUNCE;
        }
        if (this.x > court.X + court.WIDTH - this.radius) {
            this.x = court.X + court.WIDTH - this.radius;
            this.vx = -this.vx * CONFIG.BALL.BOUNCE;
        }
        
        if (this.y + this.radius > groundY) {
            this.y = groundY - this.radius;
            this.vy = -this.vy * CONFIG.BALL.BOUNCE;
            this.vx *= 0.8;
        }
    }

    hit(angle, power, isSpike = false, hitter = null) {
        this.vx = Math.cos(angle) * power;
        this.vy = Math.sin(angle) * power;
        this.isSpiking = isSpike;
        this.lastHitBy = hitter;
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.trail = [];
        this.isSpiking = false;
        this.lastHitBy = null;
    }

    serialize() {
        return {
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            radius: this.radius,
            trail: this.trail,
            isSpiking: this.isSpiking,
            lastHitBy: this.lastHitBy
        };
    }

    static deserialize(data) {
        const ball = new Ball(data.x, data.y);
        ball.vx = data.vx;
        ball.vy = data.vy;
        ball.radius = data.radius;
        ball.trail = data.trail || [];
        ball.isSpiking = data.isSpiking || false;
        ball.lastHitBy = data.lastHitBy;
        return ball;
    }
}

class Player {
    constructor(x, y, isEnemy = false) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.width = CONFIG.PLAYER.WIDTH;
        this.height = CONFIG.PLAYER.HEIGHT;
        this.isEnemy = isEnemy;
        this.isJumping = false;
        this.isBlocking = false;
        this.isReceiving = false;
        this.isSpiking = false;
        this.groundY = y;
        this.animFrame = 0;
        this.animTimer = 0;
    }

    update() {
        if (this.isJumping) {
            this.vy += CONFIG.BALL.GRAVITY * 0.8;
            this.y += this.vy;
            
            if (this.y >= this.groundY) {
                this.y = this.groundY;
                this.vy = 0;
                this.isJumping = false;
                this.isBlocking = false;
            }
        }
        
        this.x += this.vx;
        
        const court = CONFIG.COURT;
        const netX = CONFIG.NET.X;
        
        const courtLeft = court.X + 80;
        const courtRight = court.X + court.WIDTH - this.width - 80;
        const netLeft = netX - this.width - 80;
        const netRight = netX + 80;
        
        if (this.isEnemy) {
            this.x = Math.max(netRight, Math.min(courtRight, this.x));
        } else {
            this.x = Math.max(courtLeft, Math.min(netLeft, this.x));
        }
        
        this.animTimer++;
        if (this.animTimer > 10) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
    }

    jump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.vy = -CONFIG.PLAYER.JUMP_FORCE;
        }
    }

    block() {
        if (!this.isJumping) {
            this.jump();
            this.isBlocking = true;
        } else {
            this.isBlocking = true;
        }
    }

    receive() {
        this.isReceiving = true;
        setTimeout(() => {
            this.isReceiving = false;
        }, 300);
    }

    spike() {
        this.isSpiking = true;
        setTimeout(() => {
            this.isSpiking = false;
        }, 300);
    }

    moveLeft(speed = CONFIG.PLAYER.SPEED) {
        this.vx = -speed;
    }

    moveRight(speed = CONFIG.PLAYER.SPEED) {
        this.vx = speed;
    }

    stop() {
        this.vx = 0;
    }

    getHitbox() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.isJumping ? this.height + 30 : this.height
        };
    }

    canReachBall(ball) {
        const hitbox = this.getHitbox();
        const reachX = ball.x > hitbox.x - 30 && ball.x < hitbox.x + hitbox.width + 30;
        const reachY = ball.y > hitbox.y - 60 && ball.y < hitbox.y + hitbox.height + 30;
        return reachX && reachY;
    }

    serialize() {
        return {
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            width: this.width,
            height: this.height,
            isEnemy: this.isEnemy,
            isJumping: this.isJumping,
            isBlocking: this.isBlocking,
            isReceiving: this.isReceiving,
            isSpiking: this.isSpiking,
            groundY: this.groundY
        };
    }

    static deserialize(data) {
        const player = new Player(data.x, data.y, data.isEnemy);
        player.vx = data.vx;
        player.vy = data.vy;
        player.width = data.width;
        player.height = data.height;
        player.isJumping = data.isJumping;
        player.isBlocking = data.isBlocking;
        player.isReceiving = data.isReceiving;
        player.isSpiking = data.isSpiking;
        player.groundY = data.groundY;
        return player;
    }
}

class AIController {
    constructor(player, ball, opponentConfig) {
        this.player = player;
        this.ball = ball;
        this.config = opponentConfig;
        this.targetX = player.x;
        this.reactionTimer = 0;
        this.decision = null;
        this.decisionTimer = 0;
    }

    update() {
        this.reactionTimer++;
        
        if (this.reactionTimer < this.config.reactionTime / 16) {
            return;
        }
        
        this.makeDecision();
        this.executeDecision();
    }

    makeDecision() {
        this.decisionTimer++;
        if (this.decisionTimer < 30) return;
        this.decisionTimer = 0;
        
        const ball = this.ball;
        const player = this.player;
        
        if (ball.vx < 0) {
            this.targetX = ball.x + 50;
            this.decision = 'move';
        } else {
            const predictedX = this.predictBallLanding();
            this.targetX = predictedX - player.width / 2;
            
            const distance = Math.abs(ball.x - (player.x + player.width / 2));
            const canReach = distance < 100 && ball.y < CONFIG.NET.TOP + 100;
            
            if (canReach && Math.random() < this.config.difficulty * 0.7) {
                this.decision = 'spike';
            } else if (ball.y < CONFIG.NET.TOP + 50 && Math.abs(ball.x - player.x) < 60) {
                this.decision = 'block';
            } else {
                this.decision = 'move';
            }
        }
    }

    predictBallLanding() {
        let x = this.ball.x;
        let y = this.ball.y;
        let vx = this.ball.vx;
        let vy = this.ball.vy;
        const groundY = CONFIG.COURT.Y + CONFIG.COURT.HEIGHT;
        
        while (y < groundY) {
            vy += CONFIG.BALL.GRAVITY;
            x += vx;
            y += vy;
            if (x < CONFIG.COURT.X || x > CONFIG.COURT.X + CONFIG.COURT.WIDTH) {
                vx *= -CONFIG.BALL.BOUNCE;
            }
        }
        
        return x;
    }

    executeDecision() {
        const player = this.player;
        const speed = CONFIG.PLAYER.SPEED * this.config.moveSpeed;
        
        switch (this.decision) {
            case 'move':
                if (player.x < this.targetX - 10) {
                    player.moveRight(speed);
                } else if (player.x > this.targetX + 10) {
                    player.moveLeft(speed);
                } else {
                    player.stop();
                }
                break;
                
            case 'spike':
                if (player.canReachBall(this.ball)) {
                    player.jump();
                    player.spike();
                    this.performSpike();
                }
                break;
                
            case 'block':
                if (Math.abs(this.ball.x - player.x) < 80) {
                    player.block();
                }
                break;
        }
    }

    performSpike() {
        if (this.ball.lastHitBy !== 'enemy' && this.player.canReachBall(this.ball)) {
            const angle = Math.PI + Math.PI / 4 + (Math.random() - 0.5) * 0.4;
            const power = 12 * this.config.spikePower;
            this.ball.hit(angle, power, true, 'enemy');
        }
    }

    serialize() {
        return {
            targetX: this.targetX,
            reactionTimer: this.reactionTimer,
            decision: this.decision,
            decisionTimer: this.decisionTimer
        };
    }

    deserialize(data) {
        this.targetX = data.targetX;
        this.reactionTimer = data.reactionTimer;
        this.decision = data.decision;
        this.decisionTimer = data.decisionTimer;
    }
}

class EffectsManager {
    constructor() {
        this.effects = [];
    }

    addEffect(type, x, y, params = {}) {
        this.effects.push({
            type,
            x,
            y,
            frame: 0,
            maxFrames: params.duration || 30,
            params
        });
    }

    update() {
        this.effects = this.effects.filter(effect => {
            effect.frame++;
            return effect.frame < effect.maxFrames;
        });
    }

    addScoreFlash(x, y) {
        this.addEffect('scoreFlash', x, y, { duration: 40 });
    }

    addNetShake() {
        this.addEffect('netShake', CONFIG.NET.X, CONFIG.NET.TOP, { duration: 20 });
    }

    addSpikeEffect(x, y) {
        this.addEffect('spike', x, y, { duration: 30 });
    }

    serialize() {
        return {
            effects: this.effects
        };
    }

    deserialize(data) {
        this.effects = data.effects || [];
    }
}
