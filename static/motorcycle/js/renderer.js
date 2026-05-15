class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cameraX = 0;
        this.cameraY = 0;
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    clear() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#E0F6FF');
        gradient.addColorStop(1, '#FFFFFF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    updateCamera(motorcycle) {
        const pos = motorcycle.getPosition();
        const targetX = pos.x - this.canvas.width * 0.3;
        const targetY = pos.y - this.canvas.height * 0.5;
        
        this.cameraX += (targetX - this.cameraX) * 0.1;
        this.cameraY += (targetY - this.cameraY) * 0.05;
        
        this.cameraY = Math.min(this.cameraY, 0);
    }

    drawBackground() {
        this.ctx.save();
        this.ctx.translate(-this.cameraX * 0.3, 0);
        
        this.ctx.fillStyle = '#98D8AA';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height * 0.6);
        for (let x = 0; x < this.canvas.width + 500; x += 100) {
            const y = this.canvas.height * 0.6 + Math.sin(x * 0.01 + this.cameraX * 0.001) * 50;
            this.ctx.lineTo(x, y);
        }
        this.ctx.lineTo(this.canvas.width + 500, this.canvas.height);
        this.ctx.lineTo(0, this.canvas.height);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }

    drawTerrain(terrain) {
        this.ctx.save();
        this.ctx.translate(-this.cameraX, -this.cameraY);

        for (const segment of terrain.segments) {
            if (segment.end.x < this.cameraX - 100 || segment.start.x > this.cameraX + this.canvas.width + 100) {
                continue;
            }

            this.ctx.beginPath();
            this.ctx.moveTo(segment.start.x, segment.start.y);
            this.ctx.lineTo(segment.end.x, segment.end.y);
            
            this.ctx.lineTo(segment.end.x, this.canvas.height + this.cameraY + 100);
            this.ctx.lineTo(segment.start.x, this.canvas.height + this.cameraY + 100);
            this.ctx.closePath();
            
            this.ctx.fillStyle = segment.color;
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(segment.start.x, segment.start.y);
            this.ctx.lineTo(segment.end.x, segment.end.y);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    drawMotorcycle(motorcycle) {
        this.ctx.save();
        this.ctx.translate(-this.cameraX, -this.cameraY);

        const rotation = motorcycle.getRotation();
        const chassisPos = motorcycle.getPosition();
        
        this.drawWheel(motorcycle.frontWheel);
        this.drawWheel(motorcycle.rearWheel);
        
        this.ctx.save();
        this.ctx.translate(chassisPos.x, chassisPos.y);
        this.ctx.rotate(rotation);
        
        this.drawChassis();
        this.drawRider();
        
        this.ctx.restore();

        this.ctx.restore();
    }

    drawWheel(wheel) {
        const pos = wheel.getPosition();
        const radius = wheel.radius;
        
        this.ctx.fillStyle = CONFIG.COLORS.wheel;
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = CONFIG.COLORS.rim;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, radius * 0.7, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, radius * 0.3, 0, Math.PI * 2);
        this.ctx.fillStyle = CONFIG.COLORS.rim;
        this.ctx.fill();
    }

    drawChassis() {
        this.ctx.fillStyle = CONFIG.COLORS.motorcycle;
        this.drawRoundRect(-35, -15, 70, 30, 5);
        this.ctx.fill();
        
        this.ctx.fillStyle = CONFIG.COLORS.motorcycleDark;
        this.drawRoundRect(-30, -25, 25, 15, 3);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(-20, -30, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = CONFIG.COLORS.metal;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(-25, -5);
        this.ctx.lineTo(-45, -30);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(20, -5);
        this.ctx.lineTo(45, -20);
        this.ctx.stroke();
    }

    drawRider() {
        this.ctx.fillStyle = CONFIG.COLORS.rider;
        
        this.ctx.beginPath();
        this.ctx.ellipse(5, -35, 12, 15, 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = CONFIG.COLORS.riderHelmet;
        this.ctx.beginPath();
        this.ctx.arc(10, -55, 10, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(10, -55, 8, -0.5, 0.5);
        this.ctx.stroke();
        
        this.ctx.fillStyle = CONFIG.COLORS.rider;
        this.ctx.beginPath();
        this.ctx.ellipse(-15, -35, 8, 20, -0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.lineWidth = 6;
        this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = CONFIG.COLORS.rider;
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, -40);
        this.ctx.lineTo(35, -30);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(10, -45);
        this.ctx.lineTo(40, -35);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(-20, -25);
        this.ctx.lineTo(-40, -20);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(-10, -20);
        this.ctx.lineTo(-35, -15);
        this.ctx.stroke();
    }

    drawRoundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    drawTrickIndicator(trickManager) {
        const lastTrick = trickManager.getLastTrick();
        if (lastTrick && Date.now() - lastTrick.time < 2000) {
            const alpha = 1 - (Date.now() - lastTrick.time) / 2000;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.textAlign = 'center';
            
            this.ctx.font = 'bold 32px Arial';
            this.ctx.fillStyle = '#FFD700';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(lastTrick.name, this.canvas.width / 2, this.canvas.height / 2 - 20);
            this.ctx.fillText(lastTrick.name, this.canvas.width / 2, this.canvas.height / 2 - 20);
            
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillStyle = '#55efc4';
            const scoreText = `+${lastTrick.score}`;
            this.ctx.strokeText(scoreText, this.canvas.width / 2, this.canvas.height / 2 + 20);
            this.ctx.fillText(scoreText, this.canvas.width / 2, this.canvas.height / 2 + 20);
            
            if (lastTrick.combo > 1) {
                this.ctx.font = 'bold 20px Arial';
                this.ctx.fillStyle = '#ff6b6b';
                const comboText = `${lastTrick.combo}x COMBO!`;
                this.ctx.strokeText(comboText, this.canvas.width / 2, this.canvas.height / 2 + 50);
                this.ctx.fillText(comboText, this.canvas.width / 2, this.canvas.height / 2 + 50);
            }
            
            this.ctx.restore();
        }
    }

    render(motorcycle, terrain, trickManager) {
        this.clear();
        this.drawBackground();
        this.updateCamera(motorcycle);
        this.drawTerrain(terrain);
        this.drawMotorcycle(motorcycle);
        this.drawTrickIndicator(trickManager);
    }
}