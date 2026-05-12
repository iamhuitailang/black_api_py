class Ring {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 25;
        this.height = 25;
        this.collected = false;
        this.animFrame = 0;
        this.animTimer = 0;
        this.floatOffset = ((x * 7 + y * 13) % 100) / 100 * Math.PI * 2;
    }

    update() {
        this.animTimer++;
        if (this.animTimer > 8) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 8;
        }
        this.floatOffset += 0.05;
    }

    draw(ctx, cameraX) {
        if (this.collected) return;

        const drawX = this.x - cameraX;
        const floatY = this.y + Math.sin(this.floatOffset) * 5;

        ctx.fillStyle = CONFIG.COLORS.ring;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;

        const scale = 0.8 + Math.sin(this.animFrame / 8 * Math.PI * 2) * 0.2;
        
        ctx.beginPath();
        ctx.ellipse(drawX + this.width / 2, floatY + this.height / 2, 
                   this.width / 2 * scale, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.ellipse(drawX + this.width / 2 - 3, floatY + this.height / 2 - 3, 
                   4, 6, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 35;
        this.height = 35;
        this.type = type;
        this.collected = false;
        this.animFrame = 0;
        this.animTimer = 0;
        this.floatOffset = ((x * 11 + y * 17) % 100) / 100 * Math.PI * 2;
    }

    update() {
        this.animTimer++;
        this.floatOffset += 0.03;
    }

    draw(ctx, cameraX) {
        if (this.collected) return;

        const drawX = this.x - cameraX;
        const floatY = this.y + Math.sin(this.floatOffset) * 8;

        ctx.save();
        ctx.translate(drawX + this.width / 2, floatY + this.height / 2);

        switch (this.type) {
            case 'shield':
                ctx.fillStyle = CONFIG.COLORS.shield;
                ctx.beginPath();
                ctx.moveTo(0, -this.height / 2);
                ctx.lineTo(-this.width / 2, -this.height / 4);
                ctx.lineTo(-this.width / 2, this.height / 4);
                ctx.lineTo(0, this.height / 2);
                ctx.lineTo(this.width / 2, this.height / 4);
                ctx.lineTo(this.width / 2, -this.height / 4);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.strokeStyle = 'rgba(255,255,255,0.8)';
                ctx.beginPath();
                ctx.moveTo(-5, -5);
                ctx.quadraticCurveTo(0, 5, 5, -5);
                ctx.stroke();
                break;

            case 'invincibility':
                const starAngle = this.animTimer * 0.1;
                ctx.rotate(starAngle);
                ctx.fillStyle = '#ffd700';
                this.drawStar(ctx, 0, 0, 5, 15, 7);
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
                break;

            case 'speed':
                ctx.fillStyle = '#ff6b00';
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(-this.width / 4, -this.height / 3);
                ctx.quadraticCurveTo(-this.width / 6, 0, -this.width / 4, this.height / 3);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.fillStyle = '#fff';
                for (let i = 0; i < 3; i++) {
                    ctx.fillRect(-this.width / 2 - 5 - i * 8, -3 + i * 3, 6, 3);
                }
                break;

            case '1up':
                ctx.fillStyle = '#ff69b4';
                ctx.beginPath();
                ctx.arc(0, 0, this.width / 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('1UP', 0, 0);
                break;

            case 'emerald':
                const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'];
                const colorIndex = Math.floor(this.animTimer / 10) % colors.length;
                ctx.fillStyle = colors[colorIndex];
                
                ctx.beginPath();
                ctx.moveTo(0, -this.height / 2);
                ctx.lineTo(this.width / 2, 0);
                ctx.lineTo(0, this.height / 2);
                ctx.lineTo(-this.width / 2, 0);
                ctx.closePath();
                ctx.fill();
                
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.globalAlpha = 0.5 + Math.sin(this.animTimer * 0.2) * 0.3;
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(-3, -5, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
                break;
        }

        ctx.restore();
    }

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);

        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }

        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
    }

    applyEffect(player) {
        switch (this.type) {
            case 'shield':
                player.collectShield();
                break;
            case 'invincibility':
                player.collectInvincibility();
                break;
            case 'speed':
                player.vx *= 1.5;
                break;
            case '1up':
                player.collect1Up();
                break;
            case 'emerald':
                break;
        }
    }
}

class Spring {
    constructor(x, y, direction = 'up', strength = 18) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 25;
        this.direction = direction;
        this.strength = strength;
        this.compressed = false;
        this.compressTimer = 0;
    }

    update() {
        if (this.compressed) {
            this.compressTimer++;
            if (this.compressTimer > 15) {
                this.compressed = false;
                this.compressTimer = 0;
            }
        }
    }

    activate(player) {
        if (!this.compressed) {
            this.compressed = true;
            this.compressTimer = 0;
            
            switch (this.direction) {
                case 'up':
                    player.vy = -this.strength;
                    break;
                case 'left':
                    player.vx = -this.strength;
                    break;
                case 'right':
                    player.vx = this.strength;
                    break;
            }
        }
    }

    draw(ctx, cameraX) {
        const drawX = this.x - cameraX;
        const compressHeight = this.compressed ? 10 : 0;

        ctx.fillStyle = '#8b4513';
        ctx.fillRect(drawX, this.y + this.height - 8, this.width, 8);

        ctx.fillStyle = CONFIG.COLORS.spring;
        const coils = 3;
        const coilHeight = (this.height - 8 - compressHeight) / coils;
        
        for (let i = 0; i < coils; i++) {
            const y = this.y + compressHeight + i * coilHeight + 5;
            ctx.fillRect(drawX + 5, y, this.width - 10, coilHeight - 2);
        }

        ctx.fillStyle = '#ff4500';
        ctx.fillRect(drawX + 2, this.y + compressHeight, this.width - 4, 8);
    }
}

class Goal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 100;
        this.animTimer = 0;
    }

    update() {
        this.animTimer++;
    }

    draw(ctx, cameraX) {
        const drawX = this.x - cameraX;

        ctx.fillStyle = '#8b4513';
        ctx.fillRect(drawX + this.width / 2 - 5, this.y, 10, this.height);

        ctx.fillStyle = '#ffd700';
        const ringY = this.y + 30 + Math.sin(this.animTimer * 0.05) * 10;
        ctx.beginPath();
        ctx.arc(drawX + this.width / 2, ringY, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ff8c00';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(drawX + this.width / 2 - 8, ringY - 8, 6, 0, Math.PI * 2);
        ctx.fill();
    }
}
