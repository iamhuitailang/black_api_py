class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 200;
        this.splashParticles = [];
    }

    createSplash(x, y, count = 5) {
        for (let i = 0; i < count; i++) {
            const angle = Utils.random(-Math.PI / 3, Math.PI / 3);
            const speed = Utils.random(2, 5);
            this.particles.push({
                x: x + Utils.random(-10, 10),
                y: y,
                vx: Math.sin(angle) * speed,
                vy: -Math.cos(angle) * speed - Utils.random(1, 3),
                life: 1,
                decay: Utils.random(0.02, 0.04),
                size: Utils.random(3, 8),
                color: `rgba(255, 255, 255, ${Utils.random(0.7, 1)})`,
                type: 'splash'
            });
        }
    }

    createSpeedTrail(x, y, speed) {
        const intensity = Math.min(speed / 10, 1);
        const count = Math.floor(intensity * 3);
        
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x + Utils.random(-20, 20),
                y: y + Utils.random(-5, 15),
                vx: Utils.random(-0.5, 0.5),
                vy: Utils.random(0.5, 2),
                life: 1,
                decay: Utils.random(0.03, 0.05),
                size: Utils.random(4, 12),
                color: `rgba(100, 200, 255, ${Utils.random(0.4, 0.7)})`,
                type: 'trail'
            });
        }
    }

    createCollision(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = Utils.random(3, 7);
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                life: 1,
                decay: Utils.random(0.025, 0.045),
                size: Utils.random(5, 10),
                color: `rgba(255, 150, 100, ${Utils.random(0.8, 1)})`,
                type: 'collision'
            });
        }
    }

    createPowerupCollect(x, y, type) {
        const colors = {
            nitro: '#ffd700',
            shield: '#00ff88',
            magnet: '#ff00ff',
            slowOther: '#00ffff'
        };
        const color = colors[type] || '#ffffff';
        
        for (let ring = 0; ring < 3; ring++) {
            setTimeout(() => {
                for (let i = 0; i < 12; i++) {
                    const angle = (Math.PI * 2 * i) / 12;
                    const speed = Utils.random(4, 8) + ring * 2;
                    this.particles.push({
                        x: x,
                        y: y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: 1,
                        decay: 0.025,
                        size: Utils.random(6, 12),
                        color: color,
                        type: 'powerup'
                    });
                }
            }, ring * 100);
        }
    }

    update() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15;
            p.life -= p.decay;
            
            if (p.type === 'splash' && p.vy > 0) {
                p.size *= 0.98;
            }
            
            return p.life > 0;
        });

        if (this.particles.length > this.maxParticles) {
            this.particles = this.particles.slice(-this.maxParticles);
        }
    }

    render(ctx) {
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life;
            
            if (p.type === 'splash' || p.type === 'trail') {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.3 * p.life, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.fill();
            } else {
                ctx.shadowBlur = 10;
                ctx.shadowColor = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
            
            ctx.restore();
        });
    }

    clear() {
        this.particles = [];
    }
}