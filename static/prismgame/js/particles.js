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
        this.alpha = 1;
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.life -= deltaTime;
        this.alpha = Math.max(0, this.life / this.maxLife);
        this.size *= 0.99;
        return this.life > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = this.size * 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 500;
    }

    emit(x, y, options = {}) {
        const count = options.count || 10;
        const color = options.color || '#ffffff';
        const speed = options.speed || 50;
        const size = options.size || 3;
        const life = options.life || 1;
        const spread = options.spread || Math.PI * 2;
        const baseAngle = options.angle !== undefined ? options.angle : Math.random() * Math.PI * 2;

        for (let i = 0; i < count; i++) {
            const angle = baseAngle + (Math.random() - 0.5) * spread;
            const spd = speed * (0.5 + Math.random() * 0.5);
            const particle = new Particle(
                x, y,
                Math.cos(angle) * spd,
                Math.sin(angle) * spd,
                color,
                size * (0.5 + Math.random() * 0.5),
                life * (0.5 + Math.random() * 0.5)
            );

            if (this.particles.length < this.maxParticles) {
                this.particles.push(particle);
            }
        }
    }

    emitAlongPath(path, options = {}) {
        if (!path || path.length < 2) return;

        const density = options.density || 2;
        const color = options.color || '#ffffff';
        const size = options.size || 2;
        const life = options.life || 0.5;

        for (let i = 0; i < path.length - 1; i++) {
            const p1 = path[i];
            const p2 = path[i + 1];
            const dist = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
            const count = Math.floor(dist / density);

            for (let j = 0; j < count; j++) {
                const t = j / count;
                const x = p1.x + (p2.x - p1.x) * t;
                const y = p1.y + (p2.y - p1.y) * t;

                const angle = Math.random() * Math.PI * 2;
                const spd = 10 + Math.random() * 20;

                const particle = new Particle(
                    x, y,
                    Math.cos(angle) * spd,
                    Math.sin(angle) * spd,
                    color,
                    size * (0.5 + Math.random() * 0.5),
                    life * (0.3 + Math.random() * 0.7)
                );

                if (this.particles.length < this.maxParticles) {
                    this.particles.push(particle);
                }
            }
        }
    }

    update(deltaTime) {
        this.particles = this.particles.filter(p => p.update(deltaTime));
    }

    draw(ctx) {
        for (const particle of this.particles) {
            particle.draw(ctx);
        }
    }

    clear() {
        this.particles = [];
    }
}

class GlowEffect {
    constructor() {
        this.intensity = 0;
        this.targetIntensity = 0;
        this.color = '#ffffff';
        this.x = 0;
        this.y = 0;
        this.radius = 50;
    }

    setTarget(x, y, intensity, color) {
        this.x = x;
        this.y = y;
        this.targetIntensity = intensity;
        this.color = color;
    }

    update(deltaTime) {
        this.intensity += (this.targetIntensity - this.intensity) * deltaTime * 5;
        this.radius = 50 + this.intensity * 30;
    }

    draw(ctx) {
        if (this.intensity < 0.01) return;

        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, this.color + Math.floor(this.intensity * 80).toString(16).padStart(2, '0'));
        gradient.addColorStop(0.5, this.color + Math.floor(this.intensity * 40).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, this.color + '00');

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
        ctx.restore();
    }
}
