class Particle {
    constructor(x, y, color, type = 'normal') {
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
        this.life = 1;
        this.maxLife = 1;
        
        if (type === 'hit') {
            this.vx = (Math.random() - 0.5) * 8;
            this.vy = (Math.random() - 0.5) * 8;
            this.size = Math.random() * 4 + 2;
            this.maxLife = 30;
            this.life = 30;
        } else if (type === 'trail') {
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
            this.size = Math.random() * 3 + 1;
            this.maxLife = 20;
            this.life = 20;
        } else if (type === 'explosion') {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 6 + 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.size = Math.random() * 6 + 3;
            this.maxLife = 40;
            this.life = 40;
        } else if (type === 'charge') {
            this.vx = (Math.random() - 0.5) * 3;
            this.vy = (Math.random() - 0.5) * 3;
            this.size = Math.random() * 5 + 2;
            this.maxLife = 25;
            this.life = 25;
        } else {
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = (Math.random() - 0.5) * 4;
            this.size = Math.random() * 3 + 1;
            this.maxLife = 20;
            this.life = 20;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1;
        this.life--;
        return this.life > 0;
    }

    draw(ctx) {
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

class HitEffect {
    constructor(x, y, color = '#ffff00') {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = 5;
        this.maxRadius = 40;
        this.life = 20;
        this.maxLife = 20;
        this.particles = [];
        
        for (let i = 0; i < 12; i++) {
            this.particles.push(new Particle(x, y, color, 'hit'));
        }
    }

    update() {
        this.life--;
        this.radius += 2;
        this.particles = this.particles.filter(p => p.update());
        return this.life > 0 || this.particles.length > 0;
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha * 0.8;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        this.particles.forEach(p => p.draw(ctx));
    }
}

class ExplosionEffect {
    constructor(x, y, radius = 60) {
        this.x = x;
        this.y = y;
        this.maxRadius = radius;
        this.radius = 10;
        this.life = 40;
        this.maxLife = 40;
        this.particles = [];
        
        for (let i = 0; i < 30; i++) {
            const color = ['#ff4400', '#ff8800', '#ffaa00', '#ffff00'][Math.floor(Math.random() * 4)];
            this.particles.push(new Particle(x, y, color, 'explosion'));
        }
    }

    update() {
        this.life--;
        if (this.radius < this.maxRadius) {
            this.radius += 5;
        }
        this.particles = this.particles.filter(p => p.update());
        return this.life > 0 || this.particles.length > 0;
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha * 0.6;
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        gradient.addColorStop(0, 'rgba(255, 200, 50, 0.9)');
        gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        this.particles.forEach(p => p.draw(ctx));
    }
}

class ChargeEffect {
    constructor(x, y, color = '#ffff00') {
        this.x = x;
        this.y = y;
        this.color = color;
        this.particles = [];
        this.angle = 0;
    }

    update(shooterX, shooterY) {
        this.x = shooterX;
        this.y = shooterY;
        this.angle += 0.2;
        
        if (Math.random() < 0.4) {
            const offsetX = Math.cos(this.angle + Math.random()) * 30;
            const offsetY = Math.sin(this.angle + Math.random()) * 30;
            this.particles.push(new Particle(shooterX + offsetX, shooterY + offsetY, this.color, 'charge'));
        }
        
        this.particles = this.particles.filter(p => p.update());
    }

    draw(ctx) {
        ctx.save();
        const time = Date.now() / 100;
        for (let i = 0; i < 3; i++) {
            const radius = 20 + i * 10 + Math.sin(time + i) * 5;
            ctx.globalAlpha = 0.3 - i * 0.1;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
        
        this.particles.forEach(p => p.draw(ctx));
    }
}

class DamageNumber {
    constructor(x, y, damage, isCrit = false) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.isCrit = isCrit;
        this.life = 60;
        this.maxLife = 60;
        this.vy = -2;
    }

    update() {
        this.y += this.vy;
        this.vy += 0.05;
        this.life--;
        return this.life > 0;
    }

    draw(ctx) {
        const alpha = Math.min(1, this.life / 30);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = this.isCrit ? 'bold 24px Arial' : 'bold 18px Arial';
        ctx.fillStyle = this.isCrit ? '#ff4444' : '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        ctx.strokeText(this.isCrit ? '暴击! ' + this.damage : '-' + this.damage, this.x, this.y);
        ctx.fillText(this.isCrit ? '暴击! ' + this.damage : '-' + this.damage, this.x, this.y);
        ctx.restore();
    }
}

class EffectManager {
    constructor() {
        this.effects = [];
        this.damageNumbers = [];
    }

    addHit(x, y, color) {
        this.effects.push(new HitEffect(x, y, color));
    }

    addExplosion(x, y, radius) {
        this.effects.push(new ExplosionEffect(x, y, radius));
    }

    addDamage(x, y, damage, isCrit) {
        this.damageNumbers.push(new DamageNumber(x, y, damage, isCrit));
    }

    update() {
        this.effects = this.effects.filter(e => e.update());
        this.damageNumbers = this.damageNumbers.filter(d => d.update());
    }

    draw(ctx) {
        this.effects.forEach(e => e.draw(ctx));
        this.damageNumbers.forEach(d => d.draw(ctx));
    }

    clear() {
        this.effects = [];
        this.damageNumbers = [];
    }
}
