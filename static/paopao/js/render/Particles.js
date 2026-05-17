const Particles = {
    createParticle(x, y, vx, vy, color, size, life) {
        return {
            x,
            y,
            vx,
            vy,
            color,
            size,
            life,
            maxLife: life,
            alpha: 1
        };
    },
    
    createExplosion(x, y, colors, count = 20) {
        const particles = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Helpers.randomRange(2, 6);
            particles.push(this.createParticle(
                x,
                y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                colors[Math.floor(Math.random() * colors.length)],
                Helpers.randomRange(4, 10),
                Helpers.randomRange(400, 800)
            ));
        }
        return particles;
    },
    
    createSparkle(x, y, color, count = 10) {
        const particles = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Helpers.randomRange(1, 3);
            particles.push(this.createParticle(
                x + Helpers.randomRange(-5, 5),
                y + Helpers.randomRange(-5, 5),
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 1,
                color,
                Helpers.randomRange(2, 5),
                Helpers.randomRange(300, 600)
            ));
        }
        return particles;
    },
    
    updateParticles(particles, deltaTime) {
        return particles.filter(p => {
            p.life -= deltaTime;
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05;
            p.alpha = p.life / p.maxLife;
            return p.life > 0;
        });
    },
    
    renderParticles(ctx, particles) {
        for (const p of particles) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.restore();
        }
    }
};
