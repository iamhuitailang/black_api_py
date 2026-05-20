const Utils = {
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },
    
    lerp(start, end, t) {
        return start + (end - start) * t;
    },
    
    randomRange(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },
    
    map(value, inMin, inMax, outMin, outMax) {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    },
    
    getWindArrow(speed) {
        if (Math.abs(speed) < 0.1) return '↓';
        if (speed > 0) return '→';
        return '←';
    },
    
    getWindRotation(speed) {
        return Math.atan2(0, speed) * (180 / Math.PI);
    },
    
    formatNumber(num, decimals = 0) {
        return num.toFixed(decimals);
    },
    
    calculateScore(distance, terrainMultiplier = 1.0, hasMagnet = false) {
        const { PERFECT_DISTANCE, PERFECT_SCORE, MAX_SCORE_DISTANCE } = CONFIG.SCORING;
        
        let score = 0;
        if (distance <= PERFECT_DISTANCE) {
            score = PERFECT_SCORE;
        } else if (distance >= MAX_SCORE_DISTANCE) {
            score = 0;
        } else {
            const ratio = 1 - (distance / MAX_SCORE_DISTANCE);
            score = Math.floor(PERFECT_SCORE * ratio * ratio);
        }
        
        score *= terrainMultiplier;
        
        if (hasMagnet) {
            score *= 2;
        }
        
        return Math.floor(score);
    },
    
    getScoreRating(score) {
        if (score >= 95) return { text: '完美!', color: '#FFD700' };
        if (score >= 85) return { text: '优秀!', color: '#4CAF50' };
        if (score >= 70) return { text: '良好', color: '#2196F3' };
        if (score >= 50) return { text: '及格', color: '#FF9800' };
        return { text: '继续努力', color: '#f44336' };
    }
};
