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
        if (len === 0) return new Vector(0, 0);
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
    constructor(x, y, radius, isStatic = false) {
        this.position = new Vector(x, y);
        this.velocity = new Vector(0, 0);
        this.acceleration = new Vector(0, 0);
        this.radius = radius;
        this.isStatic = isStatic;
        this.forces = [];
    }

    applyForce(force) {
        this.forces.push(force);
    }

    update(dt = 1) {
        if (this.isStatic) return;

        this.forces.forEach(force => {
            this.acceleration = this.acceleration.add(force);
        });
        this.forces = [];

        this.velocity = this.velocity.add(this.acceleration.mul(dt));
        this.velocity = this.velocity.mul(CONFIG.AIR_RESISTANCE);
        this.position = this.position.add(this.velocity.mul(dt));

        this.acceleration = new Vector(0, 0);
    }
}

class RopeSegment {
    constructor(x, y, length, angle) {
        this.anchor = new Vector(x, y);
        this.length = length;
        this.angle = angle;
        this.angularVelocity = 0;
        this.angularAcceleration = 0;
        this.cut = false;
    }

    getEnd() {
        return new Vector(
            this.anchor.x + Math.cos(this.angle) * this.length,
            this.anchor.y + Math.sin(this.angle) * this.length
        );
    }

    update(gravity) {
        if (this.cut) return;
        
        this.angularAcceleration = (gravity / this.length) * Math.cos(this.angle);
        this.angularVelocity += this.angularAcceleration;
        this.angularVelocity *= 0.995;
        this.angle += this.angularVelocity;
    }
}

class Rope {
    constructor(startX, startY, endX, endY, segments = CONFIG.ROPE_SEGMENTS) {
        this.start = new Vector(startX, startY);
        this.end = new Vector(endX, endY);
        this.segments = [];
        this.cut = false;
        this.cutIndex = -1;
        this.wasCut = false;
        
        const totalLength = this.start.distance(this.end);
        const segmentLength = totalLength / segments;
        const angle = Math.atan2(endY - startY, endX - startX);
        
        let currentX = startX;
        let currentY = startY;
        
        for (let i = 0; i < segments; i++) {
            this.segments.push(new RopeSegment(currentX, currentY, segmentLength, angle));
            const endPos = this.segments[i].getEnd();
            currentX = endPos.x;
            currentY = endPos.y;
        }
    }

    update(gravity, candyPosition) {
        if (this.cut) {
            this.updateFreeFall(gravity);
        } else {
            this.segments[0].anchor = this.start.clone();
            for (let i = 0; i < this.segments.length; i++) {
                this.segments[i].update(gravity);
                if (i < this.segments.length - 1) {
                    this.segments[i + 1].anchor = this.segments[i].getEnd();
                }
            }
            this.end = this.segments[this.segments.length - 1].getEnd();
        }
    }

    updateFreeFall(gravity) {
        for (let i = 0; i < this.segments.length; i++) {
            if (i > this.cutIndex) {
                this.segments[i].anchor.y += gravity * 2;
            }
        }
    }

    cutAtPoint(x, y, threshold = 25) {
        for (let i = 0; i < this.segments.length; i++) {
            const seg = this.segments[i];
            const start = seg.anchor;
            const end = seg.getEnd();
            
            const dist = this.pointToLineDistance(x, y, start.x, start.y, end.x, end.y);
            if (dist < threshold) {
                if (!this.cut) {
                    this.cut = true;
                    this.cutIndex = i;
                    this.wasCut = true;
                }
                return true;
            }
        }
        return false;
    }

    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getEndPosition() {
        if (this.cut) return null;
        return this.end;
    }
}

class CollisionDetector {
    static circleCircle(c1, c2) {
        const dx = c1.position.x - c2.position.x;
        const dy = c1.position.y - c2.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < c1.radius + c2.radius;
    }

    static pointInCircle(px, py, circle) {
        const dx = px - circle.position.x;
        const dy = py - circle.position.y;
        return dx * dx + dy * dy < circle.radius * circle.radius;
    }

    static checkBoundary(body, width, height) {
        if (body.position.x - body.radius < 0) {
            body.position.x = body.radius;
            body.velocity.x *= -CONFIG.BOUNCE_DAMPING;
        }
        if (body.position.x + body.radius > width) {
            body.position.x = width - body.radius;
            body.velocity.x *= -CONFIG.BOUNCE_DAMPING;
        }
        if (body.position.y - body.radius < 0) {
            body.position.y = body.radius;
            body.velocity.y *= -CONFIG.BOUNCE_DAMPING;
        }
    }

    static isOutOfBounds(body, width, height) {
        return body.position.y > height + body.radius * 2;
    }
}