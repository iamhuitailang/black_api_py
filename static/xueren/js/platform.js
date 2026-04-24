class Platform {
    constructor(x, y, width, height, isIce = true, hasIcicle = false) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.isIce = isIce;
        this.hasIcicle = hasIcicle;
        this.icicles = [];
        
        if (hasIcicle) {
            this.generateIcicles();
        }
    }
    
    generateIcicles() {
        const icicleCount = Math.floor(this.width / 60);
        for (let i = 0; i < icicleCount; i++) {
            this.icicles.push({
                x: this.x + 30 + i * 60 + Utils.random(-10, 10),
                y: this.y + this.height,
                width: 8,
                height: 15 + Utils.random(0, 10)
            });
        }
    }
    
    getCollisionRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    update() {
        
    }
    
    draw(ctx) {
        Utils.drawPlatform(ctx, this.x, this.y, this.width, this.height, this.isIce);
        
        this.icicles.forEach(icicle => {
            ctx.save();
            ctx.fillStyle = CONFIG.COLORS.LIGHT_BLUE;
            ctx.beginPath();
            ctx.moveTo(icicle.x, icicle.y);
            ctx.lineTo(icicle.x - icicle.width / 2, icicle.y + icicle.height);
            ctx.lineTo(icicle.x + icicle.width / 2, icicle.y + icicle.height);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.moveTo(icicle.x - 2, icicle.y + 2);
            ctx.lineTo(icicle.x - 3, icicle.y + icicle.height * 0.6);
            ctx.lineTo(icicle.x, icicle.y + icicle.height * 0.4);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });
    }
}

class SnowDrift {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.wobbleOffset = Utils.random(0, Math.PI * 2);
    }
    
    getCollisionRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    update() {
        this.wobbleOffset += 0.02;
    }
    
    draw(ctx) {
        ctx.save();
        
        const wobble = Math.sin(this.wobbleOffset) * 2;
        
        const gradient = ctx.createRadialGradient(
            this.x + this.width / 2,
            this.y + this.height,
            0,
            this.x + this.width / 2,
            this.y + this.height,
            this.width / 2
        );
        gradient.addColorStop(0, CONFIG.COLORS.WHITE);
        gradient.addColorStop(1, CONFIG.COLORS.LIGHT_BLUE);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height);
        ctx.quadraticCurveTo(
            this.x + this.width / 4,
            this.y + wobble,
            this.x + this.width / 2,
            this.y
        );
        ctx.quadraticCurveTo(
            this.x + this.width * 3 / 4,
            this.y - wobble,
            this.x + this.width,
            this.y + this.height
        );
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(this.x + this.width * 0.3, this.y + this.height * 0.4, 5, 0, Math.PI * 2);
        ctx.arc(this.x + this.width * 0.6, this.y + this.height * 0.3, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}
