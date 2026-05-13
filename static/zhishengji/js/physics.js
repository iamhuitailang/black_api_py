class PhysicsEngine {
    constructor() {
        this.gravity = CONFIG.PHYSICS.gravity;
        this.friction = CONFIG.PHYSICS.friction;
        this.airResistance = CONFIG.PHYSICS.airResistance;
        this.maxVelocity = CONFIG.PHYSICS.maxVelocity;
    }

    update(object, deltaTime) {
        object.vy += this.gravity;
        
        object.vx *= this.airResistance;
        object.vy *= this.friction;
        
        object.vx = Math.max(-this.maxVelocity, Math.min(this.maxVelocity, object.vx));
        object.vy = Math.max(-this.maxVelocity, Math.min(this.maxVelocity, object.vy));
        
        object.x += object.vx;
        object.y += object.vy;
        
        return object;
    }

    applyForce(object, forceX, forceY) {
        object.vx += forceX;
        object.vy += forceY;
    }

    static checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }

    static checkCircleCollision(x1, y1, r1, x2, y2, r2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < r1 + r2;
    }

    static getDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    clampToBounds(object, canvasWidth, canvasHeight, groundY) {
        object.x = Math.max(0, Math.min(canvasWidth - object.width, object.x));
        object.y = Math.max(0, Math.min(groundY - object.height, object.y));
        
        if (object.y >= groundY - object.height) {
            object.vy = 0;
            object.y = groundY - object.height;
        }
    }
}