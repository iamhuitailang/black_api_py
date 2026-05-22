class EffectManager {
    constructor() {
        this.particles = [];
        this.leaves = [];
        this.sunbeams = [];
        this.ripples = [];
        
        this.initLeaves();
        this.initSunbeams();
    }

    initLeaves() {
        for (let i = 0; i < 15; i++) {
            this.leaves.push({
                x: Math.random() * GameConfig.CANVAS.WIDTH,
                y: Math.random() * GameConfig.CANVAS.HEIGHT,
                size: 10 + Math.random() * 10,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.02,
                fallSpeed: 0.5 + Math.random() * 1,
                swayOffset: Math.random() * Math.PI * 2,
                swaySpeed: 0.01 + Math.random() * 0.01,
                color: GameConfig.COLORS.LEAF[Math.floor(Math.random() * GameConfig.COLORS.LEAF.length)]
            });
        }
    }

    initSunbeams() {
        for (let i = 0; i < 5; i++) {
            this.sunbeams.push({
                x: Math.random() * GameConfig.CANVAS.WIDTH,
                width: 50 + Math.random() * 100,
                height: GameConfig.CANVAS.HEIGHT,
                alpha: 0.05 + Math.random() * 0.1,
                swayOffset: Math.random() * Math.PI * 2
            });
        }
    }

    addParticles(x, y, count, color, options = {}) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = options.speed || (1 + Math.random() * 3);
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - (options.upward || 2),
                size: options.size || (3 + Math.random() * 4),
                color: color,
                alpha: 1,
                life: options.life || (500 + Math.random() * 500),
                maxLife: options.life || (500 + Math.random() * 500),
                gravity: options.gravity !== undefined ? options.gravity : 0.1
            });
        }
    }

    addRipple(x, y, color) {
        this.ripples.push({
            x: x,
            y: y,
            radius: 5,
            maxRadius: 30,
            alpha: 1,
            color: color
        });
    }

    addBananaCollectEffect(x, y) {
        this.addParticles(x, y, 8, '#FFD700', { speed: 2, upward: 3, life: 400 });
        this.addRipple(x, y, '#FFD700');
    }

    addDamageEffect(x, y) {
        this.addParticles(x, y, 10, '#FF4444', { speed: 3, upward: 2, life: 500 });
        this.addRipple(x, y, '#FF4444');
    }

    addJumpEffect(x, y) {
        this.addParticles(x, y, 5, '#90EE90', { speed: 1.5, upward: 1, life: 300, gravity: 0.05 });
    }

    update(deltaTime) {
        for (let leaf of this.leaves) {
            leaf.y += leaf.fallSpeed;
            leaf.rotation += leaf.rotationSpeed;
            leaf.swayOffset += leaf.swaySpeed;
            leaf.x += Math.sin(leaf.swayOffset) * 0.5;
            
            if (leaf.y > GameConfig.CANVAS.HEIGHT) {
                leaf.y = -20;
                leaf.x = Math.random() * GameConfig.CANVAS.WIDTH;
            }
        }
        
        for (let particle of this.particles) {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += particle.gravity;
            particle.life -= deltaTime;
            particle.alpha = particle.life / particle.maxLife;
        }
        
        this.particles = this.particles.filter(p => p.life > 0);
        
        for (let ripple of this.ripples) {
            ripple.radius += 1;
            ripple.alpha = 1 - ripple.radius / ripple.maxRadius;
        }
        
        this.ripples = this.ripples.filter(r => r.radius < r.maxRadius);
    }

    draw(ctx) {
        this.drawBackground(ctx);
        this.drawGround(ctx);
        this.drawSunbeams(ctx);
        this.drawLeaves(ctx);
        this.drawRipples(ctx);
        this.drawParticles(ctx);
    }

    drawBackground(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, GameConfig.CANVAS.HEIGHT);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.5, '#B0E0E6');
        gradient.addColorStop(0.7, '#98FB98');
        gradient.addColorStop(1, '#90EE90');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, GameConfig.CANVAS.WIDTH, GameConfig.CANVAS.HEIGHT);
        
        this.drawClouds(ctx);
        this.drawTrees(ctx);
    }

    drawClouds(ctx) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        const clouds = [
            { x: 100, y: 60, size: 1 },
            { x: 400, y: 40, size: 1.2 },
            { x: 700, y: 80, size: 0.9 }
        ];
        
        for (let cloud of clouds) {
            ctx.save();
            ctx.translate(cloud.x, cloud.y);
            ctx.scale(cloud.size, cloud.size);
            
            ctx.beginPath();
            ctx.arc(0, 0, 25, 0, Math.PI * 2);
            ctx.arc(25, -5, 20, 0, Math.PI * 2);
            ctx.arc(50, 0, 25, 0, Math.PI * 2);
            ctx.arc(25, 10, 20, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    }

    drawTrees(ctx) {
        ctx.fillStyle = '#8B4513';
        
        ctx.fillRect(30, GameConfig.CANVAS.GROUND_Y - 100, 25, 100);
        ctx.fillRect(GameConfig.CANVAS.WIDTH - 55, GameConfig.CANVAS.GROUND_Y - 120, 25, 120);
        
        ctx.fillStyle = '#228B22';
        
        ctx.beginPath();
        ctx.arc(42, GameConfig.CANVAS.GROUND_Y - 110, 45, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(GameConfig.CANVAS.WIDTH - 42, GameConfig.CANVAS.GROUND_Y - 130, 50, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#228B22';
        ctx.lineWidth = 4;
        
        ctx.beginPath();
        ctx.moveTo(100, 0);
        ctx.quadraticCurveTo(120, 100, 100, 200);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(GameConfig.CANVAS.WIDTH - 80, 0);
        ctx.quadraticCurveTo(GameConfig.CANVAS.WIDTH - 100, 80, GameConfig.CANVAS.WIDTH - 80, 150);
        ctx.stroke();
        
        ctx.fillStyle = '#32CD32';
        ctx.beginPath();
        ctx.ellipse(105, 50, 8, 15, 0.3, 0, Math.PI * 2);
        ctx.ellipse(110, 100, 10, 18, -0.2, 0, Math.PI * 2);
        ctx.ellipse(95, 160, 7, 12, 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(GameConfig.CANVAS.WIDTH - 85, 60, 9, 16, -0.3, 0, Math.PI * 2);
        ctx.ellipse(GameConfig.CANVAS.WIDTH - 75, 120, 8, 14, 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawGround(ctx) {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, GameConfig.CANVAS.GROUND_Y, GameConfig.CANVAS.WIDTH, GameConfig.CANVAS.HEIGHT - GameConfig.CANVAS.GROUND_Y);
        
        ctx.fillStyle = '#228B22';
        ctx.fillRect(0, GameConfig.CANVAS.GROUND_Y - 10, GameConfig.CANVAS.WIDTH, 15);
        
        ctx.fillStyle = '#32CD32';
        for (let i = 0; i < GameConfig.CANVAS.WIDTH; i += 15) {
            ctx.beginPath();
            ctx.moveTo(i, GameConfig.CANVAS.GROUND_Y - 5);
            ctx.lineTo(i + 5, GameConfig.CANVAS.GROUND_Y - 15);
            ctx.lineTo(i + 10, GameConfig.CANVAS.GROUND_Y - 5);
            ctx.fill();
        }
    }

    drawSunbeams(ctx) {
        for (let beam of this.sunbeams) {
            const sway = Math.sin(Date.now() / 2000 + beam.swayOffset) * 20;
            ctx.save();
            ctx.globalAlpha = beam.alpha;
            ctx.fillStyle = '#FFFFCC';
            
            ctx.beginPath();
            ctx.moveTo(beam.x - beam.width / 2 + sway, 0);
            ctx.lineTo(beam.x + beam.width / 2 + sway, 0);
            ctx.lineTo(beam.x + beam.width / 2 - sway, beam.height);
            ctx.lineTo(beam.x - beam.width / 2 - sway, beam.height);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }
    }

    drawLeaves(ctx) {
        for (let leaf of this.leaves) {
            ctx.save();
            ctx.translate(leaf.x, leaf.y);
            ctx.rotate(leaf.rotation);
            
            ctx.fillStyle = leaf.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, leaf.size / 2, leaf.size / 4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(0, 100, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-leaf.size / 2, 0);
            ctx.lineTo(leaf.size / 2, 0);
            ctx.stroke();
            
            ctx.restore();
        }
    }

    drawRipples(ctx) {
        for (let ripple of this.ripples) {
            ctx.save();
            ctx.globalAlpha = ripple.alpha * 0.5;
            ctx.strokeStyle = ripple.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    drawParticles(ctx) {
        for (let particle of this.particles) {
            ctx.save();
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}
