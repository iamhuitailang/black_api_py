const Utils = {
    toRadians(degrees) {
        return degrees * Math.PI / 180;
    },

    toDegrees(radians) {
        return radians * 180 / Math.PI;
    },

    randomRange(min, max) {
        return Math.random() * (max - min) + min;
    },

    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    angleBetween(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },

    circleCollision(x1, y1, r1, x2, y2, r2) {
        return this.distance(x1, y1, x2, y2) < r1 + r2;
    },

    rectCollision(x, y, w, h, rx, ry, rw, rh) {
        return x < rx + rw && x + w > rx && y < ry + rh && y + h > ry;
    },

    pointInRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    },

    getDistanceCategory(distance) {
        if (distance >= GameConfig.DISTANCE_THRESHOLDS.far) return 'far';
        if (distance >= GameConfig.DISTANCE_THRESHOLDS.medium) return 'medium';
        return 'close';
    },

    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    },

    createParticle(x, y, color, options = {}) {
        return {
            x: x,
            y: y,
            vx: options.vx || this.randomRange(-3, 3),
            vy: options.vy || this.randomRange(-5, -1),
            radius: options.radius || this.randomRange(3, 8),
            color: color,
            alpha: 1,
            decay: options.decay || 0.02,
            gravity: options.gravity !== undefined ? options.gravity : 0.1,
            type: options.type || 'circle'
        };
    },

    createBubbleParticles(x, y, count, color) {
        const particles = [];
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = this.randomRange(2, 6);
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                radius: this.randomRange(5, 15),
                color: color,
                alpha: 1,
                decay: 0.015,
                gravity: 0.05,
                type: 'bubble',
                wobble: this.randomRange(0, Math.PI * 2),
                wobbleSpeed: this.randomRange(0.05, 0.15)
            });
        }
        return particles;
    },

    createExplosionParticles(x, y, count, colors) {
        const particles = [];
        for (let i = 0; i < count; i++) {
            const angle = this.randomRange(0, Math.PI * 2);
            const speed = this.randomRange(3, 10);
            const color = colors[this.randomInt(0, colors.length - 1)];
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: this.randomRange(4, 12),
                color: color,
                alpha: 1,
                decay: this.randomRange(0.02, 0.04),
                gravity: 0.15,
                type: 'explosion'
            });
        }
        return particles;
    },

    easeOutQuad(t) {
        return t * (2 - t);
    },

    easeInQuad(t) {
        return t * t;
    },

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
};
