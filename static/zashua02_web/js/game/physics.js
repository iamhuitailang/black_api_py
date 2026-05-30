const Physics = {
    GRAVITY: 980,
    STAGE_WIDTH: 1200,
    STAGE_HEIGHT: 500,
    FLOOR_HEIGHT: 60,

    getParabolicPosition(startX, startY, targetX, duration, elapsed) {
        const t = Math.min(elapsed / duration, 1);
        const x = startX + (targetX - startX) * t;
        const peakHeight = Math.abs(targetX - startX) * 0.4 + 100;
        const y = startY - 4 * peakHeight * t * (1 - t);
        return { x, y };
    },

    calculateDuration(distance, speed) {
        const baseDuration = 0.8;
        const distanceFactor = distance / 300;
        return baseDuration * distanceFactor / speed;
    },

    checkCatch(propX, propY, catcherX, catcherY, catchRadius) {
        const dx = propX - catcherX;
        const dy = propY - catcherY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < catchRadius;
    }
};

window.Physics = Physics;
