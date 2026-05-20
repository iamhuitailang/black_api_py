const Effects = {
    particles: [],
    trails: [],
    floatingClouds: [],
    
    init() {
        this.particles = [];
        this.trails = [];
        this.floatingClouds = [];
    },
    
    createTrail(x, y, color) {
        this.trails.push({
            x, y,
            alpha: 1,
            size: 5,
            color: color || 'rgba(255, 215, 0, 0.6)',
            life: 30
        });
    },
    
    createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                alpha: 1,
                size: 3 + Math.random() * 4,
                color: color || '#FFD700',
                life: 30 + Math.random() * 30
            });
        }
    },
    
    createPerfectCatchEffect(x, y) {
        this.createParticles(x, y, 20, '#FFD700');
        this.createParticles(x, y, 10, '#FFA500');
    },
    
    createNormalCatchEffect(x, y) {
        this.createParticles(x, y, 10, '#7EC8E3');
    },
    
    createWindParticles(wind) {
        if (Math.random() < 0.3) {
            this.particles.push({
                x: wind.x + Math.random() * wind.width,
                y: wind.y + Math.random() * wind.height,
                vx: wind.forceX * 3,
                vy: wind.forceY * 3,
                alpha: 0.6,
                size: 2,
                color: '#87CEEB',
                life: 60
            });
        }
    },
    
    update() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life--;
            p.alpha = p.life / 60;
            return p.life > 0;
        });
        
        this.trails = this.trails.filter(t => {
            t.life--;
            t.alpha = t.life / 30;
            t.size *= 0.95;
            return t.life > 0;
        });
        
        this.floatingClouds.forEach(cloud => {
            cloud.x += cloud.vx;
            if (cloud.x > 6000) cloud.x = -200;
        });
    },
    
    generateBackgroundClouds(levelWidth) {
        this.floatingClouds = [];
        for (let i = 0; i < 20; i++) {
            this.floatingClouds.push({
                x: Math.random() * levelWidth,
                y: 50 + Math.random() * 300,
                size: 60 + Math.random() * 100,
                vx: 0.2 + Math.random() * 0.3,
                alpha: 0.6 + Math.random() * 0.4
            });
        }
    },
    
    drawBackground(ctx, cameraX, canvasWidth, canvasHeight) {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        gradient.addColorStop(0, CONFIG.COLORS.SKY_TOP);
        gradient.addColorStop(0.5, CONFIG.COLORS.SKY_MID);
        gradient.addColorStop(1, CONFIG.COLORS.SKY_BOTTOM);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        this.floatingClouds.forEach(cloud => {
            const screenX = cloud.x - cameraX * 0.3;
            if (screenX > -cloud.size && screenX < canvasWidth + cloud.size) {
                this.drawCloud(ctx, screenX, cloud.y, cloud.size, cloud.alpha);
            }
        });
    },
    
    drawCloud(ctx, x, y, size, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = CONFIG.COLORS.CLOUD;
        
        ctx.beginPath();
        ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x + size * 0.35, y - size * 0.1, size * 0.35, 0, Math.PI * 2);
        ctx.arc(x + size * 0.6, y, size * 0.3, 0, Math.PI * 2);
        ctx.arc(x + size * 0.3, y + size * 0.15, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    },
    
    drawParticles(ctx, cameraX) {
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x - cameraX, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        this.trails.forEach(t => {
            ctx.save();
            ctx.globalAlpha = t.alpha;
            ctx.fillStyle = t.color;
            ctx.beginPath();
            ctx.arc(t.x - cameraX, t.y, t.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
};
