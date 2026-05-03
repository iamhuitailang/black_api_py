class ImageManager {
    constructor() {
        this.currentTheme = 'cat';
        this.currentImage = null;
        this.customImage = null;
        this.themes = {
            cat: {
                name: '猫咪',
                emoji: '🐱',
                colors: ['#FFB6C1', '#FF69B4', '#FF1493', '#DB7093', '#FFC0CB']
            },
            dog: {
                name: '狗狗',
                emoji: '🐶',
                colors: ['#DEB887', '#D2691E', '#8B4513', '#A0522D', '#F4A460']
            },
            flower: {
                name: '花朵',
                emoji: '🌸',
                colors: ['#FF69B4', '#FFB6C1', '#FF1493', '#FF6B6B', '#FFA07A']
            },
            landscape: {
                name: '风景',
                emoji: '🏞️',
                colors: ['#87CEEB', '#4682B4', '#98D8C8', '#7DCE82', '#B19CD9']
            },
            abstract: {
                name: '抽象',
                emoji: '🎨',
                colors: ['#98D8C8', '#B19CD9', '#FFB6C1', '#FFD93D', '#7DCE82']
            }
        };
        this.imageCache = new Map();
    }

    init(theme = 'cat') {
        this.currentTheme = theme;
        return this.loadThemeImage(theme);
    }

    getTheme(theme) {
        return this.themes[theme] || this.themes.cat;
    }

    getAllThemes() {
        return Object.entries(this.themes).map(([key, value]) => ({
            key,
            ...value
        }));
    }

    async loadThemeImage(theme) {
        this.currentTheme = theme;
        this.customImage = null;
        
        if (this.imageCache.has(theme)) {
            this.currentImage = this.imageCache.get(theme);
            return this.currentImage;
        }
        
        const image = await this.generateThemeImage(theme);
        this.imageCache.set(theme, image);
        this.currentImage = image;
        
        return this.currentImage;
    }

    generateThemeImage(theme) {
        return new Promise((resolve) => {
            const themeData = this.getTheme(theme);
            const canvas = document.createElement('canvas');
            const size = 400;
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            switch (theme) {
                case 'cat':
                    this.drawCatImage(ctx, size, themeData);
                    break;
                case 'dog':
                    this.drawDogImage(ctx, size, themeData);
                    break;
                case 'flower':
                    this.drawFlowerImage(ctx, size, themeData);
                    break;
                case 'landscape':
                    this.drawLandscapeImage(ctx, size, themeData);
                    break;
                case 'abstract':
                    this.drawAbstractImage(ctx, size, themeData);
                    break;
                default:
                    this.drawCatImage(ctx, size, themeData);
            }
            
            const img = new Image();
            img.onload = () => {
                resolve({
                    element: img,
                    width: size,
                    height: size,
                    loaded: true,
                    theme: theme
                });
            };
            img.src = canvas.toDataURL();
        });
    }

    drawCatImage(ctx, size, themeData) {
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, themeData.colors[0]);
        gradient.addColorStop(0.5, themeData.colors[1]);
        gradient.addColorStop(1, themeData.colors[2]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        ctx.save();
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 5; i++) {
            const x = (size / 6) * (i + 1);
            const y = size / 2;
            this.drawPaw(ctx, x, y, 40 + i * 10, themeData.colors[3]);
        }
        ctx.restore();
        
        this.drawCuteCat(ctx, size / 2, size / 2, size * 0.3);
        
        ctx.save();
        ctx.globalAlpha = 0.15;
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const radius = size * 0.35;
            const x = size / 2 + Math.cos(angle) * radius;
            const y = size / 2 + Math.sin(angle) * radius;
            this.drawSmallCat(ctx, x, y, 25, themeData.colors[4]);
        }
        ctx.restore();
    }

    drawCuteCat(ctx, x, y, size) {
        ctx.save();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(x, y, size, size * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#FFB6C1';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.7, y - size * 0.5);
        ctx.lineTo(x - size * 0.5, y - size * 1.1);
        ctx.lineTo(x - size * 0.2, y - size * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x + size * 0.2, y - size * 0.5);
        ctx.lineTo(x + size * 0.5, y - size * 1.1);
        ctx.lineTo(x + size * 0.7, y - size * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.55, y - size * 0.55);
        ctx.lineTo(x - size * 0.45, y - size * 0.9);
        ctx.lineTo(x - size * 0.35, y - size * 0.55);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(x + size * 0.35, y - size * 0.55);
        ctx.lineTo(x + size * 0.45, y - size * 0.9);
        ctx.lineTo(x + size * 0.55, y - size * 0.55);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#5D4E6D';
        ctx.beginPath();
        ctx.ellipse(x - size * 0.3, y - size * 0.1, size * 0.12, size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(x + size * 0.3, y - size * 0.1, size * 0.12, size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(x - size * 0.26, y - size * 0.15, size * 0.04, size * 0.05, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(x + size * 0.34, y - size * 0.15, size * 0.04, size * 0.05, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.moveTo(x, y + size * 0.05);
        ctx.lineTo(x - size * 0.08, y + size * 0.18);
        ctx.lineTo(x + size * 0.08, y + size * 0.18);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#5D4E6D';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(x - size * 0.08, y + size * 0.25, size * 0.08, 0, Math.PI);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(x + size * 0.08, y + size * 0.25, size * 0.08, 0, Math.PI);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 182, 193, 0.4)';
        ctx.beginPath();
        ctx.ellipse(x - size * 0.55, y + size * 0.1, size * 0.12, size * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(x + size * 0.55, y + size * 0.1, size * 0.12, size * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#5D4E6D';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.7, y + size * 0.05);
        ctx.lineTo(x - size * 0.45, y + size * 0.1);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x - size * 0.7, y + size * 0.2);
        ctx.lineTo(x - size * 0.45, y + size * 0.2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x + size * 0.45, y + size * 0.1);
        ctx.lineTo(x + size * 0.7, y + size * 0.05);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x + size * 0.45, y + size * 0.2);
        ctx.lineTo(x + size * 0.7, y + size * 0.2);
        ctx.stroke();
        
        ctx.restore();
    }

    drawSmallCat(ctx, x, y, size, color) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x, y, size, size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(x - size * 0.6, y - size * 0.4);
        ctx.lineTo(x - size * 0.4, y - size * 0.9);
        ctx.lineTo(x - size * 0.1, y - size * 0.4);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(x + size * 0.1, y - size * 0.4);
        ctx.lineTo(x + size * 0.4, y - size * 0.9);
        ctx.lineTo(x + size * 0.6, y - size * 0.4);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    drawPaw(ctx, x, y, size, color) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x, y + size * 0.3, size * 0.8, size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 5) * (i + 0.5) - Math.PI / 2;
            const toeX = x + Math.cos(angle) * size * 0.5;
            const toeY = y - size * 0.3 + Math.sin(angle) * size * 0.2;
            ctx.beginPath();
            ctx.ellipse(toeX, toeY, size * 0.2, size * 0.25, angle, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawDogImage(ctx, size, themeData) {
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#FFF8E7');
        gradient.addColorStop(0.5, '#FFE4B5');
        gradient.addColorStop(1, '#DEB887');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        ctx.save();
        ctx.globalAlpha = 0.2;
        for (let i = 0; i < 6; i++) {
            const x = 50 + (size - 100) * Math.random();
            const y = 50 + (size - 100) * Math.random();
            const boneSize = 30 + Math.random() * 30;
            this.drawBone(ctx, x, y, boneSize, themeData.colors[1]);
        }
        ctx.restore();
        
        this.drawCuteDog(ctx, size / 2, size / 2, size * 0.3);
        
        ctx.save();
        ctx.globalAlpha = 0.15;
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i;
            const radius = size * 0.38;
            const x = size / 2 + Math.cos(angle) * radius;
            const y = size / 2 + Math.sin(angle) * radius;
            this.drawSmallDog(ctx, x, y, 28, themeData.colors[0]);
        }
        ctx.restore();
    }

    drawCuteDog(ctx, x, y, size) {
        ctx.save();
        
        ctx.fillStyle = '#DEB887';
        ctx.beginPath();
        ctx.ellipse(x, y, size, size * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = '#D2691E';
        ctx.beginPath();
        ctx.ellipse(x - size * 0.75, y - size * 0.2, size * 0.35, size * 0.55, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.ellipse(x + size * 0.75, y - size * 0.2, size * 0.35, size * 0.55, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.ellipse(x - size * 0.75, y - size * 0.2, size * 0.2, size * 0.35, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(x + size * 0.75, y - size * 0.2, size * 0.2, size * 0.35, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(x, y + size * 0.15, size * 0.5, size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#5D4E6D';
        ctx.beginPath();
        ctx.ellipse(x - size * 0.35, y - size * 0.2, size * 0.1, size * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(x + size * 0.35, y - size * 0.2, size * 0.1, size * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(x - size * 0.32, y - size * 0.24, size * 0.03, size * 0.04, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(x + size * 0.38, y - size * 0.24, size * 0.03, size * 0.04, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#5D4E6D';
        ctx.beginPath();
        ctx.ellipse(x, y + size * 0.05, size * 0.12, size * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(x - size * 0.02, y + size * 0.02, size * 0.04, size * 0.03, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#5D4E6D';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y + size * 0.15);
        ctx.lineTo(x, y + size * 0.25);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(x - size * 0.08, y + size * 0.25, size * 0.08, 0, Math.PI);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(x + size * 0.08, y + size * 0.25, size * 0.08, 0, Math.PI);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 182, 193, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x - size * 0.55, y + size * 0.05, size * 0.15, size * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(x + size * 0.55, y + size * 0.05, size * 0.15, size * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    drawSmallDog(ctx, x, y, size, color) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x, y, size, size * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(x - size * 0.65, y - size * 0.15, size * 0.3, size * 0.45, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(x + size * 0.65, y - size * 0.15, size * 0.3, size * 0.45, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    drawBone(ctx, x, y, size, color) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x - size * 0.6, y, size * 0.3, size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(x + size * 0.6, y, size * 0.3, size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillRect(x - size * 0.5, y - size * 0.15, size, size * 0.3);
        ctx.restore();
    }

    drawFlowerImage(ctx, size, themeData) {
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#E8F5E9');
        gradient.addColorStop(0.5, '#FFF8E1');
        gradient.addColorStop(1, '#FFEBEE');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        ctx.save();
        ctx.globalAlpha = 0.15;
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const petalSize = 15 + Math.random() * 25;
            const petalCount = 5 + Math.floor(Math.random() * 3);
            this.drawSimpleFlower(ctx, x, y, petalSize, petalCount, themeData.colors[Math.floor(Math.random() * 5)]);
        }
        ctx.restore();
        
        this.drawBouquet(ctx, size / 2, size / 2, size * 0.25);
        
        ctx.save();
        ctx.globalAlpha = 0.2;
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const radius = size * 0.38;
            const x = size / 2 + Math.cos(angle) * radius;
            const y = size / 2 + Math.sin(angle) * radius;
            this.drawSimpleFlower(ctx, x, y, 25, 6, themeData.colors[i % 5]);
        }
        ctx.restore();
    }

    drawBouquet(ctx, x, y, size) {
        ctx.save();
        
        for (let i = 0; i < 7; i++) {
            const angle = (Math.PI * 2 / 7) * i - Math.PI / 2;
            const radius = size * 0.7;
            const flowerX = x + Math.cos(angle) * radius;
            const flowerY = y + Math.sin(angle) * radius;
            const colors = ['#FF69B4', '#FFB6C1', '#FF1493', '#FF6B6B', '#FFA07A', '#FFB6C1', '#FF69B4'];
            
            ctx.strokeStyle = '#4CAF50';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x, y + size * 0.5);
            ctx.quadraticCurveTo(flowerX + (x - flowerX) * 0.3, y + size * 0.2, flowerX, flowerY);
            ctx.stroke();
            
            this.drawSimpleFlower(ctx, flowerX, flowerY, size * 0.35, 6, colors[i]);
        }
        
        this.drawSimpleFlower(ctx, x, y - size * 0.1, size * 0.45, 8, '#FFD700');
        
        ctx.restore();
    }

    drawSimpleFlower(ctx, x, y, size, petalCount, color) {
        ctx.save();
        
        ctx.fillStyle = color;
        for (let i = 0; i < petalCount; i++) {
            const angle = (Math.PI * 2 / petalCount) * i;
            const petalX = x + Math.cos(angle) * size * 0.6;
            const petalY = y + Math.sin(angle) * size * 0.6;
            
            ctx.beginPath();
            ctx.ellipse(petalX, petalY, size * 0.4, size * 0.25, angle, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    drawLandscapeImage(ctx, size, themeData) {
        const skyGradient = ctx.createLinearGradient(0, 0, 0, size);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(0.6, '#B0E0E6');
        skyGradient.addColorStop(1, '#E0F7FA');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, size, size);
        
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.drawCloud(ctx, size * 0.15, size * 0.1, size * 0.1);
        this.drawCloud(ctx, size * 0.6, size * 0.08, size * 0.12);
        this.drawCloud(ctx, size * 0.85, size * 0.2, size * 0.08);
        ctx.restore();
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(size * 0.85, size * 0.15, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.save();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            const innerRadius = size * 0.1;
            const outerRadius = size * 0.13;
            ctx.beginPath();
            ctx.moveTo(
                size * 0.85 + Math.cos(angle) * innerRadius,
                size * 0.15 + Math.sin(angle) * innerRadius
            );
            ctx.lineTo(
                size * 0.85 + Math.cos(angle) * outerRadius,
                size * 0.15 + Math.sin(angle) * outerRadius
            );
            ctx.stroke();
        }
        ctx.restore();
        
        ctx.fillStyle = '#98D8C8';
        ctx.beginPath();
        ctx.moveTo(0, size * 0.6);
        ctx.lineTo(size * 0.15, size * 0.35);
        ctx.lineTo(size * 0.3, size * 0.55);
        ctx.lineTo(size * 0.5, size * 0.25);
        ctx.lineTo(size * 0.7, size * 0.5);
        ctx.lineTo(size * 0.85, size * 0.3);
        ctx.lineTo(size, size * 0.55);
        ctx.lineTo(size, size);
        ctx.lineTo(0, size);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#7ECFC0';
        ctx.beginPath();
        ctx.moveTo(0, size * 0.75);
        ctx.lineTo(size * 0.2, size * 0.55);
        ctx.lineTo(size * 0.35, size * 0.65);
        ctx.lineTo(size * 0.55, size * 0.45);
        ctx.lineTo(size * 0.75, size * 0.6);
        ctx.lineTo(size * 0.9, size * 0.5);
        ctx.lineTo(size, size * 0.65);
        ctx.lineTo(size, size);
        ctx.lineTo(0, size);
        ctx.closePath();
        ctx.fill();
        
        const grassGradient = ctx.createLinearGradient(0, size * 0.7, 0, size);
        grassGradient.addColorStop(0, '#7DCE82');
        grassGradient.addColorStop(1, '#4CAF50');
        ctx.fillStyle = grassGradient;
        ctx.fillRect(0, size * 0.75, size, size * 0.25);
        
        ctx.save();
        for (let i = 0; i < 30; i++) {
            const gx = Math.random() * size;
            const gy = size * 0.75 + Math.random() * size * 0.2;
            ctx.strokeStyle = `hsl(${120 + Math.random() * 30}, ${60 + Math.random() * 20}%, ${35 + Math.random() * 15}%)`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(gx, gy);
            ctx.quadraticCurveTo(gx + (Math.random() - 0.5) * 5, gy - 8, gx + (Math.random() - 0.5) * 3, gy - 15);
            ctx.stroke();
        }
        ctx.restore();
        
        this.drawPineTree(ctx, size * 0.2, size * 0.7, size * 0.15);
        this.drawPineTree(ctx, size * 0.8, size * 0.72, size * 0.12);
        this.drawPineTree(ctx, size * 0.55, size * 0.68, size * 0.18);
        
        ctx.save();
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 8; i++) {
            const fx = size * 0.1 + (size * 0.8) * (i / 7);
            const fy = size * 0.85 + Math.random() * size * 0.1;
            const colors = ['#FF69B4', '#FFD700', '#FF6B6B', '#87CEEB'];
            this.drawSimpleFlower(ctx, fx, fy, 8, 5, colors[Math.floor(Math.random() * colors.length)]);
        }
        ctx.restore();
    }

    drawCloud(ctx, x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
        ctx.arc(x + size * 0.5, y - size * 0.2, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x + size, y, size * 0.6, 0, Math.PI * 2);
        ctx.arc(x + size * 0.5, y + size * 0.1, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawPineTree(ctx, x, y, size) {
        ctx.save();
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - size * 0.1, y, size * 0.2, size * 0.4);
        
        for (let i = 0; i < 3; i++) {
            const layerY = y - i * size * 0.35;
            const layerWidth = size * (1 - i * 0.25);
            const layerHeight = size * 0.4;
            
            ctx.fillStyle = i === 0 ? '#2E7D32' : i === 1 ? '#388E3C' : '#43A047';
            ctx.beginPath();
            ctx.moveTo(x, layerY - layerHeight);
            ctx.lineTo(x - layerWidth / 2, layerY);
            ctx.lineTo(x + layerWidth / 2, layerY);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.beginPath();
            ctx.moveTo(x, layerY - layerHeight);
            ctx.lineTo(x - layerWidth / 2, layerY);
            ctx.lineTo(x, layerY - layerHeight * 0.3);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }

    drawAbstractImage(ctx, size, themeData) {
        const bgGradient = ctx.createLinearGradient(0, 0, size, size);
        bgGradient.addColorStop(0, '#E8F5E9');
        bgGradient.addColorStop(0.25, '#E3F2FD');
        bgGradient.addColorStop(0.5, '#FFF3E0');
        bgGradient.addColorStop(0.75, '#FCE4EC');
        bgGradient.addColorStop(1, '#F3E5F5');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, size, size);
        
        ctx.save();
        ctx.globalAlpha = 0.15;
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = 20 + Math.random() * 60;
            const color = themeData.colors[Math.floor(Math.random() * 5)];
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        
        ctx.save();
        ctx.globalAlpha = 0.25;
        for (let i = 0; i < 12; i++) {
            const x = size * 0.1 + (size * 0.8) * (i / 11);
            const y = size * 0.1 + (size * 0.8) * Math.sin(i * 0.8);
            const radius = 25 + Math.sin(i * 0.5) * 15;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, themeData.colors[i % 5]);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        
        ctx.save();
        ctx.strokeStyle = '#FF69B4';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.4;
        
        for (let i = 0; i < 5; i++) {
            const startY = size * 0.2 + i * size * 0.15;
            ctx.beginPath();
            ctx.moveTo(0, startY);
            
            for (let x = 0; x <= size; x += 20) {
                const y = startY + Math.sin(x * 0.02 + i) * 30;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        ctx.restore();
        
        ctx.save();
        ctx.globalAlpha = 0.35;
        const shapes = [
            { x: size * 0.2, y: size * 0.3, size: 50, type: 'star', color: '#FFD93D' },
            { x: size * 0.75, y: size * 0.25, size: 45, type: 'heart', color: '#FF6B9D' },
            { x: size * 0.3, y: size * 0.7, size: 55, type: 'circle', color: '#98D8C8' },
            { x: size * 0.8, y: size * 0.65, size: 40, type: 'star', color: '#B19CD9' },
            { x: size * 0.5, y: size * 0.5, size: 60, type: 'hexagon', color: '#7DCE82' },
        ];
        
        shapes.forEach(shape => {
            ctx.fillStyle = shape.color;
            this.drawShape(ctx, shape.x, shape.y, shape.size, shape.type);
        });
        ctx.restore();
        
        ctx.save();
        ctx.globalAlpha = 0.5;
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = 3 + Math.random() * 8;
            
            ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 60%)`;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawShape(ctx, x, y, size, type) {
        ctx.beginPath();
        
        switch (type) {
            case 'star':
                for (let i = 0; i < 10; i++) {
                    const angle = (Math.PI * 2 / 10) * i - Math.PI / 2;
                    const radius = i % 2 === 0 ? size : size * 0.5;
                    const px = x + Math.cos(angle) * radius;
                    const py = y + Math.sin(angle) * radius;
                    
                    if (i === 0) {
                        ctx.moveTo(px, py);
                    } else {
                        ctx.lineTo(px, py);
                    }
                }
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'heart':
                ctx.moveTo(x, y + size * 0.3);
                ctx.bezierCurveTo(x - size * 0.5, y - size * 0.2, x - size * 0.5, y - size * 0.8, x, y - size * 0.4);
                ctx.bezierCurveTo(x + size * 0.5, y - size * 0.8, x + size * 0.5, y - size * 0.2, x, y + size * 0.3);
                ctx.fill();
                break;
                
            case 'circle':
                ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'hexagon':
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI * 2 / 6) * i - Math.PI / 2;
                    const px = x + Math.cos(angle) * size * 0.6;
                    const py = y + Math.sin(angle) * size * 0.6;
                    
                    if (i === 0) {
                        ctx.moveTo(px, py);
                    } else {
                        ctx.lineTo(px, py);
                    }
                }
                ctx.closePath();
                ctx.fill();
                break;
        }
    }

    async loadImageFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const size = Math.max(img.width, img.height);
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext('2d');
                    
                    const scale = Math.min(size / img.width, size / img.height);
                    const w = img.width * scale;
                    const h = img.height * scale;
                    const x = (size - w) / 2;
                    const y = (size - h) / 2;
                    
                    ctx.drawImage(img, x, y, w, h);
                    
                    const squaredImg = new Image();
                    squaredImg.onload = () => {
                        this.customImage = {
                            element: squaredImg,
                            width: size,
                            height: size,
                            loaded: true,
                            theme: 'custom'
                        };
                        this.currentImage = this.customImage;
                        resolve(this.customImage);
                    };
                    squaredImg.onerror = reject;
                    squaredImg.src = canvas.toDataURL();
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async loadRandomImage() {
        const themes = Object.keys(this.themes);
        const randomTheme = themes[Math.floor(Math.random() * themes.length)];
        return this.loadThemeImage(randomTheme);
    }

    getCurrentImage() {
        return this.currentImage;
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    hasCustomImage() {
        return this.customImage !== null;
    }
}

export const imageManager = new ImageManager();
export default imageManager;
