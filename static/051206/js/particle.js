import { TILE_SIZE, COLORS } from './config.js';

export class Particle {
    constructor(ctx, x, y, vx, vy, color, life = 60) {
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = 6;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2;
        this.life--;
        return this.life > 0;
    }

    draw() {
        const alpha = this.life / this.maxLife;
        this.ctx.fillStyle = this.color;
        this.ctx.globalAlpha = alpha;
        this.ctx.fillRect(this.x, this.y, this.size, this.size);
        this.ctx.globalAlpha = 1;
    }
}

export class ParticleSystem {
    constructor(ctx) {
        this.ctx = ctx;
        this.particles = [];
    }

    emit(x, y, type, count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const speed = 2 + Math.random() * 3;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 2;

            let color;
            let life;

            switch (type) {
                case 'brick':
                    color = COLORS.brick;
                    life = 45;
                    break;
                case 'coin':
                    color = COLORS.coin;
                    life = 30;
                    break;
                case 'star':
                    color = COLORS.star;
                    life = 40;
                    break;
                case 'enemy':
                    color = COLORS.goomba;
                    life = 35;
                    break;
                case 'score':
                    color = '#fff';
                    life = 50;
                    break;
                default:
                    color = '#fff';
                    life = 30;
            }

            this.particles.push(new Particle(this.ctx, x, y, vx, vy, color, life));
        }
    }

    emitScorePop(x, y, score) {
        const particle = new Particle(this.ctx, x, y, 0, -1, '#fff', 40);
        particle.isScore = true;
        particle.score = score;
        particle.size = 12;
        this.particles.push(particle);
    }

    emitCoinCollect(x, y) {
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 6) * i - Math.PI / 2;
            const speed = 3 + Math.random() * 2;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 2;
            this.particles.push(new Particle(this.ctx, x, y, vx, vy, COLORS.coin, 25));
        }
    }

    emitBrickBreak(x, y) {
        for (let i = 0; i < 12; i++) {
            const vx = (Math.random() - 0.5) * 6;
            const vy = -3 - Math.random() * 4;
            this.particles.push(new Particle(
                this.ctx,
                x + Math.random() * TILE_SIZE,
                y + Math.random() * TILE_SIZE,
                vx,
                vy,
                COLORS.brick,
                50
            ));
        }
    }

    emitPowerUp(x, y) {
        for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 / 16) * i;
            const speed = 2 + Math.random() * 2;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            this.particles.push(new Particle(this.ctx, x, y, vx, vy, '#fff', 35));
        }
    }

    emitStarEffect(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const colors = [COLORS.star, '#fff', '#ff0'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push(new Particle(this.ctx, x, y, vx, vy, color, 30));
        }
    }

    update() {
        this.particles = this.particles.filter(particle => particle.update());
    }

    draw() {
        for (const particle of this.particles) {
            if (particle.isScore) {
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(particle.score.toString(), particle.x, particle.y);
            } else {
                particle.draw();
            }
        }
    }

    clear() {
        this.particles = [];
    }
}