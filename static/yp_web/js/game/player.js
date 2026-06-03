class Player {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.x = options.x || 100;
        this.y = options.y || 0;
        this.width = options.width || 60;
        this.height = options.height || 80;
        this.groundY = 0;
        this.velocityY = 0;
        this.isJumping = false;
        this.jumpCount = 0;
        this.maxJumps = options.maxJumps || 2;
        this.jumpPower = options.jumpPower || -18;
        this.gravity = options.gravity || 0.8;
        this.color = options.color || '#6366f1';
        this.character = options.character || null;
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = 0.15;
        this.shieldCount = options.shieldCount || 0;
        this.init();
    }

    init() {
        this.groundY = this.canvas.height - 120;
        this.y = this.groundY - this.height;
    }

    jump() {
        if (this.jumpCount < this.maxJumps) {
            this.velocityY = this.jumpPower;
            this.isJumping = true;
            this.jumpCount++;
            return true;
        }
        return false;
    }

    update(deltaTime) {
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        if (this.y >= this.groundY - this.height) {
            this.y = this.groundY - this.height;
            this.velocityY = 0;
            this.isJumping = false;
            this.jumpCount = 0;
        }

        this.animTimer += deltaTime;
        if (this.animTimer >= this.animSpeed) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }

        if (this.isInvincible) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.isInvincible = false;
            }
        }
    }

    getBounds() {
        return {
            x: this.x + 10,
            y: this.y + 10,
            width: this.width - 20,
            height: this.height - 20
        };
    }

    draw(ctx) {
        const c = this.ctx;
        
        c.save();
        
        if (this.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
            c.globalAlpha = 0.5;
        }

        const gradient = c.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        if (this.character && this.character.rarity === 4) {
            gradient.addColorStop(0, '#f59e0b');
            gradient.addColorStop(1, '#d97706');
        } else if (this.character && this.character.rarity === 3) {
            gradient.addColorStop(0, '#8b5cf6');
            gradient.addColorStop(1, '#7c3aed');
        } else if (this.character && this.character.rarity === 2) {
            gradient.addColorStop(0, '#3b82f6');
            gradient.addColorStop(1, '#2563eb');
        } else {
            gradient.addColorStop(0, '#6366f1');
            gradient.addColorStop(1, '#4f46e5');
        }

        c.fillStyle = gradient;
        this.roundRect(this.x, this.y, this.width, this.height, 12);
        c.fill();

        c.fillStyle = 'rgba(255, 255, 255, 0.3)';
        c.beginPath();
        c.arc(this.x + this.width * 0.6, this.y + this.height * 0.3, 15, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = '#0f0f23';
        c.beginPath();
        c.arc(this.x + this.width * 0.55, this.y + this.height * 0.28, 5, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(this.x + this.width * 0.65, this.y + this.height * 0.28, 5, 0, Math.PI * 2);
        c.fill();

        if (!this.isJumping) {
            const legOffset = Math.sin(this.animFrame * Math.PI / 2) * 8;
            c.fillStyle = gradient;
            c.fillRect(this.x + 12, this.y + this.height - 15, 15, 15 + legOffset);
            c.fillRect(this.x + this.width - 27, this.y + this.height - 15, 15, 15 - legOffset);
        }

        if (this.shieldCount > 0) {
            c.strokeStyle = 'rgba(99, 102, 241, 0.6)';
            c.lineWidth = 3;
            c.beginPath();
            c.arc(this.x + this.width / 2, this.y + this.height / 2, this.width * 0.8, 0, Math.PI * 2);
            c.stroke();
        }

        c.restore();
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

    takeDamage() {
        if (this.isInvincible) return false;
        
        if (this.shieldCount > 0) {
            this.shieldCount--;
            this.isInvincible = true;
            this.invincibleTimer = 1.5;
            return false;
        }
        
        return true;
    }

    setInvincible(duration) {
        this.isInvincible = true;
        this.invincibleTimer = duration;
    }

    reset() {
        this.y = this.groundY - this.height;
        this.velocityY = 0;
        this.isJumping = false;
        this.jumpCount = 0;
        this.isInvincible = false;
        this.invincibleTimer = 0;
    }
}
