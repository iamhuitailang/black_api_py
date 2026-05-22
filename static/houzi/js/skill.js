class SkillManager {
    constructor(player) {
        this.player = player;
        this.activeEffects = [];
    }

    update(deltaTime) {
        if (this.player.character.skill === 'grab' && Input.wasPressed('space')) {
            this.useQuickGrab();
        }
        
        if (this.player.character.skill === 'shield' && Input.wasPressed('shift')) {
            this.useShield();
        }
        
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            this.activeEffects[i].update(deltaTime);
            if (this.activeEffects[i].isFinished()) {
                this.activeEffects.splice(i, 1);
            }
        }
    }

    useQuickGrab() {
        if (!this.player.canUseSkill('quickGrab')) return false;
        this.player.useQuickGrab();
        
        this.activeEffects.push(new QuickGrabEffect(this.player.x, this.player.y));
        return true;
    }

    useShield() {
        if (!this.player.canUseSkill('shield')) return false;
        this.player.useShield();
        
        this.activeEffects.push(new ShieldEffect(this.player.x, this.player.y));
        return true;
    }

    draw(ctx) {
        for (let effect of this.activeEffects) {
            effect.draw(ctx);
        }
    }

    getCooldownText(skillName) {
        const cooldown = this.player.getSkillCooldown(skillName);
        if (cooldown <= 0) return '';
        return Math.ceil(cooldown / 1000) + 's';
    }

    isSkillReady(skillName) {
        return this.player.canUseSkill(skillName);
    }
}

class QuickGrabEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.maxRadius = 400;
        this.alpha = 1;
        this.finished = false;
    }

    update(deltaTime) {
        this.radius += deltaTime * 1.5;
        this.alpha = Math.max(0, 1 - this.radius / this.maxRadius);
        
        if (this.radius >= this.maxRadius) {
            this.finished = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha * 0.5;
        
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = `rgba(255, 215, 0, ${this.alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }

    isFinished() {
        return this.finished;
    }
}

class ShieldEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.particles = [];
        this.finished = false;
        this.duration = 500;
        this.elapsed = 0;
        
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            this.particles.push({
                angle: angle,
                distance: 50 + Math.random() * 20,
                size: 5 + Math.random() * 5,
                speed: 2 + Math.random() * 2
            });
        }
    }

    update(deltaTime) {
        this.elapsed += deltaTime;
        
        for (let particle of this.particles) {
            particle.distance += particle.speed * deltaTime * 0.1;
            particle.size *= 0.95;
        }
        
        if (this.elapsed >= this.duration) {
            this.finished = true;
        }
    }

    draw(ctx) {
        ctx.save();
        
        const alpha = 1 - this.elapsed / this.duration;
        
        for (let particle of this.particles) {
            const px = this.x + Math.cos(particle.angle) * particle.distance;
            const py = this.y + Math.sin(particle.angle) * particle.distance;
            
            ctx.fillStyle = `rgba(100, 200, 255, ${alpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(px, py, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    isFinished() {
        return this.finished;
    }
}
