const Helpers = {
    distance: function(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },
    
    angle: function(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },
    
    clamp: function(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },
    
    lerp: function(start, end, t) {
        return start + (end - start) * t;
    },
    
    random: function(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    degreesToRadians: function(degrees) {
        return degrees * (Math.PI / 180);
    },
    
    radiansToDegrees: function(radians) {
        return radians * (180 / Math.PI);
    },
    
    normalizeAngle: function(angle) {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    },
    
    collisionCircle: function(x1, y1, r1, x2, y2, r2) {
        return this.distance(x1, y1, x2, y2) <= (r1 + r2);
    },
    
    collisionPoint: function(px, py, cx, cy, r) {
        return this.distance(px, py, cx, cy) <= r;
    },
    
    getRingScore: function(x, y, targetX, targetY, targetRadius) {
        const distance = this.distance(x, y, targetX, targetY);
        const normalizedDistance = distance / targetRadius;
        
        if (normalizedDistance <= 0.1) return 10;
        if (normalizedDistance <= 0.2) return 9;
        if (normalizedDistance <= 0.3) return 8;
        if (normalizedDistance <= 0.4) return 7;
        if (normalizedDistance <= 0.5) return 6;
        if (normalizedDistance <= 0.6) return 5;
        if (normalizedDistance <= 0.7) return 4;
        if (normalizedDistance <= 0.8) return 3;
        if (normalizedDistance <= 0.9) return 2;
        if (normalizedDistance <= 1.0) return 1;
        
        return 0;
    },
    
    formatTime: function(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
    
    getWindDirectionText: function(direction) {
        if (direction >= -22.5 && direction < 22.5) return '东风';
        if (direction >= 22.5 && direction < 67.5) return '东南风';
        if (direction >= 67.5 && direction < 112.5) return '南风';
        if (direction >= 112.5 && direction < 157.5) return '西南风';
        if (direction >= 157.5 || direction < -157.5) return '西风';
        if (direction >= -157.5 && direction < -112.5) return '西北风';
        if (direction >= -112.5 && direction < -67.5) return '北风';
        return '东北风';
    },
    
    getWindStrengthText: function(speed) {
        if (speed === 0) return '无风';
        if (speed < 0.5) return '微风';
        if (speed < 1.0) return '轻风';
        if (speed < 1.5) return '和风';
        if (speed < 2.0) return '清风';
        if (speed < 2.5) return '强风';
        return '大风';
    },
    
    deepClone: function(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) {
            const copy = [];
            for (let i = 0; i < obj.length; i++) {
                copy[i] = this.deepClone(obj[i]);
            }
            return copy;
        }
        if (typeof obj === 'object') {
            const copy = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    copy[key] = this.deepClone(obj[key]);
                }
            }
            return copy;
        }
    }
};

window.Helpers = Helpers;