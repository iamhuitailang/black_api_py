import { CANDLE_TYPES, FLICKER_SPEEDS } from './config.js';

class Particle {
    constructor(x, y, vx, vy, life, color, size) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.color = color;
        this.size = size;
        this.active = true;
    }

    update(gravity = 0, wind = 0) {
        this.x += this.vx + wind;
        this.y += this.vy + gravity;
        this.life--;
        this.vy += gravity;
        if (this.life <= 0) {
            this.active = false;
        }
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

class WaxDrip {
    constructor(x, y, candleBottom) {
        this.x = x;
        this.y = y;
        this.startY = y;
        this.targetY = candleBottom;
        this.speed = 1.5 + Math.random() * 2;
        this.width = 3 + Math.random() * 5;
        this.active = true;
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 0.05 + Math.random() * 0.05;
    }

    update(candleHeight, candleLeft, candleRight) {
        if (!this.active) return;
        
        this.y += this.speed;
        this.wobble += this.wobbleSpeed;
        
        if (this.y >= this.targetY - 3) {
            this.active = false;
        }
    }

    draw(ctx, color) {
        if (!this.active) return;
        
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        const wobbleOffset = Math.sin(this.wobble) * 0.5;
        ctx.ellipse(
            this.x + wobbleOffset,
            this.y,
            this.width * (1 - (this.y - this.startY) / this.maxLength * 0.5),
            (this.y - this.startY) / 2,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
    }
}

class SmokeParticle extends Particle {
    constructor(x, y) {
        super(
            x,
            y,
            (Math.random() - 0.5) * 0.5,
            -1 - Math.random() * 1.5,
            60 + Math.random() * 40,
            `rgba(150, 150, 150, ${0.3 + Math.random() * 0.2})`,
            3 + Math.random() * 5
        );
    }

    update() {
        super.update(-0.01, (Math.random() - 0.5) * 0.2);
        this.size += 0.05;
    }
}

class CandleRenderer {
    constructor(canvas, candleData) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.candleData = candleData;
        this.width = 0;
        this.height = 0;
        this.flameParticles = [];
        this.smokeParticles = [];
        this.waxDrips = [];
        this.waxPool = [];
        this.lastFlickerTime = 0;
        this.flameIntensity = 1;
        this.smokeEmissionTimer = 0;
        this.currentState = 'idle';
        this.currentProgress = 0;
        this.currentSettings = null;
        this.resize();
        this.setupResizeListener();
    }

    setupResizeListener() {
        const resizeObserver = new ResizeObserver(() => {
            this.resize();
            if (this.currentSettings) {
                this.render(this.currentState, this.currentProgress, this.currentSettings);
            }
        });
        resizeObserver.observe(this.canvas);
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.width = rect.width * dpr;
        this.height = rect.height * dpr;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.ctx.scale(dpr, dpr);
    }

    getDisplaySize() {
        const rect = this.canvas.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
    }

    render(state, progress, settings) {
        this.currentState = state;
        this.currentProgress = progress;
        this.currentSettings = settings;
        
        const { width, height } = this.getDisplaySize();
        if (width === 0 || height === 0) return;
        
        this.ctx.clearRect(0, 0, width, height);
        
        const candleType = CANDLE_TYPES[this.candleData.type];
        const candleWidth = Math.min(width * 0.4, 80);
        const candleMaxHeight = height * 0.75;
        const currentHeight = candleMaxHeight * (1 - progress);
        const candleX = width / 2;
        const candleBottom = height - 50;
        const candleTop = candleBottom - currentHeight;

        this.drawTable(width, height);
        this.drawCandleShadow(candleX, candleBottom, candleWidth, currentHeight);
        this.drawCandleBody(candleX, candleTop, candleWidth, currentHeight, candleType);
        this.drawWaxDrips(candleX, candleTop, candleWidth, candleType);
        
        if (state === 'burning' || state === 'extinguished') {
            this.drawWick(candleX, candleTop);
        }
        
        if (state === 'burning') {
            this.drawFlame(candleX, candleTop, candleType, settings.flickerSpeed);
            this.drawFlameGlow(candleX, candleTop, candleType);
            this.maybeSpawnWaxDrip(candleX, candleTop, candleWidth, candleType, candleBottom);
            this.updateWaxDrips(candleTop, candleX - candleWidth / 2, candleX + candleWidth / 2, candleBottom, candleWidth);
        } else if (state === 'extinguished') {
            this.updateSmokeParticles();
            this.drawSmoke(candleX, candleTop);
            this.maybeEmitSmoke(candleX, candleTop);
        }
        
        this.drawDripsOnTable(candleX, candleBottom, candleWidth, candleType, progress);
    }

    drawTable(width, height) {
        const gradient = this.ctx.createLinearGradient(0, height - 60, 0, height);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.1)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, height - 60, width, 60);
    }

    drawCandleShadow(cx, bottom, width, height) {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        this.ctx.beginPath();
        this.ctx.ellipse(cx, bottom + 5, width * 0.8, 10, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    drawCandleBody(cx, top, width, height, candleType) {
        const left = cx - width / 2;
        const right = cx + width / 2;
        const bottom = top + height;
        
        this.ctx.save();
        
        const bodyGradient = this.ctx.createLinearGradient(left, top, right, top);
        
        if (candleType.color === 'rainbow') {
            const rainbowGradient = this.ctx.createLinearGradient(left, top, right, bottom);
            const colors = candleType.gradient;
            colors.forEach((color, i) => {
                rainbowGradient.addColorStop(i / (colors.length - 1), color);
            });
            this.ctx.fillStyle = rainbowGradient;
        } else {
            bodyGradient.addColorStop(0, candleType.gradient[0]);
            bodyGradient.addColorStop(0.5, candleType.gradient[1]);
            bodyGradient.addColorStop(1, candleType.gradient[2]);
            this.ctx.fillStyle = bodyGradient;
        }
        
        this.ctx.beginPath();
        this.ctx.moveTo(left, top + 8);
        this.ctx.quadraticCurveTo(left, top, cx, top);
        this.ctx.quadraticCurveTo(right, top, right, top + 8);
        this.ctx.lineTo(right, bottom - 5);
        this.ctx.quadraticCurveTo(right, bottom, cx, bottom);
        this.ctx.quadraticCurveTo(left, bottom, left, bottom - 5);
        this.ctx.closePath();
        this.ctx.fill();
        
        const highlightGradient = this.ctx.createLinearGradient(left, top, left + width * 0.3, top);
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = highlightGradient;
        this.ctx.fillRect(left + 2, top + 10, width * 0.25, height - 15);
        
        this.ctx.restore();
    }

    drawWick(cx, top) {
        this.ctx.save();
        this.ctx.strokeStyle = '#2d2d2d';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(cx, top);
        this.ctx.lineTo(cx, top - 8);
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.beginPath();
        this.ctx.arc(cx, top - 8, 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    drawFlame(cx, top, candleType, flickerSpeed) {
        const now = Date.now();
        const flickerConfig = FLICKER_SPEEDS[flickerSpeed] || FLICKER_SPEEDS.normal;
        
        const targetIntensity = flickerConfig.min + (Math.sin(now * 0.001) * 0.5 + 0.5) * (flickerConfig.max - flickerConfig.min);
        this.flameIntensity = this.flameIntensity * 0.9 + targetIntensity * 0.1;
        
        const time = now * 0.003;
        const wobbleX = Math.sin(time) * 1.5 + Math.sin(time * 2.3) * 0.6;
        const wobbleY = Math.cos(time * 1.5) * 1.2 + Math.sin(time * 3.1) * 0.4;
        
        const baseSize = 20 * this.flameIntensity;
        const height = baseSize * 2.1;
        const fx = cx + wobbleX;
        const fy = top - 5;
        
        this.ctx.save();
        
        const outerGlow = this.ctx.createRadialGradient(fx, fy - height * 0.4, 0, fx, fy - height * 0.4, baseSize * 2.5);
        outerGlow.addColorStop(0, 'rgba(255, 150, 50, 0.25)');
        outerGlow.addColorStop(0.4, 'rgba(255, 120, 30, 0.12)');
        outerGlow.addColorStop(0.7, 'rgba(255, 80, 20, 0.05)');
        outerGlow.addColorStop(1, 'rgba(255, 50, 0, 0)');
        this.ctx.fillStyle = outerGlow;
        this.ctx.beginPath();
        this.ctx.arc(fx, fy - height * 0.4, baseSize * 2.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        const flameGrad = this.ctx.createLinearGradient(fx, fy, fx, fy - height);
        flameGrad.addColorStop(0, candleType.flameGradient[0]);
        flameGrad.addColorStop(0.3, candleType.flameGradient[1]);
        flameGrad.addColorStop(0.6, candleType.flameGradient[2]);
        flameGrad.addColorStop(0.85, candleType.flameGradient[3]);
        flameGrad.addColorStop(1, '#ffffff');
        
        this.ctx.fillStyle = flameGrad;
        this.ctx.beginPath();
        
        const left = fx - baseSize * 0.6;
        const right = fx + baseSize * 0.6;
        const midY = fy - height * 0.5;
        const tipY = fy - height + wobbleY;
        
        this.ctx.moveTo(left, fy);
        this.ctx.quadraticCurveTo(left - 2, midY + 8, fx - baseSize * 0.3, midY - height * 0.1);
        this.ctx.quadraticCurveTo(fx - baseSize * 0.1, tipY + height * 0.25, fx, tipY);
        this.ctx.quadraticCurveTo(fx + baseSize * 0.1, tipY + height * 0.25, fx + baseSize * 0.3, midY - height * 0.1);
        this.ctx.quadraticCurveTo(right + 2, midY + 8, right, fy);
        this.ctx.closePath();
        this.ctx.fill();
        
        const innerGrad = this.ctx.createRadialGradient(fx, fy - height * 0.28, 0, fx, fy - height * 0.28, baseSize * 0.5);
        innerGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        innerGrad.addColorStop(0.35, '#fffde7');
        innerGrad.addColorStop(0.65, '#fff59d');
        innerGrad.addColorStop(1, 'rgba(255, 245, 157, 0)');
        this.ctx.fillStyle = innerGrad;
        this.ctx.beginPath();
        this.ctx.ellipse(fx, fy - height * 0.28, baseSize * 0.4, height * 0.35, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        const coreGrad = this.ctx.createRadialGradient(fx, fy - height * 0.15, 0, fx, fy - height * 0.15, baseSize * 0.22);
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.7)');
        coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = coreGrad;
        this.ctx.beginPath();
        this.ctx.ellipse(fx, fy - height * 0.15, baseSize * 0.18, height * 0.12, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }

    drawFlameGlow(cx, top, candleType) {
        const glowGradient = this.ctx.createRadialGradient(cx, top - 20, 0, cx, top - 20, 100);
        glowGradient.addColorStop(0, 'rgba(255, 180, 80, 0.15)');
        glowGradient.addColorStop(0.5, 'rgba(255, 150, 50, 0.08)');
        glowGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        this.ctx.save();
        this.ctx.fillStyle = glowGradient;
        this.ctx.fillRect(cx - 100, top - 120, 200, 200);
        this.ctx.restore();
    }

    updateFlameParticles(flickerSpeed) {
        this.flameParticles = this.flameParticles.filter(p => p.active);
        this.flameParticles.forEach(p => p.update(-0.02, (Math.random() - 0.5) * 0.3));
    }

    maybeSpawnWaxDrip(cx, top, width, candleType, candleBottom) {
        if (Math.random() < 0.02) {
            const dripX = cx + (Math.random() - 0.5) * width * 0.6;
            this.waxDrips.push(new WaxDrip(dripX, top, candleBottom));
        }
    }

    updateWaxDrips(candleTop, candleLeft, candleRight, candleBottom, candleWidth) {
        this.waxDrips = this.waxDrips.filter(drip => {
            drip.update(0, candleLeft, candleRight);
            if (drip.active && drip.y >= candleBottom - 5) {
                this.waxPool.push({
                    x: drip.x,
                    size: drip.width * 1.5,
                    opacity: 0.8
                });
                if (this.waxPool.length > 20) {
                    this.waxPool.shift();
                }
                drip.active = false;
            }
            return drip.active;
        });
    }

    drawWaxDrips(cx, top, width, candleType) {
        const dripColor = candleType.color === 'rainbow' ? candleType.gradient[0] : candleType.gradient[1];
        this.waxDrips.forEach(drip => drip.draw(this.ctx, dripColor));
    }

    drawDripsOnTable(cx, bottom, width, candleType, progress) {
        const dripColor = candleType.color === 'rainbow' ? candleType.gradient[0] : candleType.gradient[1];
        
        this.ctx.save();
        
        const basePoolSize = width * (0.4 + progress * 0.8);
        const poolGradient = this.ctx.createRadialGradient(cx, bottom + 5, 0, cx, bottom + 5, basePoolSize);
        poolGradient.addColorStop(0, dripColor);
        poolGradient.addColorStop(0.6, dripColor + 'cc');
        poolGradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = poolGradient;
        this.ctx.beginPath();
        this.ctx.ellipse(cx, bottom + 5, basePoolSize, basePoolSize * 0.35, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.waxPool.forEach((pool, index) => {
            const alpha = 0.6 + (index / this.waxPool.length) * 0.4;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = dripColor;
            this.ctx.beginPath();
            this.ctx.ellipse(pool.x, bottom + 3, pool.size, pool.size * 0.4, 0, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
        
        const staticDripCount = 3 + Math.floor(progress * 4);
        for (let i = 0; i < staticDripCount; i++) {
            const angle = (i / staticDripCount) * Math.PI * 2;
            const distance = width * (0.2 + Math.random() * 0.5);
            const dripX = cx + Math.cos(angle) * distance;
            const dripSize = 3 + Math.random() * 5;
            this.ctx.fillStyle = dripColor;
            this.ctx.beginPath();
            this.ctx.ellipse(dripX, bottom + 2, dripSize, dripSize * 0.45, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        if (progress > 0.3) {
            for (let i = 0; i < 2; i++) {
                const trailX = cx + (Math.random() - 0.5) * width * 0.6;
                const trailLength = 15 + Math.random() * 20;
                const trailWidth = 2 + Math.random() * 2;
                
                const trailGradient = this.ctx.createLinearGradient(trailX, bottom, trailX, bottom - trailLength);
                trailGradient.addColorStop(0, dripColor);
                trailGradient.addColorStop(1, 'transparent');
                
                this.ctx.fillStyle = trailGradient;
                this.ctx.beginPath();
                this.ctx.ellipse(trailX, bottom - trailLength / 2, trailWidth, trailLength / 2, 0, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        this.ctx.restore();
    }

    drawSmoke(cx, top) {
        this.smokeParticles.forEach(p => p.draw(this.ctx));
    }

    updateSmokeParticles() {
        this.smokeParticles = this.smokeParticles.filter(p => p.active);
        this.smokeParticles.forEach(p => p.update());
    }

    maybeEmitSmoke(cx, top) {
        this.smokeEmissionTimer++;
        if (this.smokeEmissionTimer > 10) {
            this.smokeEmissionTimer = 0;
            if (this.smokeParticles.length < 20) {
                this.smokeParticles.push(new SmokeParticle(cx + (Math.random() - 0.5) * 5, top - 10));
            }
        }
    }

    startExtinguishAnimation(cx, top) {
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                this.smokeParticles.push(new SmokeParticle(cx + (Math.random() - 0.5) * 10, top - 10));
            }, i * 50);
        }
    }

    destroy() {
        this.flameParticles = [];
        this.smokeParticles = [];
        this.waxDrips = [];
    }
}

export { CandleRenderer, Particle, WaxDrip, SmokeParticle };
