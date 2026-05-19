class Trap {
    constructor(x, y, type = 'spike', options = {}) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = options.width || 40;
        this.height = options.height || 20;
        this.color = options.color || '#ff4757';
        this.animTimer = 0;
    }
    
    update(deltaTime) {
        this.animTimer += deltaTime;
    }
    
    render(ctx) {
        ctx.save();
        
        if (this.type === 'spike') {
            this.drawSpike(ctx);
        } else if (this.type === 'laser') {
            this.drawLaser(ctx);
        }
        
        ctx.restore();
    }
    
    drawSpike(ctx) {
        const spikeCount = Math.floor(this.width / 15);
        const spikeWidth = this.width / spikeCount;
        
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        
        for (let i = 0; i < spikeCount; i++) {
            const baseX = this.x + i * spikeWidth;
            ctx.beginPath();
            ctx.moveTo(baseX, this.y + this.height);
            ctx.lineTo(baseX + spikeWidth / 2, this.y);
            ctx.lineTo(baseX + spikeWidth, this.y + this.height);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < spikeCount; i++) {
            const baseX = this.x + i * spikeWidth;
            ctx.beginPath();
            ctx.moveTo(baseX + spikeWidth / 2, this.y);
            ctx.lineTo(baseX + spikeWidth / 4, this.y + this.height / 2);
            ctx.lineTo(baseX + spikeWidth / 2, this.y + this.height / 3);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    drawLaser(ctx) {
        const pulse = Math.sin(this.animTimer / 200) * 0.3 + 0.7;
        
        ctx.fillStyle = `rgba(255, 71, 87, ${0.3 * pulse})`;
        ctx.fillRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);
        
        ctx.fillStyle = `rgba(255, 71, 87, ${pulse})`;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(this.x, this.y + this.height / 3, this.width, 2);
    }
    
    serialize() {
        return {
            x: this.x,
            y: this.y,
            type: this.type,
            width: this.width,
            height: this.height
        };
    }
    
    static deserialize(data) {
        return new Trap(data.x, data.y, data.type, {
            width: data.width,
            height: data.height
        });
    }
}
