class Particle {
    constructor(x, y, vx, vy, color, size, life, type = 'normal') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;
        this.type = type;
        this.alpha = 1;
        this.trail = [];
        this.maxTrailLength = type === 'flame' ? 8 : 3;
    }

    update(deltaTime) {
        if (this.type === 'flame' || this.type === 'energy') {
            this.trail.push({ x: this.x, y: this.y, alpha: this.alpha });
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
        }

        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        if (this.type === 'star') {
            this.vx *= 0.99;
            this.vy *= 0.99;
        } else if (this.type === 'flame') {
            this.vx *= 0.98;
            this.vy *= 0.98;
        } else if (this.type === 'energy') {
            this.vx *= 0.95;
            this.vy *= 0.95;
        }

        this.life -= deltaTime;
        this.alpha = Math.max(0, this.life / this.maxLife);
    }

    draw(ctx) {
        ctx.save();

        if (this.type === 'flame' && this.trail.length > 1) {
            for (let i = 0; i < this.trail.length - 1; i++) {
                const t = this.trail[i];
                const nextT = this.trail[i + 1];
                const trailAlpha = (i / this.trail.length) * this.alpha * 0.6;
                const trailSize = this.size * (i / this.trail.length) * 0.8;
                
                ctx.beginPath();
                ctx.moveTo(t.x, t.y);
                ctx.lineTo(nextT.x, nextT.y);
                ctx.strokeStyle = this.color.replace('1)', `${trailAlpha})`);
                ctx.lineWidth = trailSize;
                ctx.lineCap = 'round';
                ctx.stroke();
            }
        }

        if (this.type === 'energy' && this.trail.length > 1) {
            for (let i = 0; i < this.trail.length - 1; i++) {
                const t = this.trail[i];
                const trailAlpha = (i / this.trail.length) * this.alpha * 0.8;
                
                ctx.beginPath();
                ctx.arc(t.x, t.y, this.size * (i / this.trail.length) * 0.6, 0, Math.PI * 2);
                ctx.fillStyle = this.color.replace('1)', `${trailAlpha})`);
                ctx.fill();
            }
        }

        ctx.globalAlpha = this.alpha;

        if (this.type === 'star') {
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.size * 2
            );
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(0.5, this.color.replace('1)', '0.5)'));
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        } else if (this.type === 'explosion') {
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.size
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.3, this.color);
            gradient.addColorStop(1, 'rgba(255, 100, 50, 0)');
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        } else if (this.type === 'flame') {
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.size
            );
            gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
            gradient.addColorStop(0.5, this.color);
            gradient.addColorStop(1, 'rgba(255, 100, 50, 0)');
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        } else if (this.type === 'energy') {
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.size * 1.5
            );
            gradient.addColorStop(0, 'rgba(200, 255, 255, 1)');
            gradient.addColorStop(0.5, this.color);
            gradient.addColorStop(1, 'rgba(100, 150, 255, 0)');
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        ctx.restore();
    }

    isAlive() {
        return this.life > 0;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.stars = [];
        this.nebulaParticles = [];
    }

    initStars(width, height) {
        this.stars = [];
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 2 + 0.5;
            const speed = Math.random() * 20 + 10;
            const brightness = Math.random() * 0.5 + 0.5;
            
            this.stars.push({
                x, y,
                baseX: x,
                baseY: y,
                size,
                speed,
                brightness,
                twinkleOffset: Math.random() * Math.PI * 2,
                twinkleSpeed: Math.random() * 2 + 1
            });
        }

        this.nebulaParticles = [];
        for (let i = 0; i < 50; i++) {
            this.nebulaParticles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 100 + 50,
                color: this.getNebulaColor(),
                alpha: Math.random() * 0.1 + 0.05,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5
            });
        }
    }

    getNebulaColor() {
        const colors = [
            'rgba(100, 150, 255, ',
            'rgba(150, 100, 200, ',
            'rgba(200, 100, 150, ',
            'rgba(255, 150, 100, '
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    updateStars(deltaTime, time, cameraX, cameraY, width, height) {
        for (const star of this.stars) {
            const parallax = 0.3;
            star.x = (star.baseX - cameraX * parallax) % width;
            star.y = (star.baseY - cameraY * parallax) % height;
            
            if (star.x < 0) star.x += width;
            if (star.y < 0) star.y += height;
            
            star.twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;
        }

        for (const nebula of this.nebulaParticles) {
            nebula.x += nebula.vx * deltaTime;
            nebula.y += nebula.vy * deltaTime;
            
            if (nebula.x < -nebula.size) nebula.x = width + nebula.size;
            if (nebula.x > width + nebula.size) nebula.x = -nebula.size;
            if (nebula.y < -nebula.size) nebula.y = height + nebula.size;
            if (nebula.y > height + nebula.size) nebula.y = -nebula.size;
        }
    }

    drawBackground(ctx, width, height, wave) {
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        
        const waveProgress = Math.min((wave - 1) / 20, 1);
        
        if (waveProgress < 0.33) {
            gradient.addColorStop(0, '#0a0a2e');
            gradient.addColorStop(0.5, '#0d1a4d');
            gradient.addColorStop(1, '#1a1a3e');
        } else if (waveProgress < 0.66) {
            const t = (waveProgress - 0.33) / 0.33;
            gradient.addColorStop(0, this.lerpColor('#0a0a2e', '#2a0a3e', t));
            gradient.addColorStop(0.5, this.lerpColor('#0d1a4d', '#3d1a4d', t));
            gradient.addColorStop(1, this.lerpColor('#1a1a3e', '#3e1a2a', t));
        } else {
            const t = (waveProgress - 0.66) / 0.34;
            gradient.addColorStop(0, this.lerpColor('#2a0a3e', '#3e2a0a', t));
            gradient.addColorStop(0.5, this.lerpColor('#3d1a4d', '#4d3d1a', t));
            gradient.addColorStop(1, this.lerpColor('#3e1a2a', '#3e2a0a', t));
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        for (const nebula of this.nebulaParticles) {
            const nebulaGradient = ctx.createRadialGradient(
                nebula.x, nebula.y, 0,
                nebula.x, nebula.y, nebula.size
            );
            nebulaGradient.addColorStop(0, nebula.color + nebula.alpha + ')');
            nebulaGradient.addColorStop(1, nebula.color + '0)');
            
            ctx.fillStyle = nebulaGradient;
            ctx.fillRect(
                nebula.x - nebula.size,
                nebula.y - nebula.size,
                nebula.size * 2,
                nebula.size * 2
            );
        }

        for (const star of this.stars) {
            const alpha = star.brightness * star.twinkle;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();
            
            if (star.size > 1.5) {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(200, 220, 255, ${alpha * 0.3})`;
                ctx.fill();
            }
        }
    }

    lerpColor(color1, color2, t) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        const r = Math.round(c1.r + (c2.r - c1.r) * t);
        const g = Math.round(c1.g + (c2.g - c1.g) * t);
        const b = Math.round(c1.b + (c2.b - c1.b) * t);
        return `rgb(${r}, ${g}, ${b})`;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    emitExplosion(x, y, count = 30, colors = null) {
        const defaultColors = [
            'rgba(255, 200, 100, 1)',
            'rgba(255, 150, 50, 1)',
            'rgba(255, 100, 50, 1)',
            'rgba(255, 50, 50, 1)'
        ];
        const particleColors = colors || defaultColors;

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const speed = Math.random() * 200 + 100;
            const color = particleColors[Math.floor(Math.random() * particleColors.length)];
            const size = Math.random() * 6 + 3;
            const life = Math.random() * 0.8 + 0.4;
            
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color,
                size,
                life,
                'explosion'
            ));
        }

        for (let i = 0; i < count * 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 300 + 150;
            const color = 'rgba(255, 200, 100, 1)';
            const size = Math.random() * 3 + 1;
            const life = Math.random() * 0.6 + 0.3;
            
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color,
                size,
                life,
                'flame'
            ));
        }
    }

    emitEnergyFragment(x, y, targetX, targetY) {
        const colors = [
            'rgba(100, 200, 255, 1)',
            'rgba(150, 100, 255, 1)',
            'rgba(100, 255, 200, 1)',
            'rgba(200, 150, 255, 1)'
        ];

        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 150;

        this.particles.push(new Particle(
            x, y,
            (dx / dist) * speed,
            (dy / dist) * speed,
            colors[Math.floor(Math.random() * colors.length)],
            5,
            3,
            'energy'
        ));
    }

    emitThruster(x, y, angle) {
        const spread = 0.3;
        for (let i = 0; i < 3; i++) {
            const particleAngle = angle + Math.PI + (Math.random() - 0.5) * spread;
            const speed = Math.random() * 100 + 50;
            
            this.particles.push(new Particle(
                x + Math.cos(angle + Math.PI) * 15,
                y + Math.sin(angle + Math.PI) * 15,
                Math.cos(particleAngle) * speed,
                Math.sin(particleAngle) * speed,
                'rgba(255, 180, 100, 1)',
                Math.random() * 3 + 2,
                0.3,
                'flame'
            ));
        }
    }

    emitHit(x, y) {
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 150 + 50;
            
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                'rgba(255, 255, 200, 1)',
                Math.random() * 2 + 1,
                0.3,
                'explosion'
            ));
        }
    }

    emitUltimate(x, y, radius) {
        for (let i = 0; i < 100; i++) {
            const angle = (Math.PI * 2 * i) / 100;
            const speed = Math.random() * 500 + 300;
            const colors = [
                'rgba(100, 200, 255, 1)',
                'rgba(200, 100, 255, 1)',
                'rgba(255, 200, 100, 1)'
            ];
            
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                colors[Math.floor(Math.random() * colors.length)],
                Math.random() * 8 + 4,
                1.5,
                'explosion'
            ));
        }

        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 800 + 400;
            
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                'rgba(255, 255, 255, 1)',
                Math.random() * 4 + 2,
                1,
                'flame'
            ));
        }
    }

    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(deltaTime);
            if (!this.particles[i].isAlive()) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (const particle of this.particles) {
            particle.draw(ctx);
        }
    }

    clear() {
        this.particles = [];
    }
}

const particleSystem = new ParticleSystem();
