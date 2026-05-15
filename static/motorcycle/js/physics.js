class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        return new Vector2(this.x + v.x, this.y + v.y);
    }

    sub(v) {
        return new Vector2(this.x - v.x, this.y - v.y);
    }

    mul(s) {
        return new Vector2(this.x * s, this.y * s);
    }

    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const len = this.length();
        if (len === 0) return new Vector2();
        return new Vector2(this.x / len, this.y / len);
    }

    clone() {
        return new Vector2(this.x, this.y);
    }
}

class Wheel {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = radius;
        this.grounded = false;
    }

    update(terrain, dt) {
        this.vy += CONFIG.GRAVITY * dt;
        
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        this.grounded = false;
        const checkRadius = this.radius + 50;
        
        for (const segment of terrain.segments) {
            if (segment.end.x < this.x - checkRadius || segment.start.x > this.x + checkRadius) {
                continue;
            }
            
            const collision = this.checkCollision(segment);
            if (collision) {
                this.resolveCollision(collision, segment);
                this.grounded = true;
            }
        }
    }

    checkCollision(segment) {
        const x1 = segment.start.x, y1 = segment.start.y;
        const x2 = segment.end.x, y2 = segment.end.y;
        const cx = this.x, cy = this.y;
        const r = this.radius;
        
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) return null;
        
        const dirX = dx / len;
        const dirY = dy / len;
        
        const toCX = cx - x1;
        const toCY = cy - y1;
        
        const proj = Math.max(0, Math.min(len, toCX * dirX + toCY * toCY));
        
        const closestX = x1 + dirX * proj;
        const closestY = y1 + dirY * proj;
        
        const distX = cx - closestX;
        const distY = cy - closestY;
        const dist = Math.sqrt(distX * distX + distY * distY);
        
        if (dist < r) {
            let normalX = distX / (dist || 1);
            let normalY = distY / (dist || 1);
            
            if (normalY > 0) {
                normalX *= -1;
                normalY *= -1;
            }
            
            if (normalY === 0) {
                normalY = -1;
            }
            
            return {
                x: closestX,
                y: closestY,
                normalX: normalX,
                normalY: normalY,
                penetration: r - dist
            };
        }
        
        return null;
    }

    resolveCollision(collision, segment) {
        this.y += collision.normalY * collision.penetration;
        this.x += collision.normalX * collision.penetration * 0.5;
        
        const velAlongNormal = this.vx * collision.normalX + this.vy * collision.normalY;
        if (velAlongNormal < 0) {
            const bounce = 0.1;
            this.vx += collision.normalX * (-velAlongNormal * (1 + bounce));
            this.vy += collision.normalY * (-velAlongNormal * (1 + bounce));
        }
        
        const tangentX = -collision.normalY;
        const tangentY = collision.normalX;
        const velAlongTangent = this.vx * tangentX + this.vy * tangentY;
        const friction = segment.friction || CONFIG.GROUND_FRICTION;
        
        this.vx += tangentX * (-velAlongTangent * (1 - friction));
        this.vy += tangentY * (-velAlongTangent * (1 - friction));
    }

    getPosition() {
        return new Vector2(this.x, this.y);
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    getVelocity() {
        return new Vector2(this.vx, this.vy);
    }

    setVelocity(vx, vy) {
        this.vx = vx;
        this.vy = vy;
    }
}

const physics = {};