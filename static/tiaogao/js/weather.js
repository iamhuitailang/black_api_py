const WeatherSystem = {
    current: null,
    particles: [],
    
    init() {
        this.current = CONFIG.WEATHER_TYPES[0];
        this.particles = [];
    },
    
    randomize() {
        const rand = Math.random();
        let cumulative = 0;
        
        for (const weather of CONFIG.WEATHER_TYPES) {
            cumulative += weather.probability;
            if (rand <= cumulative) {
                this.current = weather;
                break;
            }
        }
        
        this.particles = [];
        
        if (this.current.name === '雨天') {
            for (let i = 0; i < 100; i++) {
                this.particles.push({
                    x: Math.random(),
                    y: Math.random(),
                    speed: 0.002 + Math.random() * 0.003,
                    length: 0.01 + Math.random() * 0.01
                });
            }
        }
        
        return this.current;
    },
    
    update(deltaTime) {
        if (this.current && this.current.name === '雨天') {
            for (const p of this.particles) {
                p.y += p.speed;
                p.x += 0.001;
                if (p.y > 1) {
                    p.y = -p.length;
                    p.x = Math.random();
                }
            }
        }
    },
    
    render(ctx, width, height) {
        if (!this.current) return;
        
        if (this.current.name === '雨天') {
            ctx.strokeStyle = 'rgba(200, 220, 255, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            
            for (const p of this.particles) {
                const x = p.x * width;
                const y = p.y * height;
                const len = p.length * height;
                
                ctx.moveTo(x, y);
                ctx.lineTo(x + 2, y + len);
            }
            
            ctx.stroke();
        }
    },
    
    getJumpModifier() {
        return this.current ? this.current.effect : 1.0;
    },
    
    isLandingStrict() {
        return this.current ? this.current.landingStrict : false;
    },
    
    getIcon() {
        return this.current ? this.current.icon : '☀️';
    }
};
