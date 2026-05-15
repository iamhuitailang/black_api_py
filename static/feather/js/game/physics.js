const Physics = (() => {
    const applyFriction = (velocity, friction = 0.98) => {
        return velocity * friction;
    };

    const clamp = (value, min, max) => {
        return Math.max(min, Math.min(max, value));
    };

    const checkCollision = (obj1, obj2) => {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    };

    const checkCircleCollision = (circle1, circle2) => {
        const dx = circle1.x - circle2.x;
        const dy = circle1.y - circle2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < circle1.radius + circle2.radius;
    };

    const lerp = (start, end, t) => {
        return start + (end - start) * t;
    };

    return {
        applyFriction,
        clamp,
        checkCollision,
        checkCircleCollision,
        lerp
    };
})();