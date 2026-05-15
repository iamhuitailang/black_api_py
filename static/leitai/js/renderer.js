const Renderer = {
    canvas: null,
    ctx: null,

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
    },

    clear() {
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    },

    drawBackground() {
        const ctx = this.ctx;
        
        const bgGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        bgGradient.addColorStop(0, '#81D4FA');
        bgGradient.addColorStop(0.4, '#B3E5FC');
        bgGradient.addColorStop(0.7, '#E1F5FE');
        bgGradient.addColorStop(1, '#FFF8E1');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        for (let i = 0; i < 30; i++) {
            const x = (i * 47) % CANVAS_WIDTH;
            const y = 50 + (i * 23) % 150;
            const size = 2 + (i % 4);
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        const sunGradient = ctx.createRadialGradient(100, 70, 0, 100, 70, 60);
        sunGradient.addColorStop(0, '#FFF9C4');
        sunGradient.addColorStop(0.5, '#FFEB3B');
        sunGradient.addColorStop(1, '#FFC107');
        ctx.fillStyle = sunGradient;
        ctx.beginPath();
        ctx.arc(100, 70, 55, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FFD54F';
        ctx.lineWidth = 4;
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(100 + Math.cos(angle) * 60, 70 + Math.sin(angle) * 60);
            ctx.lineTo(100 + Math.cos(angle) * 75, 70 + Math.sin(angle) * 75);
            ctx.stroke();
        }

        ctx.fillStyle = '#FF8A65';
        ctx.beginPath();
        ctx.arc(100, 70, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFA726';
        ctx.beginPath();
        ctx.arc(85, 60, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(115, 65, 4, 0, Math.PI * 2);
        ctx.fill();

        this.drawCloud(180, 90, 1);
        this.drawCloud(550, 50, 0.9);
        this.drawCloud(850, 110, 1.1);
        this.drawCloud(1050, 70, 0.7);

        const wallGradient = ctx.createLinearGradient(0, GROUND_Y - 200, 0, GROUND_Y);
        wallGradient.addColorStop(0, '#FFCC80');
        wallGradient.addColorStop(1, '#FFB74D');
        ctx.fillStyle = wallGradient;
        ctx.fillRect(0, GROUND_Y - 200, CANVAS_WIDTH, 200);

        ctx.strokeStyle = '#FFA726';
        ctx.lineWidth = 2;
        for (let y = GROUND_Y - 180; y < GROUND_Y; y += 30) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(CANVAS_WIDTH, y);
            ctx.stroke();
        }

        const floorGradient = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_HEIGHT);
        floorGradient.addColorStop(0, '#A1887F');
        floorGradient.addColorStop(0.3, '#8D6E63');
        floorGradient.addColorStop(1, '#6D4C41');
        ctx.fillStyle = floorGradient;
        ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        for (let x = 0; x < CANVAS_WIDTH; x += 80) {
            ctx.beginPath();
            ctx.moveTo(x, GROUND_Y);
            ctx.lineTo(x + 40, CANVAS_HEIGHT);
            ctx.stroke();
        }

        ctx.fillStyle = 'rgba(93, 64, 55, 0.3)';
        ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 8);

        this.drawRug();
        this.drawSofa();
        this.drawTable();
        this.drawLamp();
        this.drawPicture();
    },

    drawCloud(x, y, scale) {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(x, y, 30 * scale, 0, Math.PI * 2);
        ctx.arc(x + 35 * scale, y - 10 * scale, 25 * scale, 0, Math.PI * 2);
        ctx.arc(x + 70 * scale, y, 30 * scale, 0, Math.PI * 2);
        ctx.arc(x + 35 * scale, y + 10 * scale, 20 * scale, 0, Math.PI * 2);
        ctx.fill();
    },

    drawRug() {
        const ctx = this.ctx;
        const centerX = CANVAS_WIDTH / 2;
        const centerY = GROUND_Y + 80;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(centerX + 8, centerY + 5, 410, 65, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const rugGradient = ctx.createRadialGradient(centerX - 50, centerY - 10, 0, centerX, centerY, 400);
        rugGradient.addColorStop(0, '#EF9A9A');
        rugGradient.addColorStop(0.5, '#E57373');
        rugGradient.addColorStop(1, '#C62828');
        ctx.fillStyle = rugGradient;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, 400, 60, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#B71C1C';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, 350, 45, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = '#FFCDD2';
        ctx.lineWidth = 3;
        ctx.setLineDash([15, 10]);
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, 320, 35, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#FFCDD2';
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const dotX = centerX + Math.cos(angle) * 280;
            const dotY = centerY + Math.sin(angle) * 30;
            ctx.beginPath();
            ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    drawSofa() {
        const ctx = this.ctx;
        const x = 50;
        const y = GROUND_Y - 60;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(x + 5, y + 5, 180, 75);
        
        const sofaGradient = ctx.createLinearGradient(x, y, x, y + 70);
        sofaGradient.addColorStop(0, '#8D6E63');
        sofaGradient.addColorStop(0.5, '#6D4C41');
        sofaGradient.addColorStop(1, '#5D4037');
        ctx.fillStyle = sofaGradient;
        ctx.beginPath();
        ctx.roundRect(x, y, 180, 70, 8);
        ctx.fill();
        
        ctx.strokeStyle = '#4E342E';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = '#8D6E63';
        ctx.beginPath();
        ctx.roundRect(x - 18, y - 35, 36, 105, 8);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(x + 162, y - 35, 36, 105, 8);
        ctx.fill();
        
        const backGradient = ctx.createLinearGradient(x + 10, y - 50, x + 10, y - 20);
        backGradient.addColorStop(0, '#A1887F');
        backGradient.addColorStop(1, '#8D6E63');
        ctx.fillStyle = backGradient;
        ctx.beginPath();
        ctx.roundRect(x + 10, y - 50, 160, 30, 8);
        ctx.fill();
        
        const pillowGradient = ctx.createRadialGradient(x + 35, y + 15, 0, x + 45, y + 30, 30);
        pillowGradient.addColorStop(0, '#FFCCBC');
        pillowGradient.addColorStop(1, '#FF8A65');
        ctx.fillStyle = pillowGradient;
        ctx.beginPath();
        ctx.roundRect(x + 20, y + 10, 50, 40, 10);
        ctx.fill();
        
        const pillowGradient2 = ctx.createRadialGradient(x + 125, y + 15, 0, x + 135, y + 30, 30);
        pillowGradient2.addColorStop(0, '#FFCCBC');
        pillowGradient2.addColorStop(1, '#FF8A65');
        ctx.fillStyle = pillowGradient2;
        ctx.beginPath();
        ctx.roundRect(x + 110, y + 10, 50, 40, 10);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x + 35, y + 20, 10, 6, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 125, y + 20, 10, 6, -0.3, 0, Math.PI * 2);
        ctx.fill();
    },

    drawTable() {
        const ctx = this.ctx;
        const x = CANVAS_WIDTH - 250;
        const y = GROUND_Y - 30;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(x + 5, y + 5, 150, 20);
        
        const tableGradient = ctx.createLinearGradient(x, y, x, y + 15);
        tableGradient.addColorStop(0, '#8D6E63');
        tableGradient.addColorStop(1, '#5D4037');
        ctx.fillStyle = tableGradient;
        ctx.beginPath();
        ctx.roundRect(x, y, 150, 18, 5);
        ctx.fill();
        
        ctx.strokeStyle = '#4E342E';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        const legGradient = ctx.createLinearGradient(x + 10, y + 15, x + 25, y + 95);
        legGradient.addColorStop(0, '#6D4C41');
        legGradient.addColorStop(1, '#4E342E');
        ctx.fillStyle = legGradient;
        ctx.fillRect(x + 10, y + 15, 18, 85);
        ctx.fillRect(x + 122, y + 15, 18, 85);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(x + 23, y + 20, 5, 75);
        ctx.fillRect(x + 135, y + 20, 5, 75);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(x + 40, y - 5, 18, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#B0BEC5';
        ctx.beginPath();
        ctx.ellipse(x + 40, y - 5, 15, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x + 36, y - 5, 8, 18);
        
        ctx.fillStyle = '#90A4AE';
        ctx.fillRect(x + 80, y - 8, 25, 5);
        ctx.fillRect(x + 85, y - 18, 5, 15);
    },

    drawLamp() {
        const ctx = this.ctx;
        const x = CANVAS_WIDTH - 80;
        const y = GROUND_Y - 150;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(x + 3, y + 103, 30, 80);
        
        const poleGradient = ctx.createLinearGradient(x, y + 100, x + 30, y + 100);
        poleGradient.addColorStop(0, '#8D6E63');
        poleGradient.addColorStop(0.5, '#6D4C41');
        poleGradient.addColorStop(1, '#5D4037');
        ctx.fillStyle = poleGradient;
        ctx.fillRect(x, y + 100, 30, 85);
        
        ctx.fillStyle = '#5D4037';
        ctx.beginPath();
        ctx.roundRect(x - 5, y + 175, 40, 15, 5);
        ctx.fill();
        
        const shadeGradient = ctx.createRadialGradient(x + 15, y + 60, 0, x + 15, y + 60, 50);
        shadeGradient.addColorStop(0, '#FFF9C4');
        shadeGradient.addColorStop(0.5, '#FFECB3');
        shadeGradient.addColorStop(1, '#FFE082');
        ctx.fillStyle = shadeGradient;
        ctx.beginPath();
        ctx.moveTo(x - 25, y + 100);
        ctx.quadraticCurveTo(x + 15, y + 10, x + 55, y + 100);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#FFD54F';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        const glowGradient = ctx.createRadialGradient(x + 15, y + 115, 0, x + 15, y + 115, 80);
        glowGradient.addColorStop(0, 'rgba(255, 235, 179, 0.5)');
        glowGradient.addColorStop(0.5, 'rgba(255, 235, 179, 0.2)');
        glowGradient.addColorStop(1, 'rgba(255, 235, 179, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x + 15, y + 115, 80, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFD54F';
        ctx.beginPath();
        ctx.arc(x + 15, y + 95, 8, 0, Math.PI * 2);
        ctx.fill();
    },

    drawPicture() {
        const ctx = this.ctx;
        const x = CANVAS_WIDTH / 2 - 65;
        const y = 75;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(x + 5, y + 5, 130, 100);
        
        const frameGradient = ctx.createLinearGradient(x, y, x + 130, y + 100);
        frameGradient.addColorStop(0, '#A1887F');
        frameGradient.addColorStop(0.5, '#8D6E63');
        frameGradient.addColorStop(1, '#6D4C41');
        ctx.fillStyle = frameGradient;
        ctx.fillRect(x, y, 130, 100);
        
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, 130, 100);
        
        ctx.fillStyle = '#FFFDE7';
        ctx.fillRect(x + 12, y + 12, 106, 76);
        
        ctx.strokeStyle = '#D7CCC8';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 12, y + 12, 106, 76);
        
        const faceGradient = ctx.createRadialGradient(x + 65, y + 50, 0, x + 65, y + 50, 30);
        faceGradient.addColorStop(0, '#FFEBEE');
        faceGradient.addColorStop(1, '#FFCDD2');
        ctx.fillStyle = faceGradient;
        ctx.beginPath();
        ctx.arc(x + 65, y + 50, 28, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#F8BBD0';
        ctx.beginPath();
        ctx.arc(x + 40, y + 55, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 90, y + 55, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(x + 55, y + 45, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 75, y + 45, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(x + 53, y + 43, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 73, y + 43, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#F48FB1';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x + 65, y + 55, 12, 0.15, Math.PI - 0.15);
        ctx.stroke();
        
        ctx.fillStyle = '#FFECB3';
        ctx.beginPath();
        ctx.moveTo(x + 45, y + 25);
        ctx.lineTo(x + 52, y + 10);
        ctx.lineTo(x + 59, y + 25);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 71, y + 25);
        ctx.lineTo(x + 78, y + 10);
        ctx.lineTo(x + 85, y + 25);
        ctx.closePath();
        ctx.fill();
    },

    drawCharacter(char) {
        const ctx = this.ctx;
        
        ctx.save();
        
        const shakeX = char.shakeOffset.x;
        const shakeY = char.shakeOffset.y;
        
        ctx.translate(char.x + shakeX, char.y + shakeY - char.height);
        
        if (!char.facingRight) {
            ctx.scale(-1, 1);
            ctx.translate(-char.width, 0);
        }

        if (char.isHurt && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        this.drawCharacterBody(char);
        this.drawCharacterFace(char);
        
        if (char.isAttacking) {
            this.drawAttackEffect(char);
        }

        ctx.restore();
    },

    drawCharacterBody(char) {
        const ctx = this.ctx;
        
        let bodyHeight = char.height;
        let bodyY = 0;
        
        if (char.isCrouching) {
            bodyHeight = char.height * 0.6;
            bodyY = char.height - bodyHeight;
        }

        if (char.charIndex === 0) {
            this.drawAngryPufferBody(char, bodyY, bodyHeight);
        } else if (char.charIndex === 1) {
            this.drawBigFootBody(char, bodyY, bodyHeight);
        } else {
            this.drawBouncyBunnyBody(char, bodyY, bodyHeight);
        }
    },

    drawAngryPufferBody(char, bodyY, bodyHeight) {
        const ctx = this.ctx;
        const cx = char.width / 2;
        const cy = bodyY + bodyHeight * 0.5;
        
        ctx.fillStyle = '#FF5252';
        ctx.beginPath();
        ctx.arc(cx, cy, 45, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 6;
        ctx.stroke();
        
        ctx.fillStyle = '#FF8A80';
        ctx.beginPath();
        ctx.ellipse(cx - 15, cy - 20, 18, 12, -0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFCDD2';
        ctx.beginPath();
        ctx.arc(cx - 28, cy + 8, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 28, cy + 8, 12, 0, Math.PI * 2);
        ctx.fill();
        
        const footAnim = char.isJumping ? 12 : 0;
        const walk = Math.sin(char.animFrame * 0.3) * 4;
        
        ctx.fillStyle = '#FF5252';
        ctx.beginPath();
        ctx.ellipse(15 - walk, char.height + 5 - footAnim, 22, 16, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(65 + walk, char.height + 5 + footAnim, 22, 16, -0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.ellipse(15 - walk, char.height + 5 - footAnim, 22, 16, 0.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(65 + walk, char.height + 5 + footAnim, 22, 16, -0.2, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#5D4037';
        ctx.beginPath();
        ctx.ellipse(15 - walk, char.height + 12 - footAnim, 25, 10, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(65 + walk, char.height + 12 + footAnim, 25, 10, -0.2, 0, Math.PI * 2);
        ctx.fill();
    },

    drawBigFootBody(char, bodyY, bodyHeight) {
        const ctx = this.ctx;
        const cx = char.width / 2;
        const cy = bodyY + bodyHeight * 0.5;
        
        ctx.fillStyle = '#9C27B0';
        ctx.beginPath();
        ctx.roundRect(5, bodyY + 10, 70, 80, 25);
        ctx.fill();
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 6;
        ctx.stroke();
        
        ctx.fillStyle = '#CE93D8';
        ctx.beginPath();
        ctx.ellipse(cx - 8, cy - 15, 20, 15, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#E1BEE7';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 15, 25, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const footAnim = char.isJumping ? 10 : 0;
        const walk = Math.sin(char.animFrame * 0.25) * 5;
        
        ctx.fillStyle = '#795548';
        ctx.beginPath();
        ctx.ellipse(2 - walk, char.height + 8 - footAnim, 38, 20, 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(78 + walk, char.height + 8 + footAnim, 38, 20, -0.15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.ellipse(2 - walk, char.height + 8 - footAnim, 38, 20, 0.15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(78 + walk, char.height + 8 + footAnim, 38, 20, -0.15, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#A1887F';
        ctx.beginPath();
        ctx.ellipse(2 - walk, char.height + 5 - footAnim, 30, 14, 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(78 + walk, char.height + 5 + footAnim, 30, 14, -0.15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(-10 - walk, char.height - 2 - footAnim, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(90 + walk, char.height - 2 + footAnim, 6, 0, Math.PI * 2);
        ctx.fill();
    },

    drawBouncyBunnyBody(char, bodyY, bodyHeight) {
        const ctx = this.ctx;
        const cx = char.width / 2;
        const cy = bodyY + bodyHeight * 0.55;
        
        ctx.fillStyle = '#FF9800';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 38, 45, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 6;
        ctx.stroke();
        
        ctx.fillStyle = '#FFB74D';
        ctx.beginPath();
        ctx.ellipse(cx - 12, cy - 18, 15, 10, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFF8E1';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 10, 25, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 10, 25, 20, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        const earBob = Math.sin(char.animFrame * 0.15) * 4;
        
        ctx.fillStyle = '#FF9800';
        ctx.beginPath();
        ctx.ellipse(16, bodyY - 5 + earBob, 12, 32, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        ctx.fillStyle = '#FF80AB';
        ctx.beginPath();
        ctx.ellipse(16, bodyY - 5 + earBob, 7, 22, -0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF9800';
        ctx.beginPath();
        ctx.ellipse(64, bodyY - 5 - earBob, 12, 32, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        ctx.fillStyle = '#FF80AB';
        ctx.beginPath();
        ctx.ellipse(64, bodyY - 5 - earBob, 7, 22, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        const hopAnim = char.isJumping ? -18 : 0;
        const legAnim = Math.sin(char.animFrame * 0.3) * 7;
        
        ctx.fillStyle = '#FF9800';
        ctx.beginPath();
        ctx.ellipse(20 - legAnim, char.height + hopAnim, 14, 24, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(60 + legAnim, char.height + hopAnim, 14, 24, -0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(20 - legAnim, char.height + hopAnim, 14, 24, 0.4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(60 + legAnim, char.height + hopAnim, 14, 24, -0.4, 0, Math.PI * 2);
        ctx.stroke();
        
        const tailBob = Math.sin(char.animFrame * 0.35) * 4;
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(68, bodyY + 38 + tailBob, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.stroke();
    },

    drawCharacterFace(char) {
        if (char.charIndex === 0) {
            this.drawAngryPufferFace(char);
        } else if (char.charIndex === 1) {
            this.drawBigFootFace(char);
        } else {
            this.drawBouncyBunnyFace(char);
        }
    },

    drawAngryPufferFace(char) {
        const ctx = this.ctx;
        const cx = char.width / 2;
        let faceY = 30;
        if (char.isCrouching) faceY = char.height - 55;
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(cx - 16, faceY, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 16, faceY, 16, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(cx - 16, faceY, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + 16, faceY, 16, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(cx - 28, faceY - 18);
        ctx.lineTo(cx - 5, faceY - 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 28, faceY - 18);
        ctx.lineTo(cx + 5, faceY - 10);
        ctx.stroke();
        
        ctx.fillStyle = '#000';
        if (char.isAngry || char.isAttacking) {
            ctx.beginPath();
            ctx.arc(cx - 16, faceY + 2, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + 16, faceY + 2, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(cx - 16, faceY + 2, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + 16, faceY + 2, 5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(cx - 16, faceY + 2, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + 16, faceY + 2, 6, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(cx - 19, faceY - 3, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 13, faceY - 3, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 6;
        ctx.beginPath();
        if (char.isAngry || char.isAttacking) {
            ctx.arc(cx, faceY + 25, 15, 0, Math.PI);
        } else {
            ctx.arc(cx, faceY + 22, 10, 0.2, Math.PI - 0.2);
        }
        ctx.stroke();
        
        if (char.isAngry || char.isAttacking) {
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(cx, faceY + 25, 12, 0, Math.PI);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
            ctx.beginPath();
            ctx.arc(cx - 30, faceY + 12, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + 30, faceY + 12, 14, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#FF5722';
            ctx.lineWidth = 4;
            this.drawSteam(cx - 20, faceY - 40, char.animFrame);
            this.drawSteam(cx + 20, faceY - 35, char.animFrame + 2);
        }
    },

    drawBigFootFace(char) {
        const ctx = this.ctx;
        const cx = char.width / 2;
        let faceY = 35;
        if (char.isCrouching) faceY = char.height - 50;
        
        ctx.fillStyle = '#5D4037';
        ctx.beginPath();
        ctx.moveTo(cx - 18, faceY - 30);
        ctx.lineTo(cx - 22, faceY + 8);
        ctx.lineTo(cx - 3, faceY + 5);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 18, faceY - 30);
        ctx.lineTo(cx + 22, faceY + 8);
        ctx.lineTo(cx + 3, faceY + 5);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx - 18, faceY - 30);
        ctx.lineTo(cx - 22, faceY + 8);
        ctx.lineTo(cx - 3, faceY + 5);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 18, faceY - 30);
        ctx.lineTo(cx + 22, faceY + 8);
        ctx.lineTo(cx + 3, faceY + 5);
        ctx.closePath();
        ctx.stroke();
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(cx - 14, faceY, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 14, faceY, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(cx - 14, faceY, 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + 14, faceY, 15, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#000';
        if (char.isAngry || char.isAttacking) {
            ctx.beginPath();
            ctx.moveTo(cx - 20, faceY - 8);
            ctx.lineTo(cx - 8, faceY + 5);
            ctx.lineTo(cx - 6, faceY - 12);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx + 20, faceY - 8);
            ctx.lineTo(cx + 8, faceY + 5);
            ctx.lineTo(cx + 6, faceY - 12);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(cx - 14, faceY + 2, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + 14, faceY + 2, 7, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(cx - 16, faceY - 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 12, faceY - 2, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 5;
        ctx.beginPath();
        if (char.isAngry || char.isAttacking) {
            ctx.moveTo(cx - 12, faceY + 28);
            ctx.lineTo(cx, faceY + 20);
            ctx.lineTo(cx + 12, faceY + 28);
        } else {
            ctx.arc(cx, faceY + 25, 12, 0.3, Math.PI - 0.3);
        }
        ctx.stroke();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(cx - 10, faceY - 32, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 10, faceY - 32, 5, 0, Math.PI * 2);
        ctx.fill();
    },

    drawBouncyBunnyFace(char) {
        const ctx = this.ctx;
        const cx = char.width / 2;
        let faceY = 40;
        if (char.isCrouching) faceY = char.height - 45;
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(cx - 14, faceY, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 14, faceY, 14, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx - 14, faceY, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + 14, faceY, 14, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#000';
        if (char.isAngry || char.isAttacking) {
            ctx.beginPath();
            ctx.arc(cx - 14, faceY + 2, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + 14, faceY + 2, 6, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(cx - 14, faceY + 3, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + 14, faceY + 3, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(cx - 15, faceY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 13, faceY, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.arc(cx, faceY + 14, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.beginPath();
        if (char.isAngry || char.isAttacking) {
            ctx.arc(cx, faceY + 23, 10, 0.2, Math.PI - 0.2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx - 8, faceY + 23);
            ctx.lineTo(cx - 4, faceY + 32);
            ctx.lineTo(cx, faceY + 23);
            ctx.lineTo(cx + 4, faceY + 32);
            ctx.lineTo(cx + 8, faceY + 23);
            ctx.stroke();
        } else {
            ctx.arc(cx, faceY + 20, 8, 0.2, Math.PI - 0.2);
        }
        ctx.stroke();
        
        ctx.strokeStyle = '#FF80AB';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx - 28, faceY + 12);
        ctx.lineTo(cx - 10, faceY + 14);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - 28, faceY + 18);
        ctx.lineTo(cx - 10, faceY + 18);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 28, faceY + 12);
        ctx.lineTo(cx + 10, faceY + 14);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 28, faceY + 18);
        ctx.lineTo(cx + 10, faceY + 18);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 182, 193, 0.7)';
        ctx.beginPath();
        ctx.arc(cx - 30, faceY + 14, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 30, faceY + 14, 10, 0, Math.PI * 2);
        ctx.fill();
    },

    drawSteam(x, y, frame) {
        const ctx = this.ctx;
        const offset = Math.sin(frame * 0.3) * 5;
        
        ctx.beginPath();
        ctx.arc(x + offset, y - frame * 2, 5 + frame * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x - offset + 10, y - frame * 2 - 10, 4 + frame * 0.4, 0, Math.PI * 2);
        ctx.fill();
    },

    drawAttackEffect(char) {
        const ctx = this.ctx;
        const attack = char.currentAttack;
        
        if (!attack || char.attackPhase !== 'hit') return;

        let effectX = char.facingRight ? char.width + 20 : -40;
        let effectY = char.height / 2;

        if (attack === ATTACKS.ANGRY_ROAR) {
            const colors = ['#FF5722', '#FF9800', '#FFC107'];
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = colors[i];
                ctx.globalAlpha = 0.6 - i * 0.15;
                ctx.beginPath();
                ctx.arc(effectX + i * 15, effectY, 40 - i * 8, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 28px Arial';
            ctx.fillText('💢', effectX - 15, effectY + 10);
            ctx.font = 'bold 16px Arial';
            ctx.fillText('气死我了!', effectX - 40, effectY + 40);
        } else if (attack === ATTACKS.BELLY_SLAP) {
            ctx.fillStyle = 'rgba(255, 193, 7, 0.8)';
            ctx.beginPath();
            ctx.ellipse(char.width / 2, effectY + 20, 40, 30, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#FF5722';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(char.width / 2, effectY + 20, 30, 0, Math.PI);
            ctx.stroke();
            
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 24px Arial';
            ctx.fillText('啪!', char.width / 2 - 15, effectY + 28);
        } else if (attack.isUltimate) {
            for (let i = 0; i < 5; i++) {
                ctx.fillStyle = `hsl(${30 + i * 15}, 100%, ${50 + i * 10}%)`;
                ctx.globalAlpha = 0.8 - i * 0.12;
                ctx.beginPath();
                ctx.arc(effectX, char.height + 10, 70 - i * 10, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 32px Arial';
            ctx.fillText('💥', effectX - 20, char.height + 20);
            ctx.font = 'bold 18px Arial';
            ctx.fillText('必杀踩!', effectX - 35, char.height + 50);
            
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const starX = effectX + Math.cos(angle) * 60;
                const starY = char.height + 10 + Math.sin(angle) * 60;
                this.drawStar(starX, starY, 8, '#FFEB3B');
            }
        } else if (attack === ATTACKS.LIGHT_STOMP) {
            ctx.fillStyle = 'rgba(76, 175, 80, 0.7)';
            ctx.beginPath();
            ctx.ellipse(effectX, char.height + 8, 35, 18, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 18px Arial';
            ctx.fillText('咚!', effectX - 15, char.height + 15);
        } else if (attack === ATTACKS.HEAVY_STOMP) {
            ctx.fillStyle = 'rgba(121, 85, 72, 0.8)';
            ctx.beginPath();
            ctx.ellipse(effectX, char.height + 10, 50, 25, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#5D4037';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(effectX, char.height + 10, 40, 18, 0, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 22px Arial';
            ctx.fillText('哐!', effectX - 18, char.height + 18);
        }
    },

    drawEffects(effects) {
        const ctx = this.ctx;
        
        effects.forEach(effect => {
            if (effect.type === 'hit') {
                ctx.fillStyle = `rgba(255, 100, 100, ${effect.alpha})`;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                ctx.fill();
                
                this.drawStar(effect.x, effect.y, effect.radius * 0.5, `rgba(255, 235, 59, ${effect.alpha})`);
            } else if (effect.type === 'stomp') {
                ctx.fillStyle = `rgba(139, 69, 19, ${effect.alpha})`;
                ctx.beginPath();
                ctx.ellipse(effect.x, effect.y, effect.radius * 2, effect.radius * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    },

    drawStar(x, y, size, color) {
        const ctx = this.ctx;
        ctx.fillStyle = color;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const px = x + Math.cos(angle) * size;
            const py = y + Math.sin(angle) * size;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    },

    drawParticles(particles) {
        const ctx = this.ctx;
        
        particles.forEach(p => {
            ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
    },

    applyScreenShake(shake) {
        this.ctx.translate(shake.x, shake.y);
    },

    updateUI(state) {
        if (state.player && state.enemy) {
            document.getElementById('player-rage').style.width = `${state.player.rage}%`;
            document.getElementById('enemy-rage').style.width = `${state.enemy.rage}%`;
        }
        document.getElementById('timer').textContent = Math.ceil(state.timer);
    },

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    },

    hideScreens() {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    },

    showPauseMenu() {
        document.getElementById('pause-menu').classList.remove('hidden');
    },

    hidePauseMenu() {
        document.getElementById('pause-menu').classList.add('hidden');
    },

    showResult(isVictory, message) {
        const titleEl = document.getElementById('result-title');
        titleEl.textContent = isVictory ? '🎉 胜利！🎉' : '😢 失败...';
        titleEl.className = isVictory ? 'victory' : 'defeat';
        document.getElementById('result-message').textContent = message;
        this.showScreen('result-screen');
    },

    highlightSelectedChar(index) {
        document.querySelectorAll('.char-card').forEach((card, i) => {
            card.classList.toggle('selected', i === index);
        });
    }
};