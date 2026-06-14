class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.facingRight = true;
        this.isDead = false;
        this.deathTimer = 0;
        this.flashTimer = 0;
        this.isFlashing = false;
    }

    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }

    intersects(other) {
        const a = this.getBounds();
        const b = other.getBounds();
        return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    }

    takeDamage(amount) {
        if (this.isDead) return false;
        this.health -= amount;
        this.isFlashing = true;
        this.flashTimer = 100;
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
            this.deathTimer = 1000;
            return true;
        }
        return false;
    }

    update(deltaTime) {
        if (this.flashTimer > 0) {
            this.flashTimer -= deltaTime;
            if (this.flashTimer <= 0) {
                this.isFlashing = false;
            }
        }
        if (this.isDead) {
            this.deathTimer -= deltaTime;
        }
    }

    draw(ctx) {
    }

    drawHealthBar(ctx, offsetY = -15, width = null, showText = false) {
        if (this.isDead || this.health >= this.maxHealth) return;
        
        const barWidth = width || this.width;
        const barHeight = 4;
        const x = this.x + (this.width - barWidth) / 2;
        const y = this.y + offsetY;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        const healthPercent = this.health / this.maxHealth;
        const healthColor = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillStyle = healthColor;
        ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
        
        if (showText) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.health}/${this.maxHealth}`, x + barWidth / 2, y - 2);
        }
    }
}

class Particle {
    constructor(x, y, vx, vy, color, size, life, gravity = 0) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;
        this.gravity = gravity;
        this.alpha = 1;
    }

    update(deltaTime) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life -= deltaTime;
        this.alpha = Math.max(0, this.life / this.maxLife);
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    addParticle(x, y, vx, vy, color, size, life, gravity = 0) {
        this.particles.push(new Particle(x, y, vx, vy, color, size, life, gravity));
    }

    addExplosion(x, y, colors, count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const speed = 2 + Math.random() * 4;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = 2 + Math.random() * 4;
            this.addParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, size, 500 + Math.random() * 500, 0.1);
        }
    }

    addSparks(x, y, direction, count = 5) {
        for (let i = 0; i < count; i++) {
            const angle = direction + (Math.random() - 0.5) * Math.PI * 0.5;
            const speed = 3 + Math.random() * 3;
            this.addParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, '#ffff00', 2, 300 + Math.random() * 200, 0.2);
        }
    }

    addScrewParts(x, y, count = 5) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            const color = ['#888888', '#aaaaaa', '#666666'][Math.floor(Math.random() * 3)];
            this.addParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed - 2, color, 3 + Math.random() * 3, 800 + Math.random() * 400, 0.3);
        }
    }

    addCircuitSparks(x, y, count = 15) {
        const colors = ['#00ffff', '#ff00ff', '#ffff00', '#00ff00'];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 5;
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.addParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, 2 + Math.random() * 2, 400 + Math.random() * 400, 0.05);
        }
    }

    update(deltaTime) {
        this.particles = this.particles.filter(p => {
            p.update(deltaTime);
            return !p.isDead();
        });
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }

    clear() {
        this.particles = [];
    }
}

const particleSystem = new ParticleSystem();
