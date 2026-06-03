class Note {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.x = options.x || canvas.width + 50;
        this.y = 0;
        this.size = options.size || 40;
        this.speed = options.speed || 8;
        this.value = options.value || 100;
        this.collected = false;
        this.rotation = 0;
        this.floatOffset = 0;
        this.floatSpeed = options.floatSpeed || 0.05;
        this.color = options.color || '#fbbf24';
        this.type = options.type || 'normal';
        this.init();
    }

    init() {
        const groundY = this.canvas.height - 120;
        this.y = groundY - 100 - Math.random() * 150;
    }

    update(deltaTime, speed) {
        this.x -= speed;
        this.rotation += 0.05;
        this.floatOffset += this.floatSpeed;
    }

    draw(ctx) {
        const c = this.ctx;
        const floatY = this.y + Math.sin(this.floatOffset) * 10;

        c.save();
        c.translate(this.x + this.size / 2, floatY + this.size / 2);
        c.rotate(this.rotation);

        const gradient = c.createRadialGradient(0, 0, 0, 0, 0, this.size / 2);
        gradient.addColorStop(0, '#fef3c7');
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(1, '#d97706');

        c.fillStyle = gradient;
        c.beginPath();
        c.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = 'rgba(255, 255, 255, 0.8)';
        c.beginPath();
        c.arc(-this.size * 0.15, -this.size * 0.15, this.size * 0.15, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = '#78350f';
        c.beginPath();
        c.ellipse(this.size * 0.1, this.size * 0.05, this.size * 0.08, this.size * 0.12, 0, 0, Math.PI * 2);
        c.fill();

        c.restore();

        c.shadowColor = this.color;
        c.shadowBlur = 20;
        c.beginPath();
        c.arc(this.x + this.size / 2, floatY + this.size / 2, this.size / 2, 0, Math.PI * 2);
        c.fill();
        c.shadowBlur = 0;
    }

    getBounds() {
        const floatY = this.y + Math.sin(this.floatOffset) * 10;
        return {
            x: this.x,
            y: floatY,
            width: this.size,
            height: this.size
        };
    }

    isOffScreen() {
        return this.x + this.size < 0;
    }

    checkCollision(player) {
        if (this.collected) return false;
        
        const b = this.getBounds();
        const p = player.getBounds();
        
        const centerX = b.x + b.width / 2;
        const centerY = b.y + b.height / 2;
        const playerCenterX = p.x + p.width / 2;
        const playerCenterY = p.y + p.height / 2;
        
        const distance = Math.sqrt(
            Math.pow(centerX - playerCenterX, 2) + 
            Math.pow(centerY - playerCenterY, 2)
        );
        
        const collectRadius = 60;
        
        if (distance < collectRadius) {
            this.collected = true;
            return true;
        }
        
        return false;
    }
}
