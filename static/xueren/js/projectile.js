class Projectile {
    constructor(x, y, facingRight, isBig = false) {
        this.x = x;
        this.y = y;
        this.facingRight = facingRight;
        this.isBig = isBig;
        
        this.width = isBig ? CONFIG.PROJECTILE.BIG_WIDTH : CONFIG.PROJECTILE.WIDTH;
        this.height = isBig ? CONFIG.PROJECTILE.BIG_HEIGHT : CONFIG.PROJECTILE.HEIGHT;
        this.speed = CONFIG.PROJECTILE.SPEED;
        this.velocityX = facingRight ? this.speed : -this.speed;
        this.velocityY = 0;
        
        this.rotation = 0;
        this.rotationSpeed = 0.15;
        this.active = true;
    }
    
    getCollisionRect() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
    
    update() {
        if (!this.active) return;
        
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.rotation += this.rotationSpeed;
        
        if (this.x < -50 || this.x > CONFIG.CANVAS_WIDTH + 50 ||
            this.y < -50 || this.y > CONFIG.CANVAS_HEIGHT + 50) {
            this.active = false;
        }
    }
    
    draw(ctx) {
        if (!this.active) return;
        
        const size = this.isBig ? 16 : 8;
        Utils.drawSnowflake(ctx, this.x, this.y, size, this.rotation);
        
        if (this.isBig) {
            ctx.save();
            ctx.strokeStyle = 'rgba(135, 206, 235, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }
}
