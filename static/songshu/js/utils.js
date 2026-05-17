const Utils = {
    random(min, max) {
        return Math.random() * (max - min) + min;
    },

    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
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

    rectIntersect(r1, r2) {
        return r1.x < r2.x + r2.width &&
               r1.x + r1.width > r2.x &&
               r1.y < r2.y + r2.height &&
               r1.y + r1.height > r2.y;
    },

    pointInRect(px, py, rect) {
        return px >= rect.x && px <= rect.x + rect.width &&
               py >= rect.y && py <= rect.y + rect.height;
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    calculateRank(score, time, kills) {
        const totalScore = score + Math.max(0, (300 - time) * 10) + kills * 50;
        if (totalScore >= 10000) return 'S';
        if (totalScore >= 7000) return 'A';
        if (totalScore >= 4000) return 'B';
        if (totalScore >= 2000) return 'C';
        return 'D';
    },

    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    easeOutQuad(t) {
        return t * (2 - t);
    },

    easeInQuad(t) {
        return t * t;
    },

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    arrayShuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    getNeonGradient(ctx, x, y, width, height, color1, color2) {
        const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        return gradient;
    },

    drawNeonRect(ctx, x, y, width, height, color, glowIntensity = 15) {
        ctx.shadowColor = color;
        ctx.shadowBlur = glowIntensity;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        ctx.shadowBlur = 0;
    },

    drawNeonText(ctx, text, x, y, color, fontSize = 20, glowIntensity = 10) {
        ctx.shadowColor = color;
        ctx.shadowBlur = glowIntensity;
        ctx.fillStyle = color;
        ctx.font = `${fontSize}px "Courier New", monospace`;
        ctx.fillText(text, x, y);
        ctx.shadowBlur = 0;
    },

    drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    },

    particleBurst(x, y, color, count = 10) {
        const particles = [];
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = Utils.random(2, 6);
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: Utils.random(0.02, 0.05),
                color: color,
                size: Utils.random(3, 8)
            });
        }
        return particles;
    },

    screenShake(intensity = 5, duration = 200) {
        return {
            x: Utils.random(-intensity, intensity),
            y: Utils.random(-intensity, intensity),
            intensity: intensity,
            duration: duration,
            startTime: Date.now()
        };
    }
};
