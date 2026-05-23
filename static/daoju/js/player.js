class Player {
    constructor(width, height) {
        this.width = GameConfig.PLAYER.WIDTH;
        this.height = GameConfig.PLAYER.HEIGHT;
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.x = (width - this.width) / 2;
        this.y = height - this.height - 20;
        this.targetX = this.x;
        this.speed = GameConfig.PLAYER.SPEED;
        this.hp = GameConfig.PLAYER.INITIAL_HP;
        this.maxHp = GameConfig.PLAYER.INITIAL_HP;
        this.combo = 0;
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.direction = 0;
        this.isMoving = false;
        this.bobOffset = 0;
        this.bobTimer = 0;
        this.hitFlash = 0;
    }

    reset() {
        this.x = (this.canvasWidth - this.width) / 2;
        this.targetX = this.x;
        this.y = this.canvasHeight - this.height - 20;
        this.hp = GameConfig.PLAYER.INITIAL_HP;
        this.maxHp = GameConfig.PLAYER.INITIAL_HP;
        this.combo = 0;
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.direction = 0;
        this.isMoving = false;
        this.hitFlash = 0;
    }

    moveLeft() { this.direction = -1; this.isMoving = true; }
    moveRight() { this.direction = 1; this.isMoving = true; }
    stopMoving() { this.direction = 0; this.isMoving = false; }
    centerPlayer() { this.targetX = (this.canvasWidth - this.width) / 2; }

    takeDamage(amount = 1) {
        if (this.isInvincible) return false;
        this.hp -= amount;
        this.combo = 0;
        this.hitFlash = 0.3;
        if (this.hp <= 0) { this.hp = 0; return true; }
        return false;
    }

    addCombo() { if (this.combo < GameConfig.GAME.MAX_COMBO) this.combo++; }

    activateInvincible(duration = GameConfig.PLAYER.INVINCIBLE_DURATION) {
        this.isInvincible = true;
        this.invincibleTimer = duration;
    }

    update(dt) {
        if (this.direction !== 0) {
            this.targetX += this.direction * this.speed * dt;
            this.targetX = Utils.clamp(this.targetX, 0, this.canvasWidth - this.width);
        }
        this.x = Utils.lerp(this.x, this.targetX, 12 * dt);
        this.x = Utils.clamp(this.x, 0, this.canvasWidth - this.width);
        this.bobTimer += dt;
        this.bobOffset = Math.sin(this.bobTimer * 8) * 2;
        if (this.hitFlash > 0) { this.hitFlash -= dt; if (this.hitFlash < 0) this.hitFlash = 0; }
        if (this.isInvincible) {
            this.invincibleTimer -= dt * 1000;
            if (this.invincibleTimer <= 0) { this.isInvincible = false; this.invincibleTimer = 0; }
        }
    }

    draw(ctx, theme) {
        const dx = this.x, dy = this.y + this.bobOffset;

        if (this.isInvincible) {
            ctx.save();
            const ps = Math.sin(Date.now() * 0.008) * 0.15 + 1;
            ctx.globalAlpha = 0.25;
            const g = ctx.createRadialGradient(dx + this.width/2, dy + this.height/2, 0,
                dx + this.width/2, dy + this.height/2, this.width * 0.7 * ps);
            g.addColorStop(0, 'rgba(255,215,0,0.6)');
            g.addColorStop(0.5, 'rgba(255,215,0,0.3)');
            g.addColorStop(1, 'rgba(255,215,0,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(dx + this.width/2, dy + this.height/2, this.width * 0.7 * ps, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.save();
        if (this.hitFlash > 0) ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.03) * 0.3;

        ctx.shadowColor = 'rgba(0,0,0,0.25)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;

        const bw = this.width * 0.55, bh = this.height * 0.45;
        const bx = dx + (this.width - bw) / 2, by = dy + this.height * 0.32;

        const bg = ctx.createLinearGradient(bx, by, bx, by + bh);
        bg.addColorStop(0, '#5DADE2'); bg.addColorStop(0.5, '#3498DB'); bg.addColorStop(1, '#2980B9');
        ctx.fillStyle = bg;
        Utils.drawRoundRect(ctx, bx, by, bw, bh, 10);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.ellipse(bx + bw*0.35, by + bh*0.3, bw*0.15, bh*0.1, -0.3, 0, Math.PI * 2);
        ctx.fill();

        const hr = this.width * 0.24, hx = dx + this.width/2, hy = dy + this.height * 0.18;
        const hg = ctx.createRadialGradient(hx - 6, hy - 6, 0, hx, hy, hr);
        hg.addColorStop(0, '#FFE4C4'); hg.addColorStop(0.7, '#F5CBA7'); hg.addColorStop(1, '#E8B88A');
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(hx, hy, hr, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#5D4037';
        ctx.beginPath();
        ctx.ellipse(hx, hy - hr*0.3, hr*0.9, hr*0.5, 0, Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(hx - 7, hy - 2, 3.5, 0, Math.PI * 2);
        ctx.arc(hx + 7, hy - 2, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(hx - 6, hy - 3, 1.2, 0, Math.PI * 2);
        ctx.arc(hx + 8, hy - 3, 1.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(hx, hy + 6, 6, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();

        const lw = bw * 0.38, lh = this.height * 0.22, ly = by + bh;
        const lo = this.isMoving ? Math.sin(this.bobTimer * 12) * 6 : 0;

        const lg = ctx.createLinearGradient(0, ly, 0, ly + lh);
        lg.addColorStop(0, '#2C3E50'); lg.addColorStop(1, '#1A252F');
        ctx.fillStyle = lg;
        Utils.drawRoundRect(ctx, bx + 3, ly, lw, lh - lo, 4);
        ctx.fill();
        Utils.drawRoundRect(ctx, bx + bw - lw - 3, ly, lw, lh + lo, 4);
        ctx.fill();

        ctx.fillStyle = '#34495E';
        Utils.drawRoundRect(ctx, bx, ly + lh - 8, lw + 6, 8, 3);
        ctx.fill();
        Utils.drawRoundRect(ctx, bx + bw - lw - 6, ly + lh - 8, lw + 6, 8, 3);
        ctx.fill();

        const aw = 9, ah = bh * 0.7, ay = by + 8;
        ctx.fillStyle = '#F5CBA7';
        const ao = this.isMoving ? Math.sin(this.bobTimer * 12) * 10 : 0;
        Utils.drawRoundRect(ctx, bx - aw - 4, ay - ao, aw, ah, 4);
        ctx.fill();
        Utils.drawRoundRect(ctx, bx + bw + 4, ay + ao, aw, ah, 4);
        ctx.fill();

        ctx.restore();

        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(dx + this.width/2, dy + this.height + 2, this.width * 0.35, 5, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    getBounds() { return { x: this.x + 8, y: this.y + 8, width: this.width - 16, height: this.height - 12 }; }

    getState() {
        return {
            x: this.x, targetX: this.targetX, y: this.y,
            hp: this.hp, maxHp: this.maxHp, combo: this.combo,
            isInvincible: this.isInvincible, invincibleTimer: this.invincibleTimer
        };
    }

    loadState(s) {
        if (s) {
            this.x = s.x || this.x;
            this.targetX = s.targetX || s.x || this.x;
            this.y = s.y || this.y;
            this.hp = s.hp != null ? s.hp : GameConfig.PLAYER.INITIAL_HP;
            this.maxHp = s.maxHp || GameConfig.PLAYER.INITIAL_HP;
            this.combo = s.combo || 0;
            this.isInvincible = s.isInvincible || false;
            this.invincibleTimer = s.invincibleTimer || 0;
        }
    }
}
