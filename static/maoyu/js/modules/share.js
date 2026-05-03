import { Storage } from './storage.js';

export const Share = {
    canvas: null,
    ctx: null,

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
    },

    generateCard(translationData) {
        if (!this.ctx) return;

        const ctx = this.ctx;
        const width = 400;
        const height = 500;

        ctx.clearRect(0, 0, width, height);

        this.drawBackground(ctx, width, height);
        this.drawCatImage(ctx, width);
        this.drawTitle(ctx, width);
        this.drawTranslation(ctx, width, translationData);
        this.drawFooter(ctx, width, height);
    },

    drawBackground(ctx, width, height) {
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#FFF5F7');
        gradient.addColorStop(0.5, '#FFE5EC');
        gradient.addColorStop(1, '#FECFEF');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = 'rgba(255, 182, 193, 0.3)';
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 15 + 5;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = 'rgba(255, 107, 157, 0.8)';
        ctx.font = '24px Arial';
        const pawPrints = ['🐾', '🐱', '❤️', '✨'];
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * (width - 50) + 25;
            const y = Math.random() * (height - 50) + 25;
            ctx.fillText(pawPrints[i % pawPrints.length], x, y);
        }
    },

    drawCatImage(ctx, width) {
        const centerX = width / 2;
        const catY = 80;

        ctx.fillStyle = '#FFB3BA';
        ctx.beginPath();
        ctx.arc(centerX, catY + 30, 35, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(centerX - 30, catY + 10);
        ctx.lineTo(centerX - 45, catY - 15);
        ctx.lineTo(centerX - 15, catY + 5);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(centerX + 30, catY + 10);
        ctx.lineTo(centerX + 45, catY - 15);
        ctx.lineTo(centerX + 15, catY + 5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#5D4E6D';
        ctx.beginPath();
        ctx.ellipse(centerX - 14, catY + 28, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(centerX + 14, catY + 28, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(centerX - 12, catY + 25, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + 16, catY + 25, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FF6B9D';
        ctx.beginPath();
        ctx.moveTo(centerX, catY + 38);
        ctx.lineTo(centerX - 5, catY + 44);
        ctx.lineTo(centerX + 5, catY + 44);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#5D4E6D';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(centerX, catY + 44);
        ctx.lineTo(centerX, catY + 48);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(centerX - 6, catY + 48, 6, 0, 0.5 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(centerX + 6, catY + 48, 6, 0.5 * Math.PI, Math.PI);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 182, 193, 0.5)';
        ctx.beginPath();
        ctx.ellipse(centerX - 25, catY + 35, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(centerX + 25, catY + 35, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
    },

    drawTitle(ctx, width) {
        const centerX = width / 2;

        ctx.fillStyle = '#FF6B9D';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🐾 猫语翻译器 🐾', centerX, 160);

        ctx.fillStyle = '#888';
        ctx.font = '14px Arial';
        ctx.fillText('喵星人与人类的沟通桥梁', centerX, 185);
    },

    drawTranslation(ctx, width, data) {
        const centerX = width / 2;
        const startY = 220;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        const boxWidth = 350;
        const boxHeight = 150;
        const boxX = (width - boxWidth) / 2;
        this.roundRect(ctx, boxX, startY, boxWidth, boxHeight, 15);
        ctx.fill();

        ctx.strokeStyle = '#FF9AA2';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        this.roundRect(ctx, boxX, startY, boxWidth, boxHeight, 15);
        ctx.stroke();
        ctx.setLineDash([]);

        if (data) {
            ctx.fillStyle = '#5D4E6D';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'left';

            if (data.type === 'cat-to-human') {
                ctx.fillText('🐱 猫叫:', boxX + 20, startY + 40);
                ctx.fillStyle = '#FF6B9D';
                ctx.font = '18px Arial';
                this.wrapText(ctx, data.from || '喵喵喵', boxX + 20, startY + 65, boxWidth - 40, 25);

                ctx.fillStyle = '#5D4E6D';
                ctx.font = 'bold 16px Arial';
                ctx.fillText('💬 翻译:', boxX + 20, startY + 105);
                ctx.fillStyle = '#FF6B9D';
                ctx.font = '18px Arial';
                this.wrapText(ctx, data.to || '你好呀！', boxX + 20, startY + 130, boxWidth - 40, 25);
            } else {
                ctx.fillText('💬 人话:', boxX + 20, startY + 40);
                ctx.fillStyle = '#FF6B9D';
                ctx.font = '18px Arial';
                this.wrapText(ctx, data.from || '我爱你', boxX + 20, startY + 65, boxWidth - 40, 25);

                ctx.fillStyle = '#5D4E6D';
                ctx.font = 'bold 16px Arial';
                ctx.fillText('🐱 猫语:', boxX + 20, startY + 105);
                ctx.fillStyle = '#FF6B9D';
                ctx.font = '18px Arial';
                this.wrapText(ctx, data.to || '呼噜呼噜～喵～', boxX + 20, startY + 130, boxWidth - 40, 25);
            }
        } else {
            ctx.fillStyle = '#888';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('快来试试猫语翻译吧！', centerX, startY + 70);
            ctx.fillText('理解喵星人的每一声喵叫', centerX, startY + 100);
        }
    },

    drawFooter(ctx, width, height) {
        const centerX = width / 2;

        ctx.fillStyle = '#FF9AA2';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('扫描二维码或保存图片分享', centerX, height - 40);

        ctx.fillStyle = '#5D4E6D';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('🐱 喵星人专属翻译器 🐱', centerX, height - 15);
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

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split('');
        let line = '';
        let currentY = y;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n];
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, currentY);
                line = words[n];
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
    },

    downloadCard() {
        if (!this.canvas) return;

        const link = document.createElement('a');
        link.download = 'maoyu-translator-card.png';
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    },

    getLatestTranslation() {
        const history = Storage.getHistory();
        if (history.length > 0) {
            return history[0];
        }
        return null;
    }
};

export default Share;
