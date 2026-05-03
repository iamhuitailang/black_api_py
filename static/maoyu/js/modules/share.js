const ShareModule = {
    modal: null,
    canvas: null,
    ctx: null,

    init() {
        this.modal = document.getElementById('share-modal');
        this.canvas = document.getElementById('share-canvas');
        
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.resizeCanvas();
        }

        this.bindEvents();
    },

    resizeCanvas() {
        if (!this.canvas) return;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = 600 * dpr;
        this.canvas.height = 800 * dpr;
        this.ctx?.scale(dpr, dpr);
        this.canvas.style.width = '600px';
        this.canvas.style.height = '800px';
    },

    bindEvents() {
        const closeBtn = document.getElementById('share-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        const saveBtn = document.getElementById('share-save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveImage());
        }

        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.close();
                }
            });
        }
    },

    open(translationData) {
        if (!this.modal || !this.canvas) {
            this.showToast('分享功能不可用', 'error');
            return;
        }

        this.drawCard(translationData);
        this.modal.style.display = 'flex';
        AudioManager.playClick();
    },

    close() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
        AudioManager.playClick();
    },

    drawCard(data) {
        if (!this.ctx) return;

        const ctx = this.ctx;
        const width = 600;
        const height = 800;

        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#FFF5F5');
        gradient.addColorStop(0.5, '#FFE4E8');
        gradient.addColorStop(1, '#FFB3BA');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        this.drawDecorations(ctx, width, height);

        ctx.fillStyle = '#FF8787';
        ctx.font = 'bold 32px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🐱 猫语翻译器 🐱', width / 2, 60);

        ctx.fillStyle = '#FFF';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 5;
        
        this.roundRect(ctx, 50, 100, 500, 150, 20);
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#868E96';
        ctx.font = 'bold 16px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(data.direction === 'human-to-cat' ? '💬 人话：' : '🐱 猫语：', 80, 145);

        ctx.fillStyle = '#495057';
        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.fillText(this.truncateText(data.input, 20), 80, 185);

        ctx.textAlign = 'center';
        ctx.font = 'bold 40px Arial, sans-serif';
        ctx.fillText('⬇️', width / 2, 280);

        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#FFF';
        this.roundRect(ctx, 50, 310, 500, 180, 20);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        ctx.fillStyle = '#868E96';
        ctx.font = 'bold 16px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(data.direction === 'human-to-cat' ? '🐱 猫语翻译：' : '💬 人话翻译：', 80, 355);

        ctx.fillStyle = '#FF6B6B';
        ctx.font = 'bold 26px Arial, sans-serif';
        const outputText = data.isRandom ? this.truncateText(data.output, 15) : data.output;
        ctx.fillText(outputText, 80, 400);

        ctx.fillStyle = '#FFF';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 15;
        this.roundRect(ctx, 50, 520, 500, 200, 20);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        this.drawCatIllustration(ctx, 150, 550, 100);

        ctx.textAlign = 'center';
        ctx.font = '20px Arial, sans-serif';
        ctx.fillStyle = '#FF8787';
        ctx.fillText(`${data.emoji || '😺'} ${data.description || '喵喵～'}`, width / 2, 700);

        ctx.fillStyle = '#ADB5BD';
        ctx.font = '14px Arial, sans-serif';
        ctx.fillText('长按保存，分享到朋友圈', width / 2, 760);
        ctx.fillText(this.getDateString(), width / 2, 785);
    },

    drawDecorations(ctx, width, height) {
        ctx.globalAlpha = 0.3;
        ctx.font = '30px Arial';
        
        const pawPrints = ['🐾', '💕', '🐱', '✨'];
        const positions = [
            { x: 30, y: 120 },
            { x: width - 50, y: 200 },
            { x: 50, y: height - 150 },
            { x: width - 60, y: height - 100 },
            { x: width / 2 - 250, y: height / 2 + 100 }
        ];

        positions.forEach((pos, i) => {
            ctx.fillText(pawPrints[i % pawPrints.length], pos.x, pos.y);
        });

        ctx.globalAlpha = 1;
    },

    drawCatIllustration(ctx, x, y, size) {
        ctx.save();
        ctx.translate(x + size / 2, y + size / 2);
        ctx.scale(size / 200, size / 200);

        ctx.fillStyle = '#FFB3BA';
        ctx.beginPath();
        ctx.arc(0, 0, 80, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-60, -60);
        ctx.lineTo(-30, -90);
        ctx.lineTo(0, -60);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, -60);
        ctx.lineTo(30, -90);
        ctx.lineTo(60, -60);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#4A4A4A';
        ctx.beginPath();
        ctx.ellipse(-30, -10, 10, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(30, -10, 10, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(-26, -15, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(34, -15, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FF8787';
        ctx.beginPath();
        ctx.moveTo(0, 15);
        ctx.lineTo(-10, 25);
        ctx.lineTo(10, 25);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#4A4A4A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 25);
        ctx.lineTo(0, 35);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-12, 35, 12, Math.PI * 0.8, Math.PI * 0.1, true);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(12, 35, 12, Math.PI * 0.9, Math.PI * 0.2);
        ctx.stroke();

        ctx.restore();
    },

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    },

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    },

    getDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    saveImage() {
        if (!this.canvas) return;

        try {
            const dataUrl = this.canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `猫语翻译_${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
            
            AudioManager.playSuccess();
            this.showToast('图片已保存！', 'success');
        } catch (e) {
            this.showToast('保存失败，请截图保存', 'error');
        }
    },

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 8px;
            background: ${type === 'success' ? '#51CF66' : type === 'error' ? '#FF6B6B' : '#74C0FC'};
            color: white;
            font-weight: 500;
            z-index: 10000;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 2000);
    }
};
