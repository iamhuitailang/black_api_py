export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    clear() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.5, '#E0F6FF');
        gradient.addColorStop(1, '#B8E6FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawIceBackground() {
        this.ctx.save();
        this.ctx.globalAlpha = 0.1;
        
        for (let i = 0; i < 15; i++) {
            const x = (i * 137) % this.canvas.width;
            const y = (i * 89) % this.canvas.height;
            const size = 20 + (i % 5) * 10;
            
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.drawSnowflake(x, y, size);
        }
        
        this.ctx.restore();
    }

    drawSnowflake(x, y, size) {
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
        }
        this.ctx.stroke();
    }

    drawGoal(goal) {
        this.ctx.save();
        
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.ellipse(goal.x, goal.y + 15, goal.radius, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#F5F5DC';
        this.ctx.beginPath();
        this.ctx.moveTo(goal.x, goal.y - goal.radius);
        this.ctx.lineTo(goal.x - goal.radius, goal.y + 15);
        this.ctx.lineTo(goal.x + goal.radius, goal.y + 15);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillStyle = '#2C1810';
        this.ctx.beginPath();
        this.ctx.arc(goal.x, goal.y + 5, 12, 0, Math.PI * 2);
        this.ctx.fill();
        
        const glowSize = goal.radius + 15 + Math.sin(Date.now() / 300) * 5;
        this.ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 200) * 0.1;
        const glowGradient = this.ctx.createRadialGradient(goal.x, goal.y, 0, goal.x, goal.y, glowSize);
        glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
        glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
        this.ctx.arc(goal.x, goal.y, glowSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }

    drawHole(hole) {
        this.ctx.save();
        
        const gradient = this.ctx.createRadialGradient(
            hole.x, hole.y, 0,
            hole.x, hole.y, hole.radius
        );
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.7, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#4a90d9';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(hole.x - hole.radius * 0.3, hole.y - hole.radius * 0.3, hole.radius * 0.3, hole.radius * 0.15, -0.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }

    drawSpike(spike) {
        this.ctx.save();
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.strokeStyle = '#c0392b';
        this.ctx.lineWidth = 2;
        
        const spikes = 6;
        const innerRadius = spike.radius * 0.4;
        const outerRadius = spike.radius;
        
        this.ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            const x = spike.x + Math.cos(angle) * radius;
            const y = spike.y + Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(spike.x - 3, spike.y - 3, spike.radius * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }

    drawSpeedBoost(boost) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.6;
        
        const gradient = this.ctx.createLinearGradient(
            boost.x, boost.y,
            boost.x + boost.width, boost.y + boost.height
        );
        gradient.addColorStop(0, '#FF6B6B');
        gradient.addColorStop(0.5, '#FFA500');
        gradient.addColorStop(1, '#FF6B6B');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(boost.x, boost.y, boost.width, boost.height);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (let i = 0; i < 3; i++) {
            const offset = ((Date.now() / 100 + i * 50) % (boost.width + 50)) - 25;
            this.ctx.fillRect(boost.x + offset, boost.y, 10, boost.height);
        }
        
        this.ctx.restore();
    }

    drawSlowZone(slow) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.5;
        
        this.ctx.fillStyle = '#8B7355';
        this.ctx.fillRect(slow.x, slow.y, slow.width, slow.height);
        
        this.ctx.fillStyle = '#6B5344';
        for (let i = 0; i < slow.width / 15; i++) {
            for (let j = 0; j < slow.height / 15; j++) {
                if ((i + j) % 2 === 0) {
                    this.ctx.fillRect(
                        slow.x + i * 15,
                        slow.y + j * 15,
                        12, 12
                    );
                }
            }
        }
        
        this.ctx.restore();
    }

    drawPortal(portal, isFirst) {
        this.ctx.save();
        
        const time = Date.now() / 1000;
        const color = isFirst ? '#9b59b6' : '#3498db';
        
        for (let i = 3; i >= 0; i--) {
            const radius = portal.radius + i * 5 + Math.sin(time * 3 + i) * 3;
            this.ctx.globalAlpha = 0.1 + (3 - i) * 0.1;
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(portal.x, portal.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1;
        const gradient = this.ctx.createRadialGradient(
            portal.x, portal.y, 0,
            portal.x, portal.y, portal.radius
        );
        gradient.addColorStop(0, 'white');
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(portal.x, portal.y, portal.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.rotate(time * 2);
        this.ctx.translate(portal.x, portal.y);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            this.ctx.rotate(Math.PI / 2);
            this.ctx.beginPath();
            this.ctx.arc(0, 0, portal.radius * 0.6, 0, Math.PI * 0.5);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    drawRotatingIce(rotating) {
        this.ctx.save();
        
        const time = Date.now() / 1000;
        const rotation = time * rotating.speed;
        
        this.ctx.translate(rotating.x + rotating.width / 2, rotating.y + rotating.height / 2);
        this.ctx.rotate(rotation);
        
        this.ctx.globalAlpha = 0.4;
        this.ctx.fillStyle = '#3498db';
        this.ctx.fillRect(-rotating.width / 2, -rotating.height / 2, rotating.width, rotating.height);
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 2;
        const arrowSize = Math.min(rotating.width, rotating.height) * 0.3;
        
        for (let i = 0; i < 4; i++) {
            this.ctx.rotate(Math.PI / 2);
            this.ctx.beginPath();
            this.ctx.moveTo(0, -arrowSize);
            this.ctx.lineTo(arrowSize * 0.5, 0);
            this.ctx.lineTo(-arrowSize * 0.5, 0);
            this.ctx.closePath();
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    drawItem(item) {
        this.ctx.save();
        this.ctx.translate(item.x, item.y);
        
        const bounce = Math.sin(Date.now() / 300 + item.x) * 5;
        this.ctx.translate(0, bounce);
        
        const glowSize = item.radius + 10 + Math.sin(Date.now() / 200) * 3;
        this.ctx.globalAlpha = 0.3;
        const glowGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
        glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.globalAlpha = 1;
        this.ctx.font = `${item.radius * 2}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        let emoji = '';
        switch(item.type) {
            case 'magnet': emoji = '🐟'; break;
            case 'claw': emoji = '❄️'; break;
            case 'shield': emoji = '🛡️'; break;
            case 'rocket': emoji = '🚀'; break;
        }
        
        this.ctx.fillText(emoji, 0, 0);
        
        this.ctx.restore();
    }

    drawPenguin(penguin) {
        this.ctx.save();
        
        const r = penguin.radius;
        const x = penguin.x;
        const y = penguin.y;
        
        if (penguin.hasShield) {
            this.ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.2;
            this.ctx.strokeStyle = '#3498db';
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.arc(x, y, r + 10, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        }
        
        if (penguin.hasMagnet) {
            this.ctx.globalAlpha = 0.3;
            const magnetGradient = this.ctx.createRadialGradient(x, y, 0, x, y, 80);
            magnetGradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
            magnetGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            this.ctx.fillStyle = magnetGradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 80, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
        
        const bodyGradient = this.ctx.createRadialGradient(x - r * 0.3, y - r * 0.2, r * 0.2, x, y, r);
        bodyGradient.addColorStop(0, '#4A6572');
        bodyGradient.addColorStop(0.6, '#2C3E50');
        bodyGradient.addColorStop(1, '#1A252F');
        
        this.ctx.fillStyle = bodyGradient;
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, r * 0.9, r * 1.05, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(x - r * 0.25, y - r * 0.4, r * 0.35, r * 0.25, -0.4, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + r * 0.2, r * 0.6, r * 0.7, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        const headGradient = this.ctx.createRadialGradient(x - r * 0.15, y - r * 0.7, r * 0.15, x, y - r * 0.5, r * 0.55);
        headGradient.addColorStop(0, '#5A6D7F');
        headGradient.addColorStop(0.5, '#2C3E50');
        headGradient.addColorStop(1, '#1A252F');
        
        this.ctx.fillStyle = headGradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y - r * 0.5, r * 0.55, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(x - r * 0.15, y - r * 0.65, r * 0.25, r * 0.2, -0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y - r * 0.4, r * 0.4, r * 0.33, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.beginPath();
        this.ctx.moveTo(x - r * 0.4, y - r * 0.5);
        this.ctx.quadraticCurveTo(x - r * 0.55, y - r * 0.8, x - r * 0.25, y - r * 0.78);
        this.ctx.quadraticCurveTo(x - r * 0.2, y - r * 0.6, x - r * 0.3, y - r * 0.5);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.beginPath();
        this.ctx.moveTo(x + r * 0.4, y - r * 0.5);
        this.ctx.quadraticCurveTo(x + r * 0.55, y - r * 0.8, x + r * 0.25, y - r * 0.78);
        this.ctx.quadraticCurveTo(x + r * 0.2, y - r * 0.6, x + r * 0.3, y - r * 0.5);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.ellipse(x - r * 0.18, y - r * 0.5, r * 0.16, r * 0.18, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.ellipse(x + r * 0.18, y - r * 0.5, r * 0.16, r * 0.18, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#1A1A1A';
        this.ctx.beginPath();
        this.ctx.arc(x - r * 0.16, y - r * 0.48, r * 0.08, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#1A1A1A';
        this.ctx.beginPath();
        this.ctx.arc(x + r * 0.2, y - r * 0.48, r * 0.08, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(x - r * 0.19, y - r * 0.51, r * 0.035, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(x + r * 0.17, y - r * 0.51, r * 0.035, 0, Math.PI * 2);
        this.ctx.fill();
        
        const beakGradient = this.ctx.createLinearGradient(x, y - r * 0.42, x, y - r * 0.3);
        beakGradient.addColorStop(0, '#FFB347');
        beakGradient.addColorStop(0.5, '#FF9F43');
        beakGradient.addColorStop(1, '#FF8C00');
        
        this.ctx.fillStyle = beakGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - r * 0.42);
        this.ctx.quadraticCurveTo(x - r * 0.13, y - r * 0.36, x - r * 0.12, y - r * 0.3);
        this.ctx.quadraticCurveTo(x, y - r * 0.27, x + r * 0.12, y - r * 0.3);
        this.ctx.quadraticCurveTo(x + r * 0.13, y - r * 0.36, x, y - r * 0.42);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'rgba(255, 160, 180, 0.6)';
        this.ctx.beginPath();
        this.ctx.ellipse(x - r * 0.32, y - r * 0.38, r * 0.11, r * 0.08, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'rgba(255, 160, 180, 0.6)';
        this.ctx.beginPath();
        this.ctx.ellipse(x + r * 0.32, y - r * 0.38, r * 0.11, r * 0.08, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#2C3E50';
        this.ctx.lineWidth = 2.5;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.arc(x, y - r * 0.3, r * 0.08, 0.2, Math.PI - 0.2);
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.beginPath();
        this.ctx.ellipse(x - r * 0.72, y + r * 0.25, r * 0.22, r * 0.42, -0.35, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.beginPath();
        this.ctx.ellipse(x + r * 0.72, y + r * 0.25, r * 0.22, r * 0.42, 0.35, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(x - r * 0.75, y + r * 0.3, r * 0.08, r * 0.25, -0.35, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(x + r * 0.75, y + r * 0.3, r * 0.08, r * 0.25, 0.35, 0, Math.PI * 2);
        this.ctx.fill();
        
        const footGradient = this.ctx.createLinearGradient(x, y + r * 0.78, x, y + r * 1.02);
        footGradient.addColorStop(0, '#FFB347');
        footGradient.addColorStop(1, '#FF9F43');
        
        this.ctx.fillStyle = footGradient;
        this.ctx.beginPath();
        this.ctx.ellipse(x - r * 0.28, y + r * 0.92, r * 0.26, r * 0.13, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = footGradient;
        this.ctx.beginPath();
        this.ctx.ellipse(x + r * 0.28, y + r * 0.92, r * 0.26, r * 0.13, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#FF8C00';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(x - r * 0.28, y + r * 0.92);
        this.ctx.lineTo(x - r * 0.42, y + r * 1.0);
        this.ctx.moveTo(x - r * 0.28, y + r * 0.92);
        this.ctx.lineTo(x - r * 0.2, y + r * 1.03);
        this.ctx.moveTo(x - r * 0.28, y + r * 0.92);
        this.ctx.lineTo(x - r * 0.13, y + r * 0.95);
        this.ctx.stroke();
        
        this.ctx.strokeStyle = '#FF8C00';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(x + r * 0.28, y + r * 0.92);
        this.ctx.lineTo(x + r * 0.42, y + r * 1.0);
        this.ctx.moveTo(x + r * 0.28, y + r * 0.92);
        this.ctx.lineTo(x + r * 0.2, y + r * 1.03);
        this.ctx.moveTo(x + r * 0.28, y + r * 0.92);
        this.ctx.lineTo(x + r * 0.13, y + r * 0.95);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    drawParticles(particles) {
        particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    drawCheckpoint(checkpoint, active) {
        this.ctx.save();
        
        const poleX = checkpoint.x;
        const poleY = checkpoint.y;
        const poleHeight = 40;
        
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(poleX - 3, poleY - poleHeight, 6, poleHeight + 20);
        
        this.ctx.fillStyle = active ? '#27ae60' : '#95a5a6';
        this.ctx.beginPath();
        this.ctx.moveTo(poleX + 3, poleY - poleHeight);
        this.ctx.lineTo(poleX + 30, poleY - poleHeight + 8);
        this.ctx.lineTo(poleX + 3, poleY - poleHeight + 16);
        this.ctx.closePath();
        this.ctx.fill();
        
        if (active) {
            this.ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 200) * 0.2;
            const glow = this.ctx.createRadialGradient(poleX, poleY - poleHeight / 2, 0, poleX, poleY - poleHeight / 2, 30);
            glow.addColorStop(0, 'rgba(39, 174, 96, 0.8)');
            glow.addColorStop(1, 'rgba(39, 174, 96, 0)');
            this.ctx.fillStyle = glow;
            this.ctx.beginPath();
            this.ctx.arc(poleX, poleY - poleHeight / 2, 30, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
}
