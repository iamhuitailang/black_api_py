const Feather = (() => {
    class Feather {
        constructor(config) {
            this.x = config.x || 275;
            this.y = config.y || 50;
            this.width = 30;
            this.height = 40;
            this.vx = 0;
            this.vy = 0;
            this.rotation = 0;
            this.swingAngle = 0;
            this.swingSpeed = 0.03;
            this.color = config.color || '#FFFFFF';
            this.secondaryColor = config.secondaryColor || '#E0E0E0';
            this.fallSpeed = config.fallSpeed || 1.2;
            this.windInfluence = config.windInfluence || 0.8;
            this.hasShield = false;
            this.shieldTime = 0;
            this.isSlow = false;
            this.slowTime = 0;
            this.targetX = this.x;
        }

        update(windForce, playerInput, deltaTime) {
            const dt = Math.min(deltaTime / 16.67, 2);
            
            const baseFallSpeed = this.isSlow ? this.fallSpeed * 0.4 : this.fallSpeed;
            this.vy = Physics.lerp(this.vy, baseFallSpeed, 0.05 * dt);
            
            const effectiveWind = windForce * this.windInfluence * (this.hasShield ? 0 : 1);
            
            if (playerInput !== 0) {
                this.vx += playerInput * 1.2 * dt;
            }
            
            this.vx += effectiveWind * 0.08 * dt;
            this.vx = Physics.applyFriction(this.vx, 0.85);
            this.vx = Physics.clamp(this.vx, -6, 6);
            
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            
            this.swingAngle += this.swingSpeed * dt;
            this.rotation = Math.sin(this.swingAngle) * 0.08 + this.vx * 0.015;
            
            this.x = Physics.clamp(this.x, 35, 515);
            
            if (this.hasShield) {
                this.shieldTime -= deltaTime;
                if (this.shieldTime <= 0) {
                    this.hasShield = false;
                }
            }
            if (this.isSlow) {
                this.slowTime -= deltaTime;
                if (this.slowTime <= 0) {
                    this.isSlow = false;
                }
            }
        }

        activateShield(duration = 8000) {
            this.hasShield = true;
            this.shieldTime = duration;
        }

        activateSlow(duration = 8000) {
            this.isSlow = true;
            this.slowTime = duration;
        }

        getBounds() {
            return {
                x: this.x - this.width / 2,
                y: this.y - this.height / 2,
                width: this.width,
                height: this.height
            };
        }

        getCenter() {
            return { x: this.x, y: this.y };
        }
    }

    const create = (config) => {
        return new Feather(config);
    };

    return { create };
})();
