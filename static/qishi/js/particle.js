class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || (Math.random() - 0.5) * 4;
        this.vy = options.vy || (Math.random() - 0.5) * 4;
        this.life = options.life || 1;
        this.maxLife = this.life;
        this.size = options.size || 3;
        this.color = options.color || CONFIG.COLORS.PARTICLE;
        this.gravity = options.gravity || 0;
        this.friction = options.friction || 0.98;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.life -= 0.02;
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
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

    emit(x, y, count = 10, options = {}) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, options));
        }
    }

    emitAttack(x, y, facingRight) {
        for (let i = 0; i < 8; i++) {
            const angle = (facingRight ? 0 : Math.PI) + (Math.random() - 0.5) * 0.5;
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * (3 + Math.random() * 3),
                vy: Math.sin(angle) * 2 + (Math.random() - 0.5) * 2,
                life: 0.8,
                size: 2 + Math.random() * 2,
                color: CONFIG.COLORS.ATTACK
            }));
        }
    }

    emitSpell(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                life: 1,
                size: 4,
                color: CONFIG.COLORS.SPELL
            }));
        }
    }

    emitDash(x, y, facingRight) {
        for (let i = 0; i < 5; i++) {
            this.particles.push(new Particle(x, y, {
                vx: (facingRight ? -1 : 1) * (1 + Math.random() * 2),
                vy: (Math.random() - 0.5) * 2,
                life: 0.5,
                size: 3 + Math.random() * 2,
                color: CONFIG.COLORS.DASH
            }));
        }
    }

    emitHit(x, y) {
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * (2 + Math.random() * 3),
                vy: Math.sin(angle) * (2 + Math.random() * 3),
                life: 0.6,
                size: 2 + Math.random() * 2,
                color: CONFIG.COLORS.HEALTH
            }));
        }
    }

    emitDeath(x, y) {
        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2;
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * (3 + Math.random() * 4),
                vy: Math.sin(angle) * (3 + Math.random() * 4),
                gravity: 0.1,
                life: 1.2,
                size: 3 + Math.random() * 3,
                color: CONFIG.COLORS.ENEMY
            }));
        }
    }

    emitEssence(x, y) {
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * (2 + Math.random() * 2),
                vy: Math.sin(angle) * (2 + Math.random() * 2) - 2,
                life: 1.5,
                size: 2 + Math.random() * 3,
                color: CONFIG.COLORS.ESSENCE
            }));
        }
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
}