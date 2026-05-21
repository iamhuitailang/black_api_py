class Obstacle {
    constructor(x, y, width, height, type = 'normal') {
        this.id = Utils.generateId();
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.active = true;
        this.originalY = y;
        this.moveRange = 0;
        this.moveSpeed = 0;
        this.moveOffset = 0;
    }

    setMovement(range, speed) {
        this.moveRange = range;
        this.moveSpeed = speed;
    }

    update(dt = 1) {
        if (this.moveRange > 0 && this.moveSpeed > 0) {
            this.moveOffset += this.moveSpeed * dt * 0.02;
            this.y = this.originalY + Math.sin(this.moveOffset) * this.moveRange;
        }
    }

    draw(ctx, cameraY = 0) {
        if (!this.active) return;
        
        const drawY = this.y - cameraY;
        
        ctx.save();
        
        const gradient = ctx.createLinearGradient(this.x, drawY, this.x, drawY + this.height);
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(0.5, '#A0522D');
        gradient.addColorStop(1, '#654321');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(this.x, drawY, this.width, this.height, 5);
        ctx.fill();
        
        ctx.strokeStyle = '#5D3A1A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(this.x, drawY, this.width, this.height, 5);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const lineY = drawY + (this.height / 4) * i;
            ctx.beginPath();
            ctx.moveTo(this.x + 5, lineY);
            ctx.lineTo(this.x + this.width - 5, lineY);
            ctx.stroke();
        }
        
        ctx.fillStyle = '#FFD700';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🚧', this.x + this.width / 2, drawY + this.height / 2);
        
        ctx.restore();
    }

    serialize() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            type: this.type,
            active: this.active,
            originalY: this.originalY,
            moveRange: this.moveRange,
            moveSpeed: this.moveSpeed,
            moveOffset: this.moveOffset
        };
    }

    static deserialize(data) {
        const obstacle = new Obstacle(data.x, data.y, data.width, data.height, data.type);
        obstacle.id = data.id;
        obstacle.active = data.active;
        obstacle.originalY = data.originalY;
        obstacle.moveRange = data.moveRange;
        obstacle.moveSpeed = data.moveSpeed;
        obstacle.moveOffset = data.moveOffset || 0;
        return obstacle;
    }

    static generateObstacles(worldWidth, worldHeight, level = 1) {
        const obstacles = [];
        const groundY = worldHeight - 50;
        const count = Math.min(2 + level, 6);
        
        for (let i = 0; i < count; i++) {
            const width = Utils.random(60, 120);
            const height = 20;
            const x = Utils.random(50, worldWidth - width - 50);
            const y = groundY - 200 - i * 150 - Utils.random(0, 50);
            
            const obstacle = new Obstacle(x, y, width, height);
            
            if (Math.random() > 0.5) {
                obstacle.setMovement(Utils.random(30, 80), Utils.random(0.5, 1.5));
            }
            
            obstacles.push(obstacle);
        }
        
        return obstacles;
    }
}