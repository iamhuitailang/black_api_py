class Background {
    constructor(theme, canvasWidth, canvasHeight) {
        this.theme = theme;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.clouds = [];
        this.stars = [];
        this.balloons = [];
        this.initClouds();
        this.initBalloons();
    }
    
    initClouds() {
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * this.canvasWidth,
                y: Utils.random(30, 150),
                width: Utils.random(60, 120),
                height: Utils.random(30, 50),
                speed: Utils.random(0.2, 0.5)
            });
        }
    }
    
    initBalloons() {
        const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'];
        for (let i = 0; i < 8; i++) {
            this.balloons.push({
                x: Math.random() * this.canvasWidth,
                y: Utils.random(100, 400),
                size: Utils.random(15, 25),
                color: colors[Math.floor(Math.random() * colors.length)],
                speed: Utils.random(0.3, 0.8),
                wobble: Math.random() * Math.PI * 2
            });
        }
    }
    
    update() {
        this.clouds.forEach(cloud => {
            cloud.x += cloud.speed;
            if (cloud.x > this.canvasWidth + cloud.width) {
                cloud.x = -cloud.width;
            }
        });
        
        this.balloons.forEach(balloon => {
            balloon.y -= balloon.speed;
            balloon.wobble += 0.02;
            balloon.x += Math.sin(balloon.wobble) * 0.5;
            if (balloon.y < -50) {
                balloon.y = this.canvasHeight + 50;
                balloon.x = Math.random() * this.canvasWidth;
            }
        });
    }
    
    setTheme(theme) {
        this.theme = theme;
    }
    
    draw(ctx) {
        const colors = GameConfig.sceneThemes[this.theme];
        
        const gradient = Utils.createGradient(ctx, 0, 0, 0, this.canvasHeight, 
            colors.skyTop, colors.skyBottom);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        ctx.fillStyle = colors.sunColor;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(this.canvasWidth - 80, 60, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(this.canvasWidth - 80, 60, 55, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        this.clouds.forEach(cloud => {
            ctx.fillStyle = colors.cloudColor;
            ctx.globalAlpha = 0.8;
            this.drawCloud(ctx, cloud.x, cloud.y, cloud.width, cloud.height);
            ctx.globalAlpha = 1;
        });
        
        this.balloons.forEach(balloon => {
            this.drawBalloon(ctx, balloon.x, balloon.y, balloon.size, balloon.color);
        });
        
        ctx.fillStyle = 'rgba(139, 195, 74, 0.8)';
        ctx.beginPath();
        ctx.moveTo(0, this.canvasHeight);
        for (let x = 0; x <= this.canvasWidth; x += 50) {
            const y = this.canvasHeight - 30 - Math.sin(x * 0.02) * 20;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(this.canvasWidth, this.canvasHeight);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = 'rgba(139, 195, 74, 0.6)';
        for (let i = 0; i < 5; i++) {
            const x = i * (this.canvasWidth / 5) + Math.random() * 50;
            const y = this.canvasHeight - 20;
            this.drawGrass(ctx, x, y, 30);
        }
    }
    
    drawCloud(ctx, x, y, width, height) {
        ctx.beginPath();
        ctx.arc(x, y, height * 0.6, 0, Math.PI * 2);
        ctx.arc(x + width * 0.3, y - height * 0.2, height * 0.5, 0, Math.PI * 2);
        ctx.arc(x + width * 0.6, y, height * 0.55, 0, Math.PI * 2);
        ctx.arc(x + width * 0.3, y + height * 0.2, height * 0.45, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawBalloon(ctx, x, y, size, color) {
        ctx.save();
        
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y + size);
        ctx.lineTo(x, y + size * 1.8);
        ctx.stroke();
        
        const gradient = ctx.createRadialGradient(
            x - size * 0.3, y - size * 0.3, size * 0.1,
            x, y, size
        );
        gradient.addColorStop(0, this.lightenColor(color, 50));
        gradient.addColorStop(0.7, color);
        gradient.addColorStop(1, this.darkenColor(color, 20));
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.ellipse(x - size * 0.25, y - size * 0.25, size * 0.12, size * 0.18, -0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = this.darkenColor(color, 30);
        ctx.beginPath();
        ctx.moveTo(x - size * 0.08, y + size);
        ctx.lineTo(x + size * 0.08, y + size);
        ctx.lineTo(x, y + size + 4);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    lightenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + amount);
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + amount);
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + amount);
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    darkenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - amount);
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - amount);
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - amount);
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    drawGrass(ctx, x, y, height) {
        ctx.strokeStyle = 'rgba(76, 175, 80, 0.8)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(x + i * 8, y);
            ctx.quadraticCurveTo(x + i * 8 + 3, y - height / 2, x + i * 8 + 5, y - height);
            ctx.stroke();
        }
    }
}

window.Background = Background;
