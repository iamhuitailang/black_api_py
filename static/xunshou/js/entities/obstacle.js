class Obstacle {
    constructor(type, x, canvasHeight) {
        const config = OBSTACLE_TYPES[type];
        this.type = type;
        this.x = x;
        this.width = config.width;
        this.height = config.height;
        this.damage = config.damage;
        this.phase = Math.random() * Math.PI * 2;
        this.baseY = canvasHeight - 60;
        
        if (type === 'log') {
            this.y = this.baseY - this.height + 5;
        } else if (type === 'spike') {
            const heightVariation = Math.random() * 25;
            this.y = this.baseY - 10 - heightVariation - this.height;
        } else if (type === 'fireball') {
            const heightVariation = Math.random() * 35;
            this.y = this.baseY - 15 - heightVariation - this.height;
            this.swingAmplitude = 35;
            this.swingSpeed = 1.8;
            this.centerY = this.y;
        }
    }
    
    update(dt, gameSpeed) {
        this.x -= gameSpeed * 60 * dt;
        this.phase += dt;
        
        if (this.type === 'fireball') {
            this.y = this.centerY + Math.sin(this.phase * this.swingSpeed) * this.swingAmplitude;
        }
    }
    
    isOffScreen() {
        return this.x + this.width < 0;
    }
    
    getHitbox() {
        if (this.type === 'fireball') {
            return {
                x: this.x + 5,
                y: this.y + 5,
                width: this.width - 10,
                height: this.height - 10
            };
        } else if (this.type === 'spike') {
            return {
                x: this.x + 3,
                y: this.y + 3,
                width: this.width - 6,
                height: this.height - 3
            };
        }
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    draw(ctx, renderer) {
        renderer.drawObstacle(this);
    }
}
