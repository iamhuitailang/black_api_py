const Utils = (function() {
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    function showMessage(text, type = 'info', duration = 3000) {
        const messageArea = document.getElementById('message-area');
        const message = document.createElement('div');
        message.className = `game-message ${type}`;
        message.textContent = text;
        messageArea.appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, duration);
    }
    
    function isPointInRect(point, rect) {
        return point.x >= rect.x && 
               point.x <= rect.x + rect.width &&
               point.y >= rect.y && 
               point.y <= rect.y + rect.height;
    }
    
    function distance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }
    
    function lerp(start, end, t) {
        return start + (end - start) * t;
    }
    
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    function randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    function randomInt(min, max) {
        return Math.floor(randomRange(min, max + 1));
    }
    
    function shuffleArray(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
    
    function deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    function easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    function easeOutElastic(t) {
        const p = 0.3;
        return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
    }
    
    return {
        formatTime,
        showMessage,
        isPointInRect,
        distance,
        lerp,
        clamp,
        randomRange,
        randomInt,
        shuffleArray,
        deepClone,
        debounce,
        easeInOutQuad,
        easeOutElastic
    };
})();
