class FireHoop {
    constructor(x, canvasHeight, isMoving = false) {
        this.x = x;
        this.width = 80;
        this.height = 80;
        this.baseY = canvasHeight - 60;
        this.y = this.baseY - 100 - this.height - Math.random() * 50;
        this.passed = false;
        this.phase = Math.random() * Math.PI * 2;
        this.isMoving = isMoving;
        
        if (isMoving) {
            this.moveAmplitude = 25;
            this.moveSpeed = 1.2;
            this.centerY = this.y;
        }
    }
    
    update(dt, gameSpeed) {
        this.x -= gameSpeed * 60 * dt;
        this.phase += dt;
        
        if (this.isMoving) {
            this.y = this.centerY + Math.sin(this.phase * this.moveSpeed) * this.moveAmplitude;
        }
    }
    
    isOffScreen() {
        return this.x + this.width < 0;
    }
    
    checkPassed(player) {
        if (this.passed) return false;
        
        const playerHitbox = player.getHitbox();
        const hoopCenterX = this.x + this.width / 2;
        const hoopCenterY = this.y + this.height / 2;
        const hoopInnerRadius = this.width / 2 - 15;
        
        const playerCenterX = playerHitbox.x + playerHitbox.width / 2;
        const playerCenterY = playerHitbox.y + playerHitbox.height / 2;
        
        const distance = Helpers.distance(playerCenterX, playerCenterY, hoopCenterX, hoopCenterY);
        
        if (distance < hoopInnerRadius && playerCenterX > this.x && playerCenterX < this.x + this.width) {
            this.passed = true;
            return true;
        }
        
        return false;
    }
    
    getHitbox() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    draw(ctx, renderer) {
        renderer.drawFireHoop(this);
    }
}
