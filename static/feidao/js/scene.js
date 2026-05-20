class SceneRenderer {
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.crowdMembers = [];
        this.lanterns = [];
        this.initCrowd();
        this.initLanterns();
    }

    initCrowd() {
        for (let i = 0; i < 15; i++) {
            this.crowdMembers.push({
                x: Math.random() * this.width,
                y: this.height - 80 - Math.random() * 30,
                size: 20 + Math.random() * 15,
                color: this.getRandomCrowdColor(),
                bounceOffset: Math.random() * Math.PI * 2,
                bounceSpeed: 0.02 + Math.random() * 0.03
            });
        }
    }

    initLanterns() {
        const lanternPositions = [
            { x: 80, y: 80 },
            { x: this.width - 80, y: 80 },
            { x: 200, y: 60 },
            { x: this.width - 200, y: 60 }
        ];
        lanternPositions.forEach(pos => {
            this.lanterns.push({
                x: pos.x,
                y: pos.y,
                size: 25,
                swingAngle: 0,
                swingSpeed: 0.02 + Math.random() * 0.02,
                glowIntensity: 0.5 + Math.random() * 0.5
            });
        });
    }

    getRandomCrowdColor() {
        const colors = ['#8B0000', '#006400', '#00008B', '#8B8B00', '#8B008B', '#CD853F', '#A0522D'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    drawBackground(sceneConfig) {
        this.drawSky(sceneConfig);
        this.drawVintageOverlay();
        this.drawStage(sceneConfig);
        this.drawCurtains();
        this.drawTopBanner();
        this.drawLanterns();
        this.drawCrowd();
    }

    drawSky(sceneConfig) {
        const gradient = this.ctx.createRadialGradient(
            this.width / 2, 100, 50,
            this.width / 2, 100, 400
        );
        gradient.addColorStop(0, this.lightenColor(sceneConfig.backgroundColor, 20));
        gradient.addColorStop(0.5, sceneConfig.backgroundColor);
        gradient.addColorStop(1, this.darkenColor(sceneConfig.backgroundColor, 40));
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        const ambientGradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        ambientGradient.addColorStop(0, 'rgba(255, 200, 100, 0.1)');
        ambientGradient.addColorStop(0.5, 'rgba(255, 150, 50, 0.05)');
        ambientGradient.addColorStop(1, 'rgba(100, 50, 0, 0.1)');
        this.ctx.fillStyle = ambientGradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawVintageOverlay() {
        this.ctx.save();
        
        const gradient = this.ctx.createRadialGradient(
            this.width / 2, this.height / 2, 100,
            this.width / 2, this.height / 2, Math.max(this.width, this.height) * 0.7
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.globalAlpha = 0.03;
        for (let i = 0; i < 100; i++) {
            const y = Math.random() * this.height;
            this.ctx.fillStyle = Math.random() > 0.5 ? '#8B4513' : '#D2691E';
            this.ctx.fillRect(0, y, this.width, 1);
        }
        
        this.ctx.restore();
    }

    drawCurtains() {
        const curtainLeft = this.ctx.createLinearGradient(0, 0, 100, 0);
        curtainLeft.addColorStop(0, '#5C0000');
        curtainLeft.addColorStop(0.5, '#8B0000');
        curtainLeft.addColorStop(0.8, '#A52A2A');
        curtainLeft.addColorStop(1, 'rgba(139, 0, 0, 0)');
        
        this.ctx.fillStyle = curtainLeft;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.bezierCurveTo(60, 150, 30, this.height - 100, 0, this.height);
        this.ctx.lineTo(100, this.height);
        this.ctx.bezierCurveTo(80, this.height - 150, 120, 200, 100, 0);
        this.ctx.closePath();
        this.ctx.fill();

        const curtainRight = this.ctx.createLinearGradient(this.width, 0, this.width - 100, 0);
        curtainRight.addColorStop(0, '#5C0000');
        curtainRight.addColorStop(0.5, '#8B0000');
        curtainRight.addColorStop(0.8, '#A52A2A');
        curtainRight.addColorStop(1, 'rgba(139, 0, 0, 0)');
        
        this.ctx.fillStyle = curtainRight;
        this.ctx.beginPath();
        this.ctx.moveTo(this.width, 0);
        this.ctx.bezierCurveTo(this.width - 60, 150, this.width - 30, this.height - 100, this.width, this.height);
        this.ctx.lineTo(this.width - 100, this.height);
        this.ctx.bezierCurveTo(this.width - 80, this.height - 150, this.width - 120, 200, this.width - 100, 0);
        this.ctx.closePath();
        this.ctx.fill();

        this.drawCurtainFolds();
    }

    drawCurtainFolds() {
        this.ctx.strokeStyle = 'rgba(92, 0, 0, 0.3)';
        this.ctx.lineWidth = 3;
        
        for (let i = 0; i < 5; i++) {
            const x = 15 + i * 18;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.bezierCurveTo(x + 10, 200, x - 5, this.height - 100, x, this.height);
            this.ctx.stroke();
        }

        for (let i = 0; i < 5; i++) {
            const x = this.width - 15 - i * 18;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.bezierCurveTo(x - 10, 200, x + 5, this.height - 100, x, this.height);
            this.ctx.stroke();
        }

        this.drawGoldTrim(50, 0);
        this.drawGoldTrim(this.width - 50, 0);
    }

    drawGoldTrim(x, startY) {
        const goldGradient = this.ctx.createLinearGradient(x - 8, 0, x + 8, 0);
        goldGradient.addColorStop(0, '#B8860B');
        goldGradient.addColorStop(0.3, '#FFD700');
        goldGradient.addColorStop(0.7, '#FFD700');
        goldGradient.addColorStop(1, '#B8860B');

        this.ctx.fillStyle = goldGradient;
        this.ctx.fillRect(x - 6, startY, 12, this.height);

        this.ctx.strokeStyle = 'rgba(184, 134, 11, 0.5)';
        this.ctx.lineWidth = 1;
        for (let y = startY; y < this.height; y += 25) {
            this.ctx.beginPath();
            this.ctx.arc(x, y + 10, 4, 0, Math.PI * 2);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fill();
            this.ctx.stroke();
        }
    }

    drawTopBanner() {
        const bannerGradient = this.ctx.createLinearGradient(0, 0, 0, 45);
        bannerGradient.addColorStop(0, '#8B0000');
        bannerGradient.addColorStop(0.5, '#A52A2A');
        bannerGradient.addColorStop(1, '#6B0000');
        
        this.ctx.fillStyle = bannerGradient;
        this.ctx.fillRect(0, 0, this.width, 45);

        this.ctx.fillStyle = '#FFD700';
        for (let i = 0; i < this.width; i += 35) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 45);
            this.ctx.lineTo(i + 17, 45);
            this.ctx.lineTo(i + 8, 58);
            this.ctx.closePath();
            this.ctx.fill();
        }

        this.ctx.strokeStyle = '#B8860B';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 5);
        this.ctx.lineTo(this.width, 5);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(0, 40);
        this.ctx.lineTo(this.width, 40);
        this.ctx.stroke();
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max((num >> 16) - amt, 0);
        const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
        const B = Math.max((num & 0x0000FF) - amt, 0);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min((num >> 16) + amt, 255);
        const G = Math.min((num >> 8 & 0x00FF) + amt, 255);
        const B = Math.min((num & 0x0000FF) + amt, 255);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    drawStage(sceneConfig) {
        this.drawWoodenFloor();
        
        this.drawStagePillars();
        
        this.drawStageRoof();
        
        this.drawRedCarpet();
        
        this.drawStageRailing();
        
        this.drawStageSign();
    }

    drawWoodenFloor() {
        const floorGradient = this.ctx.createLinearGradient(0, this.height - 100, 0, this.height);
        floorGradient.addColorStop(0, '#A0522D');
        floorGradient.addColorStop(0.3, '#8B4513');
        floorGradient.addColorStop(0.7, '#654321');
        floorGradient.addColorStop(1, '#4A3520');
        
        this.ctx.fillStyle = floorGradient;
        this.ctx.fillRect(0, this.height - 100, this.width, 100);

        this.ctx.strokeStyle = 'rgba(60, 30, 15, 0.3)';
        this.ctx.lineWidth = 1;
        for (let y = this.height - 95; y < this.height; y += 10) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.bezierCurveTo(
                this.width * 0.3, y + Math.sin(y) * 2,
                this.width * 0.7, y - Math.sin(y) * 2,
                this.width, y
            );
            this.ctx.stroke();
        }

        const edgeGradient = this.ctx.createLinearGradient(0, this.height - 100, 0, this.height - 90);
        edgeGradient.addColorStop(0, '#CD853F');
        edgeGradient.addColorStop(1, '#8B4513');
        this.ctx.fillStyle = edgeGradient;
        this.ctx.fillRect(0, this.height - 100, this.width, 10);
    }

    drawStagePillars() {
        const leftPillarGradient = this.ctx.createLinearGradient(95, 0, 110, 0);
        leftPillarGradient.addColorStop(0, '#654321');
        leftPillarGradient.addColorStop(0.3, '#8B4513');
        leftPillarGradient.addColorStop(0.7, '#A0522D');
        leftPillarGradient.addColorStop(1, '#654321');
        
        this.ctx.fillStyle = leftPillarGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(95, this.height - 100);
        this.ctx.lineTo(98, this.height - 280);
        this.ctx.lineTo(108, this.height - 280);
        this.ctx.lineTo(110, this.height - 100);
        this.ctx.closePath();
        this.ctx.fill();

        const rightPillarGradient = this.ctx.createLinearGradient(this.width - 110, 0, this.width - 95, 0);
        rightPillarGradient.addColorStop(0, '#654321');
        rightPillarGradient.addColorStop(0.3, '#A0522D');
        rightPillarGradient.addColorStop(0.7, '#8B4513');
        rightPillarGradient.addColorStop(1, '#654321');
        
        this.ctx.fillStyle = rightPillarGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(this.width - 110, this.height - 100);
        this.ctx.lineTo(this.width - 108, this.height - 280);
        this.ctx.lineTo(this.width - 98, this.height - 280);
        this.ctx.lineTo(this.width - 95, this.height - 100);
        this.ctx.closePath();
        this.ctx.fill();

        this.drawPillarBase(102, this.height - 100);
        this.drawPillarBase(this.width - 102, this.height - 100);
        this.drawPillarCapital(102, this.height - 280);
        this.drawPillarCapital(this.width - 102, this.height - 280);
    }

    drawPillarBase(x, y) {
        this.ctx.fillStyle = '#CD853F';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, 25, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#DAA520';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y - 5, 20, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawPillarCapital(x, y) {
        this.ctx.fillStyle = '#DAA520';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, 20, 6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.moveTo(x - 25, y);
        this.ctx.lineTo(x + 25, y);
        this.ctx.lineTo(x + 20, y - 15);
        this.ctx.lineTo(x - 20, y - 15);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawStageRoof() {
        const roofGradient = this.ctx.createLinearGradient(0, this.height - 300, 0, this.height - 275);
        roofGradient.addColorStop(0, '#4A3520');
        roofGradient.addColorStop(0.5, '#654321');
        roofGradient.addColorStop(1, '#8B4513');
        
        this.ctx.fillStyle = roofGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(70, this.height - 275);
        this.ctx.quadraticCurveTo(this.width / 2, this.height - 320, this.width - 70, this.height - 275);
        this.ctx.lineTo(this.width - 60, this.height - 260);
        this.ctx.quadraticCurveTo(this.width / 2, this.height - 300, 60, this.height - 260);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const progress = i / 7;
            const x1 = 70 + progress * (this.width - 140);
            const y1 = this.height - 275 - Math.sin(progress * Math.PI) * 45;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x1 - 10, y1 + 25);
            this.ctx.stroke();
        }

        this.ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 15; i++) {
            const progress = i / 14;
            const x = 75 + progress * (this.width - 150);
            const y = this.height - 260 - Math.sin(progress * Math.PI) * 40;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawRedCarpet() {
        const carpetGradient = this.ctx.createLinearGradient(0, this.height - 260, 0, this.height - 100);
        carpetGradient.addColorStop(0, '#8B0000');
        carpetGradient.addColorStop(0.3, '#B22222');
        carpetGradient.addColorStop(0.7, '#A52A2A');
        carpetGradient.addColorStop(1, '#8B0000');
        
        this.ctx.fillStyle = carpetGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(125, this.height - 260);
        this.ctx.lineTo(this.width - 125, this.height - 260);
        this.ctx.lineTo(this.width - 105, this.height - 100);
        this.ctx.lineTo(105, this.height - 100);
        this.ctx.closePath();
        this.ctx.fill();

        const borderGradient = this.ctx.createLinearGradient(0, this.height - 260, 0, this.height - 100);
        borderGradient.addColorStop(0, '#FFD700');
        borderGradient.addColorStop(1, '#DAA520');
        
        this.ctx.strokeStyle = borderGradient;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(130, this.height - 255);
        this.ctx.lineTo(this.width - 130, this.height - 255);
        this.ctx.moveTo(115, this.height - 105);
        this.ctx.lineTo(this.width - 115, this.height - 105);
        this.ctx.stroke();

        this.drawCarpetPattern();
    }

    drawCarpetPattern() {
        this.ctx.fillStyle = 'rgba(218, 165, 32, 0.4)';
        for (let i = 0; i < 5; i++) {
            const x = this.width / 2 - 200 + i * 100;
            this.ctx.beginPath();
            this.ctx.arc(x, this.height - 180, 20, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawStageRailing() {
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(130, this.height - 255);
        this.ctx.lineTo(this.width - 130, this.height - 255);
        this.ctx.stroke();

        this.ctx.fillStyle = '#A0522D';
        for (let i = 0; i < 10; i++) {
            const x = 150 + i * 60;
            this.ctx.beginPath();
            this.ctx.arc(x, this.height - 255, 6, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawStageSign() {
        const signGradient = this.ctx.createLinearGradient(
            this.width / 2 - 90, this.height - 340,
            this.width / 2 + 90, this.height - 310
        );
        signGradient.addColorStop(0, '#654321');
        signGradient.addColorStop(0.3, '#8B4513');
        signGradient.addColorStop(0.7, '#A0522D');
        signGradient.addColorStop(1, '#654321');

        this.ctx.fillStyle = signGradient;
        this.drawRoundRect(this.width / 2 - 90, this.height - 340, 180, 45, 8);
        this.ctx.fill();

        this.ctx.strokeStyle = '#DAA520';
        this.ctx.lineWidth = 3;
        this.drawRoundRect(this.width / 2 - 90, this.height - 340, 180, 45, 8);
        this.ctx.stroke();

        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 20px "Microsoft YaHei", "楷体", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 3;
        this.ctx.fillText('飞刀绝技', this.width / 2, this.height - 317);
        this.ctx.shadowBlur = 0;

        this.drawSignDecoration(this.width / 2 - 90, this.height - 317);
        this.drawSignDecoration(this.width / 2 + 90, this.height - 317);
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

    drawSignDecoration(x, y) {
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 72 - 90) * Math.PI / 180;
            const radius = i % 2 === 0 ? 12 : 6;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawLanterns() {
        this.lanterns.forEach(lantern => {
            lantern.swingAngle = Math.sin(Date.now() * lantern.swingSpeed * 0.001) * 0.15;

            this.ctx.save();
            this.ctx.translate(lantern.x, lantern.y);
            this.ctx.rotate(lantern.swingAngle);

            this.ctx.strokeStyle = '#8B4513';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(0, -40);
            this.ctx.lineTo(0, -lantern.size - 10);
            this.ctx.stroke();

            const glowGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, lantern.size * 2.5);
            glowGradient.addColorStop(0, `rgba(255, 180, 50, ${0.4 * lantern.glowIntensity})`);
            glowGradient.addColorStop(0.5, `rgba(255, 150, 30, ${0.2 * lantern.glowIntensity})`);
            glowGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
            this.ctx.fillStyle = glowGradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, lantern.size * 2.5, 0, Math.PI * 2);
            this.ctx.fill();

            const lanternGradient = this.ctx.createRadialGradient(-5, -5, 0, 0, 0, lantern.size * 1.2);
            lanternGradient.addColorStop(0, '#FF6347');
            lanternGradient.addColorStop(0.5, '#FF4500');
            lanternGradient.addColorStop(1, '#DC143C');
            
            this.ctx.fillStyle = lanternGradient;
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, lantern.size, lantern.size * 1.3, 0, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.strokeStyle = 'rgba(139, 0, 0, 0.5)';
            this.ctx.lineWidth = 1.5;
            for (let i = -2; i <= 2; i++) {
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, lantern.size * (1 - Math.abs(i) * 0.15), lantern.size * 1.3, 0, 0, Math.PI * 2);
                this.ctx.stroke();
            }

            const topCapGradient = this.ctx.createLinearGradient(0, -lantern.size * 1.4, 0, -lantern.size * 1.1);
            topCapGradient.addColorStop(0, '#B8860B');
            topCapGradient.addColorStop(0.5, '#FFD700');
            topCapGradient.addColorStop(1, '#DAA520');
            
            this.ctx.fillStyle = topCapGradient;
            this.ctx.beginPath();
            this.ctx.ellipse(0, -lantern.size * 1.25, lantern.size * 0.6, 5, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillRect(-lantern.size * 0.3, -lantern.size * 1.55, lantern.size * 0.6, 8);

            const bottomCapGradient = this.ctx.createLinearGradient(0, lantern.size * 1.1, 0, lantern.size * 1.4);
            bottomCapGradient.addColorStop(0, '#DAA520');
            bottomCapGradient.addColorStop(0.5, '#FFD700');
            bottomCapGradient.addColorStop(1, '#B8860B');
            
            this.ctx.fillStyle = bottomCapGradient;
            this.ctx.beginPath();
            this.ctx.ellipse(0, lantern.size * 1.25, lantern.size * 0.6, 5, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillRect(-lantern.size * 0.3, lantern.size * 1.15, lantern.size * 0.6, 8);

            this.ctx.fillStyle = '#8B0000';
            this.ctx.font = 'bold 14px "楷体", serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
            this.ctx.shadowBlur = 2;
            this.ctx.fillText('福', 0, 0);
            this.ctx.shadowBlur = 0;

            this.drawTassel(0, lantern.size * 1.4);

            this.ctx.restore();
        });
    }

    drawTassel(x, y) {
        const time = Date.now() * 0.003;
        
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.quadraticCurveTo(x + 3, y + 15, x + Math.sin(time) * 5, y + 30);
        this.ctx.stroke();

        const tasselColors = ['#FFD700', '#FFA500', '#FF4500'];
        for (let i = 0; i < 5; i++) {
            const offsetX = (i - 2) * 4;
            const sway = Math.sin(time + i * 0.5) * 3;
            this.ctx.strokeStyle = tasselColors[i % 3];
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(x + offsetX, y + 5);
            this.ctx.quadraticCurveTo(
                x + offsetX + sway,
                y + 20,
                x + offsetX + sway * 1.5,
                y + 35
            );
            this.ctx.stroke();
        }
    }

    drawCrowd() {
        this.crowdMembers.forEach((person, index) => {
            person.bounceOffset += person.bounceSpeed;
            const bounceY = Math.sin(person.bounceOffset) * 2;

            this.drawPerson(person, bounceY, index);
        });

        this.drawCrowdHands();
        this.drawCrowdAccessories();
    }

    drawPerson(person, bounceY, index) {
        this.ctx.fillStyle = person.color;
        this.ctx.beginPath();
        this.ctx.ellipse(person.x, person.y + bounceY, person.size / 2.5, person.size / 1.8, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = this.darkenColor(person.color, 20);
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.ellipse(person.x, person.y + bounceY, person.size / 2.5, person.size / 1.8, 0, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.fillStyle = '#FFDAB9';
        this.ctx.beginPath();
        this.ctx.arc(person.x, person.y - person.size / 2 + bounceY, person.size / 3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = this.getHatColor(index);
        this.ctx.beginPath();
        this.ctx.ellipse(person.x, person.y - person.size / 2 - person.size / 4 + bounceY, person.size / 2.5, person.size / 6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillRect(person.x - person.size / 5, person.y - person.size / 2 - person.size / 3 + bounceY, person.size / 2.5, person.size / 5);

        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(person.x - 3, person.y - person.size / 2 + bounceY - 2, 1.5, 0, Math.PI * 2);
        this.ctx.arc(person.x + 3, person.y - person.size / 2 + bounceY - 2, 1.5, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(person.x, person.y - person.size / 2 + bounceY + 2, 3, 0.1, Math.PI - 0.1);
        this.ctx.stroke();
    }

    getHatColor(index) {
        const colors = ['#8B4513', '#2F4F4F', '#556B2F', '#8B0000', '#4B0082'];
        return colors[index % colors.length];
    }

    drawCrowdHands() {
        const time = Date.now() * 0.004;
        for (let i = 0; i < 10; i++) {
            const x = 80 + i * 80 + Math.sin(i * 0.7) * 20;
            const y = this.height - 85;
            const waveY = Math.sin(time + i * 0.6) * 10;
            const waveX = Math.cos(time * 0.7 + i * 0.4) * 3;

            this.ctx.fillStyle = '#FFDAB9';
            this.ctx.beginPath();
            this.ctx.arc(x + waveX, y + waveY, 7, 0, Math.PI * 2);
            this.ctx.fill();

            if (i % 3 === 0) {
                this.ctx.fillStyle = '#FFD700';
                this.drawCoin(x + waveX, y + waveY - 15);
            }
        }
    }

    drawCoin(x, y) {
        const coinGradient = this.ctx.createRadialGradient(x - 1, y - 1, 0, x, y, 8);
        coinGradient.addColorStop(0, '#FFEC8B');
        coinGradient.addColorStop(0.5, '#FFD700');
        coinGradient.addColorStop(1, '#DAA520');
        
        this.ctx.fillStyle = coinGradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 7, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#B8860B';
        this.ctx.font = 'bold 8px serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('金', x, y);
    }

    drawCrowdAccessories() {
        const time = Date.now() * 0.002;
        for (let i = 0; i < 5; i++) {
            const x = 120 + i * 160;
            const y = this.height - 70;
            const wave = Math.sin(time + i) * 5;

            this.ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
            this.ctx.beginPath();
            this.ctx.moveTo(x, y + wave);
            this.ctx.quadraticCurveTo(x + 15, y - 20 + wave, x + 30, y + wave);
            this.ctx.quadraticCurveTo(x + 15, y + 10 + wave, x, y + wave);
            this.ctx.fill();

            this.ctx.strokeStyle = '#8B4513';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x + 15, y + wave);
            this.ctx.lineTo(x + 15, y + 30);
            this.ctx.stroke();
        }
    }

    drawAimLine(startX, startY, angle, power) {
        const rad = angle * Math.PI / 180;
        const length = 50 + power * 2;

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(startX + Math.cos(rad) * length, startY - Math.sin(rad) * length);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        const arrowX = startX + Math.cos(rad) * length;
        const arrowY = startY - Math.sin(rad) * length;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.beginPath();
        this.ctx.moveTo(arrowX, arrowY);
        this.ctx.lineTo(arrowX - Math.cos(rad - 0.3) * 15, arrowY + Math.sin(rad - 0.3) * 15);
        this.ctx.lineTo(arrowX - Math.cos(rad + 0.3) * 15, arrowY + Math.sin(rad + 0.3) * 15);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawTrajectoryPreview(startX, startY, angle, power, gravity) {
        const rad = angle * Math.PI / 180;
        const throwConfig = GameData.getThrowConfig('medium');
        const speed = throwConfig.speed * (power / 50);
        let vx = Math.cos(rad) * speed;
        let vy = -Math.sin(rad) * speed;
        let x = startX;
        let y = startY;

        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
        for (let i = 0; i < 30; i++) {
            vy += gravity;
            x += vx;
            y += vy;

            if (y > this.height - 100 || x < 0 || x > this.width) break;

            this.ctx.beginPath();
            this.ctx.arc(x, y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    createParticles(x, y, color, count) {
        const particles = [];
        for (let i = 0; i < count; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 2,
                life: 1,
                decay: 0.02 + Math.random() * 0.02,
                size: 3 + Math.random() * 4,
                color: color
            });
        }
        return particles;
    }

    drawParticles(particles) {
        particles.forEach(p => {
            this.ctx.fillStyle = p.color + Math.floor(p.life * 255).toString(16).padStart(2, '0');
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    updateParticles(particles) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= p.decay;
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    createFirework(x, y) {
        const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFD700'];
        const particles = [];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        for (let i = 0; i < 40; i++) {
            const angle = (Math.PI * 2 / 40) * i;
            const speed = 2 + Math.random() * 4;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.015,
                size: 3,
                color: color
            });
        }
        return particles;
    }

    createDustParticles() {
        const particles = [];
        for (let i = 0; i < 20; i++) {
            particles.push({
                x: Math.random() * this.width,
                y: this.height - 50 - Math.random() * 100,
                vx: (Math.random() - 0.5) * 0.5,
                vy: -0.2 - Math.random() * 0.3,
                life: 0.3 + Math.random() * 0.5,
                size: 1 + Math.random() * 2,
                color: '#D2B48C'
            });
        }
        return particles;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SceneRenderer;
}
