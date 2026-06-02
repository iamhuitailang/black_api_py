class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(v) { return new Vector2(this.x + v.x, this.y + v.y); }
    sub(v) { return new Vector2(this.x - v.x, this.y - v.y); }
    mul(s) { return new Vector2(this.x * s, this.y * s); }
    div(s) { return new Vector2(this.x / s, this.y / s); }
    length() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    normalize() { const l = this.length(); return l ? this.div(l) : new Vector2(0, 0); }
    dot(v) { return this.x * v.x + this.y * v.y; }
    clone() { return new Vector2(this.x, this.y); }
}

class Ball {
    constructor(x, y, radius = 7) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.radius = radius;
        this.active = true;
    }

    update(gravity, friction, dt) {
        if (!this.active) return;
        this.velocity = this.velocity.add(gravity.mul(dt));
        this.velocity = this.velocity.mul(friction);
        this.position = this.position.add(this.velocity.mul(dt));
    }

    applyForce(fx, fy) {
        this.velocity.x += fx;
        this.velocity.y += fy;
    }
}

class Bumper {
    constructor(x, y, radius = 28, score = 100, color = '#ff6b6b') {
        this.position = new Vector2(x, y);
        this.radius = radius;
        this.score = score;
        this.color = color;
        this.hitAnim = 0;
    }

    checkHit(ball) {
        const dx = ball.position.x - this.position.x;
        const dy = ball.position.y - this.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = ball.radius + this.radius;

        if (dist < minDist && dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = minDist - dist;

            ball.position.x += nx * (overlap + 1);
            ball.position.y += ny * (overlap + 1);

            const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);
            const bounce = Math.max(speed * 1.3, 10);
            ball.velocity.x = nx * bounce;
            ball.velocity.y = ny * bounce;

            this.hitAnim = 1;
            return { hit: true, score: this.score, comboAdd: 10 };
        }
        return { hit: false };
    }

    update() {
        if (this.hitAnim > 0) {
            this.hitAnim -= 0.06;
            if (this.hitAnim < 0) this.hitAnim = 0;
        }
    }
}

class Target {
    constructor(x, y, radius = 18, score = 500, color = '#4ecdc4') {
        this.position = new Vector2(x, y);
        this.radius = radius;
        this.score = score;
        this.color = color;
        this.active = true;
        this.hitAnim = 0;
    }

    checkHit(ball) {
        if (!this.active) return { hit: false };

        const dx = ball.position.x - this.position.x;
        const dy = ball.position.y - this.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = ball.radius + this.radius;

        if (dist < minDist && dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = minDist - dist;

            ball.position.x += nx * (overlap + 1);
            ball.position.y += ny * (overlap + 1);

            ball.velocity.x = nx * Math.max(Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2), 6);
            ball.velocity.y = ny * Math.max(Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2), 6);

            this.active = false;
            this.hitAnim = 1;
            return { hit: true, score: this.score, comboAdd: 50 };
        }
        return { hit: false };
    }

    update() {
        if (this.hitAnim > 0) {
            this.hitAnim -= 0.03;
            if (this.hitAnim < 0) this.hitAnim = 0;
        }
    }

    reset() { this.active = true; this.hitAnim = 0; }
}

class Wall {
    constructor(x1, y1, x2, y2, rest = 0.7) {
        this.x1 = x1; this.y1 = y1;
        this.x2 = x2; this.y2 = y2;
        this.rest = rest;
    }

    checkHit(ball) {
        const dx = this.x2 - this.x1;
        const dy = this.y2 - this.y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) return;

        const nx = dx / len;
        const ny = dy / len;

        const bx = ball.position.x - this.x1;
        const by = ball.position.y - this.y1;
        const proj = bx * nx + by * ny;
        const projClamp = Math.max(0, Math.min(len, proj));

        const cx = this.x1 + nx * projClamp;
        const cy = this.y1 + ny * projClamp;

