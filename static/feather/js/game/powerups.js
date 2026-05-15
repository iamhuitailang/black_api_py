const Powerups = (() => {
    class Powerup {
        constructor(config) {
            this.type = config.type;
            this.x = config.x;
            this.y = config.y;
            this.width = 30;
            this.height = 30;
            this.collected = false;
            this.floatPhase = Math.random() * Math.PI * 2;
            this.floatSpeed = 0.05;
        }

        update(deltaTime) {
            this.floatPhase += this.floatSpeed;
        }

        checkCollision(feather) {
            if (this.collected) return false;
            const featherBounds = feather.getBounds();
            const powerupBounds = {
                x: this.x - this.width / 2,
                y: this.y - this.height / 2,
                width: this.width,
                height: this.height
            };
            return Physics.checkCollision(featherBounds, powerupBounds);
        }

        applyEffect(feather) {
            switch (this.type) {
                case 'slow':
                    feather.activateSlow();
                    break;
                case 'shield':
                    feather.activateShield();
                    break;
                case 'star':
                    return 100;
            }
            return 0;
        }

        getY() {
            return this.y + Math.sin(this.floatPhase) * 5;
        }
    }

    const create = (configs) => {
        return configs.map(config => new Powerup(config));
    };

    const updateAll = (powerups, deltaTime) => {
        powerups.forEach(powerup => powerup.update(deltaTime));
    };

    const checkCollisions = (powerups, feather) => {
        let totalScore = 0;
        powerups.forEach(powerup => {
            if (powerup.checkCollision(feather)) {
                powerup.collected = true;
                totalScore += powerup.applyEffect(feather);
            }
        });
        return totalScore;
    };

    return {
        create,
        updateAll,
        checkCollisions
    };
})();