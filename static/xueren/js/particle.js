class Particle {
    constructor(x, y, color, velocityX = 0, velocityY = 0, life = 30, size = 5) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocityX = velocityX || Utils.random(-3, 3);
        this.velocityY = velocityY || Utils.random(-5, -1);
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.gravity = 0.1;
        this.active = true;
    }
    
    update() {
        if (!this.active) return;
        
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.velocityY += this.gravity;
        this.life--;
        
        if (this.life <= 0) {
            this.active = false;
        }
    }
    
    draw(ctx) {
        if (!this.active) return;
        
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
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
    
    createSnowBurst(x, y, count = 15) {
        for (let i = 0; i < count; i++) {
            const colors = [CONFIG.COLORS.WHITE, CONFIG.COLORS.LIGHT_BLUE, CONFIG.COLORS.ICE_BLUE];
            const color = colors[Utils.randomInt(0, colors.length - 1)];
            this.particles.push(new Particle(
                x, y, color,
                Utils.random(-4, 4),
                Utils.random(-6, -2),
                Utils.randomInt(20, 40),
                Utils.random(3, 6)
            ));
        }
    }
    
    createScorePopup(x, y, score) {
        const particle = new Particle(
            x, y,
            CONFIG.COLORS.LIGHT_PINK,
            0, -2,
            60,
            0
        );
        particle.isText = true;
        particle.text = '+' + score;
        this.particles.push(particle);
    }
    
    createPowerupSparkle(x, y, color) {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            this.particles.push(new Particle(
                x, y, color,
                Math.cos(angle) * 3,
                Math.sin(angle) * 3,
                25,
                4
            ));
        }
    }
    
    createEnemyDeath(x, y, color, count = 20) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(
                x, y, color,
                Utils.random(-5, 5),
                Utils.random(-7, -1),
                Utils.randomInt(30, 50),
                Utils.random(4, 8)
            ));
        }
    }
    
    update() {
        this.particles = this.particles.filter(p => {
            p.update();
            return p.active;
        });
    }
    
    draw(ctx) {
        this.particles.forEach(particle => {
            if (particle.isText) {
                const alpha = particle.life / particle.maxLife;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.font = 'bold 20px Arial';
                ctx.fillStyle = particle.color;
                ctx.textAlign = 'center';
                ctx.fillText(particle.text, particle.x, particle.y);
                ctx.restore();
            } else {
                particle.draw(ctx);
            }
        });
    }
    
    clear() {
        this.particles = [];
    }
}
