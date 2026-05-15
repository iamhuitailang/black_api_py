const Obstacles = (() => {
    class Obstacle {
        constructor(config) {
            this.type = config.type;
            this.x = config.x;
            this.y = config.y;
            this.width = config.width || 40;
            this.height = config.height || 40;
            this.originalX = config.x;
            this.moveX = config.moveX || 0;
            this.moveY = config.moveY || 0;
            this.speed = config.speed || 0.02;
            this.movePhase = 0;
            this.radius = config.radius || 50;
        }

        update(deltaTime) {
            if (this.type === 'moving') {
                this.movePhase += this.speed;
                this.x = this.originalX + Math.sin(this.movePhase) * this.moveX;
            }
        }

        checkCollision(feather) {
            const featherCenter = feather.getCenter();
            
            if (this.type === 'vortex') {
                const center = this.getCenter();
                const dx = featherCenter.x - center.x;
                const dy = featherCenter.y - center.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                return distance < this.radius * 0.7;
            }
            
            if (this.type === 'spike') {
                const obstacleCenter = this.getCenter();
                const dx = featherCenter.x - obstacleCenter.x;
                const dy = featherCenter.y - obstacleCenter.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                return distance < 15;
            }
            
            const featherBounds = {
                x: feather.x - 10,
                y: feather.y - 15,
                width: 20,
                height: 30
            };
            return Physics.checkCollision(featherBounds, this);
        }

        getCenter() {
            return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
        }
    }

    const create = (configs) => {
        return configs.map(config => new Obstacle(config));
    };

    const updateAll = (obstacles, deltaTime) => {
        obstacles.forEach(obstacle => obstacle.update(deltaTime));
    };

    const checkCollisions = (obstacles, feather) => {
        for (const obstacle of obstacles) {
            if (obstacle.checkCollision(feather)) {
                return obstacle;
            }
        }
        return null;
    };

    return {
        create,
        updateAll,
        checkCollisions
    };
})();