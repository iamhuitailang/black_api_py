const Utils = {
    random(min, max) {
        return Math.random() * (max - min) + min;
    },

    randomInt(min, max) {
        return Math.floor(this.random(min, max + 1));
    },

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    circleCollision(x1, y1, r1, x2, y2, r2) {
        return this.distance(x1, y1, x2, y2) < r1 + r2;
    },

    rectCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    },

    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    },

    easeOutQuad(t) {
        return t * (2 - t);
    },

    easeInQuad(t) {
        return t * t;
    },

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },

    shake(amount, intensity = 10) {
        return (Math.random() - 0.5) * intensity * amount;
    },

    colorToString(r, g, b, a = 1) {
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    },

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
};

const ParticleSystem = {
    particles: [],

    create(x, y, options = {}) {
        const particle = {
            x,
            y,
            vx: options.vx || Utils.random(-3, 3),
            vy: options.vy || Utils.random(-5, -1),
            life: options.life || 1,
            maxLife: options.life || 1,
            size: options.size || Utils.random(3, 8),
            color: options.color || '#FFD700',
            gravity: options.gravity !== undefined ? options.gravity : 0.2
        };
        this.particles.push(particle);
    },

    createBurst(x, y, count, options = {}) {
        for (let i = 0; i < count; i++) {
            this.create(x, y, options);
        }
    },

    createWaterSplash(x, y) {
        for (let i = 0; i < 10; i++) {
            this.create(x, y, {
                vx: Utils.random(-4, 4),
                vy: Utils.random(-7, -2),
                color: '#87CEEB',
                size: Utils.random(4, 10),
                gravity: 0.15
            });
        }
    },

    createBiteEffect(x, y, color) {
        for (let i = 0; i < 15; i++) {
            const angle = (i / 15) * Math.PI * 2;
            const speed = Utils.random(3, 6);
            this.create(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: Utils.random(5, 12),
                life: 0.5,
                gravity: 0
            });
        }
    },

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.life -= 0.02;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    },

    render(ctx) {
        this.particles.forEach(p => {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    },

    clear() {
        this.particles = [];
    }
};