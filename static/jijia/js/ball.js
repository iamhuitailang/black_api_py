class Ball {
    constructor(x, y, vx, vy, type, isPlayer = true) {
        this.config = CONFIG.BALL_TYPES[type];
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.type = type;
        this.radius = this.config.radius;
        this.damage = this.config.damage;
        this.isPlayer = isPlayer;
        this.active = true;
        this.pierceCount = this.config.pierceCount || 0;
        this.piercedTargets = [];
        this.trail = [];
        this.glowIntensity = 0;
    }

    update(canvasWidth, canvasHeight) {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 10) {
            this.trail.shift();
        }
        
        return physics.updateBall(this, canvasWidth, canvasHeight);
    }

    draw(ctx) {
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const alpha = (i / this.trail.length) * 0.3;
            const radius = this.radius * (i / this.trail.length);
            
            ctx.beginPath();
            ctx.arc(t.x, t.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = this.config.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
            ctx.fill();
        }
        
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 1.5);
        gradient.addColorStop(0, this.config.color);
        gradient.addColorStop(0.5, this.adjustColor(this.config.color, -20));
        gradient.addColorStop(1, this.adjustColor(this.config.color, -50));
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = this.config.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.2;
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        if (this.type === 'pierce') {
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚡', this.x, this.y + 3);
        } else if (this.type === 'explosive') {
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('💥', this.x, this.y + 3);
        } else if (this.type === 'ultimate') {
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⭐', this.x, this.y + 4);
        }
    }

    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    canPierce(targetId) {
        if (this.type !== 'pierce') return false;
        if (this.piercedTargets.includes(targetId)) return false;
        return this.pierceCount > 0;
    }

    markPierced(targetId) {
        this.piercedTargets.push(targetId);
        this.pierceCount--;
    }

    getState() {
        return {
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            type: this.type,
            isPlayer: this.isPlayer,
            active: this.active,
            pierceCount: this.pierceCount,
            piercedTargets: this.piercedTargets
        };
    }

    static fromState(state) {
        const ball = new Ball(state.x, state.y, state.vx, state.vy, state.type, state.isPlayer);
        ball.active = state.active;
        ball.pierceCount = state.pierceCount;
        ball.piercedTargets = state.piercedTargets;
        return ball;
    }
}