class UFO {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = CONFIG.UFO.WIDTH;
        this.height = CONFIG.UFO.HEIGHT;
        this.speed = CONFIG.UFO.SPEED;
        this.color = CONFIG.UFO.COLOR;
        this.minPoints = CONFIG.UFO.MIN_POINTS;
        this.maxPoints = CONFIG.UFO.MAX_POINTS;
        
        this.active = false;
        this.direction = 1;
        this.x = 0;
        this.y = 50;
        this.points = 0;
        this.spawnTimer = 0;
        this.animationOffset = 0;
    }

    update() {
        this.animationOffset += 0.15;

        if (!this.active) {
            this.spawnTimer++;
            const spawnChance = 0.003 + (this.spawnTimer / 1000) * 0.001;
            if (this.spawnTimer > 200 && Math.random() < spawnChance) {
                this.spawn();
            }
            return;
        }

        this.x += this.speed * this.direction;
        this.y += Math.sin(this.animationOffset) * 0.8;

        if (this.x < -this.width * 2 || this.x > this.canvas.width + this.width) {
            this.active = false;
            this.spawnTimer = 0;
        }
    }

    spawn() {
        this.active = true;
        this.direction = Math.random() < 0.5 ? 1 : -1;
        this.x = this.direction === 1 ? -this.width : this.canvas.width;
        this.y = 30 + Math.random() * 50;
        this.points = Utils.randomInt(this.minPoints, this.maxPoints);
        this.speed = CONFIG.UFO.SPEED * (0.8 + Math.random() * 0.6);
    }

    draw(ctx) {
        if (!this.active) return;

        Utils.drawGlow(ctx, this.x + this.width / 2, this.y + this.height / 2, 35, 'rgba(255, 0, 255, 0.4)');

        const wobble = Math.sin(this.animationOffset) * 2;

        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height * 0.7 + wobble, this.width / 2, this.height / 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2 + wobble, this.width / 2.5, this.height / 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height * 0.3 + wobble, this.width / 4, this.height / 4, 0, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < 5; i++) {
            const lightX = this.x + (i + 1) * this.width / 6;
            const lightY = this.y + this.height * 0.75 + wobble;
            ctx.fillStyle = i % 2 === 0 ? '#ffff00' : '#00ffff';
            ctx.beginPath();
            ctx.arc(lightX, lightY, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.points, this.x + this.width / 2, this.y - 10 + wobble);
    }

    checkCollision(bullet) {
        if (!this.active) return null;

        const ufoRect = {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };

        if (Utils.checkCollision(bullet, ufoRect)) {
            this.active = false;
            this.spawnTimer = 0;
            return this.points;
        }
        return null;
    }

    getRect() {
        if (!this.active) return null;
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}