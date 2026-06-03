class AudioVisualizer {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.barCount = options.barCount || 64;
        this.barSpacing = options.barSpacing || 2;
        this.minBarHeight = options.minBarHeight || 4;
        this.maxBarHeight = options.maxBarHeight || 100;
        this.bars = new Array(this.barCount).fill(0);
        this.targetBars = new Array(this.barCount).fill(0);
        this.smoothing = options.smoothing || 0.8;
        this.colors = options.colors || ['#6366f1', '#8b5cf6', '#ec4899'];
    }

    update(audioData) {
        if (audioData && audioData.length > 0) {
            const step = Math.floor(audioData.length / this.barCount);
            
            for (let i = 0; i < this.barCount; i++) {
                let sum = 0;
                for (let j = 0; j < step; j++) {
                    sum += Math.abs(audioData[i * step + j] || 0);
                }
                const avg = sum / step;
                this.targetBars[i] = this.minBarHeight + avg * this.maxBarHeight;
            }
        } else {
            const time = Date.now() * 0.003;
            for (let i = 0; i < this.barCount; i++) {
                const phase = (i / this.barCount) * Math.PI * 4 + time;
                const height = this.minBarHeight + Math.sin(phase) * 30 + Math.sin(phase * 0.5) * 20;
                this.targetBars[i] = Math.max(this.minBarHeight, height);
            }
        }

        for (let i = 0; i < this.barCount; i++) {
            this.bars[i] = this.bars[i] * this.smoothing + this.targetBars[i] * (1 - this.smoothing);
        }
    }

    draw(y = 0) {
        const c = this.ctx;
        const barWidth = (this.canvas.width - (this.barCount - 1) * this.barSpacing) / this.barCount;
        
        for (let i = 0; i < this.barCount; i++) {
            const x = i * (barWidth + this.barSpacing);
            const height = Math.max(this.minBarHeight, this.bars[i]);
            const barY = this.canvas.height - y - height;

            const gradient = c.createLinearGradient(x, barY, x, this.canvas.height - y);
            const colorIndex = Math.floor((i / this.barCount) * (this.colors.length - 1));
            const color1 = this.colors[colorIndex];
            const color2 = this.colors[Math.min(colorIndex + 1, this.colors.length - 1)];
            
            gradient.addColorStop(0, color1);
            gradient.addColorStop(1, color2);

            c.fillStyle = gradient;
            c.globalAlpha = 0.6;
            
            c.beginPath();
            c.roundRect(x, barY, barWidth, height, 2);
            c.fill();
            
            c.globalAlpha = 1;
        }
    }

    getBarData() {
        return this.bars;
    }

    reset() {
        this.bars.fill(this.minBarHeight);
        this.targetBars.fill(this.minBarHeight);
    }
}

