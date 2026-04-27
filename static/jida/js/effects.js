class Particle {
    constructor(x, y, color, options = {}) {
        this.x = x;
        this.y = y;
        this.color = color;
        
        const angle = Math.random() * Math.PI * 2;
        const speed = Utils.random(
            GameConfig.PARTICLES.SPEED_MIN,
            GameConfig.PARTICLES.SPEED_MAX
        );
        
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.size = options.size || Utils.random(2, 6);
        this.life = GameConfig.PARTICLES.LIFE;
        this.maxLife = this.life;
        this.alpha = 1;
        this.gravity = 0;
        this.isActive = true;
    }
    
    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        this.vy += this.gravity * deltaTime;
        
        this.life -= deltaTime;
        this.alpha = this.life / this.maxLife;
        
        if (this.life <= 0) {
            this.isActive = false;
        }
    }
    
    draw(ctx) {
        if (!this.isActive) return;
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.alpha, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    emit(x, y, color, count = GameConfig.PARTICLES.COUNT, options = {}) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color, options));
        }
    }
    
    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(deltaTime);
            
            if (!this.particles[i].isActive) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    draw(ctx) {
        this.particles.forEach(particle => {
            particle.draw(ctx);
        });
    }
    
    clear() {
        this.particles = [];
    }
}

class RippleEffect {
    constructor(x, y, color, maxRadius = 100) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.maxRadius = maxRadius;
        
        this.radius = 0;
        this.alpha = 1;
        this.isActive = true;
        this.speed = 300;
    }
    
    update(deltaTime) {
        this.radius += this.speed * deltaTime;
        this.alpha = 1 - (this.radius / this.maxRadius);
        
        if (this.alpha <= 0 || this.radius >= this.maxRadius) {
            this.isActive = false;
        }
    }
    
    draw(ctx) {
        if (!this.isActive) return;
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = this.color;
        ctx.stroke();
        ctx.restore();
    }
}

class RippleManager {
    constructor() {
        this.ripples = [];
    }
    
    create(x, y, color, maxRadius = 100) {
        this.ripples.push(new RippleEffect(x, y, color, maxRadius));
    }
    
    update(deltaTime) {
        for (let i = this.ripples.length - 1; i >= 0; i--) {
            this.ripples[i].update(deltaTime);
            
            if (!this.ripples[i].isActive) {
                this.ripples.splice(i, 1);
            }
        }
    }
    
    draw(ctx) {
        this.ripples.forEach(ripple => {
            ripple.draw(ctx);
        });
    }
    
    clear() {
        this.ripples = [];
    }
}

