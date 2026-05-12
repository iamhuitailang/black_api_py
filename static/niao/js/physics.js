class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        return new Vector(this.x + v.x, this.y + v.y);
    }

    sub(v) {
        return new Vector(this.x - v.x, this.y - v.y);
    }

    mul(s) {
        return new Vector(this.x * s, this.y * s);
    }

    div(s) {
        return new Vector(this.x / s, this.y / s);
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const len = this.length();
        if (len === 0) return new Vector();
        return this.div(len);
    }

    distance(v) {
        return this.sub(v).length();
    }

    clone() {
        return new Vector(this.x, this.y);
    }
}

class PhysicsBody {
    constructor(x, y, radius, mass = 1) {
        this.position = new Vector(x, y);
        this.velocity = new Vector();
        this.acceleration = new Vector();
        this.radius = radius;
        this.mass = mass;
        this.isStatic = false;
        this.isAlive = true;
    }

    applyForce(force) {
        this.acceleration = this.acceleration.add(force.div(this.mass));
    }

    update() {
        if (this.isStatic) return;

        this.velocity = this.velocity.add(this.acceleration);
        this.velocity.x *= CONFIG.FRICTION;
        this.velocity.y *= CONFIG.FRICTION;
        this.position = this.position.add(this.velocity);
        this.acceleration = new Vector();

        this.checkBounds();
    }

    checkBounds() {
        const groundY = CONFIG.CANVAS_HEIGHT - 50;
        
        if (this.position.y + this.radius > groundY) {
            this.position.y = groundY - this.radius;
            this.velocity.y *= -CONFIG.BOUNCE;
            if (Math.abs(this.velocity.y) < 0.5) {
                this.velocity.y = 0;
            }
        }

        if (this.position.x - this.radius < 0) {
            this.position.x = this.radius;
            this.velocity.x *= -CONFIG.BOUNCE;
        }

        if (this.position.x + this.radius > CONFIG.CANVAS_WIDTH) {
            this.position.x = CONFIG.CANVAS_WIDTH - this.radius;
            this.velocity.x *= -CONFIG.BOUNCE;
        }
    }

    getSpeed() {
        return this.velocity.length();
    }

    isMoving() {
        return this.getSpeed() > 0.1;
    }
}

class Physics {
    constructor() {
        this.bodies = [];
        this.gravity = new Vector(0, CONFIG.GRAVITY);
    }

    addBody(body) {
        this.bodies.push(body);
        return body;
    }

    removeBody(body) {
        const index = this.bodies.indexOf(body);
        if (index > -1) {
            this.bodies.splice(index, 1);
        }
    }

    update() {
        for (const body of this.bodies) {
            if (!body.isStatic) {
                body.applyForce(this.gravity);
            }
            body.update();
        }

        this.checkCollisions();
    }

    checkCollisions() {
        for (let i = 0; i < this.bodies.length; i++) {
            for (let j = i + 1; j < this.bodies.length; j++) {
                const a = this.bodies[i];
                const b = this.bodies[j];
                
                if (this.checkCircleCollision(a, b)) {
                    this.resolveCollision(a, b);
                }
            }
        }
    }

    checkCircleCollision(a, b) {
        const dist = a.position.distance(b.position);
        return dist < a.radius + b.radius;
    }

    resolveCollision(a, b) {
        const normal = a.position.sub(b.position).normalize();
        const relativeVelocity = a.velocity.sub(b.velocity);
        const velocityAlongNormal = relativeVelocity.x * normal.x + relativeVelocity.y * normal.y;

        if (velocityAlongNormal > 0) return;

        const e = CONFIG.BOUNCE;
        const j = -(1 + e) * velocityAlongNormal / (1 / a.mass + 1 / b.mass);

        const impulse = normal.mul(j);
        
        if (!a.isStatic) {
            a.velocity = a.velocity.add(impulse.div(a.mass));
        }
        if (!b.isStatic) {
            b.velocity = b.velocity.sub(impulse.div(b.mass));
        }

        const overlap = (a.radius + b.radius) - a.position.distance(b.position);
        if (overlap > 0) {
            const separation = normal.mul(overlap / 2);
            if (!a.isStatic) {
                a.position = a.position.add(separation);
            }
            if (!b.isStatic) {
                b.position = b.position.sub(separation);
            }
        }
    }

    predictTrajectory(startPos, velocity, steps = 50) {
        const points = [];
        let pos = startPos.clone();
        let vel = velocity.clone();

        for (let i = 0; i < steps; i++) {
            points.push(pos.clone());
            vel = vel.add(this.gravity);
            vel.x *= CONFIG.FRICTION;
            vel.y *= CONFIG.FRICTION;
            pos = pos.add(vel);
        }

        return points;
    }
}