        const diffX = ball.position.x - cx;
        const diffY = ball.position.y - cy;
        const dist = Math.sqrt(diffX * diffX + diffY * diffY);

        if (dist < ball.radius && dist > 0) {
            const nnx = diffX / dist;
            const nny = diffY / dist;
            const overlap = ball.radius - dist;

            ball.position.x += nnx * (overlap + 0.5);
            ball.position.y += nny * (overlap + 0.5);

            const dot = ball.velocity.x * nnx + ball.velocity.y * nny;
            if (dot < 0) {
                ball.velocity.x -= nnx * dot * (1 + this.rest);
                ball.velocity.y -= nny * dot * (1 + this.rest);
            }
        }
    }
}

class Flipper {
    constructor(x, y, len, isLeft) {
        this.x = x; this.y = y;
        this.len = len;
        this.isLeft = isLeft;
        this.thick = 12;

        if (isLeft) {
            this.restAng = 0.4;
            this.activeAng = -0.6;
        } else {
            this.restAng = Math.PI - 0.4;
            this.activeAng = Math.PI + 0.6;
        }

        this.ang = this.restAng;
        this.targetAng = this.restAng;
        this.active = false;
        this.angVel = 0;
        this.speed = 0.25;
    }

    activate() { this.active = true; this.targetAng = this.activeAng; }
    deactivate() { this.active = false; this.targetAng = this.restAng; }

    update() {
        const prev = this.ang;
        const diff = this.targetAng - this.ang;

        if (Math.abs(diff) > 0.008) {
            this.angVel = diff > 0 ? this.speed : -this.speed;
        } else {
            this.angVel = 0;
        }

        this.ang += this.angVel;

        if (this.isLeft) {
            this.ang = Math.max(this.activeAng, Math.min(this.restAng, this.ang));
        } else {
            this.ang = Math.min(this.activeAng, Math.max(this.restAng, this.ang));
        }

        this.angVel = this.ang - prev;
    }

    getEnd() {
        return {
            x: this.x + Math.cos(this.ang) * this.len,
            y: this.y + Math.sin(this.ang) * this.len
        };
    }

    checkHit(ball) {
        const end = this.getEnd();
        const dx = end.x - this.x;
        const dy = end.y - this.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) return { hit: false };

        const nx = dx / len;
        const ny = dy / len;

        const bx = ball.position.x - this.x;
        const by = ball.position.y - this.y;
        const proj = bx * nx + by * ny;

        if (proj < -ball.radius || proj > len + ball.radius) {
            return { hit: false };
        }

        const projClamp = Math.max(0, Math.min(len, proj));
        const cx = this.x + nx * projClamp;
        const cy = this.y + ny * projClamp;

        const diffX = ball.position.x - cx;
        const diffY = ball.position.y - cy;
        const dist = Math.sqrt(diffX * diffX + diffY * diffY);
        const hitDist = ball.radius + this.thick / 2;

        if (dist < hitDist) {
            const nnx = diffX / dist;
            const nny = diffY / dist;
            const overlap = hitDist - dist;

            ball.position.x += nnx * (overlap + 1);
            ball.position.y += nny * (overlap + 1);

            const dot = ball.velocity.x * nnx + ball.velocity.y * nny;

            if (this.active && Math.abs(this.angVel) > 0.02) {
                const tipVel = this.angVel * len * (projClamp / len);
                const fvx = -Math.sin(this.ang) * tipVel;
                const fvy = Math.cos(this.ang) * tipVel;

                ball.velocity.x = ball.velocity.x - nnx * dot * 1.8 + nnx * 12 + fvx * 3;
                ball.velocity.y = ball.velocity.y - nny * dot * 1.8 + nny * 12 + fvy * 3;
            } else {
                if (dot < 0) {
                    ball.velocity.x -= nnx * dot * 1.4;
                    ball.velocity.y -= nny * dot * 1.4;
                }
            }

            return { hit: true, score: 10, comboAdd: 0 };
        }
        return { hit: false };
    }
}

