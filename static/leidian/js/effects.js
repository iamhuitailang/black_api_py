const Effects = (() => {
    let particles = [];
    let stars = [];
    
    const initStars = () => {
        stars = [];
        for (let i = 0; i < Config.GAME.STAR_COUNT; i++) {
            stars.push({
                x: Math.random() * Config.CANVAS_WIDTH,
                y: Math.random() * Config.CANVAS_HEIGHT,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 2 + 0.5,
                brightness: Math.random()
            });
        }
    };
    
    const createExplosion = (x, y, color, count = 15) => {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const speed = Math.random() * 4 + 2;
            particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 5 + 2,
                color,
                life: 1,
                decay: Math.random() * 0.03 + 0.02
            });
        }
    };
    
    const update = () => {
        stars.forEach(star => {
            star.y += star.speed;
            if (star.y > Config.CANVAS_HEIGHT) {
                star.y = 0;
                star.x = Math.random() * Config.CANVAS_WIDTH;
            }
        });
        
        particles = particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            particle.size *= 0.95;
            return particle.life > 0;
        });
    };
    
    const draw = (ctx) => {
        stars.forEach(star => {
            ctx.save();
            ctx.globalAlpha = 0.3 + star.brightness * 0.7;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    };
    
    const clear = () => {
        particles = [];
    };
    
    const getState = () => ({
        particles: JSON.parse(JSON.stringify(particles)),
        stars: JSON.parse(JSON.stringify(stars))
    });
    
    const restoreState = (state) => {
        particles = state.particles || [];
        stars = state.stars || [];
        if (stars.length === 0) {
            initStars();
        }
    };
    
    return {
        initStars,
        createExplosion,
        update,
        draw,
        clear,
        getState,
        restoreState
    };
})();
