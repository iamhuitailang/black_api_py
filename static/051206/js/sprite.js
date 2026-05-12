import { TILE_SIZE, COLORS, ANIMATION_FRAMES } from './config.js';

export class Sprite {
    constructor(ctx, x, y, width, height) {
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.frame = 0;
        this.frameTimer = 0;
        this.frameInterval = 10;
    }

    update() {
        this.frameTimer++;
        if (this.frameTimer >= this.frameInterval) {
            this.frameTimer = 0;
            this.frame = (this.frame + 1) % ANIMATION_FRAMES.WALK;
        }
    }

    drawRect(color, offsetX = 0, offsetY = 0, w = this.width, h = this.height) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            this.x + offsetX,
            this.y + offsetY,
            w,
            h
        );
    }

    drawRoundRect(color, x, y, w, h, radius) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, w, h, radius);
        this.ctx.fill();
    }

    drawCircle(color, x, y, radius) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
}

export class MarioSprite extends Sprite {
    constructor(ctx, x, y, state) {
        const height = state === 'small' ? TILE_SIZE : TILE_SIZE * 2;
        super(ctx, x, y, TILE_SIZE - 4, height);
        this.state = state;
        this.facingRight = true;
        this.isJumping = false;
        this.isWalking = false;
    }

    setState(state) {
        this.state = state;
        this.height = state === 'small' ? TILE_SIZE : TILE_SIZE * 2;
    }

    draw() {
        const ctx = this.ctx;
        ctx.save();
        
        if (!this.facingRight) {
            ctx.translate(this.x + this.width, this.y);
            ctx.scale(-1, 1);
            ctx.translate(-this.x, -this.y);
        }

        if (this.state === 'small') {
            this.drawSmallMario();
        } else {
            this.drawBigMario();
        }

        ctx.restore();
    }

    drawSmallMario() {
        const x = this.x;
        const y = this.y;

        this.ctx.fillStyle = COLORS.mario;
        this.ctx.fillRect(x + 2, y + 8, 12, 12);
        
        this.ctx.fillStyle = COLORS.marioSkin;
        this.ctx.fillRect(x + 4, y, 10, 10);
        
        this.ctx.fillStyle = COLORS.mario;
        this.ctx.fillRect(x + 2, y - 2, 12, 4);
        
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(x + 10, y + 2, 2, 2);
        
        this.ctx.fillStyle = '#4a2800';
        this.ctx.fillRect(x + 6, y + 6, 6, 2);
        
        this.ctx.fillStyle = '#0000ff';
        this.ctx.fillRect(x + 2, y + 18, 5, 10);
        this.ctx.fillRect(x + 9, y + 18, 5, 10);
        
        this.ctx.fillStyle = '#8b4513';
        this.ctx.fillRect(x, y + 26, 7, 4);
        this.ctx.fillRect(x + 9, y + 26, 7, 4);
    }

    drawBigMario() {
        const x = this.x;
        const y = this.y;
        const size = 14;

        this.drawRoundRect(COLORS.mario, x + 2, y + 14, size + 2, size + 4, 2);
        this.drawRoundRect(COLORS.marioSkin, x + 4, y + 4, size - 2, 12, 2);
        this.drawRect(COLORS.mario, x + 2, y + 2, size + 2, 5);
        this.drawRect('#000', x + 12, y + 7, 2, 2);
        this.drawRect('#4a2800', x + 6, y + 10, 6, 2);
        this.drawRect('#0000ff', x, y + 28, 7, 16);
        this.drawRect('#0000ff', x + 9, y + 28, 7, 16);
        this.drawRect('#8b4513', x - 2, y + 42, 8, 4);
        this.drawRect('#8b4513', x + 8, y + 42, 8, 4);
        
        if (this.state === 'fire') {
            this.drawRect('#ffffff', x + 2, y + 16, 4, 4);
            this.drawRect('#ffffff', x + 10, y + 20, 4, 4);
        }
    }
}

export class GoombaSprite extends Sprite {
    constructor(ctx, x, y) {
        super(ctx, x, y, TILE_SIZE, TILE_SIZE);
        this.dead = false;
        this.deadTimer = 0;
    }

