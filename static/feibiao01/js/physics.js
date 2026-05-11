const Physics = {
    calculatePower(pullDistance) {
        const maxDistance = GameConfig.Dart.maxPullDistance;
        const clampedDistance = Math.min(pullDistance, maxDistance);
        const normalized = clampedDistance / maxDistance;
        const power = GameConfig.Dart.baseSpeed + (normalized * (GameConfig.Dart.maxSpeedMultiplier - 1) * GameConfig.Dart.baseSpeed);
        return power;
    },
    
    calculateAngle(startX, startY, endX, endY) {
        return Math.atan2(endY - startY, endX - startX);
    },
    
    launchDart(dart, startX, startY, angle, power) {
        dart.x = startX;
        dart.y = startY;
        dart.angle = angle;
        dart.vx = Math.cos(angle) * power;
        dart.vy = Math.sin(angle) * power;
        dart.isLanded = false;
    },
    
    updateDart(dart, target, canvasHeight) {
        if (dart.isLanded) return false;
        
        dart.x += dart.vx;
        dart.y += dart.vy;
        dart.vy += GameConfig.Dart.gravity;
        
        dart.angle = Math.atan2(dart.vy, dart.vx);
        
        const hitTarget = this.checkTargetCollision(dart, target);
        if (hitTarget) {
            dart.isLanded = true;
            dart.landedX = dart.x;
            dart.landedY = dart.y;
            dart.landedScore = hitTarget.score;
            return true;
        }
        
        if (dart.y > canvasHeight || dart.x < 0) {
            dart.isLanded = true;
            dart.landedX = dart.x;
            dart.landedY = Math.min(dart.y, canvasHeight);
            dart.landedScore = 0;
            return true;
        }
        
        return false;
    },
    
    checkTargetCollision(dart, target) {
        const dx = dart.x - target.x;
        const dy = dart.y - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= target.radius) {
            const normalizedDistance = distance / target.radius;
            
            for (let i = 0; i < GameConfig.TargetRings.length; i++) {
                const ring = GameConfig.TargetRings[i];
                if (normalizedDistance <= ring.radius) {
                    return { hit: true, ring: ring, score: ring.score, distance: normalizedDistance };
                }
            }
        }
        
        return null;
    },
    
    getHitEffect(score, isBullseye) {
        if (isBullseye) {
            return GameConfig.Effects.PERFECT;
        } else if (score === 10) {
            return GameConfig.Effects.GREAT;
        } else if (score >= 6 && score <= 9) {
            return GameConfig.Effects.GOOD;
        } else {
            return GameConfig.Effects.MISS;
        }
    },
    
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }
};

if (typeof window !== 'undefined') {
    window.Physics = Physics;
}
