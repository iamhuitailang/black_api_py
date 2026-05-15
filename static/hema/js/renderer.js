const Renderer = {
    canvas: null,
    ctx: null,
    
    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;
    },
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    
    render(game) {
        this.clear();
        this.drawBackground();
        this.drawSwamp();
        
        game.enemies.forEach(enemy => enemy.render(this.ctx));
        
        game.hippo.render(this.ctx);
        
        ParticleSystem.render(this.ctx);
    },
    
    drawBackground() {
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, CONFIG.SWAMP_Y);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(0.5, '#B0E0E6');
        skyGradient.addColorStop(1, '#98FB98');
        
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, CONFIG.SWAMP_Y);
        
        this.drawSimpleClouds();
        this.drawSimpleTrees();
        
        const sunX = 110;
        const sunY = 75;
        
        this.ctx.fillStyle = '#FFEB3B';
        this.ctx.beginPath();
        this.ctx.arc(sunX, sunY, 30, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFFACD';
        this.ctx.beginPath();
        this.ctx.arc(sunX - 8, sunY - 8, 10, 0, Math.PI * 2);
        this.ctx.fill();
    },
    
    drawSimpleTrees() {
        const treePositions = [80, 250, 450, 650, 850, 1050];
        
        treePositions.forEach((x, i) => {
            const height = 50 + (i % 3) * 15;
            const y = CONFIG.SWAMP_Y - 8 - height;
            
            this.ctx.fillStyle = '#228B22';
            this.ctx.beginPath();
            this.ctx.moveTo(x - 25, CONFIG.SWAMP_Y - 8);
            this.ctx.lineTo(x, y);
            this.ctx.lineTo(x + 25, CONFIG.SWAMP_Y - 8);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(x - 4, CONFIG.SWAMP_Y - 18, 8, 18);
        });
    },
    
    drawSimpleClouds() {
        const time = Date.now() * 0.0001;
        const cloudConfigs = [
            { x: 180, y: 55, size: 1.0 },
            { x: 500, y: 85, size: 0.8 },
            { x: 800, y: 45, size: 0.9 },
            { x: 1050, y: 75, size: 0.7 }
        ];
        
        cloudConfigs.forEach((cloud, i) => {
            const x = ((cloud.x + time * 30 + i * 280) % (this.canvas.width + 200)) - 100;
            const y = cloud.y;
            const s = cloud.size;
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 30 * s, 0, Math.PI * 2);
            this.ctx.arc(x + 40 * s, y - 6, 35 * s, 0, Math.PI * 2);
            this.ctx.arc(x + 80 * s, y, 32 * s, 0, Math.PI * 2);
            this.ctx.arc(x + 20 * s, y + 15, 25 * s, 0, Math.PI * 2);
            this.ctx.arc(x + 55 * s, y + 15, 27 * s, 0, Math.PI * 2);
            this.ctx.fill();
        });
    },
    
    drawSwamp() {
        this.ctx.fillStyle = '#6B8E23';
        this.ctx.beginPath();
        this.ctx.moveTo(0, CONFIG.SWAMP_Y + 30);
        
        for (let x = 0; x <= this.canvas.width; x += 30) {
            const y = CONFIG.SWAMP_Y - 10 + Math.sin(x * 0.015) * 15;
            this.ctx.lineTo(x, y);
        }
        
        this.ctx.lineTo(this.canvas.width, CONFIG.SWAMP_Y + 30);
        this.ctx.closePath();
        this.ctx.fill();
        
        for (let x = 30; x < this.canvas.width; x += 100) {
            const grassY = CONFIG.SWAMP_Y - 12;
            this.ctx.fillStyle = '#7CFC00';
            for (let i = -2; i <= 2; i++) {
                const bladeX = x + i * 10;
                const bladeHeight = 12 + Math.sin(i) * 3;
                this.ctx.beginPath();
                this.ctx.moveTo(bladeX, grassY);
                this.ctx.lineTo(bladeX + 2, grassY - bladeHeight);
                this.ctx.lineTo(bladeX + 4, grassY);
                this.ctx.fill();
            }
        }
        
        const waterGradient = this.ctx.createLinearGradient(0, CONFIG.SWAMP_Y, 0, this.canvas.height);
        waterGradient.addColorStop(0, '#48D1CC');
        waterGradient.addColorStop(0.5, '#20B2AA');
        waterGradient.addColorStop(1, '#008080');
        
        this.ctx.fillStyle = waterGradient;
        this.ctx.fillRect(0, CONFIG.SWAMP_Y, this.canvas.width, this.canvas.height - CONFIG.SWAMP_Y);
        
        this.drawSimpleRipples();
        this.drawSimpleLilyPads();
        this.drawSimpleReeds();
    },
    
    drawSimpleRipples() {
        const time = Date.now() * 0.002;
        
        for (let i = 0; i < 8; i++) {
            const x = 100 + i * 140;
            const y = CONFIG.SWAMP_Y + 50 + Math.sin(i * 1.2) * 20;
            const phase = time + i * 0.6;
            const size = 20 + Math.sin(phase) * 10;
            const alpha = 0.2 + Math.sin(phase) * 0.1;
            
            this.ctx.strokeStyle = `rgba(176, 224, 230, ${alpha})`;
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.ellipse(x, y, size, size * 0.3, 0, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    },
    
    drawSimpleLilyPads() {
        const positions = [
            { x: 150, y: CONFIG.SWAMP_Y + 60, flower: true, flowerColor: '#FF69B4' },
            { x: 400, y: CONFIG.SWAMP_Y + 85, flower: true, flowerColor: '#DA70D6' },
            { x: 700, y: CONFIG.SWAMP_Y + 55, flower: false },
            { x: 950, y: CONFIG.SWAMP_Y + 80, flower: true, flowerColor: '#FFB6C1' }
        ];
        
        positions.forEach((pos, i) => {
            const bob = Math.sin(Date.now() * 0.002 + i * 0.7) * 3;
            
            this.ctx.fillStyle = '#32CD32';
            this.ctx.beginPath();
            this.ctx.ellipse(pos.x, pos.y + bob, 35, 20, 0.1, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#006400';
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, pos.y + bob);
            this.ctx.lineTo(pos.x - 4, pos.y + bob - 15);
            this.ctx.lineTo(pos.x + 4, pos.y + bob - 15);
            this.ctx.closePath();
            this.ctx.fill();
            
            if (pos.flower) {
                this.ctx.fillStyle = pos.flowerColor;
                for (let p = 0; p < 5; p++) {
                    const angle = (p / 5) * Math.PI * 2;
                    const petalX = pos.x + Math.cos(angle) * 8;
                    const petalY = pos.y + bob - 6 + Math.sin(angle) * 6;
                    this.ctx.beginPath();
                    this.ctx.ellipse(petalX, petalY, 5, 4, angle, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                this.ctx.fillStyle = '#FFD700';
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y + bob - 6, 4, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    },
    
    drawSimpleReeds() {
        const reedPositions = [
            { x: 60, y: CONFIG.SWAMP_Y + 20 },
            { x: 250, y: CONFIG.SWAMP_Y + 30 },
            { x: 550, y: CONFIG.SWAMP_Y + 25 },
            { x: 850, y: CONFIG.SWAMP_Y + 35 },
            { x: 1100, y: CONFIG.SWAMP_Y + 22 }
        ];
        
        reedPositions.forEach((reed, i) => {
            const sway = Math.sin(Date.now() * 0.0015 + i * 0.5) * 2;
            
            this.ctx.strokeStyle = '#8B4513';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(reed.x, reed.y);
            this.ctx.quadraticCurveTo(reed.x + sway, reed.y - 40, reed.x + sway * 1.5, reed.y - 80);
            this.ctx.stroke();
            
            this.ctx.fillStyle = '#228B22';
            for (let j = 0; j < 4; j++) {
                const leafY = reed.y - 20 - j * 18;
                const leafX = reed.x + sway * (0.5 + j * 0.15);
                this.ctx.beginPath();
                this.ctx.ellipse(leafX + (j % 2 === 0 ? 10 : -10), leafY, 12, 4, (j % 2 === 0 ? 0.4 : -0.4), 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    },
    
    darkenColor(hex, amount) {
        const rgb = Utils.hexToRgb(hex);
        return `rgb(${Math.max(0, rgb.r - amount)}, ${Math.max(0, rgb.g - amount)}, ${Math.max(0, rgb.b - amount)})`;
    }
};