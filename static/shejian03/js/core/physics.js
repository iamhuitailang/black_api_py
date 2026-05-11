const Physics = (function() {
    let gravity = Constants.PHYSICS.GRAVITY;
    let wind = { speed: 0, direction: 0 };
    let enabled = true;
    
    function updateArrow(arrow, deltaTime) {
        if (!enabled) return;
        
        const arrowType = Constants.ARROW_TYPES[arrow.type.toUpperCase()];
        if (!arrowType) return;
        
        const gravityMultiplier = arrowType.gravityMultiplier || 1.0;
        const windResistance = arrowType.windResistance || 1.0;
        
        arrow.velocity.y += gravity * gravityMultiplier;
        
        if (wind.speed > 0) {
            const windForce = wind.speed * windResistance * 0.1;
            const windAngle = Helpers.degreesToRadians(wind.direction);
            arrow.velocity.x += Math.cos(windAngle) * windForce;
            arrow.velocity.y += Math.sin(windAngle) * windForce * 0.5;
        }
        
        const speed = Math.sqrt(arrow.velocity.x ** 2 + arrow.velocity.y ** 2);
        if (speed > Constants.PHYSICS.MAX_VELOCITY) {
            const scale = Constants.PHYSICS.MAX_VELOCITY / speed;
            arrow.velocity.x *= scale;
            arrow.velocity.y *= scale;
        }
        
        arrow.x += arrow.velocity.x;
        arrow.y += arrow.velocity.y;
        
        if (speed > 0) {
            arrow.angle = Math.atan2(arrow.velocity.y, arrow.velocity.x);
        }
    }
    
    function checkCollisions(arrow, targets) {
        const results = [];
        
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            if (target.hit) continue;
            
            const collision = checkArrowTargetCollision(arrow, target);
            if (collision) {
                results.push({
                    targetIndex: i,
                    target: target,
                    ringScore: collision.ringScore,
                    isCritical: collision.isCritical,
                    isHeadshot: collision.isHeadshot
                });
            }
        }
        
        return results;
    }
    
    function checkArrowTargetCollision(arrow, target) {
        const targetType = Constants.TARGET_TYPES[target.type.toUpperCase()];
        if (!targetType) return null;
        
        const distance = Helpers.distance(arrow.x, arrow.y, target.x, target.y);
        const targetRadius = target.radius || targetType.radius;
        
        if (distance <= targetRadius) {
            let ringScore = 0;
            let isCritical = false;
            let isHeadshot = false;
            
            if (targetType.id === 'static' || targetType.id === 'moving' || targetType.id === 'apple') {
                ringScore = Helpers.getRingScore(arrow.x, arrow.y, target.x, target.y, targetRadius);
            } else if (targetType.animal) {
                const normalizedDistance = distance / targetRadius;
                if (normalizedDistance <= 0.2) {
                    isCritical = true;
                    ringScore = 10;
                } else if (normalizedDistance <= 0.5) {
                    ringScore = 7;
                } else {
                    ringScore = 5;
                }
            } else if (targetType.enemy) {
                const normalizedDistance = distance / targetRadius;
                if (normalizedDistance <= 0.15) {
                    isHeadshot = true;
                    ringScore = 10;
                } else if (normalizedDistance <= 0.5) {
                    ringScore = 7;
                } else {
                    ringScore = 5;
                }
            }
            
            return { ringScore, isCritical, isHeadshot };
        }
        
        return null;
    }
    
    function isOutOfBounds(arrow, canvasWidth, canvasHeight) {
        const margin = 100;
        return (
            arrow.x < -margin ||
            arrow.x > canvasWidth + margin ||
            arrow.y < -margin ||
            arrow.y > canvasHeight + margin
        );
    }
    
    function setGravity(value) {
        gravity = value;
    }
    
    function setWind(speed, direction) {
        wind = { speed, direction };
    }
    
    function getWind() {
        return { ...wind };
    }
    
    function setEnabled(value) {
        enabled = value;
    }
    
    function isEnabled() {
        return enabled;
    }
    
    return {
        updateArrow,
        checkCollisions,
        isOutOfBounds,
        setGravity,
        setWind,
        getWind,
        setEnabled,
        isEnabled
    };
})();

window.Physics = Physics;