    draw() {
        const ctx = this.ctx;
        const x = this.x;
        const y = this.y;

        if (this.dead) {
            ctx.fillStyle = COLORS.goomba;
            ctx.fillRect(x + 2, y + this.height - 8, this.width - 4, 8);
            return;
        }

        ctx.fillStyle = COLORS.goomba;
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + 10, y + 14, 5, 0, Math.PI * 2);
        ctx.arc(x + 22, y + 14, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + 12, y + 14, 2, 0, Math.PI * 2);
        ctx.arc(x + 20, y + 14, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.fillRect(x + 5, y + 10, 6, 2);
        ctx.fillRect(x + 21, y + 10, 6, 2);

        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x + 4, y + 26, 8, 6);
        ctx.fillRect(x + 20, y + 26, 8, 6);
    }
}

export class KoopaSprite extends Sprite {
    constructor(ctx, x, y, type = 'green') {
        super(ctx, x, y, TILE_SIZE, TILE_SIZE * 1.5);
        this.type = type;
        this.shellMode = false;
        this.facingRight = false;
    }

    draw() {
        const x = this.x;
        const y = this.y;
        const shellColor = this.type === 'red' ? '#ff0000' : COLORS.koopaShell;

        if (this.shellMode) {
            this.drawCircle(shellColor, x + 16, y + 24, 14);
            this.drawCircle('#ffff00', x + 16, y + 24, 6);
            return;
        }

        this.drawCircle(shellColor, x + 16, y + 24, 14);
        this.drawCircle('#ffff00', x + 16, y + 24, 6);
        
        const headX = this.facingRight ? x + 20 : x - 4;
        this.drawRoundRect(COLORS.marioSkin, headX, y + 8, 14, 14, 4);
        this.drawRect('#000', this.facingRight ? headX + 8 : headX + 2, y + 12, 3, 3);
        
        this.drawRect(this.type === 'red' ? '#ff0000' : COLORS.koopa, x + 4, y + 36, 8, 10);
        this.drawRect(this.type === 'red' ? '#ff0000' : COLORS.koopa, x + 20, y + 36, 8, 10);
    }
}

export class PiranhaSprite extends Sprite {
    constructor(ctx, x, y) {
        super(ctx, x, y, TILE_SIZE, TILE_SIZE * 1.5);
        this.extended = true;
        this.extendTimer = 0;
    }

    draw() {
        const x = this.x;
        const y = this.y + (this.extended ? 0 : 30);

        this.drawRect(COLORS.pipe, x + 8, y + 20, 16, 28);
        this.drawRect(COLORS.pipeDark, x + 10, y + 22, 12, 24);
        
        this.drawCircle(COLORS.piranha, x + 16, y + 10, 14);
        this.drawCircle('#fff', x + 10, y + 8, 4);
        this.drawCircle('#fff', x + 22, y + 8, 4);
        this.drawCircle('#000', x + 11, y + 8, 2);
        this.drawCircle('#000', x + 21, y + 8, 2);
        
        this.drawRect('#fff', x + 8, y + 14, 4, 6);
        this.drawRect('#fff', x + 20, y + 14, 4, 6);
        
        this.drawRect(COLORS.pipe, x, y + 40, 32, 8);
        this.drawRect(COLORS.pipeDark, x + 2, y + 42, 28, 4);
    }
}

export class MushroomSprite extends Sprite {
    constructor(ctx, x, y, type = 'mushroom') {
        super(ctx, x, y, TILE_SIZE, TILE_SIZE);
        this.type = type;
        this.vx = 1;
        this.vy = 0;
    }

    draw() {
        const x = this.x;
        const y = this.y;
        const ctx = this.ctx;

        const capColor = this.type === 'oneup' ? '#00ff00' : COLORS.mushroom;
        ctx.fillStyle = capColor;
        ctx.beginPath();
        ctx.arc(x + 16, y + 12, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 10, y + 6, 3, 3);
        ctx.fillRect(x + 18, y + 6, 3, 3);
        if (this.type === 'oneup') {
            ctx.fillRect(x + 6, y + 10, 3, 3);
            ctx.fillRect(x + 22, y + 10, 3, 3);
        }
        
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 10, y + 18, 12, 14);
        
        ctx.fillStyle = '#000';
        ctx.fillRect(x + 12, y + 22, 2, 2);
        ctx.fillRect(x + 18, y + 22, 2, 2);
    }
}

export class FlowerSprite extends Sprite {
    constructor(ctx, x, y) {
        super(ctx, x, y, TILE_SIZE, TILE_SIZE);
    }

