const Renderer = {
    canvas: null,
    ctx: null,

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
    },

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },

    drawStaffLines() {
        const ctx = this.ctx;
        const centerY = this.canvas.height / 2;
        const lineSpacing = 20;

        ctx.strokeStyle = 'rgba(90, 74, 58, 0.3)';
        ctx.lineWidth = 1;

        for (let i = -2; i <= 2; i++) {
            const y = centerY + i * lineSpacing;
            ctx.beginPath();
            ctx.moveTo(50, y);
            ctx.lineTo(this.canvas.width - 50, y);
            ctx.stroke();
        }
    },

    drawNote(note, mode) {
        this.clear();
        this.drawStaffLines();

        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        if (mode === 'number') {
            this.drawSingOrPitch(note.sing);
        } else if (mode === 'listen') {
            this.drawListenHint();
        } else {
            this.drawJianpuNote(note, centerX, centerY);
        }
    },

    drawJianpuNote(note, x, y) {
        const ctx = this.ctx;
        const fontSize = 80;

        ctx.font = `bold ${fontSize}px 'Georgia', serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#3d2914';

        let displayText = note.number.toString();

        if (note.accidental.symbol) {
            displayText = note.accidental.symbol + displayText;
        }

        ctx.fillText(displayText, x, y);

        const dotSpacing = 12;
        const dotRadius = 4;

        for (let i = 0; i < note.octave.dotsAbove; i++) {
            const dotY = y - fontSize / 2 - 15 - i * dotSpacing;
            ctx.beginPath();
            ctx.arc(x, dotY, dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#3d2914';
            ctx.fill();
        }

        for (let i = 0; i < note.octave.dotsBelow; i++) {
            const dotY = y + fontSize / 2 + 15 + i * dotSpacing;
            ctx.beginPath();
            ctx.arc(x, dotY, dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#3d2914';
            ctx.fill();
        }
    },

    drawSingOrPitch(text) {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        ctx.font = 'bold 90px "Georgia", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#3d2914';
        ctx.fillText(text, centerX, centerY);
    },

    drawListenHint() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        ctx.font = '80px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#3d2914';
        ctx.fillText('🔊', centerX, centerY - 20);

        ctx.font = 'bold 24px "Georgia", serif';
        ctx.fillStyle = '#5a4a3a';
        ctx.fillText('听音辨谱', centerX, centerY + 50);
    },

    drawPlaceholder() {
        this.clear();
        this.drawStaffLines();
        
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        ctx.font = '24px "Georgia", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#8b7355';
        ctx.fillText('点击"下一题"开始练习', centerX, centerY);
    }
};