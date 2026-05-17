const Helpers = {
    gridToPixel(row, col) {
        const x = col * CONSTANTS.BUBBLE_DIAMETER + CONSTANTS.BUBBLE_RADIUS;
        const offsetX = row % 2 === 0 ? 0 : CONSTANTS.BUBBLE_RADIUS;
        const y = row * CONSTANTS.BUBBLE_DIAMETER * 0.866 + CONSTANTS.BUBBLE_RADIUS;
        return { x: x + offsetX, y };
    },
    
    pixelToGrid(x, y) {
        const row = Math.floor((y - CONSTANTS.BUBBLE_RADIUS) / (CONSTANTS.BUBBLE_DIAMETER * 0.866));
        const offsetX = row % 2 === 0 ? 0 : CONSTANTS.BUBBLE_RADIUS;
        const col = Math.floor((x - CONSTANTS.BUBBLE_RADIUS - offsetX) / CONSTANTS.BUBBLE_DIAMETER);
        return { row, col };
    },
    
    getNeighbors(row, col) {
        const neighbors = [];
        const isOddRow = row % 2 === 1;
        
        const directions = isOddRow ? [
            [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, 0], [1, 1]
        ] : [
            [-1, -1], [-1, 0],
            [0, -1], [0, 1],
            [1, -1], [1, 0]
        ];
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newCol >= 0 && newCol < CONSTANTS.GRID_COLS) {
                neighbors.push({ row: newRow, col: newCol });
            }
        }
        
        return neighbors;
    },
    
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },
    
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },
    
    lerp(a, b, t) {
        return a + (b - a) * t;
    },
    
    randomRange(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    angleToVector(angleDegrees) {
        const radians = (angleDegrees - 90) * Math.PI / 180;
        return {
            x: Math.cos(radians),
            y: Math.sin(radians)
        };
    },
    
    vectorToAngle(x, y) {
        return Math.atan2(y, x) * 180 / Math.PI + 90;
    },
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    },
    
    easeInCubic(t) {
        return t * t * t;
    },
    
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },
    
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    
    getBubbleEmoji(type) {
        const config = BUBBLE_TYPES_CONFIG[type];
        return config ? config.icon : '🫧';
    },
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },
    
    rgbToHex(r, g, b) {
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },
    
    lightenColor(hex, percent) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return hex;
        const amount = Math.floor(255 * (percent / 100));
        return this.rgbToHex(
            Math.min(255, rgb.r + amount),
            Math.min(255, rgb.g + amount),
            Math.min(255, rgb.b + amount)
        );
    },
    
    darkenColor(hex, percent) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return hex;
        const amount = Math.floor(255 * (percent / 100));
        return this.rgbToHex(
            Math.max(0, rgb.r - amount),
            Math.max(0, rgb.g - amount),
            Math.max(0, rgb.b - amount)
        );
    }
};
