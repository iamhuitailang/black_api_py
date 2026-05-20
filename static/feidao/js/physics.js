const PhysicsEngine = {
    gravity: GameConfig.GRAVITY,

    updateKnife: function(knife, deltaTime) {
        if (!knife.isFlying || knife.isStuck) return;
        knife.update(this.gravity);
    },

    updateTarget: function(target, deltaTime) {
        target.update(deltaTime);
    },

    updateObstacle: function(obstacle) {
        obstacle.update();
    },

    checkTargetCollision: function(knife, target) {
        return target.checkCollision(knife);
    },

    checkObstacleCollision: function(knife, obstacle) {
        return obstacle.checkCollision(knife);
    },

    checkGroundCollision: function(knife, groundY) {
        if (knife.y >= groundY && knife.isFlying && !knife.isStuck) {
            knife.isFlying = false;
            return true;
        }
        return false;
    },

    checkWallCollision: function(knife, canvasWidth) {
        if (knife.x <= 0 || knife.x >= canvasWidth) {
            knife.isFlying = false;
            return true;
        }
        return false;
    },

    calculateScore: function(baseScore, hitResult, sceneBonus, knifeDamage) {
        const distanceBonus = Math.max(0, 1 - (hitResult.distance / 60));
        const totalScore = Math.floor(baseScore * hitResult.score * (1 + distanceBonus * 0.5) * sceneBonus * knifeDamage);
        return totalScore;
    },

    getKnifeTipPosition: function(knife) {
        const angle = Math.atan2(knife.vy, knife.vx);
        return {
            x: knife.x + Math.cos(angle) * knife.length / 2,
            y: knife.y + Math.sin(angle) * knife.length / 2
        };
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhysicsEngine;
}
