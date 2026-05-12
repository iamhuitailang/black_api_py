class Player {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = CONFIG.PLAYER.WIDTH;
        this.height = CONFIG.PLAYER.HEIGHT;
        this.speed = CONFIG.PLAYER.SPEED;
        this.color = CONFIG.PLAYER.COLOR;
        
        this.reset();
        
        this.invincible = false;
        this.invincibleTimer = 0;
        this.blinkState = true;
    }

    reset() {
        this.x = (this.canvas.width - this.width) / 2;
        this.y = this.canvas.height - this.height - 20;
    }

    update() {
        if (inputManager.isLeft()) {
            this.x -= this.speed;
        }
        if (inputManager.isRight()) {
            this.x += this.speed;
        }

        this.x = Utils.clamp(this.x, 0, this.canvas.width - this.width);

        if (this.invincible) {
            this.invincibleTimer -= 16;
            this.blinkState = !this.blinkState;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
                this.blinkState = true;
            }
        }
    }

    draw(ctx) {
        if (!this.blinkState) return;

        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        ctx.fillStyle = '#3366cc';
        ctx.beginPath();
        ctx.moveTo(cx, this.y);
        ctx.lineTo(this.x + this.width * 0.9, this.y + this.height * 0.6);
        ctx.lineTo(this.x + this.width * 0.8, this.y + this.height * 0.5);
        ctx.lineTo(this.x + this.width * 0.85, this.y + this.height);
        ctx.lineTo(this.x + this.width * 0.6, this.y + this.height * 0.85);
        ctx.lineTo(cx, this.y + this.height * 0.95);
        ctx.lineTo(this.x + this.width * 0.4, this.y + this.height * 0.85);
        ctx.lineTo(this.x + this.width * 0.15, this.y + this.height);
        ctx.lineTo(this.x + this.width * 0.2, this.y + this.height * 0.5);
        ctx.lineTo(this.x + this.width * 0.1, this.y + this.height * 0.6);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.moveTo(cx, this.y + 2);
        ctx.lineTo(this.x + this.width * 0.75, this.y + this.height * 0.55);
        ctx.lineTo(this.x + this.width * 0.65, this.y + this.height * 0.45);
        ctx.lineTo(this.x + this.width * 0.7, this.y + this.height * 0.85);
        ctx.lineTo(this.x + this.width * 0.55, this.y + this.height * 0.75);
        ctx.lineTo(cx, this.y + this.height * 0.82);
        ctx.lineTo(this.x + this.width * 0.45, this.y + this.height * 0.75);
        ctx.lineTo(this.x + this.width * 0.3, this.y + this.height * 0.85);
        ctx.lineTo(this.x + this.width * 0.35, this.y + this.height * 0.45);
        ctx.lineTo(this.x + this.width * 0.25, this.y + this.height * 0.55);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#88ffff';
        ctx.beginPath();
        ctx.ellipse(cx, this.y + this.height * 0.35, 7, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ccffff';
        ctx.beginPath();
        ctx.ellipse(cx, this.y + this.height * 0.32, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        const flame1 = 10 + Math.random() * 8;
        const flame2 = 7 + Math.random() * 5;
        
        ctx.fillStyle = '#ff4400';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.35, this.y + this.height);
        ctx.lineTo(cx, this.y + this.height + flame1);
        ctx.lineTo(this.x + this.width * 0.65, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.4, this.y + this.height);
        ctx.lineTo(cx, this.y + this.height + flame2);
        ctx.lineTo(this.x + this.width * 0.6, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.45, this.y + this.height);
        ctx.lineTo(cx, this.y + this.height + flame2 * 0.5);
        ctx.lineTo(this.x + this.width * 0.55, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#aaffcc';
        ctx.beginPath();
        ctx.arc(this.x + this.width * 0.25, this.y + this.height * 0.6, 2, 0, Math.PI * 2);
        ctx.arc(this.x + this.width * 0.75, this.y + this.height * 0.6, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    takeDamage() {
        if (this.invincible) return false;
        
        this.invincible = true;
        this.invincibleTimer = CONFIG.PLAYER.INVINCIBLE_TIME;
        return true;
    }

    getRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}