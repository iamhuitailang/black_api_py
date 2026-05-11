const renderer = {
    ctx: null,
    canvas: null,
    
    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
    },
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBackground();
    },
    
    drawBackground() {
        const ctx = this.ctx;
        const gradient = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#0d1b2a');
        gradient.addColorStop(0.5, '#1b263b');
        gradient.addColorStop(1, '#0d1b2a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.05)';
        ctx.lineWidth = 1;
        const gridSize = 40;
        
        for (let x = 0; x <= this.canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }
        
        for (let y = 0; y <= this.canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }
    },
    
    drawChannel(channel) {
        if (!channel) return;
        
        const ctx = this.ctx;
        
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(channel.x, channel.y, channel.width, channel.height);
        
        ctx.strokeStyle = '#636e72';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 10]);
        ctx.beginPath();
        ctx.moveTo(channel.x, channel.y + channel.height / 2);
        ctx.lineTo(channel.x + channel.width, channel.y + channel.height / 2);
        ctx.stroke();
        ctx.setLineDash([]);
    },
    
    drawGarage(garage) {
        const ctx = this.ctx;
        const hWidth = GAME_CONFIG.garage.width / 2;
        const hHeight = GAME_CONFIG.garage.height / 2;
        const border = GAME_CONFIG.garage.borderWidth;
        
        ctx.save();
        ctx.translate(garage.x, garage.y);
        ctx.rotate(garage.angle || 0);
        
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 25;
        
        const bgGradient = ctx.createLinearGradient(-hWidth, -hHeight, hWidth, hHeight);
        bgGradient.addColorStop(0, '#0d1a0d');
        bgGradient.addColorStop(1, '#0a1a0a');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(-hWidth - 5, -hHeight - 5, hWidth * 2 + 10, hHeight * 2 + 10);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#000';
        ctx.fillRect(-hWidth + border, -hHeight + border, hWidth * 2 - border * 2, hHeight * 2 - border * 2);
        
        const borderGradient = ctx.createLinearGradient(-hWidth, -hHeight, hWidth, hHeight);
        borderGradient.addColorStop(0, '#00ff88');
        borderGradient.addColorStop(0.25, '#00ff88');
        borderGradient.addColorStop(0.5, '#ffff00');
        borderGradient.addColorStop(0.75, '#00ff88');
        borderGradient.addColorStop(1, '#00ff88');
        
        ctx.strokeStyle = borderGradient;
        ctx.lineWidth = border + 3;
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 20;
        ctx.strokeRect(-hWidth, -hHeight, hWidth * 2, hHeight * 2);
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.strokeRect(-hWidth - 3, -hHeight - 3, hWidth * 2 + 6, hHeight * 2 + 6);
        ctx.setLineDash([]);
        
        ctx.fillStyle = 'rgba(0, 255, 136, 0.4)';
        for (let i = -hWidth + 8; i < hWidth - 8; i += 12) {
            ctx.fillRect(i, hHeight - 6, 6, 4);
        }
        
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 10;
        ctx.fillText('P', 0, -5);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 8;
        ctx.fillText('停车位', 0, 18);
        ctx.shadowBlur = 0;
        
        ctx.restore();
    },
    
    drawObstacle(obstacle) {
        const ctx = this.ctx;
        
        ctx.save();
        
        const gradient = ctx.createLinearGradient(
            obstacle.x, obstacle.y,
            obstacle.x + obstacle.width, obstacle.y + obstacle.height
        );
        gradient.addColorStop(0, '#6c5ce7');
        gradient.addColorStop(1, '#a29bfe');
        
        ctx.fillStyle = gradient;
        ctx.shadowColor = '#6c5ce7';
        ctx.shadowBlur = 8;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        ctx.strokeStyle = '#dfe6e9';
        ctx.lineWidth = 2;
        ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height / 3);
        
        ctx.restore();
    },
    
    drawCar(car) {
        const ctx = this.ctx;
        const carConfig = GAME_CONFIG.car;
        
        ctx.save();
        ctx.translate(car.x, car.y);
        ctx.rotate(car.angle);
        
        const halfWidth = carConfig.width / 2;
        const halfHeight = carConfig.height / 2;
        
        const bodyGradient = ctx.createLinearGradient(-halfWidth, -halfHeight, halfWidth, halfHeight);
        bodyGradient.addColorStop(0, '#e17055');
        bodyGradient.addColorStop(0.5, '#ff6b6b');
        bodyGradient.addColorStop(1, '#d63031');
        
        ctx.fillStyle = bodyGradient;
        ctx.shadowColor = '#ff6b6b';
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.moveTo(halfWidth - 5, -halfHeight + 2);
        ctx.lineTo(halfWidth, 0);
        ctx.lineTo(halfWidth - 5, halfHeight - 2);
        ctx.lineTo(-halfWidth + 5, halfHeight);
        ctx.lineTo(-halfWidth, halfHeight - 5);
        ctx.lineTo(-halfWidth, -halfHeight + 5);
        ctx.lineTo(-halfWidth + 5, -halfHeight);
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = '#dfe6e9';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        const windowGradient = ctx.createLinearGradient(0, -halfHeight, 0, halfHeight);
        windowGradient.addColorStop(0, '#74b9ff');
        windowGradient.addColorStop(1, '#0984e3');
        
        ctx.fillStyle = windowGradient;
        ctx.beginPath();
        ctx.roundRect(-halfWidth + 15, -halfHeight + 6, 25, halfHeight * 2 - 12, 3);
        ctx.fill();
        
        ctx.fillStyle = windowGradient;
        ctx.beginPath();
        ctx.roundRect(halfWidth - 30, -halfHeight + 8, 20, halfHeight * 2 - 16, 3);
        ctx.fill();
        
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(-halfWidth + 8, -halfHeight - 3, 12, 5);
        ctx.fillRect(halfWidth - 20, -halfHeight - 3, 12, 5);
        ctx.fillRect(-halfWidth + 8, halfHeight - 2, 12, 5);
        ctx.fillRect(halfWidth - 20, halfHeight - 2, 12, 5);
        
        ctx.fillStyle = '#fdcb6e';
        ctx.shadowColor = '#fdcb6e';
        ctx.shadowBlur = 8;
        ctx.fillRect(halfWidth - 3, -halfHeight + 5, 3, 6);
        ctx.fillRect(halfWidth - 3, halfHeight - 11, 3, 6);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#e74c3c';
        ctx.shadowColor = '#e74c3c';
        ctx.shadowBlur = 8;
        ctx.fillRect(-halfWidth, -halfHeight + 5, 3, 6);
        ctx.fillRect(-halfWidth, halfHeight - 11, 3, 6);
        ctx.shadowBlur = 0;
        
        ctx.restore();
    },
    
    drawLevel(level) {
        this.drawChannel(level.channel);
        this.drawGarage(level.garage);
        
        if (level.obstacles) {
            for (const obstacle of level.obstacles) {
                this.drawObstacle(obstacle);
            }
        }
    },
    
    drawBoundary() {
        const ctx = this.ctx;
        
        ctx.strokeStyle = '#ff4757';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ff4757';
        ctx.shadowBlur = 10;
        ctx.strokeRect(1, 1, this.canvas.width - 2, this.canvas.height - 2);
        ctx.shadowBlur = 0;
    },
    
    render(car, level) {
        this.clear();
        this.drawLevel(level);
        this.drawBoundary();
        this.drawCar(car);
    }
};
