class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
    }

    clear() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#0a0a1a');
        gradient.addColorStop(0.5, '#1a1a3e');
        gradient.addColorStop(1, '#0d0d2b');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawTable() {
        const table = CONFIG.TABLE;
        
        this.ctx.fillStyle = table.COLOR;
        this.ctx.fillRect(table.LEFT, table.TOP, table.RIGHT - table.LEFT, table.BOTTOM - table.TOP);

        this.ctx.strokeStyle = table.BORDER_COLOR;
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(table.LEFT, table.TOP, table.RIGHT - table.LEFT, table.BOTTOM - table.TOP);

        this.ctx.strokeStyle = table.LINE_COLOR;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(table.LEFT + 25, table.TOP + 25, table.RIGHT - table.LEFT - 50, table.BOTTOM - table.TOP - 50);

        const centerX = (table.LEFT + table.RIGHT) / 2;
        this.ctx.strokeStyle = table.LINE_COLOR;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([8, 8]);
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, table.TOP);
        this.ctx.lineTo(centerX, table.BOTTOM);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        this.drawNet();
        this.drawSpotlights();
    }

    drawNet() {
        const table = CONFIG.TABLE;
        
        this.ctx.setLineDash([6, 4]);
        this.ctx.strokeStyle = table.NET_COLOR;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(table.LEFT, table.NET_Y);
        this.ctx.lineTo(table.RIGHT, table.NET_Y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.fillRect(table.LEFT, table.NET_Y - 2, table.RIGHT - table.LEFT, 4);

        const postWidth = 8;
        this.ctx.fillStyle = '#666666';
        this.ctx.fillRect(table.LEFT - postWidth, table.NET_Y - 15, postWidth, 30);
        this.ctx.fillRect(table.RIGHT, table.NET_Y - 15, postWidth, 30);
    }

    drawSpotlights() {
        const table = CONFIG.TABLE;
        const centerX = (table.LEFT + table.RIGHT) / 2;
        const centerY = (table.TOP + table.BOTTOM) / 2;

        const spotlight1 = this.ctx.createRadialGradient(
            centerX - 120, centerY, 0,
            centerX - 120, centerY, 250
        );
        spotlight1.addColorStop(0, 'rgba(255, 215, 0, 0.1)');
        spotlight1.addColorStop(1, 'rgba(255, 215, 0, 0)');
        this.ctx.fillStyle = spotlight1;
        this.ctx.fillRect(table.LEFT, table.TOP, table.RIGHT - table.LEFT, table.BOTTOM - table.TOP);

        const spotlight2 = this.ctx.createRadialGradient(
            centerX + 120, centerY, 0,
            centerX + 120, centerY, 250
        );
        spotlight2.addColorStop(0, 'rgba(255, 215, 0, 0.1)');
        spotlight2.addColorStop(1, 'rgba(255, 215, 0, 0)');
        this.ctx.fillStyle = spotlight2;
        this.ctx.fillRect(table.LEFT, table.TOP, table.RIGHT - table.LEFT, table.BOTTOM - table.TOP);
    }

    drawPaddle(paddle) {
        const x = paddle.x - paddle.width / 2;
        const y = paddle.y - paddle.height / 2;

        if (paddle.hitEffect > 0) {
            this.ctx.shadowColor = CONFIG.COLORS.GOLD;
            this.ctx.shadowBlur = 25 * paddle.hitEffect;
        } else {
            this.ctx.shadowColor = paddle.color;
            this.ctx.shadowBlur = CONFIG.PADDLE.GLOW_INTENSITY;
        }

        const gradient = this.ctx.createLinearGradient(x, y, x, y + paddle.height);
        gradient.addColorStop(0, this.darkenColor(paddle.color, 25));
        gradient.addColorStop(0.5, paddle.color);
        gradient.addColorStop(1, this.darkenColor(paddle.color, 25));

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, paddle.width, paddle.height, 4);
        this.ctx.fill();

        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.shadowBlur = 0;

        if (paddle.isChopping) {
            this.ctx.strokeStyle = CONFIG.COLORS.GOLD;
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([5, 3]);
            this.ctx.strokeRect(x - 3, y - 3, paddle.width + 6, paddle.height + 6);
            this.ctx.setLineDash([]);
        }
    }

    drawBall(ball) {
        if (!ball.active) return;

        ball.trail.forEach((pos, index) => {
            const alpha = index / ball.trail.length * 0.35;
            const size = ball.radius * (0.2 + index / ball.trail.length * 0.6);
            
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = ball.spin !== CONFIG.SPIN.NONE ? CONFIG.COLORS.GOLD : '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;

        this.ctx.shadowColor = CONFIG.COLORS.GOLD;
        this.ctx.shadowBlur = CONFIG.BALL.GLOW_INTENSITY;

        const gradient = this.ctx.createRadialGradient(
            ball.x - 2, ball.y - 2, 0,
            ball.x, ball.y, ball.radius
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.6, '#f0f0f0');
        gradient.addColorStop(1, '#c0c0c0');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();

        if (ball.spin !== CONFIG.SPIN.NONE) {
            this.ctx.strokeStyle = CONFIG.COLORS.GOLD;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            
            const spinAngle = Date.now() / 40 * ball.spinStrength;
            this.ctx.arc(ball.x, ball.y, ball.radius + 4, spinAngle, spinAngle + Math.PI * 0.8);
            this.ctx.stroke();
        }

        this.ctx.shadowBlur = 0;
    }

    drawAudience() {
        const table = CONFIG.TABLE;
        
        for (let i = 0; i < 35; i++) {
            const x = table.LEFT + Math.random() * (table.RIGHT - table.LEFT);
            const y = table.TOP - 25 - Math.random() * 45;
            const size = 3 + Math.random() * 4;
            
            this.ctx.globalAlpha = 0.25 + Math.random() * 0.4;
            this.ctx.fillStyle = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181'][Math.floor(Math.random() * 5)];
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        for (let i = 0; i < 35; i++) {
            const x = table.LEFT + Math.random() * (table.RIGHT - table.LEFT);
            const y = table.BOTTOM + 25 + Math.random() * 45;
            const size = 3 + Math.random() * 4;
            
            this.ctx.globalAlpha = 0.25 + Math.random() * 0.4;
            this.ctx.fillStyle = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181'][Math.floor(Math.random() * 5)];
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (
            0x1000000 +
            (R < 0 ? 0 : R > 255 ? 255 : R) * 0x10000 +
            (G < 0 ? 0 : G > 255 ? 255 : G) * 0x100 +
            (B < 0 ? 0 : B > 255 ? 255 : B)
        ).toString(16).slice(1);
    }

    render(game) {
        this.clear();
        this.drawAudience();
        this.drawTable();
        
        if (game.particles) {
            game.particles.draw(this.ctx);
        }

        this.drawPaddle(game.playerPaddle);
        this.drawPaddle(game.aiPaddle);
        this.drawBall(game.ball);
    }
}
