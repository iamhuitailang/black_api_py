const OpponentSystem = {
    opponents: [],
    
    generateOpponents(count, mode) {
        this.opponents = [];
        
        const typeWeights = this.getTypeWeights(mode);
        
        for (let i = 0; i < count; i++) {
            const type = this.selectOpponentType(typeWeights);
            const opponent = {
                id: i,
                name: this.generateName(),
                type: type,
                bestHeight: type.bestHeight,
                currentHeight: 0,
                successfulJumps: 0,
                totalJumps: 0,
                score: 0,
                hasJumped: false,
                isJumping: false,
                jumpPhase: 'idle',
                jumpProgress: 0,
                jumpResult: null
            };
            this.opponents.push(opponent);
        }
        
        return this.opponents;
    },
    
    getTypeWeights(mode) {
        switch (mode) {
            case 'school':
                return [0.7, 0.3, 0, 0];
            case 'national':
                return [0.3, 0.5, 0.2, 0];
            case 'olympic':
                return [0.1, 0.3, 0.4, 0.2];
            default:
                return [1, 0, 0, 0];
        }
    },
    
    selectOpponentType(weights) {
        const rand = Math.random();
        let cumulative = 0;
        
        for (let i = 0; i < weights.length; i++) {
            cumulative += weights[i];
            if (rand <= cumulative) {
                return CONFIG.OPPONENT_TYPES[i];
            }
        }
        
        return CONFIG.OPPONENT_TYPES[0];
    },
    
    generateName() {
        const surnames = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '周', '吴'];
        const names = ['伟', '芳', '娜', '敏', '静', '强', '磊', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超'];
        
        const surname = surnames[Math.floor(Math.random() * surnames.length)];
        const name = names[Math.floor(Math.random() * names.length)];
        return surname + name;
    },
    
    simulateJump(opponent, barHeight) {
        opponent.hasJumped = true;
        opponent.isJumping = true;
        opponent.jumpPhase = 'running';
        opponent.jumpProgress = 0;
        opponent.jumpResult = null;
        
        const successChance = this.calculateSuccessChance(opponent, barHeight);
        const roll = Math.random();
        
        const success = roll < successChance;
        const isPerfect = success && Math.random() < 0.2;
        
        return {
            success,
            isPerfect,
            maxHeight: barHeight + (Math.random() - 0.5) * 0.1
        };
    },
    
    calculateSuccessChance(opponent, barHeight) {
        const diff = opponent.bestHeight - barHeight;
        const baseChance = 0.5 + diff * 2;
        const adjustedChance = Math.max(0.1, Math.min(0.95, baseChance));
        return adjustedChance * opponent.type.difficulty;
    },
    
    updateOpponentJump(opponent, deltaTime) {
        if (!opponent.isJumping) return;
        
        opponent.jumpProgress += deltaTime * 0.002;
        
        if (opponent.jumpProgress >= 1) {
            opponent.isJumping = false;
            opponent.jumpPhase = 'done';
        }
    },
    
    getRankings() {
        return [...this.opponents].sort((a, b) => {
            if (b.currentHeight !== a.currentHeight) {
                return b.currentHeight - a.currentHeight;
            }
            return b.score - a.score;
        });
    },
    
    getPlayerRank(playerHeight, playerScore) {
        let rank = 1;
        for (const opp of this.opponents) {
            if (opp.currentHeight > playerHeight || 
                (opp.currentHeight === playerHeight && opp.score > playerScore)) {
                rank++;
            }
        }
        return rank;
    },
    
    resetForNewHeight() {
        for (const opp of this.opponents) {
            opp.hasJumped = false;
            opp.isJumping = false;
            opp.jumpPhase = 'idle';
            opp.jumpProgress = 0;
            opp.jumpResult = null;
        }
    },
    
    getOpponentsToShow() {
        return this.opponents.filter(o => o.hasJumped || o.isJumping);
    }
};
