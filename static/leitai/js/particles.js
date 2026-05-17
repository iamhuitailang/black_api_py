class Particle {
    constructor(x, y, vx, vy, color, size, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;
        this.active = true;
    }

    update(dt) {
        if (!this.active) return;

        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1;
        this.life -= dt;

        if (this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = CONFIG.PARTICLES.MAX_COUNT;
        this.sparkles = [];
        this.initSparkles();
    }

    initSparkles() {
        for (let i = 0; i < 30; i++) {
            this.sparkles.push({
                x: Math.random() * CONFIG.CANVAS_WIDTH,
                y: Math.random() * CONFIG.CANVAS_HEIGHT,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 0.5 + 0.2,
                alpha: Math.random()
            });
        }
    }

    emitHitEffect(x, y, isPlayer) {
        const color = isPlayer ? CONFIG.COLORS.CYAN : CONFIG.COLORS.RED;
        const count = CONFIG.PARTICLES.HIT_EFFECT_COUNT;

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            const size = Math.random() * 4 + 2;
            const life = 500 + Math.random() * 500;

            this.addParticle(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color,
                size,
                life
            ));
        }

        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 4;
            
            this.addParticle(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                CONFIG.COLORS.GOLD,
                Math.random() * 3 + 1,
                300 + Math.random() * 300
            ));
        }
    }

    emitBallTrail(ball) {
        if (!ball.active) return;
        if (this.particles.length >= this.maxParticles) return;

        const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        if (speed < CONFIG.BALL.BASE_SPEED * 0.5) return;

        const alpha = Math.min(1, speed / CONFIG.BALL.MAX_SPEED);
        
        this.addParticle(new Particle(
            ball.x,
            ball.y,
            -ball.vx * 0.1,
            -ball.vy * 0.1,
            `rgba(255, 255, 255, ${alpha * 0.5})`,
            ball.radius * 0.6,
            200
        ));
    }

    emitScoreEffect(x, y, isPlayer) {
        const color = isPlayer ? CONFIG.COLORS.CYAN : CONFIG.COLORS.RED;
        
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 3;
            
            this.addParticle(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 3,
                i % 3 === 0 ? CONFIG.COLORS.GOLD : color,
                Math.random() * 5 + 2,
                800 + Math.random() * 400
            ));
        }
    }

    addParticle(particle) {
        if (this.particles.length >= this.maxParticles) {
            const inactiveIndex = this.particles.findIndex(p => !p.active);
            if (inactiveIndex !== -1) {
                this.particles[inactiveIndex] = particle;
            }
        } else {
            this.particles.push(particle);
        }
    }

    update(dt) {
        this.particles.forEach(p => p.update(dt));

        this.sparkles.forEach(s => {
            s.y += s.speed;
            s.alpha = 0.3 + Math.sin(Date.now() / 500 + s.x) * 0.3;
            if (s.y > CONFIG.CANVAS_HEIGHT) {
                s.y = 0;
                s.x = Math.random() * CONFIG.CANVAS_WIDTH;
            }
        });
    }

    draw(ctx) {
        this.sparkles.forEach(s => {
            ctx.globalAlpha = s.alpha;
            ctx.fillStyle = CONFIG.COLORS.GOLD;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        this.particles.forEach(p => p.draw(ctx));
    }

    clear() {
        this.particles = [];
    }
}
