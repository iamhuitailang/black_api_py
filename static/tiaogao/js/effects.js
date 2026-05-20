const EffectSystem = {
    effects: [],
    
    addEffect(type, x, y, data = {}) {
        const effect = {
            type,
            x,
            y,
            data,
            startTime: Date.now(),
            duration: data.duration || 1000,
            active: true
        };
        
        switch (type) {
            case 'barShake':
                effect.duration = 500;
                effect.shakeAmount = 0;
                break;
            case 'cheer':
                effect.duration = 1500;
                effect.particles = this.createCheerParticles();
                break;
            case 'redFlag':
                effect.duration = 2000;
                effect.flagY = 0;
                break;
            case 'fireworks':
                effect.duration = 3000;
                effect.fireworks = this.createFireworks(x, y);
                break;
            case 'dust':
                effect.duration = 800;
                effect.particles = this.createDustParticles(x, y);
                break;
        }
        
        this.effects.push(effect);
        return effect;
    },
    
    createCheerParticles() {
        const particles = [];
        for (let i = 0; i < 30; i++) {
            particles.push({
                x: Math.random(),
                y: 1,
                vx: (Math.random() - 0.5) * 0.01,
                vy: -0.02 - Math.random() * 0.02,
                color: ['#ff4444', '#ffd700', '#44ff44', '#4444ff'][Math.floor(Math.random() * 4)],
                size: 3 + Math.random() * 5
            });
        }
        return particles;
    },
    
    createFireworks(x, y) {
        const fireworks = [];
        for (let i = 0; i < 5; i++) {
            const fw = {
                x: x + (Math.random() - 0.5) * 0.2,
                y: y + (Math.random() - 0.5) * 0.2,
                particles: [],
                exploded: false,
                delay: i * 300
            };
            
            for (let j = 0; j < 40; j++) {
                const angle = (j / 40) * Math.PI * 2;
                const speed = 0.005 + Math.random() * 0.01;
                fw.particles.push({
                    x: 0,
                    y: 0,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color: ['#ff4444', '#ffd700', '#44ff44', '#4444ff', '#ff44ff', '#44ffff'][Math.floor(Math.random() * 6)],
                    size: 2 + Math.random() * 3,
                    life: 1
                });
            }
            
            fireworks.push(fw);
        }
        return fireworks;
    },
    
    createDustParticles(x, y) {
        const particles = [];
        for (let i = 0; i < 15; i++) {
            particles.push({
                x: x + (Math.random() - 0.5) * 0.05,
                y: y,
                vx: (Math.random() - 0.5) * 0.005,
                vy: -0.005 - Math.random() * 0.005,
                size: 2 + Math.random() * 4,
                alpha: 0.8
            });
        }
        return particles;
    },
    
    update(deltaTime) {
        const now = Date.now();
        
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            const elapsed = now - effect.startTime;
            const progress = Math.min(1, elapsed / effect.duration);
            
            if (progress >= 1) {
                effect.active = false;
                this.effects.splice(i, 1);
                continue;
            }
            
            switch (effect.type) {
                case 'barShake':
                    effect.shakeAmount = Math.sin(progress * Math.PI * 6) * (1 - progress) * 5;
                    break;
                    
                case 'cheer':
                    for (const p of effect.particles) {
                        p.x += p.vx;
                        p.y += p.vy;
                        p.vy += 0.0005;
                    }
                    break;
                    
                case 'redFlag':
                    effect.flagY = progress;
                    break;
                    
                case 'fireworks':
                    for (const fw of effect.fireworks) {
                        if (elapsed > fw.delay) {
                            fw.exploded = true;
                            for (const p of fw.particles) {
                                p.x += p.vx;
                                p.y += p.vy;
                                p.vy += 0.0002;
                                p.life -= deltaTime / 2000;
                            }
                        }
                    }
                    break;
                    
                case 'dust':
                    for (const p of effect.particles) {
                        p.x += p.vx;
                        p.y += p.vy;
                        p.alpha -= deltaTime / 800;
                    }
                    break;
            }
        }
    },
    
    render(ctx, width, height) {
        for (const effect of this.effects) {
            if (!effect.active) continue;
            
            switch (effect.type) {
                case 'barShake':
                    break;
                    
                case 'cheer':
                    for (const p of effect.particles) {
                        ctx.fillStyle = p.color;
                        ctx.beginPath();
                        ctx.arc(p.x * width, p.y * height, p.size, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    break;
                    
                case 'redFlag':
                    const flagX = width * 0.1;
                    const flagBaseY = height * 0.3;
                    const flagSize = 40;
                    
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(flagX - 3, flagBaseY - flagSize * 2, 6, flagSize * 3);
                    
                    ctx.fillStyle = '#ff0000';
                    ctx.beginPath();
                    ctx.moveTo(flagX + 3, flagBaseY - flagSize * 2);
                    ctx.lineTo(flagX + 3 + flagSize * effect.flagY, flagBaseY - flagSize * 2 + flagSize / 2);
                    ctx.lineTo(flagX + 3, flagBaseY - flagSize * 2 + flagSize);
                    ctx.closePath();
                    ctx.fill();
                    break;
                    
                case 'fireworks':
                    for (const fw of effect.fireworks) {
                        if (fw.exploded) {
                            for (const p of fw.particles) {
                                if (p.life > 0) {
                                    ctx.globalAlpha = p.life;
                                    ctx.fillStyle = p.color;
                                    ctx.beginPath();
                                    ctx.arc((fw.x + p.x) * width, (fw.y + p.y) * height, p.size, 0, Math.PI * 2);
                                    ctx.fill();
                                }
                            }
                            ctx.globalAlpha = 1;
                        }
                    }
                    break;
                    
                case 'dust':
                    for (const p of effect.particles) {
                        if (p.alpha > 0) {
                            ctx.globalAlpha = p.alpha;
                            ctx.fillStyle = '#8B7355';
                            ctx.beginPath();
                            ctx.arc(p.x * width, p.y * height, p.size, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                    ctx.globalAlpha = 1;
                    break;
            }
        }
    },
    
    getBarShake() {
        const barShake = this.effects.find(e => e.type === 'barShake' && e.active);
        return barShake ? barShake.shakeAmount : 0;
    },
    
    clear() {
        this.effects = [];
    }
};
