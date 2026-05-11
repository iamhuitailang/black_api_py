const CanvasRenderer = {
    vuCanvas: null,
    vuContext: null,
    animationId: null,
    isRunning: false,

    init() {
        this.vuCanvas = document.getElementById('vuMeterCanvas');
        if (!this.vuCanvas) {
            console.error('VU表Canvas未找到');
            return;
        }
        
        this.vuContext = this.vuCanvas.getContext('2d');
        console.log('Canvas渲染器初始化成功');
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
        
        this.drawVUMeter();
        this.animationId = requestAnimationFrame(() => this.animate());
    },

    drawVUMeter() {
        if (!this.vuContext || !this.vuCanvas) return;

        const ctx = this.vuContext;
        const width = this.vuCanvas.width;
        const height = this.vuCanvas.height;

        ctx.clearRect(0, 0, width, height);

        const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
        bgGradient.addColorStop(0, 'rgba(40, 40, 60, 0.8)');
        bgGradient.addColorStop(1, 'rgba(20, 20, 40, 0.8)');
        
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        let audioLevel = 0;
        if (typeof AudioEngine !== 'undefined') {
            audioLevel = AudioEngine.getAudioLevel();
        }

        const normalizedLevel = Math.min(audioLevel * 2, 1);
        const barHeight = normalizedLevel * (height - 40);

        const levelGradient = ctx.createLinearGradient(0, height - 20 - barHeight, 0, height - 20);
        
        if (normalizedLevel < 0.6) {
            levelGradient.addColorStop(0, '#00ff88');
            levelGradient.addColorStop(1, '#00cc66');
        } else if (normalizedLevel < 0.85) {
            levelGradient.addColorStop(0, '#ffdd00');
            levelGradient.addColorStop(1, '#ffaa00');
        } else {
            levelGradient.addColorStop(0, '#ff4444');
            levelGradient.addColorStop(1, '#cc0000');
        }

        const barWidth = width - 20;
        const x = 10;
        const y = height - 20 - barHeight;

        ctx.fillStyle = levelGradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 4);
        ctx.fill();

        ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 10; i++) {
            const markerY = height - 20 - (i / 10) * (height - 40);
            ctx.beginPath();
            ctx.moveTo(10, markerY);
            ctx.lineTo(width - 10, markerY);
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(5, 5, width - 10, height - 10, 6);
        ctx.stroke();

        ctx.fillStyle = '#888';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(Math.round(normalizedLevel * 100) + '%', width / 2, height - 5);
    },

    drawStaticVUMeter() {
        if (!this.vuContext || !this.vuCanvas) return;

        const ctx = this.vuContext;
        const width = this.vuCanvas.width;
        const height = this.vuCanvas.height;

        ctx.clearRect(0, 0, width, height);

        const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
        bgGradient.addColorStop(0, 'rgba(40, 40, 60, 0.8)');
        bgGradient.addColorStop(1, 'rgba(20, 20, 40, 0.8)');
        
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        const minY = height - 20;
        const maxY = 20;
        
        const staticGradient = ctx.createLinearGradient(0, maxY, 0, minY);
        staticGradient.addColorStop(0, 'rgba(0, 255, 136, 0.3)');
        staticGradient.addColorStop(1, 'rgba(0, 200, 83, 0.3)');
        
        ctx.fillStyle = staticGradient;
        ctx.beginPath();
        ctx.roundRect(10, height - 30, width - 20, 10, 4);
        ctx.fill();

        ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(5, 5, width - 10, height - 10, 6);
        ctx.stroke();

        ctx.fillStyle = '#888';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('0%', width / 2, height - 5);
    }
};
