const CatAnimator = {
    canvas: null,
    ctx: null,
    animationId: null,
    isRunning: false,
    currentCatType: 'lihua',
    
    CAT_TYPES: {
        lihua: {
            name: '狸花猫',
            bodyColor: '#E8A87C',
            bodyLight: '#F5D5B8',
            stripeColor: '#8B5A2B',
            earColor: '#D4956A',
            innerEar: '#C17F5A',
            cheekColor: '#FFB3BA',
            eyeColor: '#5D4037',
            noseColor: '#FF8787',
            hasStripes: true,
            faceType: 'normal',
            eyeSize: 1.0
        },
        siamese: {
            name: '暹罗猫',
            bodyColor: '#F5F5F5',
            bodyLight: '#FFFFFF',
            stripeColor: '#4A4A4A',
            earColor: '#3A3A3A',
            innerEar: '#2A2A2A',
            cheekColor: '#E8D5D5',
            eyeColor: '#4FC3F7',
            noseColor: '#8B8B8B',
            hasStripes: false,
            hasPoints: true,
            faceType: 'slender',
            eyeSize: 1.2
        },
        persian: {
            name: '波斯猫',
            bodyColor: '#FAFAFA',
            bodyLight: '#FFFFFF',
            stripeColor: '#E0E0E0',
            earColor: '#F0F0F0',
            innerEar: '#FFCDD2',
            cheekColor: '#FFEBEE',
            eyeColor: '#7B1FA2',
            noseColor: '#FFCDD2',
            hasStripes: false,
            hasFlatFace: true,
            hasLongFur: true,
            faceType: 'round',
            eyeSize: 1.3
        }
    },

    state: {
        catState: 'idle',
        frame: 0,
        blinkTimer: 0,
        mouthOpen: 0,
        tailWag: 0,
        earWiggle: 0,
        sneezeTimer: 0,
        isSneezing: false,
        hearts: [],
        pawPrints: [],
        whiskerWave: 0
    },

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        const settings = Storage.getSettings();
        this.currentCatType = settings.catType || 'lihua';
        
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.start();
    },

    setCatType(catType) {
        if (this.CAT_TYPES[catType]) {
            this.currentCatType = catType;
        }
    },

    getCatInfo() {
        return this.CAT_TYPES[this.currentCatType] || this.CAT_TYPES.lihua;
    },

    resizeCanvas() {
        if (!this.canvas) return;
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    },

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
    },

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    },

    animate() {
        if (!this.isRunning) return;
        
        this.update();
        this.draw();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    },

    update() {
        const state = this.state;
        state.frame++;
        
        state.blinkTimer++;
        if (state.blinkTimer > 180) {
            state.blinkTimer = 0;
        }
        
        state.tailWag += 0.05;
        state.whiskerWave += 0.1;
        state.earWiggle = Math.sin(state.frame * 0.02) * 0.1;
        
        if (state.isSneezing) {
            state.sneezeTimer++;
            if (state.sneezeTimer > 30) {
                state.isSneezing = false;
                state.sneezeTimer = 0;
                state.catState = 'idle';
            }
        }
        
        if (state.mouthOpen > 0) {
            state.mouthOpen -= 0.05;
        }
        
        this.updateHearts();
        this.updatePawPrints();
    },

    updateHearts() {
        const state = this.state;
        state.hearts = state.hearts.filter(heart => {
            heart.y -= 2;
            heart.x += heart.vx;
            heart.size *= 0.98;
            heart.alpha -= 0.02;
            return heart.alpha > 0;
        });
    },

    updatePawPrints() {
        const state = this.state;
        state.pawPrints = state.pawPrints.filter(print => {
            print.alpha -= 0.01;
            return print.alpha > 0;
        });
    },

    draw() {
        if (!this.ctx || !this.canvas) return;
        
        const ctx = this.ctx;
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        
        ctx.clearRect(0, 0, width, height);
        
        this.drawBackground(width, height);
        this.drawPawPrints(width, height);
        this.drawCat(width, height);
        this.drawHearts(width, height);
        this.drawSleepZzz(width, height);
    },

    drawBackground(width, height) {
        const ctx = this.ctx;
        const catInfo = this.getCatInfo();
        
        let bgColor1, bgColor2;
        
        if (this.currentCatType === 'lihua') {
            bgColor1 = '#FFF8E1';
            bgColor2 = '#FFE0B2';
        } else if (this.currentCatType === 'siamese') {
            bgColor1 = '#E3F2FD';
            bgColor2 = '#BBDEFB';
        } else {
            bgColor1 = '#FCE4EC';
            bgColor2 = '#F8BBD9';
        }
        
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, Math.max(width, height) / 2
        );
        gradient.addColorStop(0, bgColor1);
        gradient.addColorStop(1, bgColor2);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        ctx.globalAlpha = 0.15;
        ctx.font = '30px Arial';
        
        const pawColor = this.currentCatType === 'lihua' ? '#8B5A2B' : 
                        this.currentCatType === 'siamese' ? '#4A4A4A' : '#E91E63';
        ctx.fillStyle = pawColor;
        ctx.fillText('🐾', 20, 40);
        ctx.fillText('🐾', width - 50, height - 30);
        
        if (this.currentCatType === 'lihua') {
            ctx.font = '24px Arial';
            ctx.fillText('🎋', width - 60, 40);
            ctx.fillText('🎋', 30, height - 40);
        } else if (this.currentCatType === 'siamese') {
            ctx.font = '24px Arial';
            ctx.fillText('🏛️', width - 60, 40);
            ctx.fillText('�', 30, height - 40);
        } else {
            ctx.font = '24px Arial';
            ctx.fillText('�', width - 60, 40);
            ctx.fillText('💐', 30, height - 40);
        }
        
        ctx.globalAlpha = 1;
    },

    drawCat(width, height) {
        const ctx = this.ctx;
        const state = this.state;
        const catInfo = this.getCatInfo();
        const centerX = width / 2;
        const centerY = height / 2 + 30;
        const scale = Math.min(width, height) / 400;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        
        this.drawTail(state.tailWag, catInfo);
        this.drawBody(catInfo);
        this.drawHead(state, catInfo);
        
        ctx.restore();
    },

    drawTail(tailWag, catInfo) {
        const ctx = this.ctx;
        
        ctx.strokeStyle = catInfo.bodyColor;
        ctx.lineWidth = this.currentCatType === 'persian' ? 35 : 25;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(40, 30);
        
        const tailAngle = Math.sin(tailWag) * 0.5;
        const tailLength = this.currentCatType === 'siamese' ? 120 : 100;
        
        ctx.quadraticCurveTo(
            80 + Math.sin(tailWag) * 30,
            10,
            40 + tailLength + Math.sin(tailWag) * 50,
            -20
        );
        ctx.stroke();
        
        if (catInfo.hasStripes) {
            ctx.strokeStyle = catInfo.stripeColor;
            ctx.lineWidth = 3;
            for (let i = 0; i < 3; i++) {
                const t = 0.3 + i * 0.2;
                ctx.beginPath();
                const x = 60 + t * (tailLength - 20);
                const y = 20 - t * 60;
                ctx.moveTo(x - 8, y - 8);
                ctx.lineTo(x + 8, y + 8);
                ctx.stroke();
            }
        }
        
        if (catInfo.hasPoints) {
            ctx.strokeStyle = catInfo.stripeColor;
            ctx.lineWidth = this.currentCatType === 'persian' ? 35 : 25;
            ctx.beginPath();
            ctx.moveTo(40 + tailLength - 20, -10);
            ctx.lineTo(40 + tailLength + Math.sin(tailWag) * 20, -20);
            ctx.stroke();
        }
    },

    drawBody(catInfo) {
        const ctx = this.ctx;
        
        ctx.fillStyle = catInfo.bodyColor;
        ctx.beginPath();
        ctx.ellipse(0, 40, 60, 45, 0, 0, Math.PI * 2);
        ctx.fill();
        
        if (catInfo.hasLongFur) {
            ctx.fillStyle = catInfo.bodyLight;
            for (let i = 0; i < 8; i++) {
                const angle = -Math.PI / 4 + (i / 8) * Math.PI * 0.8;
                const radius = 50 + Math.sin(i * 0.8) * 10;
                const x = Math.cos(angle) * radius;
                const y = 40 + Math.sin(angle) * (radius * 0.7);
                
                ctx.beginPath();
                ctx.ellipse(x, y, 15, 20, angle, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.fillStyle = catInfo.bodyLight;
        ctx.beginPath();
        ctx.ellipse(0, 45, 35, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        
        if (catInfo.hasStripes) {
            ctx.fillStyle = catInfo.stripeColor;
            
            for (let i = 0; i < 4; i++) {
                const x = -40 + i * 25;
                ctx.beginPath();
                ctx.moveTo(x, 10);
                ctx.lineTo(x - 5, 50);
                ctx.lineTo(x + 5, 55);
                ctx.lineTo(x + 10, 15);
                ctx.closePath();
                ctx.fill();
            }
        }
        
        ctx.fillStyle = catInfo.bodyColor;
        ctx.beginPath();
        ctx.ellipse(-30, 70, 20, 15, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(30, 70, 20, 15, -0.2, 0, Math.PI * 2);
        ctx.fill();
        
        if (catInfo.hasPoints) {
            ctx.fillStyle = catInfo.stripeColor;
            ctx.beginPath();
            ctx.ellipse(-30, 75, 18, 12, 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(30, 75, 18, 12, -0.2, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    drawHead(state, catInfo) {
        const ctx = this.ctx;
        const isBlinking = state.blinkTimer > 170;
        const faceType = catInfo.faceType;
        
        let headRadius = 55;
        if (faceType === 'round') {
            headRadius = 65;
        } else if (faceType === 'slender') {
            headRadius = 50;
        }
        
        ctx.fillStyle = catInfo.bodyColor;
        ctx.beginPath();
        
        if (faceType === 'round') {
            ctx.arc(0, -20, headRadius, 0, Math.PI * 2);
        } else if (faceType === 'slender') {
            ctx.ellipse(0, -20, headRadius, headRadius * 1.1, 0, 0, Math.PI * 2);
        } else {
            ctx.arc(0, -20, headRadius, 0, Math.PI * 2);
        }
        ctx.fill();
        
        if (catInfo.hasLongFur) {
            ctx.fillStyle = catInfo.bodyLight;
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const x = Math.cos(angle) * (headRadius - 5);
                const y = -20 + Math.sin(angle) * (headRadius - 5);
                
                ctx.beginPath();
                ctx.ellipse(x, y, 12, 15, angle, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        if (catInfo.hasStripes) {
            ctx.fillStyle = catInfo.stripeColor;
            
            ctx.beginPath();
            ctx.moveTo(-10, -55);
            ctx.lineTo(0, -70);
            ctx.lineTo(10, -55);
            ctx.lineTo(5, -50);
            ctx.lineTo(0, -60);
            ctx.lineTo(-5, -50);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(-25, -45);
            ctx.lineTo(-20, -60);
            ctx.lineTo(-15, -45);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(15, -45);
            ctx.lineTo(20, -60);
            ctx.lineTo(25, -45);
            ctx.closePath();
            ctx.fill();
        }
        
        this.drawEars(state.earWiggle, catInfo);
        
        ctx.fillStyle = catInfo.cheekColor;
        ctx.beginPath();
        ctx.ellipse(-35, -5, 15, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(35, -5, 15, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        if (isBlinking || state.isSneezing) {
            ctx.strokeStyle = '#4A4A4A';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            ctx.moveTo(-25, -25);
            ctx.lineTo(-15, -25);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(15, -25);
            ctx.lineTo(25, -25);
            ctx.stroke();
        } else {
            this.drawEyes(catInfo);
        }
        
        this.drawNose(catInfo);
        this.drawMouth(state, catInfo);
        this.drawWhiskers(state.whiskerWave, catInfo);
    },

    drawEars(earWiggle, catInfo) {
        const ctx = this.ctx;
        
        ctx.fillStyle = catInfo.earColor;
        
        ctx.save();
        ctx.translate(-40, -60);
        ctx.rotate(-0.3 + earWiggle);
        
        if (catInfo.faceType === 'round') {
            ctx.beginPath();
            ctx.arc(0, -15, 25, 0, Math.PI * 2);
            ctx.fill();
        } else if (catInfo.faceType === 'slender') {
            ctx.beginPath();
            ctx.moveTo(0, -40);
            ctx.lineTo(-20, 10);
            ctx.lineTo(15, 10);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(0, -30);
            ctx.lineTo(-25, 15);
            ctx.lineTo(20, 15);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.fillStyle = catInfo.innerEar;
        if (catInfo.faceType === 'round') {
            ctx.beginPath();
            ctx.arc(0, -15, 15, 0, Math.PI * 2);
            ctx.fill();
        } else if (catInfo.faceType === 'slender') {
            ctx.beginPath();
            ctx.moveTo(0, -30);
            ctx.lineTo(-10, 5);
            ctx.lineTo(8, 5);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.lineTo(-12, 8);
            ctx.lineTo(10, 8);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
        
        ctx.save();
        ctx.translate(40, -60);
        ctx.rotate(0.3 - earWiggle);
        
        ctx.fillStyle = catInfo.earColor;
        if (catInfo.faceType === 'round') {
            ctx.beginPath();
            ctx.arc(0, -15, 25, 0, Math.PI * 2);
            ctx.fill();
        } else if (catInfo.faceType === 'slender') {
            ctx.beginPath();
            ctx.moveTo(0, -40);
            ctx.lineTo(-15, 10);
            ctx.lineTo(20, 10);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(0, -30);
            ctx.lineTo(-20, 15);
            ctx.lineTo(25, 15);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.fillStyle = catInfo.innerEar;
        if (catInfo.faceType === 'round') {
            ctx.beginPath();
            ctx.arc(0, -15, 15, 0, Math.PI * 2);
            ctx.fill();
        } else if (catInfo.faceType === 'slender') {
            ctx.beginPath();
            ctx.moveTo(0, -30);
            ctx.lineTo(-8, 5);
            ctx.lineTo(10, 5);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.lineTo(-10, 8);
            ctx.lineTo(12, 8);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
        
        if (catInfo.hasPoints) {
            ctx.fillStyle = catInfo.stripeColor;
            
            ctx.save();
            ctx.translate(-40, -60);
            ctx.rotate(-0.3 + earWiggle);
            if (catInfo.faceType === 'slender') {
                ctx.beginPath();
                ctx.moveTo(0, -40);
                ctx.lineTo(-20, 10);
                ctx.lineTo(15, 10);
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.moveTo(0, -30);
                ctx.lineTo(-25, 15);
                ctx.lineTo(20, 15);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
            
            ctx.save();
            ctx.translate(40, -60);
            ctx.rotate(0.3 - earWiggle);
            if (catInfo.faceType === 'slender') {
                ctx.beginPath();
                ctx.moveTo(0, -40);
                ctx.lineTo(-15, 10);
                ctx.lineTo(20, 10);
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.moveTo(0, -30);
                ctx.lineTo(-20, 15);
                ctx.lineTo(25, 15);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        }
    },

    drawEyes(catInfo) {
        const ctx = this.ctx;
        const eyeScale = catInfo.eyeSize;
        
        const eyeOffsetX = catInfo.faceType === 'slender' ? 25 : 20;
        const eyeOffsetY = catInfo.hasFlatFace ? -20 : -25;
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.ellipse(-eyeOffsetX, eyeOffsetY, 15 * eyeScale, 18 * eyeScale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(eyeOffsetX, eyeOffsetY, 15 * eyeScale, 18 * eyeScale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = catInfo.eyeColor;
        ctx.beginPath();
        ctx.ellipse(-eyeOffsetX, eyeOffsetY - 2, 8 * eyeScale, 12 * eyeScale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(eyeOffsetX, eyeOffsetY - 2, 8 * eyeScale, 12 * eyeScale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#1A1A1A';
        ctx.beginPath();
        ctx.ellipse(-eyeOffsetX, eyeOffsetY - 2, 4 * eyeScale, 8 * eyeScale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(eyeOffsetX, eyeOffsetY - 2, 4 * eyeScale, 8 * eyeScale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(-eyeOffsetX + 4, eyeOffsetY - 8, 4 * eyeScale * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeOffsetX + 4, eyeOffsetY - 8, 4 * eyeScale * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(-eyeOffsetX - 4, eyeOffsetY - 3, 3 * eyeScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeOffsetX - 4, eyeOffsetY - 3, 3 * eyeScale, 0, Math.PI * 2);
        ctx.fill();
    },

    drawNose(catInfo) {
        const ctx = this.ctx;
        const noseY = catInfo.hasFlatFace ? -5 : -5;
        
        ctx.fillStyle = catInfo.noseColor;
        ctx.beginPath();
        ctx.moveTo(0, noseY);
        ctx.lineTo(-8, noseY + 8);
        ctx.lineTo(0, noseY + 13);
        ctx.lineTo(8, noseY + 8);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.ellipse(-3, noseY + 3, 2, 2, 0, 0, Math.PI * 2);
        ctx.fill();
    },

    drawMouth(state, catInfo) {
        const ctx = this.ctx;
        const mouthOpen = state.mouthOpen || 0;
        const isSneezing = state.isSneezing;
        const mouthY = catInfo.hasFlatFace ? 10 : 8;
        
        ctx.strokeStyle = '#4A4A4A';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        if (mouthOpen > 0.1 || isSneezing) {
            const openAmount = isSneezing ? 0.8 : mouthOpen;
            
            ctx.fillStyle = '#FFB8B8';
            ctx.beginPath();
            ctx.ellipse(0, mouthY + 10, 12 * (1 + openAmount), 10 * (1 + openAmount * 2), 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#FF6B6B';
            ctx.beginPath();
            ctx.ellipse(0, mouthY + 14, 8, 5, 0, 0, Math.PI);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(0, mouthY);
            ctx.lineTo(0, mouthY + 7);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(-8, mouthY + 7, 8, Math.PI * 0.8, Math.PI * 0.1, true);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(8, mouthY + 7, 8, Math.PI * 0.9, Math.PI * 0.2);
            ctx.stroke();
        }
    },

    drawWhiskers(whiskerWave, catInfo) {
        const ctx = this.ctx;
        
        ctx.strokeStyle = catInfo.hasPoints ? '#8B8B8B' : '#666';
        ctx.lineWidth = catInfo.faceType === 'round' ? 1.5 : 2;
        
        const wave = Math.sin(whiskerWave) * 2;
        const startY = catInfo.hasFlatFace ? 3 : 5;
        
        ctx.beginPath();
        ctx.moveTo(-15, startY);
        ctx.quadraticCurveTo(-40, startY - 5 + wave, -55, startY - 10 + wave);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(-15, startY + 5);
        ctx.quadraticCurveTo(-45, startY + 5, -60, startY + 5);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(-15, startY + 10);
        ctx.quadraticCurveTo(-40, startY + 15 - wave, -55, startY + 20 - wave);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(15, startY);
        ctx.quadraticCurveTo(40, startY - 5 + wave, 55, startY - 10 + wave);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(15, startY + 5);
        ctx.quadraticCurveTo(45, startY + 5, 60, startY + 5);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(15, startY + 10);
        ctx.quadraticCurveTo(40, startY + 15 - wave, 55, startY + 20 - wave);
        ctx.stroke();
    },

    drawHearts(width, height) {
        const ctx = this.ctx;
        
        this.state.hearts.forEach(heart => {
            ctx.save();
            ctx.globalAlpha = heart.alpha;
            ctx.fillStyle = '#FF6B6B';
            ctx.font = `${heart.size}px Arial`;
            ctx.fillText('💕', heart.x, heart.y);
            ctx.restore();
        });
    },

    drawPawPrints(width, height) {
        const ctx = this.ctx;
        
        this.state.pawPrints.forEach(print => {
            ctx.save();
            ctx.globalAlpha = print.alpha;
            ctx.font = '24px Arial';
            ctx.fillText('🐾', print.x, print.y);
            ctx.restore();
        });
    },

    drawSleepZzz(width, height) {
        if (!Translator.isLateNight()) return;
        
        const ctx = this.ctx;
        const state = this.state;
        
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#666';
        ctx.font = '24px Arial';
        
        const zPositions = [
            { x: width / 2 + 40, y: height / 2 - 80, offset: 0 },
            { x: width / 2 + 60, y: height / 2 - 100, offset: 30 },
            { x: width / 2 + 80, y: height / 2 - 120, offset: 60 }
        ];
        
        zPositions.forEach((pos, i) => {
            const wave = Math.sin((state.frame + pos.offset) * 0.05) * 5;
            ctx.font = `${18 + i * 6}px Arial`;
            ctx.fillText('Z', pos.x + wave, pos.y + wave * 0.5);
        });
        
        ctx.restore();
    },

    triggerMouthOpen() {
        this.state.mouthOpen = 1;
    },

    triggerSneeze() {
        this.state.isSneezing = true;
        this.state.sneezeTimer = 0;
        this.state.catState = 'sneezing';
        
        for (let i = 0; i < 3; i++) {
            this.state.pawPrints.push({
                x: 200 + Math.random() * 100,
                y: 200 + Math.random() * 100,
                alpha: 0.8
            });
        }
    },

    triggerHearts() {
        for (let i = 0; i < 10; i++) {
            this.state.hearts.push({
                x: 150 + Math.random() * 100,
                y: 200 + Math.random() * 50,
                vx: (Math.random() - 0.5) * 3,
                size: 20 + Math.random() * 20,
                alpha: 1
            });
        }
    },

    triggerMeow(soundType) {
        this.triggerMouthOpen();
        
        if (soundType === 'purr') {
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    this.triggerMouthOpen();
                }, i * 200);
            }
        }
    }
};
