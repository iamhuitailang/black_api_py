const Helpers = {
    debounce(fn, delay = 300) {
        let timer = null;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    },

    throttle(fn, limit = 300) {
        let inThrottle = false;
        return function (...args) {
            if (!inThrottle) {
                fn.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }

        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }

        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }

        return obj;
    },

    mergeObjects(target, ...sources) {
        const result = this.deepClone(target);
        
        sources.forEach(source => {
            if (source && typeof source === 'object') {
                for (const key in source) {
                    if (source.hasOwnProperty(key)) {
                        if (typeof source[key] === 'object' && 
                            source[key] !== null && 
                            !Array.isArray(source[key]) &&
                            typeof result[key] === 'object' &&
                            result[key] !== null) {
                            result[key] = this.mergeObjects(result[key], source[key]);
                        } else {
                            result[key] = this.deepClone(source[key]);
                        }
                    }
                }
            }
        });

        return result;
    },

    generateId(prefix = 'id') {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        return `${prefix}_${timestamp}_${random}`;
    },

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        const parts = [];
        if (hours > 0) {
            parts.push(hours.toString().padStart(2, '0'));
        }
        parts.push(minutes.toString().padStart(2, '0'));
        parts.push(secs.toString().padStart(2, '0'));

        return parts.join(':');
    },

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    normalize(value, min, max) {
        if (max === min) return 0.5;
        return (value - min) / (max - min);
    },

    remap(value, inMin, inMax, outMin, outMax) {
        const t = this.normalize(value, inMin, inMax);
        return this.lerp(outMin, outMax, t);
    },

    sum(arr) {
        if (!Array.isArray(arr)) return 0;
        return arr.reduce((acc, val) => acc + (Number(val) || 0), 0);
    },

    avg(arr) {
        if (!Array.isArray(arr) || arr.length === 0) return 0;
        return this.sum(arr) / arr.length;
    },

    min(arr) {
        if (!Array.isArray(arr) || arr.length === 0) return 0;
        return Math.min(...arr.map(Number));
    },

    max(arr) {
        if (!Array.isArray(arr) || arr.length === 0) return 0;
        return Math.max(...arr.map(Number));
    },

    median(arr) {
        if (!Array.isArray(arr) || arr.length === 0) return 0;
        const sorted = [...arr].map(Number).sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 
            ? sorted[mid] 
            : (sorted[mid - 1] + sorted[mid]) / 2;
    },

    getColorByIndex(index, colors = null) {
        const defaultColors = [
            '#00f5ff', 
            '#8b5cf6', 
            '#f472b6', 
            '#10b981', 
            '#f59e0b', 
            '#ef4444',
            '#06b6d4',
            '#84cc16',
            '#f97316',
            '#a855f7'
        ];
        
        const colorPalette = colors || defaultColors;
        return colorPalette[index % colorPalette.length];
    },

    hexToRgba(hex, alpha = 1) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            const r = parseInt(result[1], 16);
            const g = parseInt(result[2], 16);
            const b = parseInt(result[3], 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return hex;
    },

    lightenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = this.clamp((num >> 16) + amt, 0, 255);
        const G = this.clamp(((num >> 8) & 0x00FF) + amt, 0, 255);
        const B = this.clamp((num & 0x0000FF) + amt, 0, 255);
        return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
    },

    darkenColor(hex, percent) {
        return this.lightenColor(hex, -percent);
    },

    createGradient(ctx, x0, y0, x1, y1, colors) {
        const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
        colors.forEach((color, index) => {
            gradient.addColorStop(index / (colors.length - 1), color);
        });
        return gradient;
    },

    drawRoundedRect(ctx, x, y, width, height, radius) {
        const r = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    },

    isInPath(ctx, x, y) {
        return ctx.isPointInPath(x, y);
    }
};

window.Helpers = Helpers;
