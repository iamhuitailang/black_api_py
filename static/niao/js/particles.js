class Particle {
    constructor(x, y, color, type = 'normal') {
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
        this.life = 1;
        this.maxLife = 1;
        
        if (type === 'trail') {
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
            this.size = Math.random() * 4 + 2;
            this.maxLife = 20;
            this.decay = 0.05;
        } else if (type === 'flame') {
            this.vx = (Math.random() - 0.5) * 3;
            this.vy = -Math.random() * 3 - 1;
            this.size = Math.random() * 6 + 4;
            this.maxLife = 25;
            this.decay = 0.04;
        } else if (type === 'feather') {
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = Math.random() * 2 - 1;
            this.size = Math.random() * 5 + 3;
            this.maxLife = 30;
            this.decay = 0.03;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        } else {
            this.vx = (Math.random() - 0.5) * 3;
            this.vy = Math.random() * 2 - 2;
            this.size = Math.random() * 4 + 2;
            this.maxLife = 25;
            this.decay = 0.04;
        }
        
        this.life = this.maxLife;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        
        if (this.type === 'flame') {
            this.vy -= 0.05;
            this.size *= 0.98;
        }
        
        if (this.rotationSpeed) {
            this.rotation += this.rotationSpeed;
        }
        
        return this.life > 0;
    }
    
    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        
        if (this.rotation) {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.translate(-this.x, -this.y);
        }
        
        ctx.globalAlpha = alpha;
        
        if (this.type === 'flame') {
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.size
            );
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = this.color;
        }
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    emit(x, y, color, count = 5, type = 'normal') {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color, type));
        }
    }
    
    emitTrail(x, y, color, type = 'trail') {
        this.particles.push(new Particle(x, y, color, type));
    }
    
    update() {
        this.particles = this.particles.filter(p => p.update());
    }
    
    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }
    
    clear() {
        this.particles = [];
    }
}
