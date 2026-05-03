const CanvasBackground = {
    canvas: null,
    ctx: null,
    particles: [],
    width: 0,
    height: 0,
    animationId: null,
    isRunning: false,

    init() {
        this.canvas = document.getElementById('bg-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.createParticles();
        this.bindEvents();
        this.start();
    },

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    },

    bindEvents() {
        window.addEventListener('resize', Utils.debounce(() => {
            this.resize();
        }, 250));
    },

    createParticles() {
        this.particles = [];
        const particleCount = Math.floor((this.width * this.height) / 15000);
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 4 + 2,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.2,
                color: this.getRandomColor()
            });
        }
    },

    getRandomColor() {
        const colors = [
            'rgba(255, 138, 101, ',
            'rgba(255, 171, 145, ',
            'rgba(255, 183, 77, ',
            'rgba(255, 204, 128, ',
            'rgba(255, 107, 107, '
        ];
        return Utils.randomFrom(colors);
    },

    update() {
        this.particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;
            
            if (p.x < 0 || p.x > this.width) p.speedX *= -1;
            if (p.y < 0 || p.y > this.height) p.speedY *= -1;
            
            p.opacity += (Math.random() - 0.5) * 0.02;
            p.opacity = Math.max(0.1, Math.min(0.7, p.opacity));
        });
    },

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.particles.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color + p.opacity + ')';
            this.ctx.fill();
        });
        
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 120) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    const opacity = (1 - dist / 120) * 0.2;
                    this.ctx.strokeStyle = `rgba(255, 138, 101, ${opacity})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            }
        }
    },

    animate() {
        if (!this.isRunning) return;
        
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
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

    destroy() {
        this.stop();
        this.particles = [];
    }
};

window.CanvasBackground = CanvasBackground;
