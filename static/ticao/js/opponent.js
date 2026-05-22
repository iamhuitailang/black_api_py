const Opponent = {
    currentOpponent: null,
    opponentScore: 0,

    setOpponent(opponentType) {
        this.currentOpponent = GameData.opponents[opponentType];
        this.opponentScore = 0;
    },

    generateOpponentScore(eventType, opponentMultiplier) {
        if (!this.currentOpponent) return 0;
        
        const baseScore = this.currentOpponent.avgScore;
        const variance = (Math.random() - 0.5) * 1.5;
        const finalScore = baseScore + variance;
        
        return Math.round(finalScore * 10) / 10;
    },

    generateAllAroundScores(opponentMultiplier) {
        if (!this.currentOpponent) return [];
        
        const events = ['floor', 'vault', 'bars', 'horizontal'];
        const scores = [];
        
        for (const event of events) {
            const score = this.generateOpponentScore(event, opponentMultiplier);
            scores.push({
                event: event,
                score: score
            });
        }
        
        return scores;
    },

    getTotalScore() {
        return this.opponentScore;
    },

    addScore(score) {
        this.opponentScore += score;
        this.opponentScore = Math.round(this.opponentScore * 10) / 10;
    },

    reset() {
        this.opponentScore = 0;
    },

    compareToPlayer(playerScore) {
        if (playerScore > this.opponentScore) {
            return 'win';
        } else if (playerScore < this.opponentScore) {
            return 'lose';
        } else {
            return 'draw';
        }
    },

    getComparisonText(playerScore) {
        const result = this.compareToPlayer(playerScore);
        const diff = Math.abs(playerScore - this.opponentScore).toFixed(1);
        
        switch (result) {
            case 'win': return `领先对手 ${diff} 分!`;
            case 'lose': return `落后对手 ${diff} 分`;
            case 'draw': return '与对手平分!';
            default: return '';
        }
    }
};
