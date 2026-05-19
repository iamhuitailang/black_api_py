const ParticleSystem = {
    particles: [],
    screenShake: { active: false, intensity: 0, duration: 0 },
    
    init() {
        this.particles = [];
        this.screenShake = { active: false, intensity: 0, duration: 0 };
    },
    
    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity || 0;
            p.life -= deltaTime;
            p.alpha = Math.max(0, p.life / p.maxLife);
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        if (this.screenShake.active) {
            this.screenShake.duration -= deltaTime;
            this.screenShake.intensity *= 0.95;
            if (this.screenShake.duration <= 0) {
                this.screenShake.active = false;
                this.screenShake.intensity = 0;
            }
        }
    },
    
    createHitEffect(x, y, color) {
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 / 15) * i;
            const speed = 2 + Math.random() * 4;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 5,
                color: color,
                life: 500,
                maxLife: 500,
                alpha: 1,
                gravity: 0.1
            });
        }
    },
    
    createProjectileTrail(x, y, color) {
        if (Math.random() > 0.3) return;
        this.particles.push({
            x: x + (Math.random() - 0.5) * 10,
            y: y + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: 4 + Math.random() * 6,
            color: color,
            life: 300,
            maxLife: 300,
            alpha: 0.8,
            gravity: 0
        });
    },
    
    createExplosion(x, y, color) {
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 8;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 4 + Math.random() * 8,
                color: color,
                life: 800,
                maxLife: 800,
                alpha: 1,
                gravity: 0.2
            });
        }
        
        this.createScreenShake();
    },
    
    createDefeatEffect(x, y) {
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 6;
            const colors = ['#ffd700', '#ff6b6b', '#4488ff', '#333333'];
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                size: 5 + Math.random() * 10,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1500,
                maxLife: 1500,
                alpha: 1,
                gravity: 0.15
            });
        }
    },
    
    createFaceSwitchEffect(x, y, oldColor, newColor) {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                size: 6 + Math.random() * 8,
                color: Math.random() > 0.5 ? oldColor : newColor,
                life: 600,
                maxLife: 600,
                alpha: 1,
                gravity: 0.1
            });
        }
    },
    
    createSpeedLines(character) {
        if (Math.random() > 0.2) return;
        
        const direction = character.facing;
        this.particles.push({
            x: character.x + (direction === 1 ? 0 : character.width),
            y: character.y + 20 + Math.random() * (character.height - 40),
            vx: -direction * (3 + Math.random() * 2),
            vy: 0,
            size: 1,
            length: 20 + Math.random() * 30,
            color: 'rgba(255, 255, 255, 0.6)',
            life: 200,
            maxLife: 200,
            alpha: 0.6,
            gravity: 0,
            isLine: true,
            direction: direction
        });
    },
    
    createScreenShake() {
        this.screenShake.active = true;
        this.screenShake.intensity = 8;
        this.screenShake.duration = 200;
    },
    
    getScreenShakeOffset() {
        if (!this.screenShake.active) return { x: 0, y: 0 };
        return {
            x: (Math.random() - 0.5) * this.screenShake.intensity,
            y: (Math.random() - 0.5) * this.screenShake.intensity
        };
    },
    
    render(ctx) {
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            
            if (p.isLine) {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + p.direction * p.length, p.y);
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
    },
    
    reset() {
        this.particles = [];
        this.screenShake = { active: false, intensity: 0, duration: 0 };
    }
};
