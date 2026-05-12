class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
    }

    clear() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#ffe6f2');
        gradient.addColorStop(0.5, '#ffd1dc');
        gradient.addColorStop(1, '#ffb6c1');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.globalAlpha = 0.1;
        for (let i = 0; i < 5; i++) {
            const x = (i * 120 + Date.now() * 0.01) % (this.width + 100) - 50;
            const y = 100 + i * 80;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 40 + i * 10, 0, Math.PI * 2);
            this.ctx.fillStyle = '#fff';
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
    }

    drawAnchor(anchor) {
        this.ctx.beginPath();
        this.ctx.arc(anchor.position.x, anchor.position.y, anchor.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fill();
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(anchor.position.x, anchor.position.y, 5, 0, Math.PI * 2);
        this.ctx.fillStyle = '#654321';
        this.ctx.fill();
    }

    drawRope(rope) {
        this.ctx.strokeStyle = rope.cut ? '#654321' : CONFIG.COLORS.ROPE;
        this.ctx.lineWidth = CONFIG.ROPE_WIDTH + 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        if (rope.cut) {
            for (let i = 0; i <= rope.cutIndex; i++) {
                const seg = rope.segments[i];
                const end = seg.getEnd();
                this.ctx.beginPath();
                this.ctx.moveTo(seg.anchor.x, seg.anchor.y);
                this.ctx.lineTo(end.x, end.y);
                this.ctx.stroke();
            }
        } else {
            for (let i = 0; i < rope.segments.length; i++) {
                const seg = rope.segments[i];
                const end = seg.getEnd();
                
                this.ctx.beginPath();
                this.ctx.moveTo(seg.anchor.x, seg.anchor.y);
                this.ctx.lineTo(end.x, end.y);
                this.ctx.stroke();
            }

            if (rope.segments.length > 0) {
                const midIdx = Math.floor(rope.segments.length / 2);
                const midSeg = rope.segments[midIdx];
                const midX = (midSeg.anchor.x + midSeg.getEnd().x) / 2;
                const midY = (midSeg.anchor.y + midSeg.getEnd().y) / 2;
                this.ctx.beginPath();
                this.ctx.arc(midX, midY, 8, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
                this.ctx.fill();
                this.ctx.strokeStyle = '#ff0000';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
        }
    }

    drawCandy(candy) {
        const x = candy.position.x;
        const y = candy.position.y;
        const r = candy.radius;

        if (candy.inBubble) {
            this.ctx.beginPath();
            this.ctx.arc(x, y, r + 15, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(135, 206, 250, 0.4)';
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(135, 206, 250, 0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.arc(x - 8, y - 8, 5, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fill();
        }

        if (candy.hasBalloon) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, y - r);
            this.ctx.lineTo(x, y - r - 20);
            this.ctx.strokeStyle = '#666';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.ellipse(x, y - r - 35, 18, 22, 0, 0, Math.PI * 2);
            this.ctx.fillStyle = CONFIG.COLORS.BALLOON;
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.arc(x - 6, y - r - 42, 5, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.fill();
        }

        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI * 2);
        const gradient = this.ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(0.3, candy.color);
        gradient.addColorStop(1, this.darkenColor(candy.color, 0.6));
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.ellipse(x - r * 0.3, y - r * 0.3, r * 0.25, r * 0.15, -Math.PI / 4, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fill();
    }

    drawMonster(monster) {
        const x = monster.position.x;
        const y = monster.position.y;
        const r = monster.radius;

        this.ctx.beginPath();
        this.ctx.ellipse(x, y + 5, r, r * 0.85, 0, 0, Math.PI * 2);
        const bodyGradient = this.ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
        bodyGradient.addColorStop(0, '#90EE90');
        bodyGradient.addColorStop(0.5, CONFIG.COLORS.MONSTER);
        bodyGradient.addColorStop(1, CONFIG.COLORS.MONSTER_DARK);
        this.ctx.fillStyle = bodyGradient;
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.moveTo(x - r * 0.7, y - r * 0.5);
        this.ctx.lineTo(x - r * 0.9, y - r);
        this.ctx.lineTo(x - r * 0.5, y - r * 0.6);
        this.ctx.closePath();
        this.ctx.fillStyle = CONFIG.COLORS.MONSTER;
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.moveTo(x + r * 0.7, y - r * 0.5);
        this.ctx.lineTo(x + r * 0.9, y - r);
        this.ctx.lineTo(x + r * 0.5, y - r * 0.6);
        this.ctx.closePath();
        this.ctx.fill();

        const eyeY = y - r * 0.2;
        const eyeSpacing = r * 0.35;
        const eyeOffset = monster.eyeOffset;

        this.ctx.beginPath();
        this.ctx.ellipse(x - eyeSpacing, eyeY, r * 0.2, r * 0.25, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = '#fff';
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(x - eyeSpacing + eyeOffset, eyeY, r * 0.08, 0, Math.PI * 2);
        this.ctx.fillStyle = '#000';
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.ellipse(x + eyeSpacing, eyeY, r * 0.2, r * 0.25, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = '#fff';
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(x + eyeSpacing + eyeOffset, eyeY, r * 0.08, 0, Math.PI * 2);
        this.ctx.fillStyle = '#000';
        this.ctx.fill();

        this.ctx.beginPath();
        if (monster.mouthOpen) {
            this.ctx.ellipse(x, y + r * 0.4, r * 0.35, r * 0.3, 0, 0, Math.PI * 2);
            this.ctx.fillStyle = '#8B0000';
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.moveTo(x - r * 0.2, y + r * 0.25);
            this.ctx.lineTo(x - r * 0.15, y + r * 0.4);
            this.ctx.lineTo(x - r * 0.05, y + r * 0.25);
            this.ctx.fillStyle = '#fff';
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.moveTo(x + r * 0.05, y + r * 0.25);
            this.ctx.lineTo(x + r * 0.15, y + r * 0.4);
            this.ctx.lineTo(x + r * 0.2, y + r * 0.25);
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.ellipse(x, y + r * 0.45, r * 0.15, r * 0.1, 0, 0, Math.PI * 2);
            this.ctx.fillStyle = '#FF69B4';
            this.ctx.fill();
        } else {
            this.ctx.arc(x, y + r * 0.35, r * 0.2, 0.1 * Math.PI, 0.9 * Math.PI);
            this.ctx.strokeStyle = '#8B0000';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
    }

    drawStar(star) {
        if (star.collected) return;

        const x = star.position.x;
        const y = star.position.y;
        const r = star.radius * star.pulseScale;

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(star.rotation);

        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.closePath();

        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        gradient.addColorStop(0, '#FFFF00');
        gradient.addColorStop(1, '#FFA500');
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        this.ctx.strokeStyle = '#FF8C00';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(-r * 0.2, -r * 0.2, r * 0.2, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.fill();

        this.ctx.restore();
    }

    drawBubble(bubble) {
        if (!bubble.active) return;

        const x = bubble.position.x;
        const y = bubble.position.y;
        const r = bubble.radius + Math.sin(bubble.wobble) * 3;

        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI * 2);
        this.ctx.fillStyle = CONFIG.COLORS.BUBBLE;
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(135, 206, 250, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.15, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fill();
    }

    drawMagnet(magnet) {
        if (!magnet.active) return;

        const x = magnet.position.x;
        const y = magnet.position.y;
        const r = magnet.radius * 0.5;

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(magnet.rotation);

        this.ctx.beginPath();
        this.ctx.arc(0, 0, r * 2, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 99, 71, 0.1)';
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(0, 0, r * 1.5, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 99, 71, 0.2)';
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(0, -r * 0.3, r, Math.PI, 0);
        this.ctx.lineTo(r, r * 0.7);
        this.ctx.arc(r * 0.5, r * 0.7, r * 0.5, 0, Math.PI, true);
        this.ctx.lineTo(0, r * 0.7);
        this.ctx.arc(-r * 0.5, r * 0.7, r * 0.5, 0, Math.PI, true);
        this.ctx.lineTo(-r, -r * 0.3);
        this.ctx.closePath();
        this.ctx.fillStyle = CONFIG.COLORS.MAGNET;
        this.ctx.fill();

        this.ctx.fillStyle = '#4169E1';
        this.ctx.fillRect(-r, r * 0.3, r * 0.5, r * 0.6);
        this.ctx.fillStyle = '#DC143C';
        this.ctx.fillRect(r * 0.5, r * 0.3, r * 0.5, r * 0.6);

        this.ctx.restore();
    }

    drawSpiderweb(spiderweb) {
        if (!spiderweb.active) return;

        const x = spiderweb.position.x;
        const y = spiderweb.position.y;
        const r = spiderweb.radius;

        this.ctx.strokeStyle = CONFIG.COLORS.SPIDERWEB;
        this.ctx.lineWidth = 1.5;

        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
            this.ctx.stroke();
        }

        for (let i = 1; i <= 4; i++) {
            this.ctx.beginPath();
            this.ctx.arc(x, y, r * i / 4, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    drawBalloon(balloon) {
        if (!balloon.active) return;

        const x = balloon.position.x + Math.sin(balloon.swayOffset) * 5;
        const y = balloon.position.y;
        const r = balloon.radius;

        this.ctx.beginPath();
        this.ctx.moveTo(x, y + r);
        this.ctx.lineTo(x, y + r + 15);
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.ellipse(x, y, r * 0.8, r, 0, 0, Math.PI * 2);
        const gradient = this.ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
        gradient.addColorStop(0, '#FFB6C1');
        gradient.addColorStop(1, CONFIG.COLORS.BALLOON);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.2, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.fill();
    }

    render(game) {
        this.clear();

        game.spiderwebs.forEach(s => this.drawSpiderweb(s));
        game.bubbles.forEach(b => this.drawBubble(b));
        game.magnets.forEach(m => this.drawMagnet(m));
        game.balloons.forEach(b => this.drawBalloon(b));
        game.anchors.forEach(a => this.drawAnchor(a));
        game.ropes.forEach(r => this.drawRope(r));
        game.stars.forEach(s => this.drawStar(s));
        if (game.candy) {
            this.drawCandy(game.candy);
        }
        if (game.monster) {
            this.drawMonster(game.monster);
        }

        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = '#333';
        this.ctx.fillText(`状态: ${game.candy.released ? '已释放' : '连接中'}`, 10, this.height - 30);
        this.ctx.fillText(`绳索: ${game.ropes.filter(r => !r.cut).length}/${game.ropes.length} 未切断`, 10, this.height - 10);
    }

    darkenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = Math.floor(parseInt(hex.substr(0, 2), 16) * factor);
        const g = Math.floor(parseInt(hex.substr(2, 2), 16) * factor);
        const b = Math.floor(parseInt(hex.substr(4, 2), 16) * factor);
        return `rgb(${r}, ${g}, ${b})`;
    }
}