class Background {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.groundY = canvas.height - 120;
        this.scrollSpeed = 0;
        this.baseScrollSpeed = 4;
        this.time = 0;
        this.stars = [];
        this.buildings = [];
        this.groundOffset = 0;
        this.themeIndex = 0;
        this.themes = [
            { sky: ['#1a1a3e', '#2d1b69', '#0f0f23'], ground: '#1e1e3f', accent: '#6366f1' },
            { sky: ['#1a3e1a', '#1b693d', '#0f2315'], ground: '#1e3f2e', accent: '#10b981' },
            { sky: ['#3e1a1a', '#693d1b', '#230f0f'], ground: '#3f2e1e', accent: '#ef4444' },
            { sky: ['#3e1a3e', '#691b69', '#230f23'], ground: '#3f1e3f', accent: '#ec4899' }
        ];
        this.init();
    }

    init() {
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * (this.groundY - 50),
                size: Math.random() * 2 + 1,
                speed: Math.random() * 0.5 + 0.2,
                twinkle: Math.random() * Math.PI * 2
            });
        }

        for (let i = 0; i < 15; i++) {
            this.buildings.push({
                x: i * 150 + Math.random() * 50,
                width: Math.random() * 60 + 40,
                height: Math.random() * 150 + 80,
                windows: Math.floor(Math.random() * 4) + 2,
                color: this.themes[0].accent
            });
        }
    }

    update(deltaTime, speedMultiplier = 1) {
        this.time += deltaTime;
        this.scrollSpeed = this.baseScrollSpeed * speedMultiplier;
        this.groundOffset -= this.scrollSpeed;

        if (this.groundOffset <= -100) {
            this.groundOffset = 0;
        }

        this.stars.forEach(star => {
            star.x -= star.speed;
            star.twinkle += 0.05;
            if (star.x < 0) {
                star.x = this.canvas.width;
                star.y = Math.random() * (this.groundY - 50);
            }
        });

        this.buildings.forEach(building => {
            building.x -= this.scrollSpeed * 0.3;
            if (building.x + building.width < 0) {
                building.x = this.canvas.width + Math.random() * 100;
                building.width = Math.random() * 60 + 40;
                building.height = Math.random() * 150 + 80;
                building.windows = Math.floor(Math.random() * 4) + 2;
            }
        });
    }

    draw() {
        const c = this.ctx;
        const theme = this.themes[this.themeIndex];

        const skyGradient = c.createLinearGradient(0, 0, 0, this.groundY);
        skyGradient.addColorStop(0, theme.sky[0]);
        skyGradient.addColorStop(0.5, theme.sky[1]);
        skyGradient.addColorStop(1, theme.sky[2]);
        c.fillStyle = skyGradient;
        c.fillRect(0, 0, this.canvas.width, this.groundY);

        this.stars.forEach(star => {
            const alpha = 0.5 + Math.sin(star.twinkle) * 0.5;
            c.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            c.beginPath();
            c.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            c.fill();
        });

        this.buildings.forEach(building => {
            const buildingY = this.groundY - building.height;
            
            c.fillStyle = theme.ground;
            c.fillRect(building.x, buildingY, building.width, building.height);

            c.strokeStyle = theme.accent;
            c.lineWidth = 2;
            c.strokeRect(building.x, buildingY, building.width, building.height);

            const windowWidth = (building.width - 10) / building.windows;
            const windowHeight = (building.height - 20) / Math.ceil(building.windows * 0.8);
            
            for (let row = 0; row < Math.ceil(building.windows * 0.8); row++) {
                for (let col = 0; col < building.windows; col++) {
                    const wx = building.x + 5 + col * windowWidth;
                    const wy = buildingY + 10 + row * windowHeight;
                    
                    if (Math.random() > 0.3) {
                        c.fillStyle = Math.random() > 0.5 ? theme.accent : '#fbbf24';
                        c.globalAlpha = 0.7 + Math.random() * 0.3;
                        c.fillRect(wx + 2, wy + 2, windowWidth - 6, windowHeight - 6);
                        c.globalAlpha = 1;
                    }
                }
            }
        });

        const groundGradient = c.createLinearGradient(0, this.groundY, 0, this.canvas.height);
        groundGradient.addColorStop(0, theme.ground);
        groundGradient.addColorStop(1, '#0a0a15');
        c.fillStyle = groundGradient;
        c.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);

        c.strokeStyle = theme.accent;
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(0, this.groundY);
        c.lineTo(this.canvas.width, this.groundY);
        c.stroke();

        c.strokeStyle = 'rgba(99, 102, 241, 0.3)';
        c.lineWidth = 2;
        for (let i = 0; i < this.canvas.width / 50 + 2; i++) {
            const x = i * 50 + this.groundOffset;
            c.beginPath();
            c.moveTo(x, this.groundY + 20);
            c.lineTo(x + 25, this.groundY + 40);
            c.stroke();
        }
    }

    changeTheme() {
        this.themeIndex = (this.themeIndex + 1) % this.themes.length;
        this.buildings.forEach(b => {
            b.color = this.themes[this.themeIndex].accent;
        });
    }

    getGroundY() {
        return this.groundY;
    }
}
