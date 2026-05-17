const Utils = {
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    },

    shuffleArray(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    },

    rectIntersect(r1, r2) {
        return r1.x < r2.x + r2.width &&
               r1.x + r1.width > r2.x &&
               r1.y < r2.y + r2.height &&
               r1.y + r1.height > r2.y;
    },

    pointInRect(point, rect) {
        return point.x >= rect.x &&
               point.x <= rect.x + rect.width &&
               point.y >= rect.y &&
               point.y <= rect.y + rect.height;
    },

    gridToPixel(col, row) {
        return {
            x: CONFIG.CANVAS.GRID_OFFSET_X + col * CONFIG.CANVAS.CELL_WIDTH,
            y: CONFIG.CANVAS.GRID_OFFSET_Y + row * CONFIG.CANVAS.CELL_HEIGHT
        };
    },

    pixelToGrid(x, y) {
        const col = Math.floor((x - CONFIG.CANVAS.GRID_OFFSET_X) / CONFIG.CANVAS.CELL_WIDTH);
        const row = Math.floor((y - CONFIG.CANVAS.GRID_OFFSET_Y) / CONFIG.CANVAS.CELL_HEIGHT);
        return { col, row };
    },

    isValidGrid(col, row) {
        return col >= 0 && col < CONFIG.CANVAS.GRID_COLS &&
               row >= 0 && row < CONFIG.CANVAS.GRID_ROWS;
    },

    getDistance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    },

    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};
