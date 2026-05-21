const Utils = {
    random(min, max) {
        return Math.random() * (max - min) + min;
    },

    randomInt(min, max) {
        return Math.floor(this.random(min, max + 1));
    },

    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
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

    angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },

    degToRad(deg) {
        return deg * Math.PI / 180;
    },

    radToDeg(rad) {
        return rad * 180 / Math.PI;
    },

    selectBalloonType() {
        const types = Object.values(CONSTANTS.BALLOON_TYPES);
        const rand = Math.random();
        let cumulative = 0;
        
        for (const type of types) {
            cumulative += type.probability;
            if (rand <= cumulative) {
                return type;
            }
        }
        
        return CONSTANTS.BALLOON_TYPES.NORMAL;
    },

    getBalloonColor(type) {
        return this.randomChoice(type.colors);
    },

    formatScore(score) {
        if (score >= 1000000) {
            return (score / 1000000).toFixed(1) + 'M';
        } else if (score >= 1000) {
            return (score / 1000).toFixed(1) + 'K';
        }
        return score.toString();
    },

    formatHeight(height) {
        return (height / 100).toFixed(1);
    },

    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    },

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    throttle(fn, delay) {
        let lastCall = 0;
        return function(...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                fn.apply(this, args);
            }
        };
    },

    debounce(fn, delay) {
        let timeout = null;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), delay);
        };
    }
};