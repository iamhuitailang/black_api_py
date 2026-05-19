class Background {
    constructor(canvas, themeKey = 'sky') {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.theme = CONFIG.THEMES[themeKey];
        this.themeKey = themeKey;
        this.clouds = [];
        this.stars = [];
        this.groundOffset = 0;
        this.initDecorations();
    }
    
    setTheme(themeKey) {
        this.themeKey = themeKey;
        this.theme = CONFIG.THEMES[themeKey];
        this.initDecorations();
    }
    
    initDecorations() {
        this.clouds = [];
        this.stars = [];
        
        if (this.themeKey === 'night') {
            for (let i = 0; i < 50; i++) {
                this.stars.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * (this.canvas.height - CONFIG.GAME.GROUND_HEIGHT - 100),
                    size: Math.random() * 2 + 1,
                    twinkle: Math.random() * Math.PI * 2
                });
            }
        } else {
            for (let i = 0; i < 5; i++) {
                this.clouds.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * 200 + 50,
                    width: Math.random() * 80 + 60,
                    speed: Math.random() * 0.5 + 0.2
                });
            }
        }
    }
    
    update() {
        this.groundOffset -= CONFIG.GAME.PIPE_SPEED;
        if (this.groundOffset <= -40) {
            this.groundOffset = 0;
        }
        
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.width < 0) {
                cloud.x = this.canvas.width + cloud.width;
                cloud.y = Math.random() * 200 + 50;
            }
        });
        
        this.stars.forEach(star => {
            star.twinkle += 0.05;
        });
    }
    
    draw() {
        this.drawSky();
        this.drawDecorations();
        this.drawGround();
    }
    
    drawSky() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height - CONFIG.GAME.GROUND_HEIGHT);
        gradient.addColorStop(0, this.theme.skyTop);
        gradient.addColorStop(1, this.theme.skyBottom);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height - CONFIG.GAME.GROUND_HEIGHT);
    }
    
    drawDecorations() {
        if (this.themeKey === 'night') {
            this.drawStars();
            this.drawMoon();
        } else {
            this.drawClouds();
            if (this.themeKey === 'sunset') {
                this.drawSun();
            }
        }
    }
    
    drawClouds() {
        this.ctx.fillStyle = this.theme.cloudColor;
        this.clouds.forEach(cloud => {
            this.drawCloud(cloud.x, cloud.y, cloud.width);
        });
    }
    
    drawCloud(x, y, width) {
        const height = width * 0.4;
        this.ctx.beginPath();
        this.ctx.arc(x, y, height * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + width * 0.25, y - height * 0.2, height * 0.4, 0, Math.PI * 2);
        this.ctx.arc(x + width * 0.5, y, height * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + width * 0.75, y - height * 0.1, height * 0.4, 0, Math.PI * 2);
        this.ctx.arc(x + width, y, height * 0.45, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawStars() {
        this.stars.forEach(star => {
            const alpha = 0.5 + Math.sin(star.twinkle) * 0.5;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawMoon() {
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width - 80, 100, 0,
            this.canvas.width - 80, 100, 40
        );
        gradient.addColorStop(0, '#FFFFE0');
        gradient.addColorStop(0.7, '#FFFACD');
        gradient.addColorStop(1, 'rgba(255, 250, 205, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width - 80, 100, 40, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawSun() {
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width - 100, 120, 0,
            this.canvas.width - 100, 120, 60
        );
        gradient.addColorStop(0, '#FFFF00');
        gradient.addColorStop(0.5, '#FFA500');
        gradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width - 100, 120, 60, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawGround() {
        const groundY = this.canvas.height - CONFIG.GAME.GROUND_HEIGHT;
        
        const gradient = this.ctx.createLinearGradient(0, groundY, 0, this.canvas.height);
        gradient.addColorStop(0, this.theme.groundTop);
        gradient.addColorStop(1, this.theme.groundBottom);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, groundY, this.canvas.width, CONFIG.GAME.GROUND_HEIGHT);
        
        this.ctx.strokeStyle = this.theme.groundBottom;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(0, groundY);
        this.ctx.lineTo(this.canvas.width, groundY);
        this.ctx.stroke();
        
        this.ctx.fillStyle = this.theme.groundTop;
        for (let x = this.groundOffset; x < this.canvas.width; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, groundY);
            this.ctx.lineTo(x + 10, groundY - 8);
            this.ctx.lineTo(x + 20, groundY);
            this.ctx.fill();
        }
    }
}
