const Utils = {
    random: function(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    clamp: function(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },
    
    lerp: function(start, end, t) {
        return start + (end - start) * t;
    },
    
    distance: function(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },
    
    easeOutQuad: function(t) {
        return t * (2 - t);
    },
    
    easeOutCubic: function(t) {
        return 1 - Math.pow(1 - t, 3);
    },
    
    easeInOutQuad: function(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },
    
    getTime: function() {
        return performance.now();
    },
    
    getAbsoluteTime: function() {
        return Date.now();
    },
    
    hexToRgba: function(hex, alpha = 1) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})` : hex;
    },
    
    lightenColor: function(hex, amount) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return hex;
        
        const r = Math.min(255, parseInt(result[1], 16) + amount);
        const g = Math.min(255, parseInt(result[2], 16) + amount);
        const b = Math.min(255, parseInt(result[3], 16) + amount);
        
        return `rgb(${r}, ${g}, ${b})`;
    },
    
    darkenColor: function(hex, amount) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return hex;
        
        const r = Math.max(0, parseInt(result[1], 16) - amount);
        const g = Math.max(0, parseInt(result[2], 16) - amount);
        const b = Math.max(0, parseInt(result[3], 16) - amount);
        
        return `rgb(${r}, ${g}, ${b})`;
    },
    
    formatNumber: function(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    
    saveHighScore: function(score, mode) {
        const key = `rhythm_highscore_${mode}`;
        const current = localStorage.getItem(key);
        const currentScore = current ? parseInt(current) : 0;
        
        if (score > currentScore) {
            localStorage.setItem(key, score.toString());
            return true;
        }
        return false;
    },
    
    getHighScore: function(mode) {
        const key = `rhythm_highscore_${mode}`;
        const score = localStorage.getItem(key);
        return score ? parseInt(score) : 0;
    },
    
    debounce: function(func, wait) {
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
    
    throttle: function(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

const CanvasUtils = {
    drawCircle: function(ctx, x, y, radius, color, alpha = 1) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
    },
    
    drawCircleStroke: function(ctx, x, y, radius, lineWidth, color, alpha = 1) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.restore();
    },
    
    drawGlow: function(ctx, x, y, radius, color, intensity = 1) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, Utils.hexToRgba(color, 0.8 * intensity));
        gradient.addColorStop(0.5, Utils.hexToRgba(color, 0.3 * intensity));
        gradient.addColorStop(1, Utils.hexToRgba(color, 0));
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();
    },
    
    drawRoundedRect: function(ctx, x, y, width, height, radius, color, alpha = 1) {
        ctx.save();
        ctx.globalAlpha = alpha;
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
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
    },
    
    drawText: function(ctx, text, x, y, size, color, align = 'center', baseline = 'middle') {
        ctx.save();
        ctx.font = `bold ${size}px Arial`;
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.textBaseline = baseline;
        ctx.fillText(text, x, y);
        ctx.restore();
    },
    
    drawTextWithShadow: function(ctx, text, x, y, size, color, shadowColor, align = 'center', baseline = 'middle') {
        ctx.save();
        ctx.font = `bold ${size}px Arial`;
        ctx.textAlign = align;
        ctx.textBaseline = baseline;
        
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
        ctx.restore();
    },
    
    drawLine: function(ctx, x1, y1, x2, y2, width, color, alpha = 1) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.restore();
    },
    
    drawGradientLine: function(ctx, x1, y1, x2, y2, width, color1, color2, alpha = 1) {
        ctx.save();
        ctx.globalAlpha = alpha;
        
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = width;
        ctx.strokeStyle = gradient;
        ctx.stroke();
        ctx.restore();
    }
};
