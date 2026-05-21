const Physics = {
    gravity: GameConfig.GAME.gravity,
    
    updateItem(item, deltaTime, speedMultiplier = 1) {
        if (!item.isActive) return;
        
        const gravity = this.gravity * speedMultiplier;
        item.update(gravity, speedMultiplier);
    },
    
    checkGroundCollision(item, groundY) {
        if (!item.isActive) return false;
        
        if (item.y >= groundY) {
            item.y = groundY;
            item.isActive = false;
            return true;
        }
        return false;
    },
    
    checkPlayerCatch(item, player) {
        if (!item.isActive || player.isEliminated || player.isStunned) return false;
        
        const dx = item.x - player.x;
        const dy = item.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const catchRadius = GameConfig.GAME.catchRadius * player.catchTolerance;
        
        return distance < catchRadius && item.vy > 0;
    },
    
    checkBoundaryCollision(item, bounds) {
        if (!item.isActive) return false;
        
        return item.x < bounds.minX || item.x > bounds.maxX;
    },
    
    calculateTrajectory(fromX, fromY, toX, toY, speed, heightFactor = 1) {
        const points = [];
        const dx = toX - fromX;
        const dy = toY - fromY;
        
        const gravity = this.gravity;
        const baseForce = GameConfig.GAME.baseThrowForce;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        const time = distance / (baseForce * speed);
        
        const vx = dx / time;
        const vy = -baseForce * heightFactor * speed;
        
        let x = fromX;
        let y = fromY;
        let cvx = vx;
        let cvy = vy;
        
        const steps = 30;
        const dt = time / steps;
        
        for (let i = 0; i <= steps; i++) {
            points.push({ x, y });
            cvy += gravity * dt;
            x += cvx * dt;
            y += cvy * dt;
        }
        
        return points;
    },
    
    predictLandingPosition(item, groundY) {
        const gravity = this.gravity;
        
        if (item.vy <= 0) return null;
        
        const dy = groundY - item.y;
        const discriminant = item.vy * item.vy + 2 * gravity * dy;
        
        if (discriminant < 0) return null;
        
        const time = (-item.vy + Math.sqrt(discriminant)) / gravity;
        const landingX = item.x + item.vx * time;
        
        return {
            x: landingX,
            y: groundY,
            time: time
        };
    }
};

const ParticleSystem = {
    particles: [],
    
    createExplosion(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const speed = Math.random() * 3 + 1;
            
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.03 + Math.random() * 0.02,
                size: Math.random() * 4 + 2,
                color
            });
        }
    },
    
    createFire(x, y, colors) {
        this.particles.push({
            x: x + (Math.random() - 0.5) * 20,
            y,
            vx: (Math.random() - 0.5) * 1,
            vy: -Math.random() * 3 - 1,
            life: 1,
            decay: 0.03,
            size: Math.random() * 8 + 4,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    },
    
    update() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= p.decay;
            p.size *= 0.98;
            return p.life > 0;
        });
    },
    
    clear() {
        this.particles = [];
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Physics, ParticleSystem };
}