class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawBackground() {
        const ctx = this.ctx;
        
        ctx.fillStyle = '#FFF8E7';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT - 130);
        
        ctx.fillStyle = '#FFEFD5';
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.arc(150 + i * 180, 60 + (i % 2) * 30, 45 + Math.sin(Date.now() / 1000 + i) * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = '#FFE4E1';
        ctx.fillRect(50, 30, 120, 150);
        ctx.fillRect(CONFIG.CANVAS_WIDTH - 170, 30, 120, 150);
        
        ctx.strokeStyle = '#DEB887';
        ctx.lineWidth = 6;
        ctx.strokeRect(50, 30, 120, 150);
        ctx.strokeRect(CONFIG.CANVAS_WIDTH - 170, 30, 120, 150);
        
        ctx.strokeStyle = '#DEB887';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(110, 30);
        ctx.lineTo(110, 180);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(50, 105);
        ctx.lineTo(170, 105);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(CONFIG.CANVAS_WIDTH - 110, 30);
        ctx.lineTo(CONFIG.CANVAS_WIDTH - 110, 180);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(CONFIG.CANVAS_WIDTH - 170, 105);
        ctx.lineTo(CONFIG.CANVAS_WIDTH - 50, 105);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(135, 206, 250, 0.3)';
        ctx.fillRect(56, 36, 108, 138);
        ctx.fillRect(CONFIG.CANVAS_WIDTH - 164, 36, 108, 138);
        
        ctx.fillStyle = '#87CEEB';
        ctx.beginPath();
        ctx.moveTo(90, 50);
        ctx.quadraticCurveTo(110, 80, 90, 110);
        ctx.quadraticCurveTo(130, 80, 90, 50);
        ctx.fill();
        
        ctx.fillStyle = '#FFE4B5';
        ctx.beginPath();
        ctx.arc(CONFIG.CANVAS_WIDTH - 110, 80, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(CONFIG.CANVAS_WIDTH - 110, 80, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(0, CONFIG.CANVAS_HEIGHT - 130, CONFIG.CANVAS_WIDTH, 130);
        
        ctx.strokeStyle = '#D2B48C';
        ctx.lineWidth = 2;
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 70, CONFIG.CANVAS_HEIGHT - 130);
            ctx.lineTo(i * 70 + 35, CONFIG.CANVAS_HEIGHT - 10);
            ctx.stroke();
        }
        
        ctx.fillStyle = '#F4A460';
        ctx.beginPath();
        ctx.ellipse(CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT - 65, 420, 55, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.ellipse(CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT - 65, 380, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#CD853F';
        ctx.lineWidth = 4;
        ctx.setLineDash([20, 15]);
        ctx.beginPath();
        ctx.ellipse(CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT - 65, 360, 35, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#FFB6C1';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(CONFIG.CANVAS_WIDTH / 2 - 200 + i * 100, CONFIG.CANVAS_HEIGHT - 65, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawCat(cat) {
        const ctx = this.ctx;
        const x = cat.x;
        const y = cat.y;
        
        ctx.save();
        
        if (!cat.facingRight) {
            ctx.translate(x + cat.width, y);
            ctx.scale(-1, 1);
            ctx.translate(-x, -y);
        }
        
        const bodyColor = cat.isHiding ? '#E8D5B7' : '#FFF5E6';
        const darkFur = '#E0C9A8';
        const pointColor = '#8B7355';
        const pawPadColor = '#FFB6C1';
        
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath();
        ctx.ellipse(x + cat.width / 2 + 4, y + cat.height - 3, cat.width / 2 + 5, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(x + cat.width / 2, y + cat.height / 2 + 10, cat.width / 2 + 5, cat.height / 2 - 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = darkFur;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = '#FFFAF0';
        ctx.beginPath();
        ctx.ellipse(x + cat.width / 2, y + cat.height / 2 + 15, cat.width / 3 + 5, cat.height / 3 + 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = pointColor;
        ctx.beginPath();
        ctx.ellipse(x + cat.width / 2, y + cat.height - 12, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(x + cat.width / 4 - 3, y + 8, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = darkFur;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = '#FFFAF0';
        ctx.beginPath();
        ctx.ellipse(x + cat.width / 4 - 3, y + 18, 18, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = pointColor;
        ctx.beginPath();
        ctx.moveTo(x - 8, y + 5);
        ctx.quadraticCurveTo(x + 5, y - 22, x + 22, y + 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(x + 24, y + 5);
        ctx.quadraticCurveTo(x + 37, y - 22, x + 54, y + 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#FFE4E1';
        ctx.beginPath();
        ctx.moveTo(x - 3, y + 3);
        ctx.quadraticCurveTo(x + 7, y - 15, x + 17, y + 1);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(x + 29, y + 3);
        ctx.quadraticCurveTo(x + 39, y - 15, x + 49, y + 1);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#4A3728';
        ctx.beginPath();
        ctx.ellipse(x + 8, y + 10, 9, 11, -0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 34, y + 10, 9, 11, 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#87CEEB';
        ctx.beginPath();
        ctx.ellipse(x + 9, y + 11, 6, 8, -0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 35, y + 11, 6, 8, 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x + 11, y + 7, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 37, y + 7, 3.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x + 6, y + 14, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 32, y + 14, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = pointColor;
        ctx.beginPath();
        ctx.moveTo(x + 21, y + 22);
        ctx.quadraticCurveTo(x + 18, y + 28, x + 21, y + 30);
        ctx.quadraticCurveTo(x + 24, y + 28, x + 21, y + 22);
        ctx.fill();
        
        ctx.strokeStyle = pointColor;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x + 21, y + 30);
        ctx.quadraticCurveTo(x + 10, y + 38, x + 2, y + 34);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 21, y + 30);
        ctx.quadraticCurveTo(x + 32, y + 38, x + 40, y + 34);
        ctx.stroke();
        
        ctx.fillStyle = pawPadColor;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.ellipse(x - 2, y + 24, 10, 7, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 44, y + 24, 10, 7, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        ctx.strokeStyle = '#C4A484';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x - 5, y + 18 + i * 5);
            ctx.quadraticCurveTo(x - 20, y + 16 + i * 5, x - 30, y + 20 + i * 5);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + 47, y + 18 + i * 5);
            ctx.quadraticCurveTo(x + 62, y + 16 + i * 5, x + 72, y + 20 + i * 5);
            ctx.stroke();
        }
        
        ctx.fillStyle = bodyColor;
        const tailWave = Math.sin(cat.animFrame * 0.4) * 10;
        ctx.beginPath();
        ctx.moveTo(x + cat.width - 5, y + cat.height / 2 - 5);
        ctx.quadraticCurveTo(x + cat.width + 15, y + cat.height / 2 - 35 + tailWave, x + cat.width + 35, y + cat.height / 2 - 12 + tailWave);
        ctx.quadraticCurveTo(x + cat.width + 45, y + cat.height / 2 + tailWave, x + cat.width + 32, y + cat.height / 2 + 18 + tailWave);
        ctx.quadraticCurveTo(x + cat.width + 12, y + cat.height / 2 + 40 + tailWave, x + cat.width - 5, y + cat.height / 2 + 10);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = darkFur;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = pointColor;
        ctx.beginPath();
        ctx.arc(x + cat.width + 35, y + cat.height / 2 + 3 + tailWave, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = bodyColor;
        const pawOffset = Math.sin(cat.animFrame * 0.7) * 3;
        ctx.beginPath();
        ctx.ellipse(x + 18, y + cat.height - 5 + pawOffset, 14, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + cat.width - 22, y + cat.height - 5 - pawOffset, 14, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = pawPadColor;
        ctx.beginPath();
        ctx.ellipse(x + 18, y + cat.height - 3 + pawOffset, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + cat.width - 22, y + cat.height - 3 - pawOffset, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF99AA';
        ctx.beginPath();
        ctx.arc(x + 14, y + cat.height - 2 + pawOffset, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 20, y + cat.height - 4 + pawOffset, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + cat.width - 26, y + cat.height - 2 - pawOffset, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + cat.width - 20, y + cat.height - 4 - pawOffset, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        if (cat.isAttacking) {
            ctx.strokeStyle = '#FF6B9D';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.moveTo(x + cat.width + 8 + i * 12, y + 12 + i * 7);
                ctx.quadraticCurveTo(x + cat.width + 28 + i * 12, y + 5 + i * 7, x + cat.width + 40 + i * 12, y + 10 + i * 7);
                ctx.stroke();
            }
            
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 20px Arial';
            ctx.fillText('✨', x + cat.width + 35, y + 5);
            ctx.fillText('💥', x + cat.width + 50, y + 30);
        }
        
        if (cat.isHiding) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.ellipse(x + cat.width / 2, y + cat.height / 2 + 5, cat.width / 2 + 15, cat.height / 2 + 12, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#FF6B9D';
            ctx.font = 'bold 16px Arial';
            ctx.fillText('🙈 躲猫猫~', x + cat.width / 2 - 35, y - 8);
        }
        
        ctx.restore();
    }
    
    drawFurniture(furniture) {
        const ctx = this.ctx;
        const x = furniture.x;
        const y = furniture.y;
        
        if (furniture.isDestroyed) {
            ctx.fillStyle = 'rgba(139, 115, 85, 0.3)';
            ctx.beginPath();
            ctx.ellipse(x + furniture.width / 2, y + furniture.height - 5, furniture.width / 2, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            
            for (let i = 0; i < 5; i++) {
                ctx.fillStyle = 'rgba(255, 200, 150, 0.6)';
                ctx.beginPath();
                ctx.arc(x + 10 + i * 15, y + furniture.height - 10 + Math.sin(i) * 8, 5 + i, 0, Math.PI * 2);
                ctx.fill();
            }
            return;
        }
        
        ctx.save();
        
        if (furniture.damageAnim > 0) {
            ctx.translate(Math.random() * 8 - 4, Math.random() * 8 - 4);
        }
        
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.ellipse(x + furniture.width / 2 + 3, y + furniture.height + 3, furniture.width / 2 - 5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        switch (furniture.type) {
            case 0:
                this.drawSofa(x, y, furniture);
                break;
            case 1:
                this.drawTable(x, y, furniture);
                break;
            case 2:
                this.drawBox(x, y, furniture);
                break;
            case 3:
                this.drawCup(x, y, furniture);
                break;
            case 4:
                this.drawVase(x, y, furniture);
                break;
            case 5:
                this.drawLamp(x, y, furniture);
                break;
        }
        
        const hpPercent = furniture.hp / furniture.maxHp;
        
        ctx.fillStyle = '#5D4E37';
        ctx.beginPath();
        ctx.roundRect(x, y - 18, furniture.width, 12, 4);
        ctx.fill();
        
        const hpColor = hpPercent > 0.5 ? '#90EE90' : hpPercent > 0.25 ? '#FFD700' : '#FF6B6B';
        ctx.fillStyle = hpColor;
        ctx.beginPath();
        ctx.roundRect(x + 2, y - 16, (furniture.width - 4) * hpPercent, 8, 3);
        ctx.fill();
        
        ctx.fillStyle = '#5D4E37';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(furniture.name, x + furniture.width / 2, y - 24);
        
        ctx.restore();
    }
    
    drawSofa(x, y, f) {
        const ctx = this.ctx;
        
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(x + 20, y + f.height - 8, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + f.width - 20, y + f.height - 8, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.roundRect(x, y + 25, f.width, f.height - 35, 8);
        ctx.fill();
        
        ctx.fillStyle = '#FFF8DC';
        ctx.beginPath();
        ctx.roundRect(x + 8, y + 32, f.width - 16, f.height - 50, 5);
        ctx.fill();
        
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.roundRect(x - 3, y, 35, f.height - 15, 8);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(x + f.width - 32, y, 35, f.height - 15, 8);
        ctx.fill();
        
        ctx.fillStyle = '#FFE4E1';
        ctx.beginPath();
        ctx.ellipse(x + 45, y + 18, 22, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + f.width - 45, y + 18, 22, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.arc(x + 45, y + 18, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + f.width - 45, y + 18, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawTable(x, y, f) {
        const ctx = this.ctx;
        
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.roundRect(x - 3, y - 3, f.width + 6, 18, 5);
        ctx.fill();
        
        ctx.fillStyle = '#FFFACD';
        ctx.beginPath();
        ctx.roundRect(x + 5, y + 2, f.width - 10, 8, 3);
        ctx.fill();
        
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(x + 12, y + f.height - 5, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + f.width - 12, y + f.height - 5, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(x + 8, y + 15, 10, f.height - 20);
        ctx.fillRect(x + f.width - 18, y + 15, 10, f.height - 20);
    }
    
    drawBox(x, y, f) {
        const ctx = this.ctx;
        
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.roundRect(x, y, f.width, f.height, 5);
        ctx.fill();
        
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 4, f.width - 8, f.height - 8, 3);
        ctx.stroke();
        
        ctx.strokeStyle = '#A0522D';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + f.width / 2, y + 4);
        ctx.lineTo(x + f.width / 2, y + f.height - 4);
        ctx.stroke();
        
        ctx.fillStyle = '#87CEEB';
        ctx.beginPath();
        ctx.ellipse(x + f.width / 2, y + f.height / 2, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4169E1';
        ctx.beginPath();
        ctx.arc(x + f.width / 2 - 3, y + f.height / 2 - 2, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawCup(x, y, f) {
        const ctx = this.ctx;
        
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.moveTo(x + 3, y + 8);
        ctx.quadraticCurveTo(x + 8, y + f.height + 2, x + f.width / 2, y + f.height + 2);
        ctx.quadraticCurveTo(x + f.width - 8, y + f.height + 2, x + f.width - 3, y + 8);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#FFFACD';
        ctx.beginPath();
        ctx.ellipse(x + f.width / 2, y + 8, f.width / 2 - 4, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#87CEEB';
        ctx.beginPath();
        ctx.ellipse(x + f.width / 2, y + 10, f.width / 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = f.color;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(x + f.width + 1, y + f.height / 2, 12, -Math.PI / 2.5, Math.PI / 2.5);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.ellipse(x + 10, y + f.height / 2, 4, 8, -0.3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawVase(x, y, f) {
        const ctx = this.ctx;
        
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.moveTo(x + 8, y + f.height);
        ctx.quadraticCurveTo(x - 2, y + f.height / 2, x + 12, y + 18);
        ctx.quadraticCurveTo(x + 15, y, x + f.width / 2, y - 3);
        ctx.quadraticCurveTo(x + f.width - 15, y, x + f.width - 12, y + 18);
        ctx.quadraticCurveTo(x + f.width + 2, y + f.height / 2, x + f.width - 8, y + f.height);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#FFB6C1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 15, y + f.height / 2);
        ctx.quadraticCurveTo(x + f.width / 2, y + f.height / 2 - 10, x + f.width - 15, y + f.height / 2);
        ctx.stroke();
        
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.ellipse(x + f.width / 2, y + 3, 18, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const flowerColors = ['#FF69B4', '#FFB6C1', '#FF1493', '#DB7093'];
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = flowerColors[i];
            ctx.beginPath();
            ctx.arc(x + f.width / 2 - 12 + i * 8, y - 5 + (i % 2) * 6, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x + f.width / 2, y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawLamp(x, y, f) {
        const ctx = this.ctx;
        
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(x + f.width / 2, y + f.height - 6, 18, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#DAA520';
        ctx.beginPath();
        ctx.roundRect(x + f.width / 2 - 5, y + 18, 10, f.height - 30, 3);
        ctx.fill();
        
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.moveTo(x - 5, y + 28);
        ctx.quadraticCurveTo(x + f.width / 2, y - 10, x + f.width + 5, y + 28);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#FFFACD';
        ctx.beginPath();
        ctx.moveTo(x + 5, y + 25);
        ctx.quadraticCurveTo(x + f.width / 2, y, x + f.width - 5, y + 25);
        ctx.closePath();
        ctx.fill();
        
        const glowSize = 35 + Math.sin(Date.now() / 200) * 5;
        ctx.fillStyle = 'rgba(255, 255, 200, 0.25)';
        ctx.beginPath();
        ctx.arc(x + f.width / 2, y + 15, glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x + f.width / 2, y + 8, 6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawOwner(owner) {
        if (!owner.isPresent) return;
        
        const ctx = this.ctx;
        const x = owner.x;
        const y = owner.y;
        
        ctx.save();
        
        if (!owner.facingRight) {
            ctx.translate(x + owner.width, y);
            ctx.scale(-1, 1);
            ctx.translate(-x, -y);
        }
        
        if (owner.warningTime > 0) {
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.3;
        }
        
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(x + 30, y + 118, 28, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFE4E1';
        ctx.beginPath();
        ctx.ellipse(x + 30, y + 75, 25, 28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFC0CB';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.ellipse(x + 30, y + 72, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = '14px Arial';
        ctx.fillText('♥', x + 24, y + 70);
        
        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.arc(x + 30, y + 28, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFDAB9';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.moveTo(x + 3, y + 28);
        ctx.quadraticCurveTo(x + 8, y - 15, x + 30, y - 12);
        ctx.quadraticCurveTo(x + 52, y - 15, x + 57, y + 28);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#A0522D';
        ctx.beginPath();
        ctx.ellipse(x + 10, y + 25, 9, 12, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 50, y + 25, 9, 12, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#A0522D';
        ctx.beginPath();
        ctx.moveTo(x + 30, y - 10);
        ctx.quadraticCurveTo(x + 35, y + 3, x + 40, y - 5);
        ctx.quadraticCurveTo(x + 35, y - 2, x + 30, y - 10);
        ctx.fill();
        
        ctx.fillStyle = '#4A3728';
        ctx.beginPath();
        ctx.ellipse(x + 20, y + 28, 6, 8, -0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 40, y + 28, 6, 8, 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#87CEEB';
        ctx.beginPath();
        ctx.ellipse(x + 21, y + 29, 4, 5, -0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 41, y + 29, 4, 5, 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x + 23, y + 26, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 43, y + 26, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#6B4423';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(x + 20, y + 22, 5, 0.8 * Math.PI, 0.2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + 40, y + 22, 5, 0.8 * Math.PI, 0.2 * Math.PI);
        ctx.stroke();
        
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.ellipse(x + 30, y + 39, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#FF6B6B';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(x + 30, y + 44, 12, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 182, 193, 0.5)';
        ctx.beginPath();
        ctx.ellipse(x + 10, y + 36, 9, 6, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 50, y + 36, 9, 6, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFC0CB';
        ctx.beginPath();
        ctx.ellipse(x + 22, y + 8, 5, 4, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 38, y + 8, 5, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x + 23, y + 7, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 39, y + 7, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#87CEEB';
        const legAnim = Math.sin(owner.animFrame) * 4;
        ctx.beginPath();
        ctx.ellipse(x + 20, y + 102 + legAnim, 11, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 40, y + 102 - legAnim, 11, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF6B9D';
        ctx.beginPath();
        ctx.ellipse(x + 20, y + 118 + legAnim, 14, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 40, y + 118 - legAnim, 14, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#FF4081';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x + 20, y + 118 + legAnim, 14, 8, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(x + 40, y + 118 - legAnim, 14, 8, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#FFE4C4';
        const armAnim = Math.sin(owner.animFrame * 0.7) * 3;
        ctx.beginPath();
        ctx.ellipse(x + 3, y + 72 + armAnim, 9, 17, -0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 57, y + 72 - armAnim, 9, 17, 0.35, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFDAB9';
        ctx.beginPath();
        ctx.arc(x - 2, y + 85 + armAnim, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 62, y + 85 - armAnim, 7, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
        if (owner.warningTime > 0) {
            ctx.fillStyle = '#FF4444';
            ctx.font = 'bold 32px Arial';
            ctx.fillText('❗', x + 16, y - 22);
            
            ctx.fillStyle = '#FF6B6B';
            ctx.font = 'bold 18px Arial';
            ctx.fillText('喵喵呢？', x + 5, y - 35);
            
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(x + 30, y + 5, 40 + Math.sin(Date.now() / 70) * 6, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    drawParticles(particles) {
        const ctx = this.ctx;
        particles.forEach(p => {
            ctx.globalAlpha = p.life / 60;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }
    
    render(game) {
        this.clear();
        this.drawBackground();
        
        game.furnitureManager.furnitures.forEach(f => this.drawFurniture(f));
        this.drawParticles(game.furnitureManager.particles);
        this.drawCat(game.cat);
        this.drawOwner(game.owner);
    }
}