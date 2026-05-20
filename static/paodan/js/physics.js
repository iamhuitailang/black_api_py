const Physics = {
    calculateVelocity(angle, power, speedMultiplier = 1) {
        const radians = Utils.toRadians(angle);
        const baseSpeed = 8 + (power / 100) * 12;
        return {
            vx: Math.cos(radians) * baseSpeed * speedMultiplier,
            vy: -Math.sin(radians) * baseSpeed * speedMultiplier
        };
    },

    calculateTrajectory(startX, startY, angle, power, speedMultiplier = 1, steps = 100) {
        const trajectory = [];
        const { vx, vy } = this.calculateVelocity(angle, power, speedMultiplier);
        let x = startX;
        let y = startY;
        let currentVx = vx;
        let currentVy = vy;

        for (let i = 0; i < steps; i++) {
            trajectory.push({ x, y });
            x += currentVx;
            y += currentVy;
            currentVy += GameConfig.GRAVITY;

            if (y > GameConfig.GROUND_Y) break;
            if (x < 0 || x > GameConfig.CANVAS_WIDTH) break;
        }

        return trajectory;
    },

    checkObstacleCollision(x, y, radius) {
        for (const obstacle of GameConfig.OBSTACLES) {
            if (obstacle.type === 'wall') {
                if (Utils.rectCollision(
                    x - radius, y - radius, radius * 2, radius * 2,
                    obstacle.x, obstacle.y, obstacle.width, obstacle.height
                )) {
                    return { hit: true, obstacle: obstacle };
                }
            } else if (obstacle.type === 'bump') {
                if (Utils.circleCollision(
                    x, y, radius,
                    obstacle.x + obstacle.width / 2,
                    obstacle.y + obstacle.height / 2,
                    Math.max(obstacle.width, obstacle.height) / 2
                )) {
                    return { hit: true, obstacle: obstacle };
                }
            }
        }
        return { hit: false, obstacle: null };
    },

    checkGroundCollision(y, radius) {
        return y + radius >= GameConfig.GROUND_Y;
    },

    checkCannonCollision(x, y, radius, cannonX, cannonY, cannonRadius = 50) {
        return Utils.circleCollision(x, y, radius, cannonX, cannonY, cannonRadius);
    },

    calculateBounce(vx, vy, normalAngle, restitution = 0.6) {
        const speed = Math.sqrt(vx * vx + vy * vy);
        const currentAngle = Math.atan2(vy, vx);
        const newAngle = 2 * normalAngle - currentAngle;
        return {
            vx: Math.cos(newAngle) * speed * restitution,
            vy: Math.sin(newAngle) * speed * restitution
        };
    },

    calculateDamage(basePower, distance, blastRadius) {
        const falloff = Utils.clamp(1 - distance / blastRadius, 0, 1);
        return Math.floor(basePower * (0.5 + falloff * 0.5));
    },

    predictLandingPosition(startX, startY, angle, power, speedMultiplier = 1) {
        const { vx, vy } = this.calculateVelocity(angle, power, speedMultiplier);
        let x = startX;
        let y = startY;
        let currentVx = vx;
        let currentVy = vy;

        while (y < GameConfig.GROUND_Y && x > 0 && x < GameConfig.CANVAS_WIDTH) {
            x += currentVx;
            y += currentVy;
            currentVy += GameConfig.GRAVITY;
        }

        return { x: Utils.clamp(x, 0, GameConfig.CANVAS_WIDTH), y: GameConfig.GROUND_Y };
    },

    calculateRequiredAngle(startX, startY, targetX, targetY, power) {
        const dx = targetX - startX;
        const dy = targetY - startY;
        const g = GameConfig.GRAVITY;
        const v = 8 + (power / 100) * 12;
        const vSquared = v * v;

        const discriminant = vSquared * vSquared - g * (g * dx * dx + 2 * dy * vSquared);

        if (discriminant < 0) {
            return null;
        }

        const sqrtDiscriminant = Math.sqrt(discriminant);
        const angle1 = Math.atan2(vSquared - sqrtDiscriminant, g * dx);
        const angle2 = Math.atan2(vSquared + sqrtDiscriminant, g * dx);

        return {
            low: Utils.toDegrees(angle1),
            high: Utils.toDegrees(angle2)
        };
    }
};
