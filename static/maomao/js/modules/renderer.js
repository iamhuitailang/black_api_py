import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, ATTACK_DURATION } from './constants.js';

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
        const gradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        gradient.addColorStop(0, '#87ceeb');
        gradient.addColorStop(0.6, '#e0f7fa');
        gradient.addColorStop(1, '#90ee90');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        this.drawCloud(100, 80, 0.8);
        this.drawCloud(400, 50, 1);
        this.drawCloud(700, 100, 0.7);
        this.drawCloud(1000, 60, 0.9);

        this.ctx.fillStyle = '#90ee90';
        this.ctx.fillRect(0, GROUND_Y + 30, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

        this.ctx.fillStyle = '#7ccd7c';
        for (let i = 0; i < CANVAS_WIDTH; i += 30) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, GROUND_Y + 35);
            this.ctx.quadraticCurveTo(i + 15, GROUND_Y + 20, i + 30, GROUND_Y + 35);
            this.ctx.fill();
        }
    }

    drawCloud(x, y, scale) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 30 * scale, 0, Math.PI * 2);
        this.ctx.arc(x + 35 * scale, y - 10 * scale, 35 * scale, 0, Math.PI * 2);
        this.ctx.arc(x + 70 * scale, y, 30 * scale, 0, Math.PI * 2);
        this.ctx.arc(x + 35 * scale, y + 10 * scale, 25 * scale, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawCat(cat) {
        const ctx = this.ctx;
        const x = cat.x + cat.width / 2;
        const y = cat.y;
        const scale = cat.isCrouching ? 0.7 : 1;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(cat.facing, scale);

        if (cat.isHurt && Math.floor(cat.hurtFrame / 3) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        this.drawCatBody(cat);
        this.drawCatHead(cat);
        this.drawCatLegs(cat);
        this.drawCatTail(cat);

        if (cat.isAttacking) {
            this.drawAttackEffect(cat);
        }

        ctx.restore();
    }

    drawCatBody(cat) {
        const ctx = this.ctx;
        const colors = cat.colors;

        ctx.fillStyle = colors.body;
        ctx.beginPath();
        ctx.ellipse(0, -35, 50, 35, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colors.body;
        ctx.beginPath();
        ctx.moveTo(-20, -20);
        ctx.quadraticCurveTo(-5, -10, 10, -20);
        ctx.fill();
    }

    drawCatHead(cat) {
        const ctx = this.ctx;
        const colors = cat.colors;

        ctx.fillStyle = colors.body;
        ctx.beginPath();
        ctx.arc(35, -55, 35, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colors.ear;
        ctx.beginPath();
        ctx.moveTo(15, -80);
        ctx.lineTo(25, -100);
        ctx.lineTo(40, -80);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(45, -80);
        ctx.lineTo(55, -100);
        ctx.lineTo(65, -80);
        ctx.fill();

        ctx.fillStyle = colors.eye;
        ctx.beginPath();
        ctx.ellipse(25, -55, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(50, -55, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(28, -58, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(53, -58, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colors.nose;
        ctx.beginPath();
        ctx.moveTo(37, -45);
        ctx.quadraticCurveTo(35, -38, 40, -38);
        ctx.quadraticCurveTo(45, -38, 43, -45);
        ctx.fill();

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(38, -38);
        ctx.quadraticCurveTo(30, -30, 25, -32);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(42, -38);
        ctx.quadraticCurveTo(50, -30, 55, -32);
        ctx.stroke();

        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(15, -45);
        ctx.lineTo(-5, -48);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(15, -40);
        ctx.lineTo(-5, -38);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(65, -45);
        ctx.lineTo(85, -48);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(65, -40);
        ctx.lineTo(85, -38);
        ctx.stroke();
    }

    drawCatLegs(cat) {
        const ctx = this.ctx;
        const colors = cat.colors;
        const legOffset = Math.sin(cat.animationFrame * 0.2) * 3;

        ctx.fillStyle = colors.body;

        ctx.beginPath();
        ctx.ellipse(-25, -10 + legOffset, 12, 18, 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(-5, -10 - legOffset, 12, 18, -0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(15, -8 - legOffset, 12, 18, 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(35, -8 + legOffset, 12, 18, -0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawCatTail(cat) {
        const ctx = this.ctx;
        const colors = cat.colors;
        const tailWag = cat.tailWag;

        ctx.strokeStyle = colors.tail;
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-45, -35);
        ctx.quadraticCurveTo(-70, -50 + tailWag, -80, -70 + tailWag * 1.5);
        ctx.stroke();
    }

    drawAttackEffect(cat) {
        const ctx = this.ctx;
        const attackProgress = cat.attackFrame / ATTACK_DURATION[cat.currentAttack];
        const effectAlpha = Math.sin(attackProgress * Math.PI);

        ctx.globalAlpha = effectAlpha * 0.8;

        switch (cat.currentAttack) {
            case 'light_paw':
            case 'heavy_paw':
                const pawSize = cat.currentAttack === 'heavy_paw' ? 50 : 35;
                this.drawPawEffect(80, -40, pawSize, '#ff69b4');
                break;
            case 'light_tail':
            case 'heavy_tail':
                const tailSize = cat.currentAttack === 'heavy_tail' ? 45 : 30;
                this.drawPawEffect(-70, -50 + cat.tailWag, tailSize, '#87ceeb');
                break;
            case 'special':
                this.drawSpecialEffect(cat);
                break;
        }

        ctx.globalAlpha = 1;
    }

    drawPawEffect(x, y, size, color) {
        const ctx = this.ctx;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x - size * 0.3, y - size * 0.2, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + size * 0.3, y - size * 0.2, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSpecialEffect(cat) {
        const ctx = this.ctx;
        const time = Date.now() * 0.01;

        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 + time;
            const dist = 60 + Math.sin(time + i) * 20;
            const x = Math.cos(angle) * dist + 60;
            const y = Math.sin(angle) * dist - 40;

            ctx.fillStyle = '#ff69b4';
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(x - 5, y - 3, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawParticles() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life--;

            if (p.life <= 0) return false;

            this.ctx.globalAlpha = p.life / p.maxLife;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;

            return true;
        });
    }

    addDamageEffect(x, y, damage) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 5,
                size: Math.random() * 8 + 4,
                color: '#ff6b6b',
                life: 30,
                maxLife: 30
            });
        }
    }

    addSpecialEffect(x, y) {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15,
                size: Math.random() * 12 + 6,
                color: ['#ff69b4', '#ffd700', '#87ceeb'][Math.floor(Math.random() * 3)],
                life: 40,
                maxLife: 40
            });
        }
    }
}
