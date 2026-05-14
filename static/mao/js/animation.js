class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.animating = false;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticle(type, x, y, colors) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const particle = {
            x: x || Math.random() * this.canvas.width,
            y: y || Math.random() * this.canvas.height,
            size: Math.random() * 10 + 5,
            speedX: (Math.random() - 0.5) * 8,
            speedY: (Math.random() - 0.5) * 8 - 3,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2,
            color: color,
            type: type,
            opacity: 1,
            life: 100 + Math.random() * 50
        };
        this.particles.push(particle);
    }

    drawHeart(x, y, size, color, opacity) {
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        const topCurveHeight = size * 0.3;
        this.ctx.moveTo(x, y + topCurveHeight);
        this.ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
        this.ctx.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + size, x, y + size);
        this.ctx.bezierCurveTo(x, y + size, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
        this.ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
    }

    drawStar(x, y, size, color, opacity, rotation) {
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const px = Math.cos(angle) * size;
            const py = Math.sin(angle) * size;
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
    }

    drawConfetti(x, y, size, color, opacity, rotation) {
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(-size / 2, -size / 4, size, size / 2);
        this.ctx.restore();
    }

    drawCircle(x, y, size, color, opacity) {
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    drawSquare(x, y, size, color, opacity, rotation) {
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(-size / 2, -size / 2, size, size);
        this.ctx.restore();
    }

    drawParticle(p) {
        switch (p.type) {
            case 'heart':
                this.drawHeart(p.x, p.y, p.size, p.color, p.opacity);
                break;
            case 'star':
                this.drawStar(p.x, p.y, p.size, p.color, p.opacity, p.rotation);
                break;
            case 'confetti':
                this.drawConfetti(p.x, p.y, p.size, p.color, p.opacity, p.rotation);
                break;
            case 'circle':
                this.drawCircle(p.x, p.y, p.size, p.color, p.opacity);
                break;
            case 'square':
                this.drawSquare(p.x, p.y, p.size, p.color, p.opacity, p.rotation);
                break;
            default:
                this.drawConfetti(p.x, p.y, p.size, p.color, p.opacity, p.rotation);
        }
    }

    update() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.speedX;
            p.y += p.speedY;
            p.speedY += 0.1;
            p.rotation += p.rotationSpeed;
            p.life--;
            p.opacity = p.life / 150;
            
            if (p.life <= 0 || p.y > this.canvas.height + 50) {
                this.particles.splice(i, 1);
            } else {
                this.drawParticle(p);
            }
        }
        
        if (this.particles.length > 0) {
            requestAnimationFrame(() => this.update());
        } else {
            this.animating = false;
        }
    }

    burst(type, colors, count = 50) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        for (let i = 0; i < count; i++) {
            this.createParticle(type, centerX, centerY, colors);
        }
        
        if (!this.animating) {
            this.animating = true;
            this.update();
        }
    }

    rain(type, colors, count = 100) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.createParticle(type, null, -20, colors);
            }, i * 30);
        }
        
        if (!this.animating) {
            this.animating = true;
            this.update();
        }
    }
}

class WheelAnimation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.rotation = 0;
        this.isSpinning = false;
        this.segments = [];
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.radius = Math.min(this.centerX, this.centerY) - 10;
    }

    setSegments(segments) {
        this.segments = segments;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.segments.length === 0) return;
        
        const segmentAngle = (2 * Math.PI) / this.segments.length;
        
        this.segments.forEach((segment, index) => {
            const startAngle = this.rotation + index * segmentAngle;
            const endAngle = startAngle + segmentAngle;
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.centerX, this.centerY);
            this.ctx.arc(this.centerX, this.centerY, this.radius, startAngle, endAngle);
            this.ctx.closePath();
            this.ctx.fillStyle = segment.color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            this.ctx.save();
            this.ctx.translate(this.centerX, this.centerY);
            this.ctx.rotate(startAngle + segmentAngle / 2);
            this.ctx.textAlign = 'right';
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillText(segment.text, this.radius - 20, 5);
            this.ctx.restore();
        });
        
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 30, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffd700';
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }

    spin(targetRotation, duration = 3000) {
        if (this.isSpinning) return;
        
        this.isSpinning = true;
        const startRotation = this.rotation;
        const totalRotation = targetRotation + Math.PI * 2 * 10;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            this.rotation = startRotation + (totalRotation - startRotation) * easeOut;
            this.draw();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isSpinning = false;
            }
        };
        
        requestAnimationFrame(animate);
    }
}

let particleSystem;
let wheelAnimation;

function initAnimations() {
    particleSystem = new ParticleSystem('particleCanvas');
    wheelAnimation = new WheelAnimation('wheelCanvas');
}

function triggerCelebration(theme) {
    const themeConfig = themes[theme] || themes.classic;
    const particleType = themeConfig.particles[Math.floor(Math.random() * themeConfig.particles.length)];
    particleSystem.burst(particleType, themeConfig.colors, 80);
}

function triggerConfetti(theme) {
    const themeConfig = themes[theme] || themes.classic;
    particleSystem.rain('confetti', themeConfig.colors, 100);
}

function initWheelSegments(mode, difficulty) {
    const segments = [];
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9'];
    
    if (mode === 'truth' || mode === 'mix') {
        const truthQuestions = getQuestions('truth', difficulty);
        if (truthQuestions.length > 0) {
            const sample = truthQuestions.slice(0, 3);
            sample.forEach((q, i) => {
                segments.push({
                    text: '真心话',
                    color: colors[i % colors.length],
                    type: 'truth',
                    question: q
                });
            });
        }
    }
    
    if (mode === 'dare' || mode === 'mix') {
        const dareChallenges = getQuestions('dare', difficulty);
        if (dareChallenges.length > 0) {
            const sample = dareChallenges.slice(0, 3);
            sample.forEach((q, i) => {
                segments.push({
                    text: '大冒险',
                    color: colors[(i + 3) % colors.length],
                    type: 'dare',
                    question: q
                });
            });
        }
    }
    
    while (segments.length < 6) {
        segments.push({
            text: segments.length % 2 === 0 ? '真心话' : '大冒险',
            color: colors[segments.length % colors.length],
            type: segments.length % 2 === 0 ? 'truth' : 'dare',
            question: null
        });
    }
    
    wheelAnimation.setSegments(segments);
    wheelAnimation.draw();
    return segments;
}

function spinWheel() {
    const targetRotation = Math.random() * Math.PI * 2;
    wheelAnimation.spin(targetRotation);
    
    return new Promise(resolve => {
        setTimeout(() => {
            const segments = wheelAnimation.segments;
            const segmentAngle = (2 * Math.PI) / segments.length;
            const normalizedRotation = ((wheelAnimation.rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            const selectedIndex = Math.floor((Math.PI * 2 - normalizedRotation) / segmentAngle) % segments.length;
            resolve(segments[selectedIndex]);
        }, 3500);
    });
}