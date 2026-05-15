const Wind = (() => {
    class WindSystem {
        constructor(config) {
            this.strength = config.windStrength || 0.15;
            this.variability = config.windVariability || 0.1;
            this.currentForce = 0;
            this.targetForce = 0;
            this.changeTimer = 0;
            this.holdTime = 0;
            this.particles = [];
            this.initParticles();
        }

        initParticles() {
            for (let i = 0; i < 10; i++) {
                this.particles.push({
                    x: Math.random() * 550,
                    y: Math.random() * 500,
                    speed: 0.2 + Math.random() * 0.5,
                    length: 6 + Math.random() * 10,
                    opacity: 0.1 + Math.random() * 0.15
                });
            }
        }

        update(deltaTime) {
            this.holdTime += deltaTime;
            
            if (this.holdTime > 5000) {
                this.holdTime = 0;
                this.targetForce = (Math.random() - 0.5) * 2 * this.strength;
            }

            this.currentForce = Physics.lerp(this.currentForce, this.targetForce, 0.002);

            this.particles.forEach(particle => {
                particle.x += this.currentForce * particle.speed * 1.5;
                if (particle.x > 560) {
                    particle.x = -20;
                    particle.y = Math.random() * 500;
                } else if (particle.x < -20) {
                    particle.x = 560;
                    particle.y = Math.random() * 500;
                }
            });
        }

        getForce() {
            return this.currentForce;
        }

        getParticles() {
            return this.particles;
        }
    }

    const create = (config) => {
        return new WindSystem(config);
    };

    return { create };
})();