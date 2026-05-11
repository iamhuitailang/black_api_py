export class Physics {
    constructor() {
        this.friction = 0.008;
        this.maxSpeed = 6;
        this.bounceFactor = 0.6;
    }

    updatePosition(entity, deltaTime) {
        entity.x += entity.vx * deltaTime;
        entity.y += entity.vy * deltaTime;
    }

    applyFriction(entity, terrainFriction = 0) {
        const totalFriction = this.friction + terrainFriction;
        const speed = Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy);
        
        if (speed > 0.01) {
            const frictionX = -entity.vx / speed * totalFriction;
            const frictionY = -entity.vy / speed * totalFriction;
            
            entity.vx += frictionX;
            entity.vy += frictionY;
            
            if (speed < totalFriction) {
                entity.vx = 0;
                entity.vy = 0;
            }
        }
    }

    limitSpeed(entity, maxSpeed = null) {
        const speedLimit = maxSpeed || this.maxSpeed;
        const speed = Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy);
        
        if (speed > speedLimit) {
            entity.vx = (entity.vx / speed) * speedLimit;
            entity.vy = (entity.vy / speed) * speedLimit;
        }
    }

    applyPush(entity, dx, dy, force = 2) {
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length === 0) return;
        
        const normalizedDx = dx / length;
        const normalizedDy = dy / length;
        
        entity.vx += normalizedDx * force;
        entity.vy += normalizedDy * force;
        
        this.limitSpeed(entity);
    }

    checkCircleCollision(circle1, circle2) {
        const dx = circle1.x - circle2.x;
        const dy = circle1.y - circle2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (circle1.radius + circle2.radius);
    }

    checkRectCollision(circle, rect) {
        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
        
        const dx = circle.x - closestX;
        const dy = circle.y - closestY;
        
        return (dx * dx + dy * dy) < (circle.radius * circle.radius);
    }

    handleWallBounce(entity, canvasWidth, canvasHeight, radius) {
        if (entity.x - radius < 0) {
            entity.x = radius;
            entity.vx = -entity.vx * this.bounceFactor;
        }
        if (entity.x + radius > canvasWidth) {
            entity.x = canvasWidth - radius;
            entity.vx = -entity.vx * this.bounceFactor;
        }
        if (entity.y - radius < 0) {
            entity.y = radius;
            entity.vy = -entity.vy * this.bounceFactor;
        }
        if (entity.y + radius > canvasHeight) {
            entity.y = canvasHeight - radius;
            entity.vy = -entity.vy * this.bounceFactor;
        }
    }

    isMoving(entity) {
        return Math.abs(entity.vx) > 0.01 || Math.abs(entity.vy) > 0.01;
    }

    getSpeed(entity) {
        return Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy);
    }
}
