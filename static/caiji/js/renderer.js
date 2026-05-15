import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y } from './config.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        
        this.particles = [];
    }

    clear() {
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    drawBackground() {
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(0.6, '#B0E0E6');
        skyGradient.addColorStop(1, '#E0F7FA');
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        this.drawCloud(100, 80, 60);
        this.drawCloud(350, 50, 50);
        this.drawCloud(600, 100, 70);
        this.drawCloud(900, 60, 55);
        this.drawCloud(1100, 90, 45);
        
        const groundGradient = this.ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_HEIGHT);
        groundGradient.addColorStop(0, '#7CFC00');
        groundGradient.addColorStop(0.3, '#32CD32');
        groundGradient.addColorStop(1, '#228B22');
        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(0, GROUND_Y + 20, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
        
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 25);
        
        this.drawScarecrow(150, GROUND_Y - 30);
        this.drawScarecrow(1050, GROUND_Y - 30);
        this.drawNest(600, GROUND_Y - 10);
        
        this.ctx.fillStyle = '#228B22';
        for (let i = 0; i < 30; i++) {
            const x = i * 45 + 20;
            const h = 15 + Math.sin(i * 0.5) * 5;
            this.drawGrass(x, GROUND_Y + 20, h);
        }
    }

    drawCloud(x, y, size) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.7, y, size * 0.45, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.35, y + size * 0.2, size * 0.35, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawScarecrow(x, y) {
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x - 5, y, 10, 80);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(x, y - 20, 25, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#8B0000';
        this.ctx.beginPath();
        this.ctx.moveTo(x - 30, y - 30);
        this.ctx.lineTo(x, y - 55);
        this.ctx.lineTo(x + 30, y - 30);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.moveTo(x - 15, y - 25);
        this.ctx.lineTo(x - 5, y - 20);
        this.ctx.lineTo(x - 15, y - 15);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(x + 15, y - 25);
        this.ctx.lineTo(x + 5, y - 20);
        this.ctx.lineTo(x + 15, y - 15);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x - 10, y - 5);
        this.ctx.lineTo(x + 10, y - 5);
        this.ctx.stroke();
    }

    drawNest(x, y) {
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + 10, 50, 20, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#A0522D';
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const nx = x + Math.cos(angle) * 35;
            const ny = y + 5 + Math.sin(angle) * 10;
            this.ctx.beginPath();
            this.ctx.ellipse(nx, ny, 12, 6, angle, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.fillStyle = '#FFF8DC';
        this.ctx.beginPath();
        this.ctx.ellipse(x - 15, y, 12, 9, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(x + 15, y + 3, 10, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawGrass(x, y, height) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.quadraticCurveTo(x - 3, y - height / 2, x - 2, y - height);
        this.ctx.quadraticCurveTo(x, y - height / 2, x + 2, y - height);
        this.ctx.quadraticCurveTo(x + 3, y - height / 2, x, y);
        this.ctx.fill();
    }

    drawCharacter(char) {
        const ctx = this.ctx;
        const x = char.x;
        const y = char.y;
        const facing = char.facing;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(facing, 1);
        
        if (char.hitFlashTimer > 0 && Math.floor(char.hitFlashTimer / 50) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        if (char.isUltimate) {
            this.drawUltimateEffect(char);
        }
        
        const bodyY = char.isCrouching ? -char.height * 0.5 : -char.height * 0.6;
        const bodyHeight = char.isCrouching ? char.height * 0.5 : char.height * 0.65;
        
        ctx.fillStyle = char.bodyColor;
        ctx.beginPath();
        ctx.ellipse(0, bodyY + bodyHeight / 2, char.width / 2, bodyHeight / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = char.bodyColor;
        ctx.beginPath();
        ctx.arc(15, bodyY - 10, 28, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF6347';
        ctx.beginPath();
        ctx.moveTo(20, bodyY - 35);
        ctx.quadraticCurveTo(30, bodyY - 50, 25, bodyY - 55);
        ctx.quadraticCurveTo(20, bodyY - 50, 15, bodyY - 55);
        ctx.quadraticCurveTo(10, bodyY - 50, 20, bodyY - 35);
        ctx.fill();
        
        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.ellipse(35, bodyY - 10, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(25, bodyY - 15, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(27, bodyY - 17, 2, 0, Math.PI * 2);
        ctx.fill();
        
        const wingFlap = char.isAttacking ? Math.sin(Date.now() / 30) * 20 : 0;
        ctx.fillStyle = char.wingColor;
        ctx.save();
        ctx.translate(-20, bodyY + 10);
        ctx.rotate((-30 + wingFlap) * Math.PI / 180);
        ctx.beginPath();
        ctx.ellipse(0, 0, 25, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        if (char.isUltimate && char.ultimateType === 'wingSpin') {
            const spinAngle = (Date.now() / 20) % 360;
            ctx.save();
            ctx.translate(0, bodyY + 10);
            ctx.rotate(spinAngle * Math.PI / 180);
            ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
            for (let i = 0; i < 4; i++) {
                ctx.rotate(Math.PI / 2);
                ctx.beginPath();
                ctx.ellipse(40, 0, 30, 15, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
        
        const legOffset = char.isJumping ? 10 : Math.sin(Date.now() / 100) * 3;
        ctx.fillStyle = '#FFA500';
        ctx.fillRect(-15, bodyY + bodyHeight - 5, 8, 25 + legOffset);
        ctx.fillRect(5, bodyY + bodyHeight - 5, 8, 25 - legOffset);
        
        ctx.fillStyle = '#FF8C00';
        ctx.fillRect(-20, bodyY + bodyHeight + 15 + legOffset, 15, 6);
        ctx.fillRect(0, bodyY + bodyHeight + 15 - legOffset, 15, 6);
        
        if (char.isAttacking && !char.isUltimate) {
            this.drawAttackEffect(char);
        }
        
        ctx.restore();
    }

    drawAttackEffect(char) {
        const ctx = this.ctx;
        const attack = char.currentAttack;
        
        if (char.attackPhase !== 'active') return;
        
        ctx.save();
        ctx.translate(char.x, char.y - char.height / 2);
        ctx.globalAlpha = 0.6;
        
        if (attack.includes('Peck')) {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(char.facing * 40, 0);
            ctx.lineTo(char.facing * 80, -10);
            ctx.lineTo(char.facing * 80, 10);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.strokeStyle = '#FF6347';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(char.facing * 50, 0, 40, -0.5, 0.5);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    drawUltimateEffect(char) {
        const ctx = this.ctx;
        const time = Date.now() / 100;
        
        for (let i = 0; i < 8; i++) {
            const angle = time + i * Math.PI / 4;
            const radius = 50 + Math.sin(time + i) * 10;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius - char.height / 2;
            
            ctx.fillStyle = `hsl(${(time * 30 + i * 45) % 360}, 100%, 60%)`;
            ctx.beginPath();
            ctx.arc(px, py, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawParticles() {
        this.particles = this.particles.filter(p => {
            p.life -= 16;
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            
            if (p.life > 0) {
                this.ctx.globalAlpha = p.life / p.maxLife;
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.globalAlpha = 1;
                return true;
            }
            return false;
        });
    }

    addHitEffect(x, y) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: Math.random() * 8 + 4,
                color: `hsl(${Math.random() * 60}, 100%, 50%)`,
                life: 500,
                maxLife: 500
            });
        }
    }

    render(player1, player2) {
        this.clear();
        this.drawBackground();
        this.drawParticles();
        this.drawCharacter(player2);
        this.drawCharacter(player1);
    }
}