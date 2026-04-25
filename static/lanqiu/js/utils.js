const Utils = {
    degreesToRadians: function(degrees) {
        return degrees * Math.PI / 180;
    },

    radiansToDegrees: function(radians) {
        return radians * 180 / Math.PI;
    },

    clamp: function(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    lerp: function(start, end, t) {
        return start + (end - start) * t;
    },

    randomRange: function(min, max) {
        return Math.random() * (max - min) + min;
    },

    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    distance: function(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    angleBetween: function(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },

    getMousePosition: function(canvas, event) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        };
    },

    createGradient: function(ctx, x, y, radius, innerColor, outerColor) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, innerColor);
        gradient.addColorStop(1, outerColor);
        return gradient;
    },

    drawRoundedRect: function(ctx, x, y, width, height, radius) {
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

    easeOutQuad: function(t) {
        return t * (2 - t);
    },

    easeInQuad: function(t) {
        return t * t;
    },

    easeInOutQuad: function(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
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

    formatTime: function(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const decimal = Math.floor((seconds % 1) * 10);
        
        if (mins > 0) {
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${secs}.${decimal}`;
        }
    },

    deepClone: function(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    isInGreenZone: function(powerPercent, angleDegrees) {
        const powerInZone = powerPercent >= CONSTANTS.POWER.GREEN_ZONE_MIN && 
                           powerPercent <= CONSTANTS.POWER.GREEN_ZONE_MAX;
        const angleInZone = angleDegrees >= CONSTANTS.ANGLE.OPTIMAL_MIN && 
                           angleDegrees <= CONSTANTS.ANGLE.OPTIMAL_MAX;
        return powerInZone && angleInZone;
    },

    calculateScore: function(isThreePointer, isSwish, combo) {
        let baseScore = isThreePointer ? 
                       CONSTANTS.SCORING.THREE_POINTER : 
                       CONSTANTS.SCORING.FREE_THROW;
        
        if (isSwish) {
            baseScore += CONSTANTS.SCORING.SWISH_BONUS;
        }
        
        if (combo > 0) {
            const comboBonus = Math.min(combo, CONSTANTS.SCORING.COMBO_MAX_BONUS);
            baseScore += comboBonus;
        }
        
        return baseScore;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
