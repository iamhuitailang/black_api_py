const Renderer = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    particles: [],
    animationFrame: null,
    bookshelfData: [],
    isAnimating: false,
    backgroundCanvas: null,
    backgroundCtx: null,

    init: function() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.backgroundCanvas = document.createElement('canvas');
        this.backgroundCtx = this.backgroundCanvas.getContext('2d');
        
        this.resize();
        window.addEventListener('resize', () => {
            this.resize();
            this.generateBookshelfData();
            this.renderBackground();
        });
        
        this.generateBookshelfData();
        this.renderBackground();
        this.startAnimation();
    },

    resize: function() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.backgroundCanvas.width = this.width;
        this.backgroundCanvas.height = this.height;
    },

    generateBookshelfData: function() {
        this.bookshelfData = [];
        const shelfHeight = 80;
        const shelfWidth = this.width * 0.15;
        const shelfSpacing = 100;
        const bookColors = ['#8b0000', '#006400', '#00008b', '#4b0082', '#8b4513'];

        for (let x = 0; x < this.width; x += shelfWidth + 20) {
            for (let y = 0; y < this.height; y += shelfSpacing) {
                const books = [];
                const bookWidth = 15;
                const bookHeight = shelfHeight - 20;
                
                for (let bx = x + 10; bx < x + shelfWidth - 20; bx += bookWidth + 5) {
                    books.push({
                        x: bx,
                        color: bookColors[Math.floor(Math.random() * bookColors.length)]
                    });
                }
                
                this.bookshelfData.push({
                    x: x,
                    y: y,
                    width: shelfWidth,
                    height: shelfHeight,
                    books: books
                });
            }
        }
    },

    startAnimation: function() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        
        const animate = () => {
            this.renderFrame();
            this.animationFrame = requestAnimationFrame(animate);
        };
        animate();
    },

    stopAnimation: function() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.isAnimating = false;
    },

    renderBackground: function() {
        const ctx = this.backgroundCtx;
        
        ctx.fillStyle = '#120f18';
        ctx.fillRect(0, 0, this.width, this.height);

        this.bookshelfData.forEach((shelf) => {
            ctx.fillStyle = '#3d2b1f';
            ctx.fillRect(shelf.x, shelf.y, shelf.width, shelf.height);
            
            ctx.fillStyle = '#5d4b3f';
            ctx.fillRect(shelf.x, shelf.y, shelf.width, 8);
            ctx.fillRect(shelf.x, shelf.y + shelf.height - 8, shelf.width, 8);

            shelf.books.forEach((book) => {
                const bookHeight = shelf.height - 20;
                ctx.fillStyle = book.color;
                ctx.fillRect(book.x, shelf.y + 10, 15, bookHeight);
                
                ctx.fillStyle = '#d4af37';
                ctx.fillRect(book.x + 2, shelf.y + 15, 4, bookHeight - 10);
            });
        });

        ctx.fillStyle = '#1a1520';
        ctx.fillRect(0, this.height - 60, this.width, 60);
        
        ctx.fillStyle = '#2d2535';
        ctx.fillRect(0, this.height - 65, this.width, 5);
    },

    renderFrame: function() {
        this.ctx.drawImage(this.backgroundCanvas, 0, 0);
        this.drawMagicCircle();
        this.updateAndDrawParticles();
    },

    drawBattleCharacter: function(element, x, y, scale, isEnemy) {
        this.drawMageCharacter(element, x, y, scale, isEnemy);
    },

    drawMagicCircle: function() {
        const ctx = this.ctx;
        const centerX = this.width / 2;
        const centerY = this.height / 2 + 50;
        const radius = Math.min(this.width, this.height) * 0.25;
        const time = Date.now() * 0.001;

        ctx.save();
        ctx.globalAlpha = 0.25;
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, 'rgba(180, 140, 100, 0.6)');
        gradient.addColorStop(0.5, 'rgba(139, 90, 43, 0.3)');
        gradient.addColorStop(1, 'rgba(50, 30, 10, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.9, 0, Math.PI * 2);
        ctx.stroke();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(time * 0.3);
        
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * radius * 0.7;
            const y = Math.sin(angle) * radius * 0.7;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.rotate(-time * 0.6);
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = Math.cos(angle) * radius * 0.5;
            const y = Math.sin(angle) * radius * 0.5;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
        ctx.restore();

        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + time * 0.2;
            const x = centerX + Math.cos(angle) * radius * 0.8;
            const y = centerY + Math.sin(angle) * radius * 0.8;
            this.drawRune(x, y);
        }
    },

    drawRune: function(x, y) {
        const ctx = this.ctx;
        const time = Date.now() * 0.002;
        const glow = 0.4 + Math.sin(time) * 0.2;

        ctx.save();
        ctx.globalAlpha = glow;
        ctx.fillStyle = '#d4c4a8';
        ctx.font = '16px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✦', x, y);
        ctx.restore();
    },

    addParticle: function(x, y, type) {
        const particle = {
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 3,
            vy: -Math.random() * 2 - 1,
            life: 1,
            decay: 0.008 + Math.random() * 0.01,
            size: 2 + Math.random() * 3,
            type: type || 'star'
        };
        this.particles.push(particle);
    },

    addExplosion: function(x, y, element, count = 20) {
        const colors = {
            fire: ['#ff6b35', '#ff8c42', '#ffd700'],
            water: ['#4fc3f7', '#29b6f6', '#81d4fa'],
            thunder: ['#ffeb3b', '#ffc107', '#fff59d'],
            earth: ['#8d6e63', '#a1887f', '#bcaaa4']
        };
        
        const particleColors = colors[element] || colors.fire;
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
            const speed = 1.5 + Math.random() * 3;
            const particle = {
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.015 + Math.random() * 0.01,
                size: 2 + Math.random() * 4,
                color: particleColors[Math.floor(Math.random() * particleColors.length)],
                type: 'explosion'
            };
            this.particles.push(particle);
        }
    },

    updateAndDrawParticles: function() {
        const ctx = this.ctx;
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05;
            p.life -= p.decay;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.globalAlpha = p.life;
            
            if (p.type === 'explosion' && p.color) {
                ctx.fillStyle = p.color;
            } else {
                ctx.fillStyle = '#e8dcc8';
            }
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = p.life * 0.4;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life * 1.3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }

        if (Math.random() < 0.05) {
            const x = Math.random() * this.width;
            const y = this.height;
            this.addParticle(x, y, 'star');
        }
    },

    drawMageCharacter: function(element, x, y, scale = 1, isEnemy = false) {
        const ctx = this.ctx;
        const time = Date.now() * 0.002;
        const float = Math.sin(time + x * 0.01) * 2;

        ctx.save();
        ctx.translate(x, y + float);
        ctx.scale(scale, scale);
        if (isEnemy) ctx.scale(-1, 1);

        const elementColors = {
            fire: { 
                robe: '#8b0000', 
                robeLight: '#b22222', 
                robeDark: '#4a0000',
                magic: '#ff4500', 
                glow: '#ffa500',
                trim: '#daa520'
            },
            water: { 
                robe: '#1e3a5f', 
                robeLight: '#2e5a8f', 
                robeDark: '#0e2a3f',
                magic: '#4fc3f7', 
                glow: '#81d4fa',
                trim: '#c0c0c0'
            },
            thunder: { 
                robe: '#4a148c', 
                robeLight: '#7b1fa2', 
                robeDark: '#2a0a6c',
                magic: '#ffeb3b', 
                glow: '#fff59d',
                trim: '#ffd700'
            },
            earth: { 
                robe: '#5d4037', 
                robeLight: '#8d6e63', 
                robeDark: '#3e2723',
                magic: '#a1887f', 
                glow: '#d7ccc8',
                trim: '#8b4513'
            }
        };

        const colors = elementColors[element] || elementColors.fire;

        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 20;

        ctx.fillStyle = colors.robe;
        ctx.beginPath();
        ctx.moveTo(-28, -5);
        ctx.quadraticCurveTo(-32, 20, -25, 40);
        ctx.lineTo(25, 40);
        ctx.quadraticCurveTo(32, 20, 28, -5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = colors.robeLight;
        ctx.beginPath();
        ctx.moveTo(-20, -5);
        ctx.quadraticCurveTo(-18, 15, -15, 30);
        ctx.lineTo(0, 35);
        ctx.lineTo(0, -5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = colors.robeDark;
        ctx.beginPath();
        ctx.moveTo(10, -5);
        ctx.lineTo(10, 35);
        ctx.lineTo(20, 30);
        ctx.quadraticCurveTo(22, 15, 20, -5);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = colors.trim;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-25, 0);
        ctx.quadraticCurveTo(0, 10, 25, 0);
        ctx.stroke();

        ctx.fillStyle = colors.robe;
        ctx.beginPath();
        ctx.moveTo(-22, -10);
        ctx.quadraticCurveTo(-25, -55, 0, -70);
        ctx.quadraticCurveTo(25, -55, 22, -10);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = colors.robeLight;
        ctx.beginPath();
        ctx.moveTo(-15, -15);
        ctx.quadraticCurveTo(-18, -50, 0, -65);
        ctx.quadraticCurveTo(5, -50, 0, -15);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = colors.trim;
        ctx.beginPath();
        ctx.arc(0, -60, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colors.glow;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(0, -60, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.fillStyle = '#f5deb3';
        ctx.beginPath();
        ctx.ellipse(0, -22, 16, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#e8c4a0';
        ctx.beginPath();
        ctx.ellipse(-5, -18, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2d1810';
        ctx.beginPath();
        ctx.ellipse(-6, -24, 3, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(6, -24, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-5, -25, 1, 0, Math.PI * 2);
        ctx.arc(7, -25, 1, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -18, 5, 0.2, Math.PI - 0.2);
        ctx.stroke();

        ctx.strokeStyle = colors.robeDark;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -40);
        ctx.lineTo(0, -35);
        ctx.stroke();

        ctx.fillStyle = colors.robe;
        ctx.beginPath();
        ctx.ellipse(18, 5, 8, 10, 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.quadraticCurveTo(35, -20, 40, -50);
        ctx.stroke();

        ctx.fillStyle = colors.magic;
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(40, -55, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(38, -57, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.shadowBlur = 0;
        ctx.strokeStyle = colors.glow;
        ctx.lineWidth = 1.5;
        const orbits = 3;
        for (let i = 0; i < orbits; i++) {
            const angle = (i / orbits) * Math.PI * 2 + time * 2;
            const ox = 40 + Math.cos(angle) * 12;
            const oy = -55 + Math.sin(angle) * 8;
            ctx.beginPath();
            ctx.arc(ox, oy, 2, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    },

    showSpellEffect: function(spellElement, startX, startY, targetX, targetY, callback) {
        const duration = 600;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentX = startX + (targetX - startX) * progress;
            const currentY = startY + (targetY - startY) * progress;
            
            this.addExplosion(currentX, currentY, spellElement, 3);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.addExplosion(targetX, targetY, spellElement, 25);
                if (callback) callback();
            }
        };
        
        animate();
    }
};