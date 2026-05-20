const Physics = (function() {
    const GRAVITY = 0.6;
    const MAX_FALL_SPEED = 15;
    const FRICTION = 0.98;
    const AIR_RESISTANCE = 0.995;
    
    function applyGravity(entity, deltaTime = 1) {
        if (!entity.isGrounded && !entity.isGrinding) {
            entity.vy += GRAVITY * deltaTime;
            if (entity.vy > MAX_FALL_SPEED) {
                entity.vy = MAX_FALL_SPEED;
            }
        }
    }
    
    function applyVelocity(entity, deltaTime = 1) {
        entity.x += entity.vx * deltaTime;
        entity.y += entity.vy * deltaTime;
    }
    
    function applyFriction(entity) {
        if (entity.isGrounded) {
            entity.vx *= FRICTION;
        } else {
            entity.vx *= AIR_RESISTANCE;
        }
    }
    
    function checkGroundCollision(entity, groundY) {
        if (entity.y + entity.height >= groundY) {
            entity.y = groundY - entity.height;
            entity.vy = 0;
            entity.isGrounded = true;
            entity.isJumping = false;
            entity.airTime = 0;
            return true;
        }
        return false;
    }
    
    function checkPlatformCollision(entity, platform) {
        const entityBottom = entity.y + entity.height;
        const entityRight = entity.x + entity.width;
        const entityLeft = entity.x;
        
        const platformTop = platform.y;
        const platformBottom = platform.y + platform.height;
        const platformLeft = platform.x;
        const platformRight = platform.x + platform.width;
        
        if (entityRight > platformLeft && entityLeft < platformRight) {
            if (entityBottom >= platformTop && entityBottom <= platformTop + 20 && entity.vy >= 0) {
                entity.y = platformTop - entity.height;
                entity.vy = 0;
                entity.isGrounded = true;
                entity.isJumping = false;
                entity.airTime = 0;
                entity.onPlatform = platform;
                return true;
            }
        }
        
        return false;
    }
    
    function checkRailCollision(entity, rail) {
        const entityBottom = entity.y + entity.height;
        const entityCenterX = entity.x + entity.width / 2;
        
        const railTop = rail.y;
        const railLeft = rail.x;
        const railRight = rail.x + rail.width;
        
        if (entityCenterX > railLeft && entityCenterX < railRight) {
            if (entityBottom >= railTop - 5 && entityBottom <= railTop + 10 && entity.vy >= 0) {
                return {
                    collided: true,
                    type: 'top',
                    rail: rail
                };
            }
        }
        
        return { collided: false };
    }
    
    function checkRampCollision(entity, ramp) {
        const entityBottom = entity.y + entity.height;
        const entityCenterX = entity.x + entity.width / 2;
        
        if (entityCenterX >= ramp.x && entityCenterX <= ramp.x + ramp.width) {
            const rampHeight = getRampHeightAt(entityCenterX, ramp);
            const rampY = ramp.y + ramp.height - rampHeight;
            
            if (entityBottom >= rampY && entity.vy >= 0) {
                entity.y = rampY - entity.height;
                entity.vy = 0;
                entity.isGrounded = true;
                entity.isJumping = false;
                entity.onRamp = ramp;
                
                const angle = getRampAngleAt(entityCenterX, ramp);
                entity.rampAngle = angle;
                
                return { collided: true, angle: angle };
            }
        }
        
        return { collided: false };
    }
    
    function getRampHeightAt(x, ramp) {
        const relativeX = x - ramp.x;
        const ratio = relativeX / ramp.width;
        
        if (ramp.type === 'up') {
            return ramp.height * ratio;
        } else if (ramp.type === 'down') {
            return ramp.height * (1 - ratio);
        } else if (ramp.type === 'pipe') {
            const angle = ratio * Math.PI;
            return ramp.height * (1 - Math.sin(angle));
        }
        
        return 0;
    }
    
    function getRampAngleAt(x, ramp) {
        const relativeX = x - ramp.x;
        const ratio = relativeX / ramp.width;
        
        if (ramp.type === 'up') {
            return -Math.atan2(ramp.height, ramp.width);
        } else if (ramp.type === 'down') {
            return Math.atan2(ramp.height, ramp.width);
        } else if (ramp.type === 'pipe') {
            const angle = ratio * Math.PI;
            return -Math.cos(angle) * 0.5;
        }
        
        return 0;
    }
    
    function jump(entity, power = 1) {
        if (entity.isGrounded || entity.isGrinding) {
            entity.vy = -12 * power;
            entity.isGrounded = false;
            entity.isJumping = true;
            entity.isGrinding = false;
            entity.onRail = null;
            entity.onPlatform = null;
            entity.jumpTime = Date.now();
            entity.airTime = 0;
            return true;
        }
        return false;
    }
    
    function addSpin(entity, direction, speed) {
        entity.angularVelocity = direction * speed;
    }
    
    function applyRotation(entity, deltaTime = 1) {
        if (entity.angularVelocity) {
            entity.rotation += entity.angularVelocity * deltaTime;
            entity.angularVelocity *= 0.98;
            
            if (Math.abs(entity.angularVelocity) < 0.01) {
                entity.angularVelocity = 0;
            }
        }
    }
    
    function normalizeRotation(entity) {
        while (entity.rotation > Math.PI * 2) {
            entity.rotation -= Math.PI * 2;
        }
        while (entity.rotation < 0) {
            entity.rotation += Math.PI * 2;
        }
    }
    
    function calculateLandingScore(entity) {
        normalizeRotation(entity);
        
        const landingAngle = Math.abs(entity.rotation % (Math.PI * 2));
        const normalizedAngle = landingAngle > Math.PI ? Math.PI * 2 - landingAngle : landingAngle;
        
        if (normalizedAngle < 0.3) {
            return { quality: 'perfect', scoreMultiplier: 2, penalty: 0 };
        } else if (normalizedAngle < 0.8) {
            return { quality: 'good', scoreMultiplier: 1.5, penalty: 0 };
        } else if (normalizedAngle < 1.2) {
            return { quality: 'ok', scoreMultiplier: 1, penalty: 0 };
        } else {
            return { quality: 'fail', scoreMultiplier: 0, penalty: 1 };
        }
    }
    
    function resetRotation(entity) {
        entity.rotation = 0;
        entity.angularVelocity = 0;
    }
    
    function updateAirTime(entity, deltaTime) {
        if (!entity.isGrounded && !entity.isGrinding) {
            entity.airTime += deltaTime;
        }
    }
    
    return {
        GRAVITY,
        MAX_FALL_SPEED,
        FRICTION,
        applyGravity,
        applyVelocity,
        applyFriction,
        checkGroundCollision,
        checkPlatformCollision,
        checkRailCollision,
        checkRampCollision,
        getRampHeightAt,
        getRampAngleAt,
        jump,
        addSpin,
        applyRotation,
        normalizeRotation,
        calculateLandingScore,
        resetRotation,
        updateAirTime
    };
})();