    draw() {
        const x = this.x;
        const y = this.y;

        this.drawRect(COLORS.pipe, x + 14, y + 16, 4, 16);
        
        this.drawCircle(COLORS.flower, x + 16, y + 10, 10);
        this.drawCircle('#fff', x + 8, y + 4, 5);
        this.drawCircle('#fff', x + 24, y + 4, 5);
        this.drawCircle('#fff', x + 8, y + 16, 5);
        this.drawCircle('#fff', x + 24, y + 16, 5);
        this.drawCircle(COLORS.flower, x + 16, y + 10, 5);
        
        this.drawCircle('#fff', x + 16, y + 10, 3);
    }
}

export class StarSprite extends Sprite {
    constructor(ctx, x, y) {
        super(ctx, x, y, TILE_SIZE, TILE_SIZE);
        this.vx = 2;
        this.vy = -8;
    }

    draw() {
        const ctx = this.ctx;
        const x = this.x + 16;
        const y = this.y + 16;

        ctx.fillStyle = COLORS.star;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const radius = i % 2 === 0 ? 14 : 6;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.fillRect(x - 3, y - 5, 3, 3);
    }
}

export class CoinSprite extends Sprite {
    constructor(ctx, x, y) {
        super(ctx, x, y, TILE_SIZE, TILE_SIZE);
        this.rotation = 0;
        this.collected = false;
        this.floatY = 0;
    }

    draw() {
        if (this.collected) return;

        const ctx = this.ctx;
        const x = this.x + 16;
        const y = this.y + 16 + this.floatY;

        ctx.fillStyle = COLORS.coin;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff59d';
        ctx.beginPath();
        ctx.arc(x, y - 2, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        super.update();
        this.rotation++;
    }
}

export class BlockSprite extends Sprite {
    constructor(ctx, x, y, type) {
        super(ctx, x, y, TILE_SIZE, TILE_SIZE);
        this.type = type;
        this.used = false;
        this.solid = true;
    }

    draw() {
        const ctx = this.ctx;
        const x = this.x;
        const y = this.y;

        switch (this.type) {
            case 'ground':
                ctx.fillStyle = COLORS.groundTop;
                ctx.fillRect(x, y, TILE_SIZE, 4);
                ctx.fillStyle = COLORS.ground;
                ctx.fillRect(x, y + 4, TILE_SIZE, TILE_SIZE - 4);
                break;
                
            case 'brick':
                ctx.fillStyle = COLORS.brick;
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#000';
                ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, 1);
                ctx.fillRect(x + 1, y + 15, TILE_SIZE - 2, 1);
                ctx.fillRect(x + 15, y + 1, 1, TILE_SIZE - 2);
                break;
                
            case 'question':
                const color = this.used ? COLORS.questionUsed : COLORS.question;
                ctx.fillStyle = color;
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#000';
                ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, 1);
                ctx.fillRect(x + 1, y + TILE_SIZE - 2, TILE_SIZE - 2, 1);
                if (!this.used) {
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(x + 12, y + 6, 8, 4);
                    ctx.fillRect(x + 14, y + 10, 4, 8);
                    ctx.fillRect(x + 12, y + 18, 8, 4);
                }
                break;
                
            case 'pipe':
                ctx.fillStyle = COLORS.pipe;
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = COLORS.pipeDark;
                ctx.fillRect(x + 4, y + 4, 8, TILE_SIZE - 8);
                break;
                
            case 'pipe_top':
                ctx.fillStyle = COLORS.pipe;
                ctx.fillRect(x - 4, y, TILE_SIZE + 8, 16);
                ctx.fillStyle = COLORS.pipeDark;
                ctx.fillRect(x + 4, y + 4, 8, 8);
                ctx.fillStyle = COLORS.pipe;
                ctx.fillRect(x, y + 16, TILE_SIZE, 16);
                break;
        }
    }
}

export class FlagSprite extends Sprite {
    constructor(ctx, x, y) {
        super(ctx, x, y, TILE_SIZE * 2, TILE_SIZE * 10);
    }

    draw() {
        const ctx = this.ctx;
        const x = this.x;
        const y = this.y;

        ctx.fillStyle = COLORS.flagPole;
        ctx.fillRect(x + 8, y, 8, this.height);
        
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(x + 12, y, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = COLORS.flag;
        ctx.beginPath();
        ctx.moveTo(x + 16, y + 20);
        ctx.lineTo(x + 50, y + 35);
        ctx.lineTo(x + 16, y + 50);
        ctx.closePath();
        ctx.fill();
    }
}