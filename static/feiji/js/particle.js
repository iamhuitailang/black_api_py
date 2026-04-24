class Particle {
    constructor(x, y, color, speed, angle, size, life) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.speed = speed;
        this.angle = angle;
        this.size = size;
        this.life = life;
        this.maxLife = life;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alpha = 1;
        this.isStar = Math.random() > 0.5;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        this.alpha = this.life / this.maxLife;
        this.rotation += this.rotationSpeed;
        this.vy += 0.05;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.alpha;
        
        if (this.isStar) {
            ctx.fillStyle = this.color;
            Utils.drawStar(ctx, 0, 0, 5, this.size, this.size / 2);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        
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
    
    createExplosion(x, y, count = 15) {
        const colors = ['#00ff88', '#ff66aa', '#ffff00', '#ff8800', '#ffffff'];
        
        for (let i = 0; i < count; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const speed = Utils.random(2, 6);
            const size = Utils.random(3, 8);
            const life = Utils.randomInt(20, 40);
            
            this.particles.push(new Particle(x, y, color, speed, angle, size, life));
        }
    }
    
    createHitEffect(x, y) {
        const colors = ['#00ff88', '#88ffcc'];
        
        for (let i = 0; i < 5; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const angle = Math.random() * Math.PI * 2;
            const speed = Utils.random(1, 3);
            const size = Utils.random(2, 4);
            const life = Utils.randomInt(10, 20);
            
            this.particles.push(new Particle(x, y, color, speed, angle, size, life));
        }
    }
    
    createPowerupEffect(x, y, type) {
        let colors;
        switch(type) {
            case 'shield':
                colors = ['#00aaff', '#00ccff', '#ffffff'];
                break;
            case 'doubleBullet':
                colors = ['#ffaa00', '#ffcc00', '#ffffff'];
                break;
            case 'bomb':
                colors = ['#ff4444', '#ff6600', '#ffffff'];
                break;
            default:
                colors = ['#ffffff'];
        }
        
        for (let i = 0; i < 20; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const angle = Math.random() * Math.PI * 2;
            const speed = Utils.random(2, 5);
            const size = Utils.random(3, 6);
            const life = Utils.randomInt(20, 35);
            
            this.particles.push(new Particle(x, y, color, speed, angle, size, life));
        }
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
