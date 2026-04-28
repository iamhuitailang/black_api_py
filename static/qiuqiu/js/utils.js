const Utils = {
    random: function(min, max) {
        return Math.random() * (max - min) + min;
    },

    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    lerp: function(start, end, t) {
        return start + (end - start) * t;
    },

    clamp: function(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    degToRad: function(deg) {
        return deg * Math.PI / 180;
    },

    radToDeg: function(rad) {
        return rad * 180 / Math.PI;
    },

    distance: function(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    easeOutCubic: function(t) {
        return 1 - Math.pow(1 - t, 3);
    },

    easeInOutCubic: function(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },

    easeOutBounce: function(t) {
        const n1 = 7.5625;
        const d1 = 2.75;

        if (t < 1 / d1) {
            return n1 * t * t;
        } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    },

    saveToLocalStorage: function(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
            return false;
        }
    },

    loadFromLocalStorage: function(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('Failed to load from localStorage:', e);
            return defaultValue;
        }
    },

    normalizeAngle: function(angle) {
        while (angle < 0) angle += Math.PI * 2;
        while (angle >= Math.PI * 2) angle -= Math.PI * 2;
        return angle;
    },

    isAngleInRange: function(angle, startAngle, endAngle) {
        angle = this.normalizeAngle(angle);
        startAngle = this.normalizeAngle(startAngle);
        endAngle = this.normalizeAngle(endAngle);

        if (startAngle <= endAngle) {
            return angle >= startAngle && angle <= endAngle;
        } else {
            return angle >= startAngle || angle <= endAngle;
        }
    },

    getMiddleAngle: function(startAngle, endAngle) {
        startAngle = this.normalizeAngle(startAngle);
        endAngle = this.normalizeAngle(endAngle);
        
        if (startAngle <= endAngle) {
            return (startAngle + endAngle) / 2;
        } else {
            let mid = (startAngle + endAngle + Math.PI * 2) / 2;
            if (mid >= Math.PI * 2) mid -= Math.PI * 2;
            return mid;
        }
    },

    createGradient: function(ctx, x, y, radius, colors) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        colors.forEach((color, i) => {
            gradient.addColorStop(i / (colors.length - 1), color);
        });
        return gradient;
    },

    drawRoundRect: function(ctx, x, y, width, height, radius) {
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
    }
};