class Balloon {
    constructor(x, y, type = null) {
        this.id = Utils.generateId();
        this.type = type || Utils.selectBalloonType();
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angularVelocity = 0;
        this.rotation = 0;
        this.radius = this.type.radius;
        this.mass = this.type.weight * this.radius * 0.1;
        this.color = Utils.getBalloonColor(this.type);
        this.isLaunched = false;
        this.isLanded = false;
        this.isColliding = false;
        this.sparkleTime = 0;
        this.stabilizeEffect = 0;
    }

    update(dt = 1) {
        if (!this.isLaunched) return;

        const physics = CONSTANTS.PHYSICS;
        
        this.vy += physics.GRAVITY * this.mass * dt;
        
        this.vx *= physics.AIR_RESISTANCE;
        this.vy *= physics.AIR_RESISTANCE;
        
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        this.rotation += this.angularVelocity * dt;
        this.angularVelocity *= physics.ANGULAR_DAMPING;
        
        if (this.isLanded && Math.abs(this.angularVelocity) < 0.01) {
            this.angularVelocity = 0;
        }
        
        if (Math.abs(this.vx) < 0.05) {
            this.vx = 0;
        }
        if (this.isLanded && Math.abs(this.vy) < 0.1) {
            this.vy = 0;
        }
        
        if (this.type.special === 'stabilize' && this.stabilizeEffect > 0) {
            this.stabilizeEffect -= dt * 0.02;
            this.vx *= 0.95;
            this.angularVelocity *= 0.9;
        }
        
        if (this.sparkleTime > 0) {
            this.sparkleTime -= dt;
        }
    }

    applyImpulse(forceX, forceY) {
        this.vx += forceX / this.mass;
        this.vy += forceY / this.mass;
    }

    applyAngularImpulse(torque) {
        this.angularVelocity += torque / (this.mass * this.radius * 0.5);
    }

    draw(ctx, cameraY = 0) {
        const drawY = this.y - cameraY;
        
        ctx.save();
        ctx.translate(this.x, drawY);
        ctx.rotate(this.rotation);
        
        this.drawBalloonBody(ctx);
        this.drawBalloonHighlight(ctx);
        this.drawBalloonString(ctx);
        
        if (this.type.special === 'explode') {
            this.drawBombPattern(ctx);
        } else if (this.type.special === 'stabilize') {
            this.drawGoldenGlow(ctx);
        }
        
        if (this.sparkleTime > 0) {
            this.drawSparkles(ctx);
        }
        
        ctx.restore();
    }

    drawBalloonBody(ctx) {
        const r = this.radius;
        
        const gradient = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
        gradient.addColorStop(0, this.lightenColor(this.color, 30));
        gradient.addColorStop(0.7, this.color);
        gradient.addColorStop(1, this.darkenColor(this.color, 30));
        
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * 1.1, 0, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(-r * 0.15, r * 0.9);
        ctx.quadraticCurveTo(0, r * 1.15, r * 0.15, r * 0.9);
        ctx.quadraticCurveTo(0, r * 1.0, -r * 0.15, r * 0.9);
        ctx.fillStyle = this.darkenColor(this.color, 20);
        ctx.fill();
    }

    drawBalloonHighlight(ctx) {
        const r = this.radius;
        
        ctx.beginPath();
        ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.25, r * 0.15, -0.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(r * 0.2, -r * 0.5, r * 0.1, r * 0.08, 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
    }

    drawBalloonString(ctx) {
        const r = this.radius;
        
        ctx.beginPath();
        ctx.moveTo(0, r * 0.95);
        
        const stringLength = r * 0.8;
        const segments = 5;
        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const wave = Math.sin(t * Math.PI * 2 + this.rotation * 2) * 5;
            ctx.lineTo(wave, r * 0.95 + stringLength * t);
        }
        
        ctx.strokeStyle = this.darkenColor(this.color, 40);
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    drawBombPattern(ctx) {
        const r = this.radius;
        
        ctx.fillStyle = '#FF4444';
        ctx.font = `bold ${r * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', 0, 0);
    }

    drawGoldenGlow(ctx) {
        const r = this.radius;
        const time = Date.now() * 0.003;
        
        for (let i = 0; i < 3; i++) {
            const glowR = r + 5 + i * 5 + Math.sin(time + i) * 3;
            ctx.beginPath();
            ctx.arc(0, 0, glowR, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 215, 0, ${0.3 - i * 0.1})`;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }

    drawSparkles(ctx) {
        const r = this.radius;
        const time = Date.now() * 0.01;
        
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 + time;
            const dist = r + 10 + Math.sin(time * 2 + i) * 5;
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist;
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${this.sparkleTime / 60})`;
            ctx.fill();
        }
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `rgb(${R}, ${G}, ${B})`;
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return `rgb(${R}, ${G}, ${B})`;
    }

    triggerSparkle() {
        this.sparkleTime = 60;
    }

    serialize() {
        return {
            id: this.id,
            typeId: this.type.id,
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            angularVelocity: this.angularVelocity,
            rotation: this.rotation,
            radius: this.radius,
            color: this.color,
            isLaunched: this.isLaunched,
            isLanded: this.isLanded,
            stabilizeEffect: this.stabilizeEffect
        };
    }

    static deserialize(data) {
        const type = Object.values(CONSTANTS.BALLOON_TYPES).find(t => t.id === data.typeId);
        const balloon = new Balloon(data.x, data.y, type);
        balloon.id = data.id;
        balloon.vx = data.vx;
        balloon.vy = data.vy;
        balloon.angularVelocity = data.angularVelocity;
        balloon.rotation = data.rotation;
        balloon.radius = data.radius;
        balloon.color = data.color;
        balloon.isLaunched = data.isLaunched;
        balloon.isLanded = data.isLanded;
        balloon.stabilizeEffect = data.stabilizeEffect || 0;
        return balloon;
    }
}