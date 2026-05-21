const Physics = {
    worldWidth: 0,
    worldHeight: 0,
    groundY: 0,

    init(width, height) {
        this.worldWidth = width;
        this.worldHeight = height;
        this.groundY = height - 50;
    },

    updateBalloon(balloon, dt = 1) {
        balloon.update(dt);
        this.checkWallCollision(balloon);
        this.checkGroundCollision(balloon);
    },

    checkWallCollision(balloon) {
        const r = balloon.radius;
        
        if (balloon.x - r < 0) {
            balloon.x = r;
            balloon.vx = Math.abs(balloon.vx) * balloon.type.elasticity;
            balloon.applyAngularImpulse(balloon.vy * 0.1);
        }
        
        if (balloon.x + r > this.worldWidth) {
            balloon.x = this.worldWidth - r;
            balloon.vx = -Math.abs(balloon.vx) * balloon.type.elasticity;
            balloon.applyAngularImpulse(-balloon.vy * 0.1);
        }
    },

    checkGroundCollision(balloon) {
        const r = balloon.radius;
        
        if (balloon.y + r > this.groundY) {
            balloon.y = this.groundY - r;
            
            if (Math.abs(balloon.vy) > 1) {
                balloon.vy = -balloon.vy * balloon.type.elasticity;
                balloon.vx *= CONSTANTS.PHYSICS.FRICTION;
                balloon.applyAngularImpulse(balloon.vx * 0.05);
            } else {
                balloon.vy = 0;
                balloon.vx *= 0.9;
                balloon.isLanded = true;
            }
        }
    },

    checkBalloonCollision(b1, b2) {
        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = b1.radius + b2.radius;
        
        if (dist < minDist && dist > 0) {
            this.resolveBalloonCollision(b1, b2, dx, dy, dist, minDist);
            return true;
        }
        
        return false;
    },

    resolveBalloonCollision(b1, b2, dx, dy, dist, minDist) {
        const nx = dx / dist;
        const ny = dy / dist;
        
        const overlap = minDist - dist;
        const totalMass = b1.mass + b2.mass;
        
        const separationX = (overlap / 2) * nx;
        const separationY = (overlap / 2) * ny;
        
        b1.x -= separationX * (b2.mass / totalMass);
        b1.y -= separationY * (b2.mass / totalMass);
        b2.x += separationX * (b1.mass / totalMass);
        b2.y += separationY * (b1.mass / totalMass);
        
        const dvx = b1.vx - b2.vx;
        const dvy = b1.vy - b2.vy;
        
        const dvn = dvx * nx + dvy * ny;
        
        if (dvn > 0) return;
        
        const elasticity = Math.min(b1.type.elasticity, b2.type.elasticity);
        const restitution = 1 + elasticity;
        
        const impulse = -dvn * restitution / totalMass;
        
        const impulseX = impulse * nx;
        const impulseY = impulse * ny;
        
        b1.vx += impulseX * b2.mass;
        b1.vy += impulseY * b2.mass;
        b2.vx -= impulseX * b1.mass;
        b2.vy -= impulseY * b1.mass;
        
        const angularFactor = 0.03;
        if (Math.abs(dvn) > 1) {
            b1.applyAngularImpulse(-dvn * angularFactor * b2.mass);
            b2.applyAngularImpulse(dvn * angularFactor * b1.mass);
        }
        
        const relativeSpeed = Math.sqrt(dvx * dvx + dvy * dvy);
        if (relativeSpeed > 2) {
            b1.isColliding = true;
            b2.isColliding = true;
        }
    },

    checkObstacleCollision(balloon, obstacle) {
        if (!obstacle.active) return false;
        
        const r = balloon.radius;
        const closestX = Utils.clamp(balloon.x, obstacle.x, obstacle.x + obstacle.width);
        const closestY = Utils.clamp(balloon.y, obstacle.y, obstacle.y + obstacle.height);
        
        const dx = balloon.x - closestX;
        const dy = balloon.y - closestY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < r) {
            this.resolveObstacleCollision(balloon, obstacle, dx, dy, dist);
            return true;
        }
        
        return false;
    },

    resolveObstacleCollision(balloon, obstacle, dx, dy, dist) {
        if (dist === 0) {
            const toCenterX = balloon.x - (obstacle.x + obstacle.width / 2);
            const toCenterY = balloon.y - (obstacle.y + obstacle.height / 2);
            const angle = Math.atan2(toCenterY, toCenterX);
            balloon.x += Math.cos(angle) * balloon.radius;
            balloon.y += Math.sin(angle) * balloon.radius;
            balloon.vx = -balloon.vx * balloon.type.elasticity;
            balloon.vy = -balloon.vy * balloon.type.elasticity;
        } else {
            const nx = dx / dist;
            const ny = dy / dist;
            
            const overlap = balloon.radius - dist;
            balloon.x += nx * overlap;
            balloon.y += ny * overlap;
            
            const dotProduct = balloon.vx * nx + balloon.vy * ny;
            if (dotProduct < 0) {
                balloon.vx -= 2 * dotProduct * nx * balloon.type.elasticity;
                balloon.vy -= 2 * dotProduct * ny * balloon.type.elasticity;
                balloon.applyAngularImpulse(dotProduct * 0.1);
            }
        }
    },

    handleExplosion(balloon, allBalloons) {
        if (balloon.type.special !== 'explode') return;
        
        const explosionRadius = 150;
        const explosionForce = 20;
        
        for (const other of allBalloons) {
            if (other.id === balloon.id) continue;
            
            const dx = other.x - balloon.x;
            const dy = other.y - balloon.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < explosionRadius && dist > 0) {
                const force = explosionForce * (1 - dist / explosionRadius);
                const nx = dx / dist;
                const ny = dy / dist;
                
                other.applyImpulse(nx * force * other.mass, ny * force * other.mass);
                other.applyAngularImpulse(force * 0.5);
            }
        }
    },

    handleStabilize(balloon, allBalloons) {
        if (balloon.type.special !== 'stabilize') return;
        if (balloon.stabilizeEffect > 0) return;
        
        balloon.stabilizeEffect = 1;
        
        const stabilizeRadius = 200;
        
        for (const other of allBalloons) {
            if (other.id === balloon.id) continue;
            
            const dist = Utils.distance(balloon.x, balloon.y, other.x, other.y);
            
            if (dist < stabilizeRadius) {
                other.vx *= 0.5;
                other.vy *= 0.5;
                other.angularVelocity *= 0.3;
            }
        }
    },

    calculateTowerStats(balloons) {
        if (balloons.length === 0) {
            return { height: 0, centerX: 0, angle: 0, isStable: true };
        }
        
        let sumY = 0;
        let sumX = 0;
        let totalMass = 0;
        let minY = Infinity;
        let maxY = -Infinity;
        
        for (const b of balloons) {
            sumY += b.y * b.mass;
            sumX += b.x * b.mass;
            totalMass += b.mass;
            minY = Math.min(minY, b.y - b.radius);
            maxY = Math.max(maxY, b.y + b.radius);
        }
        
        const centerX = sumX / totalMass;
        const centerY = sumY / totalMass;
        
        const height = Math.max(0, this.groundY - minY);
        
        let angle = 0;
        if (height > 50) {
            const horizontalDeviation = centerX - this.worldWidth / 2;
            angle = Math.atan2(horizontalDeviation, height) * 180 / Math.PI;
        }
        
        const isStable = Math.abs(angle) < CONSTANTS.GAME.MAX_STABLE_ANGLE;
        
        return {
            height,
            centerX,
            centerY,
            angle,
            isStable,
            balloonCount: balloons.length
        };
    },

    checkTowerFall(balloons) {
        const stats = this.calculateTowerStats(balloons);
        return Math.abs(stats.angle) > CONSTANTS.GAME.TOWER_FALL_ANGLE;
    },

    updateAllBalloons(balloons, obstacles = [], dt = 1) {
        for (const balloon of balloons) {
            this.updateBalloon(balloon, dt);
        }
        
        for (let i = 0; i < CONSTANTS.PHYSICS.COLLISION_ITERATIONS; i++) {
            for (let j = 0; j < balloons.length; j++) {
                for (let k = j + 1; k < balloons.length; k++) {
                    this.checkBalloonCollision(balloons[j], balloons[k]);
                }
            }
        }
        
        for (const balloon of balloons) {
            for (const obstacle of obstacles) {
                this.checkObstacleCollision(balloon, obstacle);
            }
        }
        
        for (const balloon of balloons) {
            if (balloon.type.special === 'stabilize' && balloon.isLanded) {
                this.handleStabilize(balloon, balloons);
            }
        }
    }
};