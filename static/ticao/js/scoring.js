const Scoring = {
    baseDifficulty: 5.0,
    maxExecution: 10.0,
    maxLanding: 2.0,
    maxTotal: 16.0,

    perfectWindow: 0.1,
    goodWindow: 0.2,
    okWindow: 0.3,

    calculateDifficultyScore(actions, opponentMultiplier = 1.0) {
        let totalDifficulty = this.baseDifficulty;
        
        for (const action of actions) {
            const diffValue = GameData.getActionDifficultyValue(action.difficulty);
            totalDifficulty += diffValue;
        }
        
        return Math.min(totalDifficulty * opponentMultiplier, 6.6);
    },

    calculateExecutionScore(hitResults) {
        let totalScore = 0;
        let maxScore = 0;
        
        for (const result of hitResults) {
            maxScore += 1.0;
            
            switch (result.quality) {
                case 'perfect':
                    totalScore += 1.0;
                    break;
                case 'good':
                    totalScore += 0.7;
                    break;
                case 'ok':
                    totalScore += 0.4;
                    break;
                case 'miss':
                    totalScore += 0;
                    break;
                default:
                    totalScore += 0.5;
            }
        }
        
        const ratio = maxScore > 0 ? totalScore / maxScore : 0;
        return Math.round(ratio * this.maxExecution * 10) / 10;
    },

    calculateLandingScore(landingQuality) {
        let score;
        
        switch (landingQuality) {
            case 'perfect':
                score = this.maxLanding;
                break;
            case 'good':
                score = 1.5;
                break;
            case 'ok':
                score = 1.0;
                break;
            case 'miss':
                score = 0.3;
                break;
            case 'fall':
                score = 0;
                break;
            default:
                score = 0.5;
        }
        
        return score;
    },

    calculateTotalScore(difficultyScore, executionScore, landingScore) {
        return Math.round((difficultyScore + executionScore + landingScore) * 10) / 10;
    },

    evaluateHitQuality(timing, errorRate = 0) {
        const adjustedTiming = timing * (1 + errorRate * 0.5);
        const absTiming = Math.abs(adjustedTiming);
        
        if (absTiming <= this.perfectWindow) {
            return { quality: 'perfect', score: 1.0, offset: 100 };
        } else if (absTiming <= this.goodWindow) {
            return { quality: 'good', score: 0.7, offset: 70 };
        } else if (absTiming <= this.okWindow) {
            return { quality: 'ok', score: 0.4, offset: 40 };
        } else {
            return { quality: 'miss', score: 0, offset: 0 };
        }
    },

    evaluateLanding(pressDuration, isLongPress) {
        if (!isLongPress) {
            return { quality: 'fall', score: 0 };
        }
        
        const optimalDuration = 500;
        const tolerance = 200;
        const diff = Math.abs(pressDuration - optimalDuration);
        
        if (diff <= tolerance * 0.5) {
            return { quality: 'perfect', score: this.maxLanding };
        } else if (diff <= tolerance) {
            return { quality: 'good', score: 1.5 };
        } else if (diff <= tolerance * 1.5) {
            return { quality: 'ok', score: 1.0 };
        } else {
            return { quality: 'miss', score: 0.5 };
        }
    },

    getRating(totalScore) {
        return GameData.getRating(totalScore);
    },

    calculateComboBonus(comboCount) {
        if (comboCount < 3) return 0;
        if (comboCount < 5) return 0.1;
        if (comboCount < 10) return 0.2;
        return 0.3;
    },

    getQualityColor(quality) {
        switch (quality) {
            case 'perfect': return '#FFD700';
            case 'good': return '#4ECDC4';
            case 'ok': return '#96CEB4';
            case 'miss': return '#FF6B6B';
            case 'fall': return '#999';
            default: return '#FFF';
        }
    },

    getQualityText(quality) {
        switch (quality) {
            case 'perfect': return '完美!';
            case 'good': return '很好!';
            case 'ok': return '不错';
            case 'miss': return '失误';
            case 'fall': return '摔倒!';
            default: return '';
        }
    }
};
