const Utils = {
    random(min, max) {
        return Math.random() * (max - min) + min;
    },

    randomInt(min, max) {
        return Math.floor(this.random(min, max + 1));
    },

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    rectCollision(r1, r2) {
        return r1.x < r2.x + r2.width &&
               r1.x + r1.width > r2.x &&
               r1.y < r2.y + r2.height &&
               r1.y + r1.height > r2.y;
    },

    circleCollision(c1, c2) {
        const dx = c1.x - c2.x;
        const dy = c1.y - c2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < c1.radius + c2.radius;
    },

    formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const centiseconds = Math.floor((ms % 1000) / 10);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
    },

    formatScore(score) {
        return score.toLocaleString();
    },

    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    now() {
        return Date.now();
    }
};