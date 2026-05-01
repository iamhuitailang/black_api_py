const Renderer = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    
    init(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    },

    resize() {
        const container = this.canvas.parentElement;
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        this.canvas.width = this.width * window.devicePixelRatio;
        this.canvas.height = this.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    },

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    },

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f0f23');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.drawClouds();
        this.drawMountains();
        this.drawBamboo();
    },

    drawClouds() {
        this.ctx.save();
        this.ctx.globalAlpha = 0.08;
        
        const time = Date.now() * 0.0001;
        
        const clouds = [
            { x: (time * 50 + 100) % (this.width + 200) - 100, y: 50, size: 0.8 },
            { x: (time * 30 + 300) % (this.width + 200) - 100, y: 80, size: 1.2 },
            { x: (time * 40 + 500) % (this.width + 200) - 100, y: 120, size: 0.6 },
        ];
        
        clouds.forEach(cloud => {
            this.ctx.fillStyle = '#ffffff';
            this.drawCloudShape(cloud.x, cloud.y, cloud.size);
        });
        
        this.ctx.restore();
    },

    drawCloudShape(x, y, scale) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 30 * scale, 0, Math.PI * 2);
        this.ctx.arc(x + 25 * scale, y - 10 * scale, 25 * scale, 0, Math.PI * 2);
        this.ctx.arc(x + 50 * scale, y, 30 * scale, 0, Math.PI * 2);
        this.ctx.arc(x + 25 * scale, y + 10 * scale, 20 * scale, 0, Math.PI * 2);
        this.ctx.fill();
    },

    drawMountains() {
        this.ctx.save();
        this.ctx.globalAlpha = 0.15;
        
        const gradient = this.ctx.createLinearGradient(0, this.height - 200, 0, this.height);
        gradient.addColorStop(0, '#2d3561');
        gradient.addColorStop(1, '#1a1a2e');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.height);
        this.ctx.lineTo(0, this.height - 100);
        this.ctx.lineTo(this.width * 0.15, this.height - 180);
        this.ctx.lineTo(this.width * 0.3, this.height - 120);
        this.ctx.lineTo(this.width * 0.45, this.height - 200);
        this.ctx.lineTo(this.width * 0.6, this.height - 150);
        this.ctx.lineTo(this.width * 0.75, this.height - 190);
        this.ctx.lineTo(this.width * 0.9, this.height - 130);
        this.ctx.lineTo(this.width, this.height - 160);
        this.ctx.lineTo(this.width, this.height);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    },

    drawBamboo() {
        this.ctx.save();
        this.ctx.globalAlpha = 0.2;
        
        this.drawBambooStalk(30, this.height, 150);
        this.drawBambooStalk(this.width - 30, this.height, 180);
        
        this.ctx.restore();
    },

    drawBambooStalk(x, baseY, height) {
        this.ctx.strokeStyle = '#2e7d32';
        this.ctx.lineWidth = 4;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, baseY);
        this.ctx.quadraticCurveTo(x - 5, baseY - height/2, x, baseY - height);
        this.ctx.stroke();
        
        for (let i = 0; i < 5; i++) {
            const y = baseY - (height * (i + 1) / 6);
            this.ctx.beginPath();
            this.ctx.moveTo(x - 10, y);
            this.ctx.lineTo(x + 10, y);
            this.ctx.stroke();
        }
        
        this.drawBambooLeaves(x, baseY - height, true);
    },

    drawBambooLeaves(x, y, isLeft) {
        this.ctx.fillStyle = '#388e3c';
        this.ctx.beginPath();
        
        if (isLeft) {
            this.ctx.ellipse(x - 15, y - 5, 15, 5, -0.5, 0, Math.PI * 2);
            this.ctx.ellipse(x - 10, y - 12, 12, 4, -0.3, 0, Math.PI * 2);
        } else {
            this.ctx.ellipse(x + 15, y - 5, 15, 5, 0.5, 0, Math.PI * 2);
            this.ctx.ellipse(x + 10, y - 12, 12, 4, 0.3, 0, Math.PI * 2);
        }
        
        this.ctx.fill();
    },

    drawLotteryBox(x, y, rotation = 0, shakeOffset = { x: 0, y: 0 }) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x + shakeOffset.x, y + shakeOffset.y);
        ctx.rotate(rotation);
        
        const boxWidth = 80;
        const boxHeight = 150;
        const boxX = -boxWidth / 2;
        const boxY = -boxHeight;
        
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 10;
        ctx.shadowOffsetY = 10;
        
        const gradient = ctx.createLinearGradient(boxX, 0, boxX + boxWidth, 0);
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(0.3, '#A0522D');
        gradient.addColorStop(0.5, '#CD853F');
        gradient.addColorStop(0.7, '#A0522D');
        gradient.addColorStop(1, '#8B4513');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(boxX + 5, boxY);
        ctx.lineTo(boxX + boxWidth - 5, boxY);
        ctx.lineTo(boxX + boxWidth, 0);
        ctx.lineTo(boxX, 0);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
        
        this.drawBoxDecorations(boxX, boxY, boxWidth, boxHeight);
        
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.ellipse(0, boxY, boxWidth / 2, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, boxY, boxWidth / 2, 12, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    },

    drawBoxDecorations(boxX, boxY, boxWidth, boxHeight) {
        const ctx = this.ctx;
        
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(boxX + 15, boxY + 15);
        ctx.lineTo(boxX + 15, -15);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(boxX + boxWidth - 15, boxY + 15);
        ctx.lineTo(boxX + boxWidth - 15, -15);
        ctx.stroke();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px serif';
        ctx.textAlign = 'center';
        ctx.fillText('签', 0, boxY + boxHeight / 2);
        
        ctx.fillStyle = '#DC143C';
        ctx.beginPath();
        ctx.arc(0, boxY + 30, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px serif';
        ctx.fillText('福', 0, boxY + 35);
    },

    drawFortuneStick(x, y, rotation = 0, scale = 1, opacity = 1, fortuneData = null) {
        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        
        const stickWidth = 30;
        const stickHeight = 200;
        const stickX = -stickWidth / 2;
        const stickY = -stickHeight / 2;
        
        let primaryColor = '#FFD700';
        let secondaryColor = '#DC143C';
        
        if (fortuneData && fortuneData.level && fortuneData.level.colors) {
            primaryColor = fortuneData.level.colors[0];
            secondaryColor = fortuneData.level.colors[1] || primaryColor;
        }
        
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 20;
        
        const gradient = ctx.createLinearGradient(stickX, 0, stickX + stickWidth, 0);
        gradient.addColorStop(0, '#F5DEB3');
        gradient.addColorStop(0.2, '#FFF8DC');
        gradient.addColorStop(0.5, '#FFFFF0');
        gradient.addColorStop(0.8, '#FFF8DC');
        gradient.addColorStop(1, '#F5DEB3');
        
        ctx.fillStyle = gradient;
        this.roundRect(ctx, stickX, stickY, stickWidth, stickHeight, 8);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2;
        this.roundRect(ctx, stickX, stickY, stickWidth, stickHeight, 8);
        ctx.stroke();
        
        if (fortuneData) {
            ctx.fillStyle = secondaryColor;
            ctx.font = 'bold 18px serif';
            ctx.textAlign = 'center';
            
            const levelName = fortuneData.level.displayName;
            const chars = levelName.split('');
            for (let i = 0; i < chars.length; i++) {
                ctx.fillText(chars[i], 0, stickY + 50 + i * 30);
            }
        }
        
        ctx.restore();
    },

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    },

    drawFortunePaper(x, y, scale = 1, opacity = 1, fortuneData = null, progress = 1) {
        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        const paperWidth = 300;
        const paperHeight = 400;
        const paperX = -paperWidth / 2;
        const paperY = -paperHeight / 2;
        
        let primaryColor = '#FFD700';
        let bgColor = '#FFF8DC';
        
        if (fortuneData && fortuneData.level) {
            primaryColor = fortuneData.level.colors[0];
            bgColor = fortuneData.level.bgColors[0] || bgColor;
        }
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        
        ctx.fillStyle = bgColor;
        this.roundRect(ctx, paperX, paperY, paperWidth, paperHeight, 5);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 3;
        this.roundRect(ctx, paperX, paperY, paperWidth, paperHeight, 5);
        ctx.stroke();
        
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        this.roundRect(ctx, paperX + 8, paperY + 8, paperWidth - 16, paperHeight - 16, 3);
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        this.drawCornerDecorations(paperX, paperY, paperWidth, paperHeight, primaryColor);
        
        if (fortuneData) {
            this.drawFortuneContent(0, 0, paperWidth - 40, paperHeight - 40, fortuneData, progress);
        }
        
        ctx.restore();
    },

    drawCornerDecorations(x, y, width, height, color) {
        const ctx = this.ctx;
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        const cornerSize = 20;
        
        ctx.beginPath();
        ctx.moveTo(x + 5, y + 5 + cornerSize);
        ctx.lineTo(x + 5, y + 5);
        ctx.lineTo(x + 5 + cornerSize, y + 5);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x + width - 5, y + 5 + cornerSize);
        ctx.lineTo(x + width - 5, y + 5);
        ctx.lineTo(x + width - 5 - cornerSize, y + 5);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x + 5, y + height - 5 - cornerSize);
        ctx.lineTo(x + 5, y + height - 5);
        ctx.lineTo(x + 5 + cornerSize, y + height - 5);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x + width - 5, y + height - 5 - cornerSize);
        ctx.lineTo(x + width - 5, y + height - 5);
        ctx.lineTo(x + width - 5 - cornerSize, y + height - 5);
        ctx.stroke();
    },

    drawFortuneContent(x, y, width, height, fortuneData, progress) {
        const ctx = this.ctx;
        const contentProgress = Math.min(1, Math.max(0, progress));
        
        ctx.save();
        ctx.translate(x, y - height / 2 + 40);
        
        const level = fortuneData.level;
        const primaryColor = level.colors[0];
        const secondaryColor = level.colors[1] || primaryColor;
        
        ctx.textAlign = 'center';
        ctx.globalAlpha = contentProgress;
        
        ctx.fillStyle = primaryColor;
        ctx.font = 'bold 36px serif';
        ctx.fillText(level.displayName, 0, 0);
        
        ctx.fillStyle = '#666';
        ctx.font = '14px serif';
        ctx.fillText(`【${level.description}】`, 0, 30);
        
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3 * contentProgress;
        ctx.beginPath();
        ctx.moveTo(-width / 2 + 20, 45);
        ctx.lineTo(width / 2 - 20, 45);
        ctx.stroke();
        ctx.globalAlpha = contentProgress;
        
        ctx.fillStyle = '#333';
        ctx.font = 'bold 18px serif';
        ctx.fillText('签  文', 0, 75);
        
        ctx.fillStyle = '#444';
        ctx.font = '16px serif';
        this.wrapText(ctx, `"${fortuneData.text}"`, 0, 105, width - 40, 24);
        
        ctx.fillStyle = '#666';
        ctx.font = '14px serif';
        this.wrapText(ctx, fortuneData.interpretation, 0, 155, width - 40, 20);
        
        this.drawLuckyElements(ctx, width, fortuneData, 200, contentProgress);
        
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px serif';
        ctx.fillText('开运建议', 0, 310);
        
        ctx.fillStyle = '#555';
        ctx.font = '13px serif';
        this.wrapText(ctx, `"${fortuneData.suggestion}"`, 0, 335, width - 40, 20);
        
        ctx.fillStyle = '#DC143C';
        ctx.font = '13px serif';
        this.wrapText(ctx, `注意事项: ${fortuneData.note}`, 0, 365, width - 40, 18);
        
        ctx.restore();
    },

    drawLuckyElements(ctx, width, fortuneData, startY, progress) {
        const elements = [
            { label: '幸运数字', value: fortuneData.luckyNumbers.join('、') },
            { label: '幸运颜色', value: fortuneData.luckyColors.join('、') },
            { label: '幸运方位', value: fortuneData.luckyDirection },
            { label: '幸运星座', value: fortuneData.luckyConstellations.join('、') },
            { label: '幸运物', value: fortuneData.luckyItems.join('、') }
        ];
        
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px serif';
        ctx.fillText('幸运元素', 0, startY);
        
        let y = startY + 30;
        ctx.font = '13px serif';
        
        elements.forEach((elem, index) => {
            ctx.globalAlpha = progress;
            ctx.fillStyle = '#666';
            ctx.textAlign = 'left';
            ctx.fillText(`${elem.label}:`, -width / 2 + 20, y + index * 20);
            
            ctx.fillStyle = '#333';
            ctx.textAlign = 'left';
            ctx.fillText(elem.value, -width / 2 + 90, y + index * 20);
        });
        
        ctx.textAlign = 'center';
        ctx.globalAlpha = 1;
    },

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split('');
        let line = '';
        let currentY = y;
        
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n];
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, currentY);
                line = words[n];
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
    },

    drawButton(x, y, width, height, text, isHovered = false, isDisabled = false) {
        const ctx = this.ctx;
        
        ctx.save();
        
        let gradient;
        if (isDisabled) {
            gradient = ctx.createLinearGradient(x, y, x, y + height);
            gradient.addColorStop(0, '#999');
            gradient.addColorStop(1, '#666');
        } else if (isHovered) {
            gradient = ctx.createLinearGradient(x, y, x, y + height);
            gradient.addColorStop(0, '#FFD700');
            gradient.addColorStop(1, '#FFA500');
        } else {
            gradient = ctx.createLinearGradient(x, y, x, y + height);
            gradient.addColorStop(0, '#DC143C');
            gradient.addColorStop(1, '#8B0000');
        }
        
        ctx.fillStyle = gradient;
        this.roundRect(ctx, x, y, width, height, 25);
        ctx.fill();
        
        ctx.strokeStyle = isDisabled ? '#555' : '#FFD700';
        ctx.lineWidth = 2;
        this.roundRect(ctx, x, y, width, height, 25);
        ctx.stroke();
        
        ctx.fillStyle = isDisabled ? '#ccc' : '#fff';
        ctx.font = 'bold 18px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + width / 2, y + height / 2);
        
        ctx.restore();
    },

    drawTitle() {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
        ctx.shadowBlur = 20;
        
        const gradient = ctx.createLinearGradient(0, 60, 0, 100);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.5, '#FFA500');
        gradient.addColorStop(1, '#FFD700');
        
        ctx.fillStyle = gradient;
        ctx.font = 'bold 42px serif';
        ctx.textAlign = 'center';
        ctx.fillText('今日运势签', this.width / 2, 90);
        
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#DC143C';
        ctx.lineWidth = 2;
        ctx.strokeText('今日运势签', this.width / 2, 90);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = '14px serif';
        ctx.fillText('─────  江湖风云录  ─────', this.width / 2, 120);
        
        const today = new Date();
        const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
        ctx.fillStyle = '#aaa';
        ctx.font = '14px serif';
        ctx.fillText(dateStr, this.width / 2, 145);
        
        ctx.restore();
    },

    drawParticles(particles) {
        const ctx = this.ctx;
        particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    },

    drawLightEffect(x, y, radius, color, intensity = 1) {
        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = intensity;
        
        const baseColor = this.getBaseColor(color);
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, baseColor + 'CC');
        gradient.addColorStop(0.5, baseColor + '66');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    },

    getBaseColor(color) {
        if (!color.startsWith('#')) {
            return color;
        }
        
        let hex = color.slice(1);
        
        if (hex.length === 3) {
            return '#' + hex;
        }
        if (hex.length === 4) {
            return '#' + hex.slice(0, 3);
        }
        if (hex.length === 6) {
            return '#' + hex;
        }
        if (hex.length === 8) {
            return '#' + hex.slice(0, 6);
        }
        
        return color;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Renderer;
}
