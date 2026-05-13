class Obstacle {
    constructor(config) {
        const typeConfig = CONFIG.OBSTACLE_TYPES[config.type];
        this.id = config.id;
        this.type = config.type;
        this.x = config.x;
        this.y = config.y;
        this.width = config.width;
        this.height = config.height;
        this.name = typeConfig.name;
        this.lethal = typeConfig.lethal;
        this.effect = typeConfig.effect;
        this.color = typeConfig.color;
        this.moving = config.moving || false;
        this.moveSpeed = this.moving ? 2 : 0;
        this.moveDirection = 1;
        this.initialY = config.y;
    }

    update(deltaTime) {
        if (this.moving) {
            this.y += this.moveSpeed * this.moveDirection;
            if (Math.abs(this.y - this.initialY) > 50) {
                this.moveDirection *= -1;
            }
        }
    }

    checkCollision(helicopter) {
        const heliCenterX = helicopter.x + helicopter.width / 2;
        const heliCenterY = helicopter.y + helicopter.height / 2;
        const heliRadius = helicopter.width / 3;

        if (this.type === 'turbulence' || this.type === 'enemyFire') {
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            return PhysicsEngine.checkCircleCollision(
                centerX, centerY, this.width / 2,
                heliCenterX, heliCenterY, heliRadius * 0.8
            );
        }

        if (this.type === 'powerline') {
            const lineStartX = this.x;
            const lineStartY = this.y + this.height / 2;
            const lineEndX = this.x + this.width;
            const lineEndY = this.y + this.height / 2;
            
            const A = heliCenterX - lineStartX;
            const B = heliCenterY - lineStartY;
            const C = lineEndX - lineStartX;
            const D = lineEndY - lineStartY;
            
            const dot = A * C + B * D;
            const lenSq = C * C + D * D;
            let param = -1;
            
            if (lenSq !== 0) param = dot / lenSq;
            
            let xx, yy;
            
            if (param < 0) {
                xx = lineStartX;
                yy = lineStartY;
            } else if (param > 1) {
                xx = lineEndX;
                yy = lineEndY;
            } else {
                xx = lineStartX + param * C;
                yy = lineStartY + param * D;
            }
            
            const distance = PhysicsEngine.getDistance(heliCenterX, heliCenterY, xx, yy);
            return distance < heliRadius * 0.8;
        }

        if (this.type === 'mountain') {
            const mountainTopX = this.x + this.width / 2;
            const mountainBaseY = this.y + this.height;
            
            if (heliCenterX < this.x || heliCenterX > this.x + this.width) {
                return false;
            }
            
            const relativeX = (heliCenterX - this.x) / this.width;
            
            let effectiveTopY;
            if (relativeX < 0.5) {
                effectiveTopY = mountainBaseY - (relativeX * 2) * this.height;
            } else {
                effectiveTopY = mountainBaseY - ((1 - relativeX) * 2) * this.height;
            }
            
            return heliCenterY + heliRadius * 0.3 > effectiveTopY;
        }

        const helicopterBounds = {
            x: helicopter.x + 10,
            y: helicopter.y + 10,
            width: helicopter.width - 20,
            height: helicopter.height - 20
        };
        return PhysicsEngine.checkCollision(helicopterBounds, this);
    }

    applyEffect(helicopter) {
        if (!this.lethal && this.effect) {
            helicopter.applyEffect(this.effect);
        }
    }

    getState() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            moveDirection: this.moveDirection
        };
    }

    restoreState(state) {
        this.x = state.x;
        this.y = state.y;
        this.moveDirection = state.moveDirection || 1;
    }
}