class Enemy {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 35;
        this.originalX = x;
        this.direction = 1;
        this.speed = options.speed || CONFIG.enemy.speed;
        this.patrolDistance = options.patrolDistance || CONFIG.enemy.patrolDistance;
        this.leftBound = x - this.patrolDistance / 2;
        this.rightBound = x + this.patrolDistance / 2;
        this.animFrame = 0;
        this.animTimer = 0;
        this.color = options.color || '#ff6b6b';
        this.dead = false;
    }
    
    update(deltaTime) {
        this.animTimer += deltaTime;
        if (this.animTimer > 150) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
        
        this.x += this.speed * this.direction;
        
        if (this.x <= this.leftBound) {
            this.x = this.leftBound;
            this.direction = 1;
        }
        if (this.x + this.width >= this.rightBound) {
            this.x = this.rightBound - this.width;
            this.direction = -1;
        }
    }
    
    render(ctx) {
        ctx.save();
        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        if (this.direction < 0) {
            ctx.translate(centerX, centerY);
            ctx.scale(-1, 1);
            ctx.translate(-centerX, -centerY);
        }
        
        this.drawSlime(ctx, centerX, centerY);
        
        ctx.restore();
    }
    
    drawSlime(ctx, cx, cy) {
        const squish = Math.sin(this.animFrame * Math.PI / 2) * 3;
        
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        ctx.beginPath();
        ctx.ellipse(cx, cy + squish, 20, 15 - squish / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.ellipse(cx - 5, cy - 5 + squish, 6, 4, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(cx - 7, cy - 2 + squish, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 7, cy - 2 + squish, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(cx - 5, cy - 2 + squish, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 9, cy - 2 + squish, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx - 6, cy - 3 + squish, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 8, cy - 3 + squish, 1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(cx, cy + 3 + squish, 4, 0.2, Math.PI - 0.2);
        ctx.stroke();
    }
    
    serialize() {
        return {
            x: this.x,
            y: this.y,
            originalX: this.originalX,
            width: this.width,
            height: this.height,
            direction: this.direction,
            speed: this.speed,
            patrolDistance: this.patrolDistance
        };
    }
    
    static deserialize(data) {
        const enemy = new Enemy(data.originalX, data.y, {
            speed: data.speed,
            patrolDistance: data.patrolDistance
        });
        enemy.x = data.x;
        enemy.direction = data.direction;
        return enemy;
    }
}
