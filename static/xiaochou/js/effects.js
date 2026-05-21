class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || Utils.random(-3, 3);
        this.vy = options.vy || Utils.random(-5, -1);
        this.life = options.life || 60;
        this.maxLife = this.life;
        this.size = options.size || Utils.random(3, 8);
        this.color = options.color || '#FFE66D';
        this.gravity = options.gravity !== undefined ? options.gravity : 0.1;
        this.friction = options.friction || 0.98;
        this.type = options.type || 'circle';
    }

    update(dt = 1) {
        this.vy += this.gravity * dt;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
    }

    draw(ctx, cameraY = 0) {
        const alpha = this.life / this.maxLife;
        const drawY = this.y - cameraY;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        
        if (this.type === 'circle') {
            ctx.beginPath();
            ctx.arc(this.x, drawY, this.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'star') {
            this.drawStar(ctx, this.x, drawY, this.size * alpha);
        } else if (this.type === 'square') {
            ctx.fillRect(this.x - this.size / 2, drawY - this.size / 2, this.size * alpha, this.size * alpha);
        }
        
        ctx.restore();
    }

    drawStar(ctx, x, y, size) {
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size * 0.5;
        
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();
    }

    isDead() {
        return this.life <= 0;
    }
}

class Effects {
    constructor() {
        this.particles = [];
        this.clouds = [];
        this.initClouds();
    }

    initClouds() {
        for (let i = 0; i < 8; i++) {
            this.clouds.push({
                x: Utils.random(-100, 500),
                y: Utils.random(50, 300),
                width: Utils.random(80, 150),
                height: Utils.random(40, 70),
                speed: Utils.random(0.2, 0.8)
            });
        }
    }

    spawnSparkles(x, y, count = 10, color = null) {
        const colors = ['#FFE66D', '#FF6B6B', '#4ECDC4', '#95E1D3', '#FFFFFF'];
        
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, {
                vx: Utils.random(-4, 4),
                vy: Utils.random(-6, -2),
                life: Utils.random(30, 60),
                size: Utils.random(2, 6),
                color: color || Utils.randomChoice(colors),
                type: 'star',
                gravity: 0.05
            }));
        }
    }

    spawnExplosion(x, y, count = 30) {
        const colors = ['#FF4444', '#FF6B6B', '#FFE66D', '#FF8C00', '#FFFFFF'];
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = Utils.random(3, 8);
            
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: Utils.random(40, 80),
                size: Utils.random(4, 10),
                color: Utils.randomChoice(colors),
                type: Utils.randomChoice(['circle', 'square']),
                gravity: 0.15
            }));
        }
    }

    spawnScorePopup(x, y, score, cameraY = 0) {
        const isNegative = score < 0;
        
        this.particles.push({
            x,
            y,
            vx: 0,
            vy: -1.5,
            life: 60,
            maxLife: 60,
            text: (isNegative ? '' : '+') + score,
            color: isNegative ? '#FF4444' : '#FFE66D',
            update(dt) {
                this.y += this.vy * dt;
                this.vy *= 0.98;
                this.life -= dt;
            },
            draw(ctx, camY) {
                const alpha = Math.min(1, this.life / 30);
                const drawY = this.y - camY;
                
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.font = 'bold 24px Comic Sans MS';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 3;
                ctx.strokeText(this.text, this.x, drawY);
                
                ctx.fillStyle = this.color;
                ctx.fillText(this.text, this.x, drawY);
                
                ctx.restore();
            },
            isDead() {
                return this.life <= 0;
            }
        });
    }

    updateClouds(worldWidth) {
        for (const cloud of this.clouds) {
            cloud.x += cloud.speed;
            if (cloud.x > worldWidth + cloud.width) {
                cloud.x = -cloud.width;
                cloud.y = Utils.random(50, 300);
            }
        }
    }

    drawClouds(ctx, cameraY = 0) {
        for (const cloud of this.clouds) {
            const drawY = cloud.y - cameraY * 0.3;
            
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            
            const w = cloud.width;
            const h = cloud.height;
            const x = cloud.x;
            const y = drawY;
            
            ctx.beginPath();
            ctx.ellipse(x, y, w * 0.3, h * 0.5, 0, 0, Math.PI * 2);
            ctx.ellipse(x + w * 0.25, y - h * 0.2, w * 0.35, h * 0.6, 0, 0, Math.PI * 2);
            ctx.ellipse(x + w * 0.5, y, w * 0.3, h * 0.5, 0, 0, Math.PI * 2);
            ctx.ellipse(x + w * 0.75, y - h * 0.15, w * 0.28, h * 0.55, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    }

    update(dt = 1, worldWidth = 800) {
        this.updateClouds(worldWidth);
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dt);
            if (this.particles[i].isDead()) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx, cameraY = 0) {
        this.drawClouds(ctx, cameraY);
        
        for (const particle of this.particles) {
            particle.draw(ctx, cameraY);
        }
    }

    clear() {
        this.particles = [];
    }

    serialize() {
        return {
            particles: this.particles.map(p => ({
                x: p.x,
                y: p.y,
                vx: p.vx,
                vy: p.vy,
                life: p.life,
                maxLife: p.maxLife,
                size: p.size,
                color: p.color,
                type: p.type
            })),
            clouds: this.clouds
        };
    }

    deserialize(data) {
        this.particles = [];
        for (const pData of data.particles || []) {
            const p = new Particle(pData.x, pData.y, pData);
            p.life = pData.life;
            p.maxLife = pData.maxLife;
            this.particles.push(p);
        }
        this.clouds = data.clouds || this.clouds;
    }
}