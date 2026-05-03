import { catTypes } from './data.js';

export const CatAnimation = {
    canvas: null,
    ctx: null,
    animationId: null,
    currentCatType: null,
    catState: {
        eyeState: 'open',
        mouthState: 'closed',
        tailAngle: 0,
        earAngle: 0,
        isSneezing: false,
        sneezeTimer: 0,
        blinkTimer: 0
    },
    emotions: {
        happy: { eyeState: 'happy', mouthState: 'smile' },
        sad: { eyeState: 'sad', mouthState: 'frown' },
        angry: { eyeState: 'angry', mouthState: 'hiss' },
        sleepy: { eyeState: 'half', mouthState: 'closed' },
        surprised: { eyeState: 'wide', mouthState: 'open' },
        neutral: { eyeState: 'open', mouthState: 'closed' }
    },

    defaultColors: {
        body: '#FFB3BA',
        bodyDark: '#FF9AA2',
        bodyLight: '#FFD1DC',
        bodyHighlight: '#FFE5EC',
        ears: '#FFB3BA',
        earsInner: '#FF9AA2',
        nose: '#FF6B9D',
        cheeks: '#FFB6C1',
        eyes: '#5D4E6D',
        tail: '#FFB3BA',
        tailTip: '#FF9AA2',
        whiskers: '#7D6D8D'
    },

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        this.startAnimation();
        return this;
    },

    setCatType(catTypeId) {
        const catType = catTypes.find(c => c.id === catTypeId);
        if (catType) {
            this.currentCatType = catType;
        } else {
            this.currentCatType = null;
        }
    },

    getColor(colorName) {
        if (this.currentCatType && this.currentCatType.colors && this.currentCatType.colors[colorName]) {
            return this.currentCatType.colors[colorName];
        }
        return this.defaultColors[colorName] || this.defaultColors.body;
    },

    startAnimation() {
        const animate = () => {
            this.update();
            this.draw();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    },

    update() {
        this.catState.tailAngle = Math.sin(Date.now() / 600) * 0.15;
        this.catState.earAngle = Math.sin(Date.now() / 1200) * 0.03;
        
        if (this.catState.isSneezing) {
            this.catState.sneezeTimer--;
            if (this.catState.sneezeTimer <= 0) {
                this.catState.isSneezing = false;
                this.setEmotion('neutral');
            }
        }
    },

    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;

        ctx.clearRect(0, 0, width, height);

        this.drawBackground(ctx, centerX, centerY);
        this.drawTail(ctx, centerX, centerY);
        this.drawBody(ctx, centerX, centerY);
        this.drawHead(ctx, centerX, centerY - 10);
        this.drawEars(ctx, centerX, centerY - 10);
        this.drawEyes(ctx, centerX, centerY - 10);
        this.drawNoseAndMouth(ctx, centerX, centerY - 10);
        this.drawWhiskers(ctx, centerX, centerY - 10);
    },

    drawBackground(ctx, centerX, centerY) {
        let color1 = '#FFE5EC';
        let color2 = '#FECFEF';

        if (this.currentCatType) {
            color1 = this.currentCatType.theme.secondary;
            color2 = this.currentCatType.theme.primary;
        }

        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 100);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },

    drawBody(ctx, centerX, centerY) {
        const bodyColor = this.getColor('body');
        const bodyDark = this.getColor('bodyDark');
        const bodyLight = this.getColor('bodyLight');
        const bodyHighlight = this.getColor('bodyHighlight');

        ctx.save();
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;

        const bodyGradient = ctx.createRadialGradient(
            centerX - 10, centerY + 35, 5,
            centerX, centerY + 40, 60
        );
        bodyGradient.addColorStop(0, bodyHighlight);
        bodyGradient.addColorStop(0.5, bodyColor);
        bodyGradient.addColorStop(1, bodyDark);

        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 40, 55, 50, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = 'transparent';

        const bellyGradient = ctx.createRadialGradient(
            centerX, centerY + 40, 5,
            centerX, centerY + 45, 30
        );
        bellyGradient.addColorStop(0, bodyHighlight);
        bellyGradient.addColorStop(1, bodyLight);

        ctx.fillStyle = bellyGradient;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 45, 35, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        this.drawPaws(ctx, centerX, centerY);

        if (this.currentCatType && this.currentCatType.id === 'orange_tabby') {
            this.drawOrangeTabbyStripes(ctx, centerX, centerY);
        }

        if (this.currentCatType && this.currentCatType.id === 'siamese') {
            this.drawSiamesePaws(ctx, centerX, centerY);
        }

        ctx.restore();
    },

    drawPaws(ctx, centerX, centerY) {
        const bodyColor = this.getColor('body');
        const bodyDark = this.getColor('bodyDark');

        const drawPaw = (x, y) => {
            const pawGradient = ctx.createRadialGradient(x, y - 2, 2, x, y + 3, 12);
            pawGradient.addColorStop(0, bodyColor);
            pawGradient.addColorStop(1, bodyDark);

            ctx.fillStyle = pawGradient;
            ctx.beginPath();
            ctx.ellipse(x, y, 14, 12, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = this.getColor('nose');
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.ellipse(x - 6, y + 5, 4, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x - 2, y + 6, 4, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + 3, y + 5, 4, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        };

        drawPaw(centerX - 35, centerY + 75);
        drawPaw(centerX + 35, centerY + 75);
    },

    drawOrangeTabbyStripes(ctx, centerX, centerY) {
        const stripeColor = this.getColor('stripes');
        
        ctx.fillStyle = stripeColor;
        ctx.globalAlpha = 0.4;

        for (let i = 0; i < 3; i++) {
            const yOffset = i * 12;
            const width = 50 - i * 8;
            const height = 6;
            
            ctx.beginPath();
            ctx.ellipse(centerX, centerY + 30 + yOffset, width, height, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
    },

    drawSiamesePaws(ctx, centerX, centerY) {
        const pawColor = this.getColor('paws');
        
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = pawColor;

        ctx.beginPath();
        ctx.ellipse(centerX - 35, centerY + 70, 16, 20, 0, 0, Math.PI);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(centerX + 35, centerY + 70, 16, 20, 0, 0, Math.PI);
        ctx.fill();

        ctx.globalAlpha = 1;
    },

    drawTail(ctx, centerX, centerY) {
        const tailColor = this.getColor('tail');
        const tailTip = this.getColor('tailTip');
        const bodyHighlight = this.getColor('bodyHighlight');

        ctx.save();
        ctx.translate(centerX + 45, centerY + 50);
        ctx.rotate(0.4 + this.catState.tailAngle);

        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 3;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(0, 0);
        
        for (let i = 0; i <= 20; i++) {
            const t = i / 20;
            const x = t * 60;
            const y = Math.sin(t * Math.PI) * -25;
            const width = 14 - t * 8;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(this.catState.tailAngle * 0.5);
            
            const tailGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, width);
            if (t > 0.7) {
                tailGradient.addColorStop(0, tailTip);
                tailGradient.addColorStop(1, tailColor);
            } else {
                tailGradient.addColorStop(0, bodyHighlight);
                tailGradient.addColorStop(0.5, tailColor);
                tailGradient.addColorStop(1, tailTip);
            }
            
            ctx.fillStyle = tailGradient;
            ctx.beginPath();
            ctx.ellipse(0, 0, width, width * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }

        if (this.currentCatType && this.currentCatType.id === 'orange_tabby') {
            const stripeColor = this.getColor('stripes');
            ctx.fillStyle = stripeColor;
            ctx.globalAlpha = 0.3;
            
            for (let i = 0; i < 3; i++) {
                const t = 0.3 + i * 0.2;
                const x = t * 60;
                const y = Math.sin(t * Math.PI) * -25;
                
                ctx.beginPath();
                ctx.ellipse(x, y, 8, 3, 0.3, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.globalAlpha = 1;
        }

        ctx.restore();
    },

    drawHead(ctx, centerX, centerY) {
        const bodyColor = this.getColor('body');
        const bodyDark = this.getColor('bodyDark');
        const bodyHighlight = this.getColor('bodyHighlight');

        ctx.save();
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;

        const headGradient = ctx.createRadialGradient(
            centerX - 15, centerY - 15, 5,
            centerX, centerY, 65
        );
        headGradient.addColorStop(0, bodyHighlight);
        headGradient.addColorStop(0.6, bodyColor);
        headGradient.addColorStop(1, bodyDark);

        ctx.fillStyle = headGradient;
        ctx.beginPath();
        
        ctx.moveTo(centerX - 45, centerY);
        ctx.quadraticCurveTo(centerX - 45, centerY - 35, centerX - 20, centerY - 45);
        ctx.quadraticCurveTo(centerX, centerY - 55, centerX + 20, centerY - 45);
        ctx.quadraticCurveTo(centerX + 45, centerY - 35, centerX + 45, centerY);
        ctx.quadraticCurveTo(centerX + 40, centerY + 25, centerX, centerY + 35);
        ctx.quadraticCurveTo(centerX - 40, centerY + 25, centerX - 45, centerY);
        
        ctx.fill();

        ctx.shadowColor = 'transparent';

        const foreheadGradient = ctx.createRadialGradient(
            centerX, centerY - 20, 5,
            centerX, centerY - 15, 30
        );
        foreheadGradient.addColorStop(0, bodyHighlight);
        foreheadGradient.addColorStop(1, 'transparent');

        ctx.fillStyle = foreheadGradient;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - 20, 35, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (this.currentCatType && this.currentCatType.id === 'siamese') {
            this.drawSiameseMask(ctx, centerX, centerY);
        }

        if (this.currentCatType && this.currentCatType.id === 'orange_tabby') {
            this.drawOrangeTabbyForehead(ctx, centerX, centerY);
        }

        ctx.restore();
    },

    drawSiameseMask(ctx, centerX, centerY) {
        const maskColor = this.getColor('mask');
        
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = maskColor;

        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 10, 35, 30, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(centerX - 20, centerY + 5, 15, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(centerX + 20, centerY + 5, 15, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
    },

    drawOrangeTabbyForehead(ctx, centerX, centerY) {
        const stripeColor = this.getColor('stripes');
        
        ctx.fillStyle = stripeColor;
        ctx.globalAlpha = 0.4;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 40);
        ctx.lineTo(centerX - 15, centerY - 20);
        ctx.lineTo(centerX - 8, centerY - 20);
        ctx.lineTo(centerX, centerY - 30);
        ctx.lineTo(centerX + 8, centerY - 20);
        ctx.lineTo(centerX + 15, centerY - 20);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(centerX, centerY - 18, 25, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
    },

    drawEars(ctx, centerX, centerY) {
        const earsColor = this.getColor('ears');
        const earsInner = this.getColor('earsInner');
        const bodyHighlight = this.getColor('bodyHighlight');

        const drawEar = (isLeft) => {
            const dir = isLeft ? -1 : 1;
            const baseX = centerX + dir * 35;
            const baseY = centerY - 35;

            ctx.save();
            ctx.translate(baseX, baseY);
            ctx.rotate(dir * (-0.4 + this.catState.earAngle));

            ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
            ctx.shadowBlur = 5;
            ctx.shadowOffsetY = 2;

            const earGradient = ctx.createLinearGradient(0, 0, 0, -45);
            earGradient.addColorStop(0, earsColor);
            earGradient.addColorStop(1, this.currentCatType ? earsColor : bodyHighlight);

            ctx.fillStyle = earGradient;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(dir * -25, -15, dir * -18, -45);
            ctx.quadraticCurveTo(0, -35, dir * 18, -45);
            ctx.quadraticCurveTo(dir * 25, -15, 0, 0);
            ctx.fill();

            ctx.shadowColor = 'transparent';

            ctx.fillStyle = earsInner;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.moveTo(0, -5);
            ctx.quadraticCurveTo(dir * -15, -15, dir * -12, -35);
            ctx.quadraticCurveTo(0, -28, dir * 12, -35);
            ctx.quadraticCurveTo(dir * 15, -15, 0, -5);
            ctx.fill();
            ctx.globalAlpha = 1;

            ctx.strokeStyle = earsInner;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.4;
            
            for (let i = 0; i < 3; i++) {
                const offset = i * 12;
                ctx.beginPath();
                ctx.moveTo(dir * (-10 + offset * 0.3), -15);
                ctx.quadraticCurveTo(dir * (-15 + offset * 0.2), -25 - offset * 0.5, dir * (-12 + offset * 0.1), -35);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;

            ctx.restore();
        };

        drawEar(true);
        drawEar(false);
    },

    drawEyes(ctx, centerX, centerY) {
        const eyeY = centerY - 5;
        const eyesColor = this.getColor('eyes');

        if (this.catState.eyeState === 'closed') {
            this.drawClosedEyes(ctx, centerX, eyeY);
        } else if (this.catState.eyeState === 'half') {
            this.drawHalfEyes(ctx, centerX, eyeY);
        } else if (this.catState.eyeState === 'happy') {
            this.drawHappyEyes(ctx, centerX, eyeY);
        } else if (this.catState.eyeState === 'sad') {
            this.drawSadEyes(ctx, centerX, eyeY, eyesColor);
        } else if (this.catState.eyeState === 'angry') {
            this.drawAngryEyes(ctx, centerX, eyeY, eyesColor);
        } else if (this.catState.eyeState === 'wide') {
            this.drawWideEyes(ctx, centerX, eyeY, eyesColor);
        } else {
            this.drawNormalEyes(ctx, centerX, eyeY, eyesColor);
        }

        this.drawCheeks(ctx, centerX, centerY);
    },

    drawNormalEyes(ctx, centerX, eyeY, eyesColor) {
        const drawEye = (x) => {
            ctx.save();

            const eyeGradient = ctx.createRadialGradient(x, eyeY - 2, 2, x, eyeY, 18);
            eyeGradient.addColorStop(0, '#FFFFFF');
            eyeGradient.addColorStop(0.7, '#F8F8F8');
            eyeGradient.addColorStop(1, '#E8E8E8');

            ctx.fillStyle = eyeGradient;
            ctx.beginPath();
            ctx.ellipse(x, eyeY, 16, 18, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();

            const irisGradient = ctx.createRadialGradient(x, eyeY, 2, x, eyeY, 10);
            irisGradient.addColorStop(0, eyesColor);
            irisGradient.addColorStop(0.7, eyesColor);
            irisGradient.addColorStop(1, this.darkenColor(eyesColor, 0.3));

            ctx.fillStyle = irisGradient;
            ctx.beginPath();
            ctx.ellipse(x, eyeY, 10, 12, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#1A1A2E';
            ctx.beginPath();
            ctx.ellipse(x, eyeY, 5, 7, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.ellipse(x - 4, eyeY - 5, 3, 4, -0.3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.ellipse(x + 3, eyeY + 3, 2, 2, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        };

        drawEye(centerX - 22);
        drawEye(centerX + 22);
    },

    drawClosedEyes(ctx, centerX, eyeY) {
        ctx.strokeStyle = '#5D4E6D';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.arc(centerX - 22, eyeY, 12, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX + 22, eyeY, 12, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
    },

    drawHalfEyes(ctx, centerX, eyeY) {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(centerX - 22, eyeY + 5, 14, 8, 0, 0, Math.PI);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(centerX + 22, eyeY + 5, 14, 8, 0, 0, Math.PI);
        ctx.fill();

        ctx.strokeStyle = '#5D4E6D';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX - 22, eyeY, 12, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX + 22, eyeY, 12, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
    },

    drawHappyEyes(ctx, centerX, eyeY) {
        ctx.strokeStyle = '#5D4E6D';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.arc(centerX - 22, eyeY + 8, 16, 0.8 * Math.PI, 0.2 * Math.PI);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX + 22, eyeY + 8, 16, 0.8 * Math.PI, 0.2 * Math.PI);
        ctx.stroke();

        ctx.fillStyle = '#FF6B9D';
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.ellipse(centerX - 40, eyeY + 10, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(centerX + 40, eyeY + 10, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    },

    drawSadEyes(ctx, centerX, eyeY, eyesColor) {
        this.drawNormalEyes(ctx, centerX, eyeY - 2, eyesColor);

        ctx.fillStyle = '#87CEEB';
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.ellipse(centerX - 22, eyeY + 20, 4, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(centerX + 22, eyeY + 20, 4, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    },

    drawAngryEyes(ctx, centerX, eyeY, eyesColor) {
        this.drawNormalEyes(ctx, centerX, eyeY, eyesColor);

        ctx.strokeStyle = '#5D4E6D';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(centerX - 38, eyeY - 18);
        ctx.lineTo(centerX - 10, eyeY - 8);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(centerX + 38, eyeY - 18);
        ctx.lineTo(centerX + 10, eyeY - 8);
        ctx.stroke();
    },

    drawWideEyes(ctx, centerX, eyeY, eyesColor) {
        const drawEye = (x) => {
            ctx.save();

            const eyeGradient = ctx.createRadialGradient(x, eyeY - 2, 2, x, eyeY, 22);
            eyeGradient.addColorStop(0, '#FFFFFF');
            eyeGradient.addColorStop(0.7, '#F8F8F8');
            eyeGradient.addColorStop(1, '#E8E8E8');

            ctx.fillStyle = eyeGradient;
            ctx.beginPath();
            ctx.ellipse(x, eyeY, 20, 22, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = eyesColor;
            ctx.beginPath();
            ctx.ellipse(x, eyeY, 12, 14, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#1A1A2E';
            ctx.beginPath();
            ctx.ellipse(x, eyeY, 6, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.ellipse(x - 5, eyeY - 6, 4, 5, -0.3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        };

        drawEye(centerX - 22);
        drawEye(centerX + 22);
    },

    drawCheeks(ctx, centerX, centerY) {
        const cheeksColor = this.getColor('cheeks');
        
        ctx.fillStyle = cheeksColor;
        ctx.globalAlpha = 0.4;

        const leftCheek = ctx.createRadialGradient(
            centerX - 45, centerY + 10, 0,
            centerX - 45, centerY + 10, 18
        );
        leftCheek.addColorStop(0, cheeksColor);
        leftCheek.addColorStop(1, 'transparent');
        ctx.fillStyle = leftCheek;
        ctx.beginPath();
        ctx.ellipse(centerX - 45, centerY + 10, 18, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        const rightCheek = ctx.createRadialGradient(
            centerX + 45, centerY + 10, 0,
            centerX + 45, centerY + 10, 18
        );
        rightCheek.addColorStop(0, cheeksColor);
        rightCheek.addColorStop(1, 'transparent');
        ctx.fillStyle = rightCheek;
        ctx.beginPath();
        ctx.ellipse(centerX + 45, centerY + 10, 18, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
    },

    drawNoseAndMouth(ctx, centerX, centerY) {
        const noseY = centerY + 15;
        const noseColor = this.getColor('nose');

        const noseGradient = ctx.createRadialGradient(
            centerX, noseY + 3, 1,
            centerX, noseY + 2, 8
        );
        noseGradient.addColorStop(0, '#FFB6C1');
        noseGradient.addColorStop(1, noseColor);

        ctx.fillStyle = noseGradient;
        ctx.beginPath();
        ctx.moveTo(centerX, noseY);
        ctx.bezierCurveTo(
            centerX - 6, noseY + 2,
            centerX - 8, noseY + 8,
            centerX, noseY + 10
        );
        ctx.bezierCurveTo(
            centerX + 8, noseY + 8,
            centerX + 6, noseY + 2,
            centerX, noseY
        );
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.ellipse(centerX - 2, noseY + 2, 2, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#5D4E6D';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (this.catState.mouthState === 'smile') {
            this.drawSmileMouth(ctx, centerX, noseY);
        } else if (this.catState.mouthState === 'open' || this.catState.isSneezing) {
            this.drawOpenMouth(ctx, centerX, noseY);
        } else if (this.catState.mouthState === 'hiss') {
            this.drawHissMouth(ctx, centerX, noseY);
        } else {
            this.drawClosedMouth(ctx, centerX, noseY);
        }
    },

    drawClosedMouth(ctx, centerX, noseY) {
        ctx.strokeStyle = '#5D4E6D';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(centerX, noseY + 10);
        ctx.lineTo(centerX, noseY + 15);
        ctx.stroke();

        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(centerX - 10, noseY + 15, 10, 0, 0.5 * Math.PI);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX + 10, noseY + 15, 10, 0.5 * Math.PI, Math.PI);
        ctx.stroke();
    },

    drawSmileMouth(ctx, centerX, noseY) {
        ctx.strokeStyle = '#5D4E6D';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(centerX, noseY + 10);
        ctx.lineTo(centerX, noseY + 15);
        ctx.stroke();

        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, noseY + 20, 16, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();

        ctx.fillStyle = '#FF6B9D';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.ellipse(centerX, noseY + 25, 8, 4, 0, 0, Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1;
    },

    drawOpenMouth(ctx, centerX, noseY) {
        ctx.strokeStyle = '#5D4E6D';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(centerX, noseY + 10);
        ctx.lineTo(centerX, noseY + 15);
        ctx.stroke();

        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.ellipse(centerX, noseY + 28, 14, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FF6B9D';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#FF6B9D';
        ctx.beginPath();
        ctx.ellipse(centerX, noseY + 32, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
    },

    drawHissMouth(ctx, centerX, noseY) {
        ctx.strokeStyle = '#5D4E6D';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(centerX, noseY + 10);
        ctx.lineTo(centerX, noseY + 15);
        ctx.stroke();

        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX - 15, noseY + 18);
        ctx.lineTo(centerX - 10, noseY + 28);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(centerX + 15, noseY + 18);
        ctx.lineTo(centerX + 10, noseY + 28);
        ctx.stroke();
    },

    drawWhiskers(ctx, centerX, centerY) {
        const whiskerY = centerY + 18;
        const whiskersColor = this.getColor('whiskers');

        ctx.strokeStyle = whiskersColor;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.7;

        const drawWhisker = (x, y, angle, length) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            
            const gradient = ctx.createLinearGradient(0, 0, length, 0);
            gradient.addColorStop(0, whiskersColor);
            gradient.addColorStop(1, 'transparent');
            ctx.strokeStyle = gradient;
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(length * 0.5, -3, length, 0);
            ctx.stroke();
            
            ctx.restore();
        };

        drawWhisker(centerX - 50, whiskerY - 5, -0.2, 35);
        drawWhisker(centerX - 48, whiskerY, 0, 38);
        drawWhisker(centerX - 50, whiskerY + 5, 0.2, 32);

        drawWhisker(centerX + 50, whiskerY - 5, 0.2 - Math.PI, 35);
        drawWhisker(centerX + 48, whiskerY, Math.PI, 38);
        drawWhisker(centerX + 50, whiskerY + 5, -0.2 - Math.PI, 32);

        ctx.globalAlpha = 1;
    },

    darkenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - amount));
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - amount));
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - amount));
        return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    },

    setEmotion(emotion) {
        if (this.emotions[emotion]) {
            this.catState.eyeState = this.emotions[emotion].eyeState;
            this.catState.mouthState = this.emotions[emotion].mouthState;
        }
    },

    triggerSneeze() {
        this.catState.isSneezing = true;
        this.catState.sneezeTimer = 40;
        this.setEmotion('surprised');

        return new Promise(resolve => {
            setTimeout(() => {
                this.setEmotion('neutral');
                resolve();
            }, 600);
        });
    },

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
};

export const HeartAnimation = {
    container: null,
    hearts: [],

    init() {
        this.container = document.getElementById('easterEgg');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'easterEgg';
            this.container.className = 'easter-egg';
            document.body.appendChild(this.container);
        }
    },

    start() {
        this.init();
        this.container.classList.add('active');
        this.hearts = [];

        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                this.createHeart();
            }, i * 200);
        }

        setTimeout(() => {
            this.stop();
        }, 6000);
    },

    createHeart() {
        const heart = document.createElement('div');
        heart.className = 'heart';
        heart.textContent = '❤️';
        heart.style.left = Math.random() * 100 + '%';
        heart.style.top = Math.random() * 100 + '%';
        heart.style.animationDelay = Math.random() * 2 + 's';
        heart.style.fontSize = (Math.random() * 30 + 20) + 'px';

        this.container.appendChild(heart);
        this.hearts.push(heart);

        setTimeout(() => {
            if (heart.parentNode) {
                heart.parentNode.removeChild(heart);
            }
        }, 5000);
    },

    stop() {
        if (this.container) {
            this.container.classList.remove('active');
            this.container.innerHTML = '';
        }
        this.hearts = [];
    }
};

export default { CatAnimation, HeartAnimation };
