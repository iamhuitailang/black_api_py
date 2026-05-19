class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || (Math.random() - 0.5) * 4;
        this.vy = options.vy || (Math.random() - 0.5) * 4 - 2;
        this.life = options.life || 1;
        this.maxLife = this.life;
        this.size = options.size || Math.random() * 4 + 2;
        this.color = options.color || '#ffffff';
        this.gravity = options.gravity || 0.05;
    }
    
    update(deltaTime) {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.life -= deltaTime / 1000;
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
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
    
    emit(x, y, count, options = {}) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, {
                ...options,
                vx: options.vx !== undefined ? options.vx + (Math.random() - 0.5) * 2 : undefined,
                vy: options.vy !== undefined ? options.vy + (Math.random() - 0.5) * 2 : undefined
            }));
        }
    }
    
    update(deltaTime) {
        this.particles = this.particles.filter(p => {
            p.update(deltaTime);
            return !p.isDead();
        });
    }
    
    render(ctx) {
        this.particles.forEach(p => p.render(ctx));
    }
    
    clear() {
        this.particles = [];
    }
}

class StarBackground {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.stars = [];
        this.meteors = [];
        this.initStars();
    }
    
    initStars() {
        for (let i = 0; i < 150; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 0.5,
                twinkleSpeed: Math.random() * 2 + 1,
                twinklePhase: Math.random() * Math.PI * 2,
                color: CONFIG.colors.star[Math.floor(Math.random() * CONFIG.colors.star.length)]
            });
        }
    }
    
    update(time) {
        if (Math.random() < 0.005) {
            this.meteors.push({
                x: Math.random() * this.width,
                y: -20,
                length: Math.random() * 80 + 40,
                speed: Math.random() * 8 + 8,
                angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
                life: 1
            });
        }
        
        this.meteors = this.meteors.filter(m => {
            m.x += Math.cos(m.angle) * m.speed;
            m.y += Math.sin(m.angle) * m.speed;
            m.life -= 0.01;
            return m.life > 0 && m.y < this.height + 50;
        });
    }
    
    render(ctx, time) {
        this.stars.forEach(star => {
            const alpha = 0.3 + Math.sin(time / 1000 * star.twinkleSpeed + star.twinklePhase) * 0.3 + 0.4;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = star.color;
            ctx.shadowBlur = 5;
            ctx.shadowColor = star.color;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        this.meteors.forEach(m => {
            const gradient = ctx.createLinearGradient(
                m.x, m.y,
                m.x - Math.cos(m.angle) * m.length,
                m.y - Math.sin(m.angle) * m.length
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${m.life})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.save();
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(m.x, m.y);
            ctx.lineTo(
                m.x - Math.cos(m.angle) * m.length,
                m.y - Math.sin(m.angle) * m.length
            );
            ctx.stroke();
            ctx.restore();
        });
    }
}