class Physics {
    constructor(w, h) {
        this.w = w; this.h = h;
        this.gravity = { x: 0, y: 0.18 };
        this.friction = 0.999;
        this.balls = [];
        this.bumpers = [];
        this.targets = [];
        this.walls = [];
        this.leftFlipper = null;
        this.rightFlipper = null;
    }

    setGravity(x, y) { this.gravity = { x, y }; }
    setFriction(f) { this.friction = f; }

    addBall(x, y, r = 7) {
        const b = new Ball(x, y, r);
        this.balls.push(b);
        return b;
    }

    addBumper(x, y, r, s, c) {
        const b = new Bumper(x, y, r, s, c);
        this.bumpers.push(b);
        return b;
    }

    addTarget(x, y, r, s, c) {
        const t = new Target(x, y, r, s, c);
        this.targets.push(t);
        return t;
    }

    addWall(x1, y1, x2, y2, r = 0.7) {
        const w = new Wall(x1, y1, x2, y2, r);
        this.walls.push(w);
        return w;
    }

    setupFlippers(lx, ly, rx, ry, len) {
        this.leftFlipper = new Flipper(lx, ly, len, true);
        this.rightFlipper = new Flipper(rx, ry, len, false);
    }

    leftUp() { if (this.leftFlipper) this.leftFlipper.activate(); }
    leftDown() { if (this.leftFlipper) this.leftFlipper.deactivate(); }
    rightUp() { if (this.rightFlipper) this.rightFlipper.activate(); }
    rightDown() { if (this.rightFlipper) this.rightFlipper.deactivate(); }

    checkBorder(ball) {
        if (ball.position.x - ball.radius < 0) {
            ball.position.x = ball.radius;
            ball.velocity.x = Math.abs(ball.velocity.x) * 0.75;
        }
        if (ball.position.x + ball.radius > this.w) {
            ball.position.x = this.w - ball.radius;
            ball.velocity.x = -Math.abs(ball.velocity.x) * 0.75;
        }
        if (ball.position.y - ball.radius < 0) {
            ball.position.y = ball.radius;
            ball.velocity.y = Math.abs(ball.velocity.y) * 0.75;
        }
        if (ball.position.y > this.h + 50) {
            ball.active = false;
        }
    }

    update(dt = 1) {
        let score = 0, combo = 0, hits = 0;
        const gv = new Vector2(this.gravity.x, this.gravity.y);

        for (const ball of this.balls) {
            if (!ball.active) continue;

            ball.update(gv, this.friction, dt);
            this.checkBorder(ball);

            for (const w of this.walls) w.checkHit(ball);

            for (const b of this.bumpers) {
                const r = b.checkHit(ball);
                if (r.hit) { score += r.score; combo += r.comboAdd; hits++; }
                b.update();
            }

            for (const t of this.targets) {
                const r = t.checkHit(ball);
                if (r.hit) { score += r.score; combo += r.comboAdd; hits++; }
                t.update();
            }

            if (this.leftFlipper) {
                this.leftFlipper.update();
                const r = this.leftFlipper.checkHit(ball);
                if (r.hit) { score += r.score; hits++; }
            }

            if (this.rightFlipper) {
                this.rightFlipper.update();
                const r = this.rightFlipper.checkHit(ball);
                if (r.hit) { score += r.score; hits++; }
            }
        }

        return { score, comboAdd: combo, hits };
    }

    launchBall(power) {
        const active = this.balls.filter(b => b.active);
        if (active.length === 0) return false;
        const ball = active[active.length - 1];
        ball.applyForce(0, -power);
        return true;
    }

    activeCount() { return this.balls.filter(b => b.active).length; }
    resetTargets() { for (const t of this.targets) t.reset(); }
    clear() {
        this.balls = []; this.bumpers = []; this.targets = []; this.walls = [];
        this.leftFlipper = null; this.rightFlipper = null;
    }
}