class FloatingNumber {
    constructor(x, y, text, color, options = {}) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        
        this.startY = y;
        this.targetY = y - 80;
        this.life = 1.0;
        this.maxLife = 1.0;
        this.alpha = 1;
        this.isActive = true;
        this.scale = 1.5;
        this.fontSize = options.fontSize || 32;
    }
    
    update(deltaTime) {
        this.life -= deltaTime * 0.8;
        this.alpha = this.life / this.maxLife;
        
        const progress = 1 - (this.life / this.maxLife);
        this.y = Utils.lerp(this.startY, this.targetY, Utils.easeOutCubic(progress));
        
        this.scale = 1 + 0.5 * Utils.easeOutQuad(this.alpha);
        
        if (this.life <= 0) {
            this.isActive = false;
        }
    }
    
    draw(ctx) {
        if (!this.isActive) return;
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.font = `bold ${this.fontSize * this.scale}px Arial`;
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

class FloatingNumberManager {
    constructor() {
        this.numbers = [];
    }
    
    create(x, y, text, color, options = {}) {
        this.numbers.push(new FloatingNumber(x, y, text, color, options));
    }
    
    update(deltaTime) {
        for (let i = this.numbers.length - 1; i >= 0; i--) {
            this.numbers[i].update(deltaTime);
            
            if (!this.numbers[i].isActive) {
                this.numbers.splice(i, 1);
            }
        }
    }
    
    draw(ctx) {
        this.numbers.forEach(num => {
            num.draw(ctx);
        });
    }
    
    clear() {
        this.numbers = [];
    }
}

class JudgmentDisplay {
    constructor() {
        this.currentJudgment = null;
        this.life = 0;
        this.maxLife = 0.5;
        this.x = 0;
        this.y = 0;
    }
    
    show(x, y, type) {
        this.currentJudgment = type;
        this.life = this.maxLife;
        this.x = x;
        this.y = y;
    }
    
    update(deltaTime) {
        if (this.life > 0) {
            this.life -= deltaTime;
        }
    }
    
    draw(ctx) {
        if (this.life <= 0 || !this.currentJudgment) return;
        
        const alpha = this.life / this.maxLife;
        const scale = 1 + 0.3 * (1 - alpha);
        const judgment = GameConfig.JUDGMENT[this.currentJudgment];
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${48 * scale}px Arial`;
        ctx.fillStyle = judgment.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.shadowColor = judgment.color;
        ctx.shadowBlur = 20;
        
        ctx.fillText(judgment.name, this.x, this.y - 50);
        ctx.restore();
    }
}

class ComboEffect {
    constructor() {
        this.combo = 0;
        this.life = 0;
        this.maxLife = 0.8;
        this.x = 0;
        this.y = 0;
        this.flameParticles = [];
    }
    
    show(x, y, combo) {
        this.combo = combo;
        this.life = this.maxLife;
        this.x = x;
        this.y = y;
        
        for (let i = 0; i < 10; i++) {
            this.flameParticles.push({
                x: x + Utils.random(-30, 30),
                y: y,
                vx: Utils.random(-2, 2),
                vy: Utils.random(-100, -50),
                size: Utils.random(5, 15),
                life: 0.5,
                maxLife: 0.5
            });
        }
    }
    
    update(deltaTime) {
        if (this.life > 0) {
            this.life -= deltaTime;
        }
        
        for (let i = this.flameParticles.length - 1; i >= 0; i--) {
            const p = this.flameParticles[i];
            p.x += p.vx;
            p.y += p.vy * deltaTime;
            p.life -= deltaTime;
            
            if (p.life <= 0) {
                this.flameParticles.splice(i, 1);
            }
        }
    }
    
    draw(ctx) {
        this.flameParticles.forEach(p => {
            const alpha = p.life / p.maxLife;
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            gradient.addColorStop(0, Utils.hexToRgba('#ffff00', alpha));
            gradient.addColorStop(0.5, Utils.hexToRgba('#ff6600', alpha * 0.7));
            gradient.addColorStop(1, Utils.hexToRgba('#ff0000', alpha * 0.3));
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.restore();
        });
        
        if (this.life > 0 && this.combo >= 10) {
            const alpha = this.life / this.maxLife;
            const scale = 1 + 0.2 * (1 - alpha);
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = `bold ${64 * scale}px Arial`;
            ctx.fillStyle = '#ff00ff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            ctx.shadowColor = '#ff00ff';
            ctx.shadowBlur = 30;
            
            ctx.fillText(`${this.combo}x`, this.x, this.y);
            
            ctx.font = `bold ${24 * scale}px Arial`;
            ctx.fillStyle = '#ffff00';
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 15;
            ctx.fillText('COMBO', this.x, this.y + 40);
            ctx.restore();
        }
    }
}

class BackgroundParticles {
    constructor() {
        this.particles = [];
        this.maxParticles = 100;
    }
    
    init(width, height) {
        this.particles = [];
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Utils.random(1, 3),
                speed: Utils.random(20, 60),
                alpha: Utils.random(0.1, 0.5),
                color: this.getRandomColor()
            });
        }
    }
    
    getRandomColor() {
        const colors = ['#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#ff6600'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    update(deltaTime, height) {
        this.particles.forEach(p => {
            p.y += p.speed * deltaTime;
            
            if (p.y > height) {
                p.y = -10;
                p.x = Math.random() * window.innerWidth;
            }
        });
    }
    
    draw(ctx) {
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.restore();
        });
    }
}
