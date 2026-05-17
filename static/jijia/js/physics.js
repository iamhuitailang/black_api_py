class Physics {
    constructor() {
        this.gravity = CONFIG.PHYSICS.gravity;
        this.friction = CONFIG.PHYSICS.friction;
        this.bounce = CONFIG.PHYSICS.bounce;
        this.maxSpeed = CONFIG.PHYSICS.maxSpeed;
    }

    updateBall(ball, canvasWidth, canvasHeight) {
        ball.vy += this.gravity;
        ball.vx *= this.friction;
        ball.vy *= this.friction;
        
        const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        if (speed > this.maxSpeed) {
            ball.vx = (ball.vx / speed) * this.maxSpeed;
            ball.vy = (ball.vy / speed) * this.maxSpeed;
        }
        
        ball.x += ball.vx;
        ball.y += ball.vy;
        
        return this.handleWallCollision(ball, canvasWidth, canvasHeight);
    }

    handleWallCollision(ball, canvasWidth, canvasHeight) {
        let collided = false;
        
        if (ball.x - ball.radius < 0) {
            ball.x = ball.radius;
            ball.vx = -ball.vx * this.bounce;
            collided = true;
        } else if (ball.x + ball.radius > canvasWidth) {
            ball.x = canvasWidth - ball.radius;
            ball.vx = -ball.vx * this.bounce;
            collided = true;
        }
        
        if (ball.y - ball.radius < 0) {
            ball.y = ball.radius;
            ball.vy = -ball.vy * this.bounce;
            collided = true;
        }
        
        return collided;
    }

    checkCircleCollision(c1, c2) {
        const dx = c1.x - c2.x;
        const dy = c1.y - c2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < c1.radius + c2.radius;
    }

    resolveCollision(ball, target) {
        const dx = ball.x - target.x;
        const dy = ball.y - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return;
        
        const nx = dx / distance;
        const ny = dy / distance;
        
        const dvx = ball.vx;
        const dvy = ball.vy;
        const dvn = dvx * nx + dvy * ny;
        
        if (dvn > 0) return;
        
        const restitution = this.bounce;
        ball.vx -= (1 + restitution) * dvn * nx;
        ball.vy -= (1 + restitution) * dvn * ny;
        
        const overlap = (ball.radius + (target.radius || 30)) - distance;
        if (overlap > 0) {
            ball.x += nx * overlap;
            ball.y += ny * overlap;
        }
    }

    checkPointInRect(px, py, rect) {
        return px >= rect.x && px <= rect.x + rect.width &&
               py >= rect.y && py <= rect.y + rect.height;
    }

    checkCircleRectCollision(circle, rect) {
        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
        
        const dx = circle.x - closestX;
        const dy = circle.y - closestY;
        
        return (dx * dx + dy * dy) < (circle.radius * circle.radius);
    }

    resolveRectCollision(ball, rect) {
        const closestX = Math.max(rect.x, Math.min(ball.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(ball.y, rect.y + rect.height));
        
        const dx = ball.x - closestX;
        const dy = ball.y - closestY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) {
            const centerX = rect.x + rect.width / 2;
            const centerY = rect.y + rect.height / 2;
            const toCenterX = ball.x - centerX;
            const toCenterY = ball.y - centerY;
            const toCenterDist = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY);
            ball.vx = (toCenterX / toCenterDist) * this.maxSpeed * 0.5;
            ball.vy = (toCenterY / toCenterDist) * this.maxSpeed * 0.5;
            return;
        }
        
        const nx = dx / distance;
        const ny = dy / distance;
        
        const dvn = ball.vx * nx + ball.vy * ny;
        
        if (dvn < 0) {
            ball.vx -= 2 * dvn * nx * this.bounce;
            ball.vy -= 2 * dvn * ny * this.bounce;
        }
        
        const overlap = ball.radius - distance;
        if (overlap > 0) {
            ball.x += nx * overlap;
            ball.y += ny * overlap;
        }
    }
}

const physics = new Physics();