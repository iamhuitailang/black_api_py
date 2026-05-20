const Physics = {
    updateSwing(swing, dt) {
        swing.angularVelocity += -CONFIG.SWING.GRAVITY_EFFECT * Math.sin(swing.angle);
        swing.angularVelocity *= CONFIG.SWING.DAMPING;
        swing.angle += swing.angularVelocity;
        
        swing.angle = Math.max(CONFIG.SWING.MIN_ANGLE, Math.min(CONFIG.SWING.MAX_ANGLE, swing.angle));
    },
    
    applySwingInput(swing, direction) {
        swing.angularVelocity += direction * CONFIG.SWING.SWING_SPEED;
    },
    
    calculateSwingPosition(swing) {
        return {
            x: swing.pivotX + Math.sin(swing.angle) * swing.ropeLength,
            y: swing.pivotY + Math.cos(swing.angle) * swing.ropeLength
        };
    },
    
    calculateReleaseVelocity(swing, chargeLevel) {
        let chargePower;
        let heightBoost;
        if (chargeLevel >= CONFIG.CHARGE.LEVELS.FULL.threshold) {
            chargePower = 22;
            heightBoost = 18;
        } else if (chargeLevel >= CONFIG.CHARGE.LEVELS.MEDIUM.threshold) {
            chargePower = 18;
            heightBoost = 15;
        } else {
            chargePower = 14;
            heightBoost = 12;
        }
        
        return {
            x: chargePower,
            y: -heightBoost
        };
    },
    
    updateAirborne(player, input, dt) {
        player.vy += CONFIG.GRAVITY;
        
        let fallSpeed = CONFIG.AIR.GLIDE_FALL_SPEED;
        
        if (input.diving) {
            fallSpeed = CONFIG.AIR.DIVE_SPEED;
            player.vy = Math.max(player.vy, fallSpeed);
        }
        
        if (input.hovering && player.hoverTime > 0) {
            player.hoverTime--;
            player.vy = Math.min(player.vy, CONFIG.AIR.HOVER_FALL_SPEED);
        }
        
        if (input.left) {
            player.vx -= CONFIG.AIR.CONTROL_SPEED;
        }
        if (input.right) {
            player.vx += CONFIG.AIR.CONTROL_SPEED;
        }
        
        player.vx *= CONFIG.AIR_RESISTANCE;
        player.vy *= CONFIG.AIR_RESISTANCE;
        
        player.x += player.vx;
        player.y += player.vy;
    },
    
    checkSwingCatch(player, swing) {
        const swingPos = this.calculateSwingPosition(swing);
        const dx = player.x - swingPos.x;
        const dy = player.y - swingPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < CONFIG.COLLISION.SWING_CATCH_RADIUS) {
            const isPerfect = distance < CONFIG.COLLISION.PERFECT_CATCH_RADIUS;
            return { caught: true, perfect: isPerfect };
        }
        return { caught: false, perfect: false };
    },
    
    checkObstacleCollision(player, obstacle) {
        switch (obstacle.type) {
            case OBSTACLE_TYPE.CLOUD:
                return this.checkCircleCollision(player, obstacle, obstacle.radius);
            case OBSTACLE_TYPE.ROPE:
                return this.checkRopeCollision(player, obstacle);
            case OBSTACLE_TYPE.WIND:
                return this.checkRectCollision(player, obstacle);
            default:
                return false;
        }
    },
    
    checkCircleCollision(player, obstacle, radius) {
        const dx = player.x - obstacle.x;
        const dy = player.y - obstacle.y;
        return Math.sqrt(dx * dx + dy * dy) < radius + 15;
    },
    
    checkRectCollision(player, rect) {
        return player.x > rect.x && player.x < rect.x + rect.width &&
               player.y > rect.y && player.y < rect.y + rect.height;
    },
    
    checkRopeCollision(player, rope) {
        const dx = rope.x2 - rope.x1;
        const dy = rope.y2 - rope.y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        
        const t = Math.max(0, Math.min(1, 
            ((player.x - rope.x1) * dx + (player.y - rope.y1) * dy) / (len * len)
        ));
        
        const closestX = rope.x1 + t * dx;
        const closestY = rope.y1 + t * dy;
        
        const distance = Math.sqrt(
            Math.pow(player.x - closestX, 2) + 
            Math.pow(player.y - closestY, 2)
        );
        
        return distance < 10;
    },
    
    applyWindEffect(player, wind) {
        player.vx += wind.forceX;
        player.vy += wind.forceY;
    },
    
    applyCloudEffect(player) {
        player.vx *= 0.95;
        player.vy *= 0.95;
    }
};
