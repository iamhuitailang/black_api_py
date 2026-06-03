class Obstacle {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.x = options.x || canvas.width + 50;
        this.y = 0;
        this.width = options.width || 50;
        this.height = options.height || 60;
        this.speed = options.speed || 8;
        this.type = options.type || 'normal';
        this.color = options.color || '#ef4444';
        this.passed = false;
        this.onBeat = options.onBeat || false;
        this.beatWindow = options.beatWindow || false;
        this.init();
    }

    init() {
        const groundY = this.canvas.height - 120;
        if (this.type === 'low') {
            this.height = 40;
            this.y = groundY - this.height;
        } else if (this.type === 'high') {
            this.height = 50;
            this.y = groundY - this.height - 80;
        } else if (this.type === 'floating') {
            this.width = 50;
            this.height = 50;
            this.y = groundY - this.height - 120;
        } else {
            this.y = groundY - this.height;
        }
    }

    update(deltaTime, speed) {
        this.x -= speed;
    }

    draw(ctx) {
        const c = this.ctx;
        
        const gradient = c.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        
        if (this.onBeat && this.beatWindow) {
            gradient.addColorStop(0, '#fbbf24');
            gradient.addColorStop(1, '#f59e0b');
        } else if (this.type === 'low') {
            gradient.addColorStop(0, '#10b981');
            gradient.addColorStop(1, '#059669');
        } else if (this.type === 'high') {
            gradient.addColorStop(0, '#8b5cf6');
            gradient.addColorStop(1, '#7c3aed');
        } else if (this.type === 'floating') {
            gradient.addColorStop(0, '#ec4899');
            gradient.addColorStop(1, '#db2777');
        } else {
            gradient.addColorStop(0, '#ef4444');
            gradient.addColorStop(1, '#dc2626');
        }

        c.fillStyle = gradient;
        
        this.roundRect(c, this.x, this.y, this.width, this.height, 8);
        c.fill();

        c.fillStyle = 'rgba(255, 255, 255, 0.3)';
        c.fillRect(this.x + 8, this.y + 8, this.width - 16, 8);

        if (this.onBeat && this.beatWindow) {
            c.strokeStyle = '#fbbf24';
            c.lineWidth = 3;
            c.beginPath();
            c.arc(this.x + this.width / 2, this.y + this.height / 2, this.width * 0.8, 0, Math.PI * 2);
            c.stroke();
        }
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    getBounds() {
        return {
            x: this.x + 5,
            y: this.y + 5,
            width: this.width - 10,
            height: this.height - 10
        };
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }

    checkCollision(player) {
        const b = this.getBounds();
        const p = player.getBounds();
        return b.x < p.x + p.width &&
               b.x + b.width > p.x &&
               b.y < p.y + p.height &&
               b.y + b.height > p.y;
    }
}
