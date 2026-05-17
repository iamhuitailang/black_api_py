const Renderer = {
    bgCanvas: null,
    bgCtx: null,
    cauldronCanvas: null,
    cauldronCtx: null,
    width: 0,
    height: 0,
    stars: [],
    particles: [],
    animationId: null,
    isBrewing: false,
    brewProgress: 0,
    cauldronHeat: 50,

    init: function() {
        this.bgCanvas = document.getElementById('game-canvas');
        this.bgCtx = this.bgCanvas.getContext('2d');
        this.cauldronCanvas = document.getElementById('cauldron-canvas');
        this.cauldronCtx = this.cauldronCanvas.getContext('2d');
        
        this.resize();
        this.initStars();
        this.animate();
        
        window.addEventListener('resize', () => this.resize());
    },

    resize: function() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.bgCanvas.width = this.width;
        this.bgCanvas.height = this.height;
    },

    initStars: function() {
        this.stars = [];
        for (let i = 0; i < 200; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 0.5,
                brightness: Math.random(),
                twinkleSpeed: Math.random() * 0.02 + 0.01,
                twinklePhase: Math.random() * Math.PI * 2
            });
        }
    },

    addParticle: function(x, y, color, type = 'normal') {
        const particle = {
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3 - 2,
            size: Math.random() * 4 + 2,
            color: color,
            alpha: 1,
            life: 1,
            type: type
        };
        this.particles.push(particle);
    },

    addBrewParticles: function(color) {
        const centerX = 200;
        const centerY = 250;
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 60 + 40;
            this.addParticle(
                centerX + Math.cos(angle) * radius,
                centerY + Math.sin(angle) * radius,
                color,
                'brew'
            );
        }
    },

    addSuccessParticles: function() {
        const centerX = 200;
        const centerY = 200;
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 6 + 3,
                color: `hsl(${Math.random() * 60 + 45}, 100%, 60%)`,
                alpha: 1,
                life: 1,
                type: 'success'
            });
        }
    },

    addFailureParticles: function() {
        const centerX = 200;
        const centerY = 200;
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 1;
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 5 + 2,
                color: '#6b7280',
                alpha: 1,
                life: 1,
                type: 'failure'
            });
        }
    },

    update: function() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05;
            p.life -= 0.015;
            p.alpha = p.life;
            return p.life > 0;
        });

        this.stars.forEach(star => {
            star.twinklePhase += star.twinkleSpeed;
            star.brightness = (Math.sin(star.twinklePhase) + 1) / 2;
        });
    },

    draw: function() {
        this.drawBackground();
        this.drawCauldron();
        this.drawParticles();
    },

    drawBackground: function() {
        const ctx = this.bgCtx;
        
        const gradient = ctx.createRadialGradient(
            this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, this.width
        );
        gradient.addColorStop(0, '#1e1b4b');
        gradient.addColorStop(0.5, '#0f0a2e');
        gradient.addColorStop(1, '#050510');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);

        this.drawNebula(ctx);

        this.stars.forEach(star => {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * 0.8 + 0.2})`;
            ctx.fill();
            
            if (star.brightness > 0.7) {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * 0.1})`;
                ctx.fill();
            }
        });

        this.drawOrbits(ctx);
    },

    drawNebula: function(ctx) {
        const time = Date.now() / 5000;
        
        ctx.globalCompositeOperation = 'lighter';
        
        const nebula1 = ctx.createRadialGradient(
            this.width * 0.3 + Math.sin(time) * 50, 
            this.height * 0.4 + Math.cos(time) * 30, 
            0,
            this.width * 0.3, this.height * 0.4, 300
        );
        nebula1.addColorStop(0, 'rgba(139, 92, 246, 0.15)');
        nebula1.addColorStop(0.5, 'rgba(139, 92, 246, 0.05)');
        nebula1.addColorStop(1, 'rgba(139, 92, 246, 0)');
        ctx.fillStyle = nebula1;
        ctx.fillRect(0, 0, this.width, this.height);

        const nebula2 = ctx.createRadialGradient(
            this.width * 0.7 + Math.cos(time * 0.7) * 40, 
            this.height * 0.6 + Math.sin(time * 0.7) * 40, 
            0,
            this.width * 0.7, this.height * 0.6, 250
        );
        nebula2.addColorStop(0, 'rgba(59, 130, 246, 0.12)');
        nebula2.addColorStop(0.5, 'rgba(59, 130, 246, 0.04)');
        nebula2.addColorStop(1, 'rgba(59, 130, 246, 0)');
        ctx.fillStyle = nebula2;
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.globalCompositeOperation = 'source-over';
    },

    drawOrbits: function(ctx) {
        const centerX = this.width * 0.5;
        const centerY = this.height * 0.3;
        const time = Date.now() / 3000;

        ctx.strokeStyle = 'rgba(167, 139, 250, 0.1)';
        ctx.lineWidth = 1;

        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, 200 + i * 80, 80 + i * 30, 0.3, 0, Math.PI * 2);
            ctx.stroke();
            
            const planetAngle = time + i;
            const planetX = centerX + Math.cos(planetAngle) * (200 + i * 80);
            const planetY = centerY + Math.sin(planetAngle) * (80 + i * 30);
            
            ctx.beginPath();
            ctx.arc(planetX, planetY, 4 + i * 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(251, 191, 36, ${0.6 - i * 0.15})`;
            ctx.fill();
        }
    },

    drawCauldron: function() {
        const ctx = this.cauldronCtx;
        const w = 400;
        const h = 400;
        
        ctx.clearRect(0, 0, w, h);

        const time = Date.now() / 1000;

        this.drawMagicCircle(ctx, w / 2, h / 2 + 50, 150, time);

        this.drawCauldronBody(ctx, w / 2, h / 2 + 30);

        this.drawLiquid(ctx, w / 2, h / 2 + 20, time);

        if (this.isBrewing) {
            this.drawBrewingEffect(ctx, w / 2, h / 2, time);
        }

        this.drawFlames(ctx, w / 2, h / 2 + 80, time);
    },

    drawMagicCircle: function(ctx, x, y, radius, time) {
        ctx.save();
        ctx.translate(x, y);
        
        ctx.rotate(time * 0.2);
        
        ctx.strokeStyle = 'rgba(167, 139, 250, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.rotate(-time * 0.4);
        
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
        ctx.stroke();

        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * radius * 0.7, Math.sin(angle) * radius * 0.7);
            ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
            ctx.strokeStyle = 'rgba(167, 139, 250, 0.4)';
            ctx.stroke();
        }
        
        ctx.restore();
    },

    drawCauldronBody: function(ctx, x, y) {
        ctx.save();
        
        const gradient = ctx.createRadialGradient(x, y - 20, 0, x, y, 120);
        gradient.addColorStop(0, '#4c1d95');
        gradient.addColorStop(0.5, '#2e1065');
        gradient.addColorStop(1, '#1e0a45');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(x, y, 100, 80, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.ellipse(x, y - 60, 80, 20, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#1e0a45';
        ctx.fill();
        ctx.strokeStyle = '#a78bfa';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x - 100, y - 20);
        ctx.quadraticCurveTo(x - 130, y, x - 100, y + 30);
        ctx.strokeStyle = '#6b21a8';
        ctx.lineWidth = 8;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x + 100, y - 20);
        ctx.quadraticCurveTo(x + 130, y, x + 100, y + 30);
        ctx.stroke();
        
        ctx.restore();
    },

    drawLiquid: function(ctx, x, y, time) {
        ctx.save();
        
        const liquidGradient = ctx.createRadialGradient(x, y, 0, x, y, 70);
        
        if (this.isBrewing) {
            const hue = (time * 50) % 360;
            liquidGradient.addColorStop(0, `hsla(${hue}, 80%, 60%, 0.9)`);
            liquidGradient.addColorStop(0.7, `hsla(${(hue + 30) % 360}, 70%, 40%, 0.8)`);
            liquidGradient.addColorStop(1, `hsla(${(hue + 60) % 360}, 60%, 20%, 0.7)`);
        } else {
            liquidGradient.addColorStop(0, 'rgba(139, 92, 246, 0.6)');
            liquidGradient.addColorStop(0.7, 'rgba(91, 33, 182, 0.7)');
            liquidGradient.addColorStop(1, 'rgba(49, 16, 99, 0.8)');
        }
        
        ctx.beginPath();
        ctx.ellipse(x, y - 60, 75, 18, 0, 0, Math.PI * 2);
        ctx.fillStyle = liquidGradient;
        ctx.fill();
        
        for (let i = 0; i < 5; i++) {
            const rippleX = x + Math.sin(time * 2 + i * 1.5) * 40;
            const rippleY = y - 60 + Math.cos(time * 2 + i) * 5;
            const rippleSize = 10 + Math.sin(time * 3 + i) * 5;
            
            ctx.beginPath();
            ctx.ellipse(rippleX, rippleY, rippleSize, rippleSize * 0.3, 0, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.sin(time * 2 + i) * 0.05})`;
            ctx.fill();
        }
        
        ctx.restore();
    },

    drawBrewingEffect: function(ctx, x, y, time) {
        ctx.save();
        
        for (let i = 0; i < 3; i++) {
            const bubbleY = y - 60 - (time * 100 + i * 50) % 100;
            const bubbleX = x + Math.sin(time * 3 + i * 2) * 30;
            const bubbleSize = 5 + Math.sin(time * 5 + i) * 3;
            
            ctx.beginPath();
            ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(251, 191, 36, ${0.5 + Math.sin(time * 4 + i) * 0.3})`;
            ctx.fill();
        }
        
        const glowGradient = ctx.createRadialGradient(x, y - 60, 0, x, y - 60, 100);
        glowGradient.addColorStop(0, 'rgba(251, 191, 36, 0.3)');
        glowGradient.addColorStop(0.5, 'rgba(251, 191, 36, 0.1)');
        glowGradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(x - 100, y - 160, 200, 200);
        
        ctx.restore();
    },

    drawFlames: function(ctx, x, y, time) {
        ctx.save();
        
        const heatIntensity = this.cauldronHeat / 100;
        
        for (let i = 0; i < 5; i++) {
            const flameX = x + (i - 2) * 25;
            const flameHeight = (30 + Math.sin(time * 5 + i * 0.8) * 10) * heatIntensity;
            const flameWidth = 15 + Math.sin(time * 4 + i) * 5;
            
            const gradient = ctx.createLinearGradient(flameX, y + flameHeight, flameX, y - flameHeight);
            gradient.addColorStop(0, 'rgba(239, 68, 68, 0.9)');
            gradient.addColorStop(0.5, 'rgba(251, 146, 60, 0.7)');
            gradient.addColorStop(1, 'rgba(254, 240, 138, 0)');
            
            ctx.beginPath();
            ctx.moveTo(flameX - flameWidth / 2, y + flameHeight * 0.3);
            ctx.quadraticCurveTo(flameX, y - flameHeight, flameX + flameWidth / 2, y + flameHeight * 0.3);
            ctx.fillStyle = gradient;
            ctx.fill();
        }
        
        ctx.restore();
    },

    drawParticles: function() {
        const ctx = this.cauldronCtx;
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
            gradient.addColorStop(0, p.color);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.globalAlpha = p.alpha * 0.3;
            ctx.fill();
            
            ctx.restore();
        });
    },

    setBrewing: function(brewing) {
        this.isBrewing = brewing;
    },

    setHeat: function(heat) {
        this.cauldronHeat = heat;
    },

    animate: function() {
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    },

    stop: function() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
};
