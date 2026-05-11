const Scoring = (function() {
    
    function calculateScore(ringScore, targetType, isCritical = false, isHeadshot = false) {
        const type = Constants.TARGET_TYPES[targetType.toUpperCase()];
        if (!type) return ringScore;
        
        let score = ringScore * (type.scoreMultiplier || 1);
        
        if (isCritical && type.criticalMultiplier) {
            score *= type.criticalMultiplier;
        }
        
        if (isHeadshot && type.headshotMultiplier) {
            score *= type.headshotMultiplier;
        }
        
        return Math.floor(score);
    }
    
    return {
        calculateScore
    };
})();

window.Scoring = Scoring;