class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.velocityX = options.velocityX || Utils.random(-3, 3);
        this.velocityY = options.velocityY || Utils.random(-5, -1);
        this.size = options.size || Utils.random(3, 8);
        this.color = options.color || '#FFD700';
        this.life = options.life || 60;
        this.maxLife = this.life;
        this.gravity = options.gravity || 0.2;
        this.rotation = 0;
        this.rotSpeed = options.rotSpeed || Utils.random(-0.2, 0.2);
        this.shape = options.shape || 'circle';
    }
    
    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.velocityY += this.gravity;
        this.rotation += this.rotSpeed;
        this.life--;
    }
    
    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        
        if (this.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, this.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.shape === 'star') {
            this.drawStar(ctx, 0, 0, 5, this.size * alpha, this.size * alpha * 0.5);
            ctx.fill();
        } else if (this.shape === 'rect') {
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        }
        
        ctx.restore();
    }
    
    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let step = Math.PI / spikes;
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
            rot += step;
            ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
            rot += step;
        }
        
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
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
                velocityX: options.velocityX || Utils.random(-3, 3),
                velocityY: options.velocityY || Utils.random(-5, -1)
            }));
        }
    }
    
    emitJumpParticles(x, y) {
        this.emit(x, y, 8, {
            color: '#FFF',
            size: 4,
            life: 20,
            gravity: 0.1
        });
    }
    
    emitLandParticles(x, y) {
        this.emit(x, y, 6, {
            color: '#D2B48C',
            size: 5,
            life: 30,
            gravity: 0.3
        });
    }
    
    emitBreakParticles(x, y, color) {
        this.emit(x, y, 15, {
            color: color,
            size: 6,
            life: 45,
            gravity: 0.2,
            shape: 'rect'
        });
    }
    
    emitChargeParticles(x, y) {
        this.emit(x, y, 3, {
            color: '#FFD700',
            size: 3,
            life: 20,
            gravity: -0.1
        });
    }
    
    emitStarParticles(x, y) {
        this.emit(x, y, 5, {
            color: '#FFD700',
            size: 8,
            life: 40,
            gravity: 0.1,
            shape: 'star'
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

window.Particle = Particle;
window.ParticleSystem = ParticleSystem;
