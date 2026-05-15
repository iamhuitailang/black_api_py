import { CONFIG, ULTIMATES } from './config.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;
        
        this.snowflakes = [];
        for (let i = 0; i < 60; i++) {
            this.snowflakes.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 2 + Math.random() * 3,
                speed: 0.5 + Math.random() * 1,
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.02 + Math.random() * 0.02
            });
        }
        
        this.stars = [];
        for (let i = 0; i < 80; i++) {
            this.stars.push({
                x: (i * 137.5) % this.canvas.width,
                y: (i * 73.3) % (CONFIG.ARENA.y - 50),
                size: 0.5 + Math.random() * 2,
                twinkle: Math.random() * Math.PI * 2
            });
        }
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBackground() {
        const ctx = this.ctx;
        const time = Date.now() * 0.0001;
        
        const skyGradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        skyGradient.addColorStop(0, '#0a0a2e');
        skyGradient.addColorStop(0.3, '#1a1a4e');
        skyGradient.addColorStop(0.6, '#2d1b4e');
        skyGradient.addColorStop(1, '#1e3a5f');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawAurora(ctx, time);
        this.drawMoon(ctx);
        this.drawStaticStars(ctx);
        this.drawAnimatedElements();
    }

    drawAurora(ctx, time) {
        ctx.globalAlpha = 0.25;
        
        const colors = [
            ['rgba(100, 255, 218, 0.4)', 'rgba(100, 200, 255, 0.15)'],
            ['rgba(255, 150, 200, 0.25)', 'rgba(150, 100, 255, 0.1)']
        ];
        
        for (let layer = 0; layer < 2; layer++) {
            const gradient = ctx.createLinearGradient(0, 50, 0, 200);
            gradient.addColorStop(0, colors[layer][0]);
            gradient.addColorStop(1, colors[layer][1]);
            ctx.fillStyle = gradient;
            
            ctx.beginPath();
            ctx.moveTo(0, 130);
            
            for (let x = 0; x <= this.canvas.width; x += 40) {
                const y = 80 + Math.sin(x * 0.008 + time + layer * 0.8) * 35;
                ctx.lineTo(x, y);
            }
            
            ctx.lineTo(this.canvas.width, 200);
            ctx.lineTo(0, 200);
            ctx.closePath();
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    drawMoon(ctx) {
        const moonX = 150;
        const moonY = 80;
        const moonRadius = 45;
        
        const moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moonRadius * 2);
        moonGlow.addColorStop(0, 'rgba(255, 250, 230, 0.8)');
        moonGlow.addColorStop(0.3, 'rgba(255, 240, 200, 0.4)');
        moonGlow.addColorStop(1, 'rgba(255, 200, 150, 0)');
        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonRadius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        const moonGradient = ctx.createRadialGradient(moonX - 10, moonY - 10, 0, moonX, moonY, moonRadius);
        moonGradient.addColorStop(0, '#fffef5');
        moonGradient.addColorStop(0.7, '#f5f0e0');
        moonGradient.addColorStop(1, '#e8e0d0');
        ctx.fillStyle = moonGradient;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(200, 190, 170, 0.3)';
        ctx.beginPath();
        ctx.ellipse(moonX - 15, moonY - 8, 8, 6, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(moonX + 12, moonY + 10, 6, 5, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(moonX - 5, moonY + 15, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawStaticStars(ctx) {
        this.stars.forEach(star => {
            const brightness = 0.3 + Math.sin(star.twinkle + Date.now() * 0.002) * 0.3 + 0.4;
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawAnimatedElements() {
        const ctx = this.ctx;
        const time = Date.now();
        
        this.snowflakes.forEach(flake => {
            flake.wobble += flake.wobbleSpeed;
            flake.x += Math.sin(flake.wobble) * 0.5;
            flake.y += flake.speed;
            
            if (flake.y > this.canvas.height) {
                flake.y = -10;
                flake.x = Math.random() * this.canvas.width;
            }
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(flake.x, flake.y, flake.size + 1, 0, Math.PI * 2);
            ctx.fill();
        });
        
        this.drawChristmasLights(ctx, time);
    }

    hexToRgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    drawChristmasLights(ctx, time) {
        const lightY = 45;
        const colors = ['#ff6b6b', '#ffd93d', '#4ecdc4', '#ff9ff3', '#54a0ff', '#ff9f43'];
        const bulbSize = 8;
        
        ctx.strokeStyle = 'rgba(100, 80, 60, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, lightY - 15);
        for (let x = 0; x <= this.canvas.width; x += 30) {
            const y = lightY - 15 + Math.sin(x * 0.03 + time * 0.0005) * 10;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        const bulbCount = Math.floor((this.canvas.width - 15) / 30);
        for (let i = 0; i < bulbCount; i++) {
            const x = i * 30 + 15;
            const y = lightY - 15 + Math.sin(x * 0.03 + time * 0.0005) * 10;
            const colorIndex = i % colors.length;
            const color = colors[colorIndex];
            const brightness = 0.7 + Math.sin(time * 0.003 + i * 0.5) * 0.3;
            
            ctx.strokeStyle = 'rgba(80, 60, 40, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + 12);
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.fillRect(x - 3, y + 10, 6, 4);
            
            const glowGradient = ctx.createRadialGradient(x, y + 18, 0, x, y + 18, bulbSize * 2);
            glowGradient.addColorStop(0, this.hexToRgba(color, brightness));
            glowGradient.addColorStop(0.5, this.hexToRgba(color, brightness * 0.5));
            glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(x, y + 18, bulbSize * 2, 0, Math.PI * 2);
            ctx.fill();
            
            const bulbGradient = ctx.createRadialGradient(x - 2, y + 16, 0, x, y + 18, bulbSize);
            bulbGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            bulbGradient.addColorStop(0.3, this.hexToRgba(color, 1));
            bulbGradient.addColorStop(1, this.hexToRgba(color, 0.7));
            ctx.fillStyle = bulbGradient;
            ctx.beginPath();
            ctx.arc(x, y + 18, bulbSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawArena() {
        const ctx = this.ctx;
        const arena = CONFIG.ARENA;
        
        const shadowGradient = ctx.createLinearGradient(arena.x, arena.y + arena.height, arena.x, arena.y + arena.height + 50);
        shadowGradient.addColorStop(0, 'rgba(0, 100, 150, 0.4)');
        shadowGradient.addColorStop(1, 'rgba(0, 50, 100, 0)');
        ctx.fillStyle = shadowGradient;
        ctx.beginPath();
        ctx.roundRect(arena.x - 10, arena.y + arena.height - 10, arena.width + 20, 60, 20);
        ctx.fill();
        
        const iceGradient = ctx.createLinearGradient(arena.x, arena.y, arena.x, arena.y + arena.height);
        iceGradient.addColorStop(0, 'rgba(240, 248, 255, 0.95)');
        iceGradient.addColorStop(0.2, 'rgba(200, 230, 255, 0.92)');
        iceGradient.addColorStop(0.5, 'rgba(180, 220, 255, 0.9)');
        iceGradient.addColorStop(0.8, 'rgba(170, 210, 250, 0.88)');
        iceGradient.addColorStop(1, 'rgba(150, 200, 255, 0.85)');
        
        ctx.fillStyle = iceGradient;
        ctx.beginPath();
        ctx.roundRect(arena.x, arena.y, arena.width, arena.height, 25);
        ctx.fill();
        
        const borderGradient = ctx.createLinearGradient(arena.x, arena.y, arena.x + arena.width, arena.y + arena.height);
        borderGradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        borderGradient.addColorStop(0.5, 'rgba(200, 230, 255, 0.5)');
        borderGradient.addColorStop(1, 'rgba(255, 255, 255, 0.7)');
        ctx.strokeStyle = borderGradient;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(arena.x, arena.y, arena.width, arena.height, 25);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(100, 150, 200, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([20, 10]);
        ctx.strokeRect(arena.x + 30, arena.y + 30, arena.width - 60, arena.height - 60);
        ctx.setLineDash([]);
        
        this.drawSnowPiles(ctx, arena);
        this.drawDecorations(ctx, arena);
    }

    drawSnowPiles(ctx, arena) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        
        for (let i = 0; i < 8; i++) {
            const x = arena.x - 20 + i * (arena.width + 40) / 8;
            const width = 40 + Math.sin(i * 1.5) * 20;
            const height = 15 + Math.sin(i * 2) * 8;
            
            ctx.beginPath();
            ctx.ellipse(x + width / 2, arena.y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawDecorations(ctx, arena) {
        this.drawGiantChristmasTree(ctx, arena.x - 100, arena.y - 120, 1.2);
        this.drawGiantChristmasTree(ctx, arena.x + arena.width - 20, arena.y - 120, 1.2);
        this.drawGiftBoxes(ctx, arena);
    }

    drawGiantChristmasTree(ctx, x, y, scale = 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        const treeGradient = ctx.createLinearGradient(40, 0, 40, 120);
        treeGradient.addColorStop(0, '#2d6a1f');
        treeGradient.addColorStop(0.5, '#1e4a14');
        treeGradient.addColorStop(1, '#0f3a0a');
        ctx.fillStyle = treeGradient;
        
        for (let i = 0; i < 4; i++) {
            const layerY = i * 30;
            const width = 70 - i * 12;
            ctx.beginPath();
            ctx.moveTo(40, layerY);
            ctx.lineTo(40 + width, layerY + 50);
            ctx.lineTo(40 - width, layerY + 50);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.moveTo(40, layerY + 5);
            ctx.lineTo(40 + width * 0.7, layerY + 40);
            ctx.lineTo(40, layerY + 35);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = treeGradient;
        }
        
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(30, 120, 20, 35);
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(33, 122, 6, 30);
        
        const starX = 40;
        const starY = -5;
        const starGlow = ctx.createRadialGradient(starX, starY, 0, starX, starY, 25);
        starGlow.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
        starGlow.addColorStop(0.5, 'rgba(255, 180, 0, 0.4)');
        starGlow.addColorStop(1, 'rgba(255, 150, 0, 0)');
        ctx.fillStyle = starGlow;
        ctx.beginPath();
        ctx.arc(starX, starY, 25, 0, Math.PI * 2);
        ctx.fill();
        
        this.drawStar(ctx, starX, starY, 12, '#FFD700', '#FFA500');
        
        const ornaments = [
            { x: 25, y: 30, color: '#ff6b6b' },
            { x: 55, y: 35, color: '#4ecdc4' },
            { x: 35, y: 55, color: '#ffd93d' },
            { x: 50, y: 65, color: '#ff9ff3' },
            { x: 28, y: 80, color: '#54a0ff' },
            { x: 52, y: 90, color: '#ff9f43' },
            { x: 40, y: 100, color: '#ff6b6b' }
        ];
        
        ornaments.forEach(orn => {
            const glow = ctx.createRadialGradient(orn.x, orn.y, 0, orn.x, orn.y, 10);
            glow.addColorStop(0, orn.color);
            glow.addColorStop(0.5, orn.color + 'aa');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(orn.x, orn.y, 10, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = orn.color;
            ctx.beginPath();
            ctx.arc(orn.x, orn.y, 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(orn.x - 2, orn.y - 2, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }

    drawStar(ctx, cx, cy, size, color1, color2) {
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        ctx.fillStyle = gradient;
        
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const r = i % 2 === 0 ? size : size * 0.4;
            const angle = (i * Math.PI) / 5 - Math.PI / 2;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }

    drawGiftBoxes(ctx, arena) {
        const gifts = [
            { x: arena.x - 40, y: arena.y + arena.height - 35, w: 30, h: 25, color: '#ff6b6b', ribbon: '#ffd93d' },
            { x: arena.x + arena.width + 10, y: arena.y + arena.height - 40, w: 35, h: 30, color: '#4ecdc4', ribbon: '#ff9ff3' },
            { x: arena.x - 25, y: arena.y + arena.height - 55, w: 20, h: 18, color: '#ffd93d', ribbon: '#ff6b6b' }
        ];
        
        gifts.forEach(gift => {
            ctx.fillStyle = gift.color;
            ctx.beginPath();
            ctx.roundRect(gift.x, gift.y, gift.w, gift.h, 5);
            ctx.fill();
            
            ctx.fillStyle = gift.ribbon;
            ctx.fillRect(gift.x + gift.w / 2 - 3, gift.y, 6, gift.h);
            ctx.fillRect(gift.x, gift.y + gift.h / 2 - 3, gift.w, 6);
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.ellipse(gift.x + 5, gift.y + 5, 4, 3, -0.5, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawCharacter(character) {
        const { x, y, width, height, color, bellyColor, facing, isCrouching, isFrozen, isStunned, isSliding, type } = character;
        const ctx = this.ctx;
        
        const fallProgress = character.getFallProgress();
        const fallRotation = fallProgress * Math.PI * 2;
        const fallScale = 1 - fallProgress * 0.5;
        
        ctx.save();
        ctx.translate(x + width / 2, y + height / 2);
        ctx.rotate(fallRotation * facing);
        ctx.scale(fallScale, fallScale);
        ctx.translate(-(x + width / 2), -(y + height / 2));
        
        if (facing < 0) {
            ctx.translate(x + width, y);
            ctx.scale(-1, 1);
            ctx.translate(-x, -y);
        }

        const scaleY = isCrouching ? 0.6 : 1;
        const offsetY = isCrouching ? height * 0.4 : 0;
        const bounce = Math.sin(Date.now() * 0.01) * 2;

        if (isFrozen) {
            ctx.globalAlpha = 0.6;
            const freezeGlow = ctx.createRadialGradient(
                x + width / 2, y + height / 2 + offsetY + bounce, 0,
                x + width / 2, y + height / 2 + offsetY + bounce, width
            );
            freezeGlow.addColorStop(0, 'rgba(150, 230, 255, 0.8)');
            freezeGlow.addColorStop(0.5, 'rgba(100, 200, 255, 0.5)');
            freezeGlow.addColorStop(1, 'rgba(50, 150, 255, 0.2)');
            ctx.fillStyle = freezeGlow;
            ctx.beginPath();
            ctx.ellipse(x + width / 2, y + height / 2 + offsetY + bounce, width * 0.7, height * 0.6 * scaleY, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        if (isStunned) {
            for (let i = 0; i < 6; i++) {
                const angle = Date.now() * 0.003 + i * Math.PI / 3;
                const starX = x + width / 2 + Math.cos(angle) * 35;
                const starY = y - 10 + bounce + Math.sin(angle) * 12;
                this.drawStar(ctx, starX, starY, 8, '#FFD700', '#FFA500');
            }
        }

        if (isSliding) {
            for (let i = 0; i < 6; i++) {
                ctx.fillStyle = `rgba(200, 230, 255, ${0.4 - i * 0.06})`;
                ctx.beginPath();
                ctx.ellipse(
                    x + width / 2 - facing * i * 18,
                    y + height - 8 + offsetY + bounce,
                    15 - i * 2, 7, 0, 0, Math.PI * 2
                );
                ctx.fill();
            }
        }

        const bodyGradient = ctx.createRadialGradient(
            x + width / 2 - 15, y + height / 2 + offsetY + bounce - 10, 0,
            x + width / 2, y + height / 2 + offsetY + bounce, width / 2
        );
        bodyGradient.addColorStop(0, '#5a6a7a');
        bodyGradient.addColorStop(0.6, color);
        bodyGradient.addColorStop(1, '#0a1020');
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height / 2 + offsetY + bounce, width / 2, height / 2 * scaleY, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.ellipse(x + width / 2 - 12, y + height / 3 + offsetY + bounce, width / 5, height / 6, -0.4, 0, Math.PI * 2);
        ctx.fill();

        const bellyGradient = ctx.createRadialGradient(
            x + width / 2, y + height / 2 + 10 + offsetY + bounce, 0,
            x + width / 2, y + height / 2 + 15 + offsetY + bounce, width / 3
        );
        bellyGradient.addColorStop(0, '#ffffff');
        bellyGradient.addColorStop(0.6, bellyColor);
        bellyGradient.addColorStop(1, '#d0e0f0');
        ctx.fillStyle = bellyGradient;
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height / 2 + 20 + offsetY + bounce, width / 3 + 5, height / 2.8 * scaleY, 0, 0, Math.PI * 2);
        ctx.fill();

        const headGradient = ctx.createRadialGradient(
            x + width / 2 - 8, y + height * 0.15 + offsetY + bounce, 0,
            x + width / 2, y + height * 0.2 + offsetY + bounce, width * 0.4
        );
        headGradient.addColorStop(0, '#5a6a7a');
        headGradient.addColorStop(0.6, color);
        headGradient.addColorStop(1, '#0a1020');
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height * 0.22 + offsetY + bounce, width * 0.4, 0, Math.PI * 2);
        ctx.fill();

        const faceGradient = ctx.createRadialGradient(
            x + width / 2, y + height * 0.27 + offsetY + bounce, 0,
            x + width / 2, y + height * 0.27 + offsetY + bounce, width * 0.3
        );
        faceGradient.addColorStop(0, '#ffffff');
        faceGradient.addColorStop(0.7, bellyColor);
        faceGradient.addColorStop(1, '#e0e8f0');
        ctx.fillStyle = faceGradient;
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height * 0.28 + offsetY + bounce, width * 0.32, width * 0.26, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.ellipse(x + width * 0.36, y + height * 0.2 + offsetY + bounce, 11, 13, -0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + width * 0.64, y + height * 0.2 + offsetY + bounce, 11, 13, 0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(150, 220, 255, 0.35)';
        ctx.beginPath();
        ctx.ellipse(x + width * 0.38, y + height * 0.18 + offsetY + bounce, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + width * 0.66, y + height * 0.18 + offsetY + bounce, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0a0a1a';
        ctx.beginPath();
        ctx.arc(x + width * 0.38, y + height * 0.22 + offsetY + bounce, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + width * 0.66, y + height * 0.22 + offsetY + bounce, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + width * 0.395, y + height * 0.205 + offsetY + bounce, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + width * 0.675, y + height * 0.205 + offsetY + bounce, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 120, 140, 0.5)';
        ctx.beginPath();
        ctx.ellipse(x + width * 0.24, y + height * 0.31 + offsetY + bounce, 12, 7, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + width * 0.76, y + height * 0.31 + offsetY + bounce, 12, 7, 0.3, 0, Math.PI * 2);
        ctx.fill();

        const beakGradient = ctx.createLinearGradient(
            x + width / 2, y + height * 0.3 + offsetY + bounce,
            x + width / 2, y + height * 0.4 + offsetY + bounce
        );
        beakGradient.addColorStop(0, '#ffb347');
        beakGradient.addColorStop(0.5, '#ff9f43');
        beakGradient.addColorStop(1, '#ee5a24');
        ctx.fillStyle = beakGradient;
        ctx.beginPath();
        ctx.moveTo(x + width / 2, y + height * 0.32 + offsetY + bounce);
        ctx.lineTo(x + width / 2 - 11, y + height * 0.4 + offsetY + bounce);
        ctx.lineTo(x + width / 2 + 11, y + height * 0.4 + offsetY + bounce);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(x + width / 2, y + height * 0.34 + offsetY + bounce);
        ctx.lineTo(x + width / 2 - 5, y + height * 0.38 + offsetY + bounce);
        ctx.lineTo(x + width / 2 + 5, y + height * 0.38 + offsetY + bounce);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height * 0.43 + offsetY + bounce, 10, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();

        const wingGradient = ctx.createLinearGradient(
            x + width * 0.08, y + height * 0.4 + offsetY + bounce,
            x + width * 0.08, y + height * 0.7 + offsetY + bounce
        );
        wingGradient.addColorStop(0, color);
        wingGradient.addColorStop(1, '#0a1020');
        ctx.fillStyle = wingGradient;
        ctx.beginPath();
        ctx.ellipse(x + width * 0.1, y + height * 0.55 + offsetY + bounce, 10, 22, -0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + width * 0.9, y + height * 0.55 + offsetY + bounce, 10, 22, 0.6, 0, Math.PI * 2);
        ctx.fill();

        if (!isCrouching) {
            const footGradient = ctx.createLinearGradient(0, y + height - 15 + bounce, 0, y + height + 5 + bounce);
            footGradient.addColorStop(0, '#ff9f43');
            footGradient.addColorStop(1, '#ee5a24');
            ctx.fillStyle = footGradient;
            
            ctx.beginPath();
            ctx.ellipse(x + width * 0.35, y + height - 3 + bounce, 16, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + width * 0.65, y + height - 3 + bounce, 16, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#cc4400';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x + width * 0.35 - 8, y + height - 3 + bounce);
            ctx.lineTo(x + width * 0.35 - 8, y + height + 4 + bounce);
            ctx.moveTo(x + width * 0.35, y + height - 5 + bounce);
            ctx.lineTo(x + width * 0.35, y + height + 6 + bounce);
            ctx.moveTo(x + width * 0.35 + 8, y + height - 3 + bounce);
            ctx.lineTo(x + width * 0.35 + 8, y + height + 4 + bounce);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(x + width * 0.65 - 8, y + height - 3 + bounce);
            ctx.lineTo(x + width * 0.65 - 8, y + height + 4 + bounce);
            ctx.moveTo(x + width * 0.65, y + height - 5 + bounce);
            ctx.lineTo(x + width * 0.65, y + height + 6 + bounce);
            ctx.moveTo(x + width * 0.65 + 8, y + height - 3 + bounce);
            ctx.lineTo(x + width * 0.65 + 8, y + height + 4 + bounce);
            ctx.stroke();
        }

        if (type === 'emperor') {
            this.drawStar(ctx, x + width / 2, y + height * 0.02 + bounce, 14, '#FFD700', '#FFA500');
        } else if (type === 'little') {
            ctx.fillStyle = '#74b9ff';
            ctx.beginPath();
            ctx.arc(x + width * 0.28, y + height * 0.05 + bounce, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + width * 0.72, y + height * 0.05 + bounce, 7, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x + width * 0.3, y + height * 0.04 + bounce, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + width * 0.74, y + height * 0.04 + bounce, 2.5, 0, Math.PI * 2);
            ctx.fill();
        } else if (type === 'fat') {
            const ringGradient = ctx.createLinearGradient(
                x + width / 2 - 30, y + height * 0.58 + offsetY + bounce,
                x + width / 2 + 30, y + height * 0.58 + offsetY + bounce
            );
            ringGradient.addColorStop(0, '#ff6b6b');
            ringGradient.addColorStop(0.5, '#e74c3c');
            ringGradient.addColorStop(1, '#ff6b6b');
            ctx.fillStyle = ringGradient;
            ctx.beginPath();
            ctx.roundRect(x + width * 0.15, y + height * 0.56 + offsetY + bounce, width * 0.7, 18, 9);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.roundRect(x + width * 0.18, y + height * 0.57 + offsetY + bounce, width * 0.2, 10, 5);
            ctx.fill();
        }

        ctx.restore();

        character.slideParticles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.min(1, p.life / 250);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
    }

    drawProjectiles(projectiles) {
        const ctx = this.ctx;
        projectiles.forEach(p => {
            ctx.save();
            ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
            ctx.rotate(Date.now() * 0.01 + p.x * 0.01);
            
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.width);
            gradient.addColorStop(0, 'rgba(200, 240, 255, 1)');
            gradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(50, 150, 255, 0.5)');
            ctx.fillStyle = gradient;
            
            ctx.beginPath();
            ctx.moveTo(0, -p.height / 2);
            ctx.lineTo(p.width / 2, p.height / 2);
            ctx.lineTo(-p.width / 2, p.height / 2);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.moveTo(0, -p.height / 2 + 3);
            ctx.lineTo(p.width / 4, p.height / 4);
            ctx.lineTo(-p.width / 4, p.height / 4);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
            
            ctx.fillStyle = 'rgba(150, 220, 255, 0.4)';
            for (let i = 1; i <= 3; i++) {
                ctx.beginPath();
                ctx.arc(p.x + p.width / 2 - p.vx * i * 2, p.y + p.height / 2, 4 - i, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    drawUltimateEffects(effects) {
        const ctx = this.ctx;
        effects.forEach(effect => {
            if (effect.type === 'polarWave') {
                const waveX = effect.x;
                const waveY = effect.y;
                
                for (let layer = 0; layer < 4; layer++) {
                    const gradient = ctx.createRadialGradient(
                        waveX - layer * 40 * effect.direction, waveY - 50, 0,
                        waveX - layer * 40 * effect.direction, waveY - 50, 120 - layer * 20
                    );
                    gradient.addColorStop(0, `rgba(100, 220, 255, ${0.7 - layer * 0.15})`);
                    gradient.addColorStop(0.5, `rgba(150, 200, 255, ${0.5 - layer * 0.1})`);
                    gradient.addColorStop(1, 'rgba(100, 180, 255, 0)');
                    
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.ellipse(
                        waveX - layer * 50 * effect.direction,
                        waveY - 50,
                        100 - layer * 15,
                        80 - layer * 15,
                        0, 0, Math.PI * 2
                    );
                    ctx.fill();
                }
                
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2 + Date.now() * 0.002;
                    const sx = waveX + Math.cos(angle) * 80;
                    const sy = waveY - 50 + Math.sin(angle) * 50;
                    this.drawStar(ctx, sx, sy, 6, '#ffffff', '#88ddff');
                }
            } else if (effect.type === 'whaleRush') {
                const gradient = ctx.createRadialGradient(
                    effect.x, effect.y - 40, 0,
                    effect.x, effect.y - 40, 100
                );
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
                gradient.addColorStop(0.3, 'rgba(200, 240, 255, 0.8)');
                gradient.addColorStop(0.6, 'rgba(150, 220, 255, 0.5)');
                gradient.addColorStop(1, 'rgba(100, 180, 255, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.ellipse(effect.x, effect.y - 40, 100, 70, 0, 0, Math.PI * 2);
                ctx.fill();
                
                for (let i = 0; i < 12; i++) {
                    const angle = (i / 12) * Math.PI * 2 + Date.now() * 0.003;
                    const sx = effect.x + Math.cos(angle) * 90;
                    const sy = effect.y - 40 + Math.sin(angle) * 60;
                    
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(sx, sy, 5, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else if (effect.type === 'iceStorm') {
                effect.projectiles.forEach(p => {
                    if (!p.active) return;
                    
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(Date.now() * 0.005 + p.x * 0.01);
                    
                    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 18);
                    gradient.addColorStop(0, 'rgba(200, 240, 255, 1)');
                    gradient.addColorStop(0.6, 'rgba(100, 200, 255, 0.9)');
                    gradient.addColorStop(1, 'rgba(50, 150, 255, 0.7)');
                    ctx.fillStyle = gradient;
                    
                    ctx.beginPath();
                    ctx.moveTo(0, -18);
                    ctx.lineTo(12, 12);
                    ctx.lineTo(0, 6);
                    ctx.lineTo(-12, 12);
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                    ctx.beginPath();
                    ctx.moveTo(0, -14);
                    ctx.lineTo(5, 2);
                    ctx.lineTo(-5, 2);
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.restore();
                });
            }
        });
    }
}