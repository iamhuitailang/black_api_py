class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || Utils.random(-3, 3);
        this.vy = options.vy || Utils.random(-3, 3);
        this.life = options.life || 1;
        this.decay = options.decay || 0.02;
        this.size = options.size || Utils.random(2, 6);
        this.color = options.color || Utils.randomChoice(CONFIG.PARTICLES.COLORS);
        this.gravity = options.gravity || 0;
        this.friction = options.friction || 0.98;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.life -= this.decay;
        this.size *= 0.98;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    isDead() {
        return this.life <= 0 || this.size < 0.5;
    }
}

class ParticleSystem {
    constructor(maxParticles = CONFIG.PARTICLES.MAX_COUNT) {
        this.particles = [];
        this.maxParticles = maxParticles;
    }

    emit(x, y, count = 10, options = {}) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length < this.maxParticles) {
                this.particles.push(new Particle(x, y, options));
            }
        }
    }

    emitBlood(x, y, count = 15) {
        this.emit(x, y, count, {
            color: '#8b0000',
            vx: Utils.random(-4, 4),
            vy: Utils.random(-4, 4),
            size: Utils.random(3, 8),
            life: 1,
            decay: 0.03
        });
    }

    emitMuzzleFlash(x, y, angle) {
        for (let i = 0; i < 5; i++) {
            const spreadAngle = angle + Utils.random(-0.2, 0.2);
            const speed = Utils.random(5, 10);
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(spreadAngle) * speed,
                vy: Math.sin(spreadAngle) * speed,
                color: '#ffaa00',
                size: Utils.random(3, 6),
                life: 0.3,
                decay: 0.08
            }));
        }
    }

    emitExplosion(x, y, count = 30) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = Utils.random(3, 8);
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: i % 2 === 0 ? '#ff6600' : '#ffcc00',
                size: Utils.random(4, 10),
                life: 1,
                decay: 0.02
            }));
        }
    }

    emitZombieDeath(x, y, size = 25) {
        const count = Math.floor(size / 2);
        this.emit(x, y, count, {
            color: '#4a5d23',
            vx: Utils.random(-3, 3),
            vy: Utils.random(-3, 3),
            size: Utils.random(3, 8),
            life: 0.8,
            decay: 0.025
        });
        this.emitBlood(x, y, 10);
    }

    emitItemPickup(x, y, color) {
        this.emit(x, y, 15, {
            color: color,
            vx: Utils.random(-2, 2),
            vy: Utils.random(-5, -2),
            size: Utils.random(3, 6),
            life: 0.8,
            decay: 0.03,
            gravity: 0.1
        });
    }

    update() {
        this.particles = this.particles.filter(p => {
            p.update();
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
