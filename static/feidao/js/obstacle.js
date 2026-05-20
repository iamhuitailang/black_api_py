class Obstacle {
    constructor(x, y, width, height, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type || 'wood';
        this.angle = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        this.moveDirection = Math.random() > 0.5 ? 1 : -1;
        this.moveSpeed = Math.random() * 0.5;
        this.initialX = x;
        this.moveRange = 50 + Math.random() * 50;
    }

    update() {
        this.angle += this.rotationSpeed;
        this.x += this.moveSpeed * this.moveDirection;
        if (this.x > this.initialX + this.moveRange || this.x < this.initialX - this.moveRange) {
            this.moveDirection *= -1;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.angle);

        if (this.type === 'wood') {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            for (let i = -this.height / 2 + 5; i < this.height / 2; i += 8) {
                ctx.beginPath();
                ctx.moveTo(-this.width / 2, i);
                ctx.lineTo(this.width / 2, i);
                ctx.stroke();
            }
            
            ctx.strokeStyle = '#3D2314';
            ctx.lineWidth = 3;
            ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
        } else if (this.type === 'metal') {
            ctx.fillStyle = '#708090';
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            
            ctx.fillStyle = '#A9A9A9';
            ctx.fillRect(-this.width / 2 + 3, -this.height / 2 + 3, this.width - 6, 5);
            
            ctx.strokeStyle = '#2F4F4F';
            ctx.lineWidth = 3;
            ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
        } else if (this.type === 'cloth') {
            ctx.fillStyle = '#DC143C';
            ctx.beginPath();
            ctx.moveTo(-this.width / 2, -this.height / 2);
            ctx.quadraticCurveTo(0, -this.height / 2 - 10, this.width / 2, -this.height / 2);
            ctx.lineTo(this.width / 2, this.height / 2);
            ctx.quadraticCurveTo(0, this.height / 2 + 10, -this.width / 2, this.height / 2);
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = '#8B0000';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.restore();
    }

    checkCollision(knife) {
        const knifeBounds = knife.getBounds();
        
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const cos = Math.cos(-this.angle);
        const sin = Math.sin(-this.angle);
        
        const knifeCenterX = (knifeBounds.x + knifeBounds.width / 2 - cx) * cos - (knifeBounds.y + knifeBounds.height / 2 - cy) * sin + cx;
        const knifeCenterY = (knifeBounds.x + knifeBounds.width / 2 - cx) * sin + (knifeBounds.y + knifeBounds.height / 2 - cy) * cos + cy;
        
        const halfW = this.width / 2;
        const halfH = this.height / 2;
        
        const closestX = Math.max(cx - halfW, Math.min(knifeCenterX, cx + halfW));
        const closestY = Math.max(cy - halfH, Math.min(knifeCenterY, cy + halfH));
        
        const dx = knifeCenterX - closestX;
        const dy = knifeCenterY - closestY;
        
        return (dx * dx + dy * dy) < (knifeBounds.width / 2) * (knifeBounds.width / 2);
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Obstacle;
}
