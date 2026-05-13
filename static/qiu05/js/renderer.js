import { COLORS, BALL_RADIUS } from './constants.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './levels.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        this.time = 0;
    }

    render(physics, levelData) {
        this.time += 0.05;
        
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        this.drawBackground();
        this.drawEnd(levelData.endPos);
        this.drawWalls(levelData.walls);
        this.drawTraps(levelData.traps);
        this.drawStars(physics.getRemainingStars());
        this.drawBall(physics.getBallState());
    }

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        gradient.addColorStop(0, '#a8edea');
        gradient.addColorStop(1, '#fed6e3');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 20; i++) {
            const x = (i * 73 + this.time * 10) % CANVAS_WIDTH;
            const y = (i * 53) % CANVAS_HEIGHT;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 3 + Math.sin(this.time + i) * 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawWalls(walls) {
        for (const wall of walls) {
            this.ctx.fillStyle = 'rgba(139, 92, 246, 0.3)';
            this.ctx.fillRect(wall.x + 3, wall.y + 3, wall.w, wall.h);
            
            const gradient = this.ctx.createLinearGradient(wall.x, wall.y, wall.x + wall.w, wall.y + wall.h);
            gradient.addColorStop(0, '#a78bfa');
            gradient.addColorStop(1, '#7c3aed');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.roundRect(wall.x, wall.y, wall.w, wall.h, 5);
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#6d28d9';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }

    drawStars(stars) {
        for (const star of stars) {
            const glowSize = 25 + Math.sin(this.time * 3) * 5;
            const gradient = this.ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowSize);
            gradient.addColorStop(0, 'rgba(251, 191, 36, 0.6)');
            gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, glowSize, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#fbbf24';
            this.drawStar(star.x, star.y, 5, 15, 7);
        }
    }

    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - outerRadius);

        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            this.ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
        }

        this.ctx.lineTo(cx, cy - outerRadius);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawTraps(traps) {
        for (const trap of traps) {
            const centerX = trap.x + trap.w / 2;
            const centerY = trap.y + trap.h / 2;
            
            const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, trap.w);
            gradient.addColorStop(0, 'rgba(239, 68, 68, 0.5)');
            gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(trap.x - 10, trap.y - 10, trap.w + 20, trap.h + 20);

            this.ctx.fillStyle = '#ef4444';
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, trap.w / 2, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#fca5a5';
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, trap.w / 4, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('!', centerX, centerY);
        }
    }

    drawEnd(endPos) {
        const pulseSize = 30 + Math.sin(this.time * 2) * 5;
        const gradient = this.ctx.createRadialGradient(endPos.x, endPos.y, 0, endPos.x, endPos.y, pulseSize);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.6)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(endPos.x, endPos.y, pulseSize, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#10b981';
        this.ctx.beginPath();
        this.ctx.arc(endPos.x, endPos.y, 25, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('★', endPos.x, endPos.y);
    }

    drawBall(ball) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(ball.x + 3, ball.y + 3, ball.radius, ball.radius * 0.6, 0, 0, Math.PI * 2);
        this.ctx.fill();

        const gradient = this.ctx.createRadialGradient(
            ball.x - ball.radius * 0.3, 
            ball.y - ball.radius * 0.3, 
            0, 
            ball.x, 
            ball.y, 
            ball.radius
        );
        gradient.addColorStop(0, '#a78bfa');
        gradient.addColorStop(0.5, '#7c3aed');
        gradient.addColorStop(1, '#5b21b6');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = '#4c1d95';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.stroke();
    }
}
