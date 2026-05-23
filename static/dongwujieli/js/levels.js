const LevelSystem = {
    currentLevel: 1,
    levelConfig: null,

    init(level) {
        this.currentLevel = level;
        this.levelConfig = GameConfig.LEVELS[level];
    },

    getLevelConfig() {
        return this.levelConfig;
    },

    getCurrentLevel() {
        return this.currentLevel;
    },

    isLastLevel() {
        return this.currentLevel >= Object.keys(GameConfig.LEVELS).length;
    },

    nextLevel() {
        if (!this.isLastLevel()) {
            this.currentLevel++;
            this.levelConfig = GameConfig.LEVELS[this.currentLevel];
            return true;
        }
        return false;
    },

    calculateStars(time) {
        const config = this.levelConfig;
        if (time <= config.threeStarTime) {
            return 3;
        } else if (time <= config.twoStarTime) {
            return 2;
        }
        return 1;
    },

    calculateScore(time, stars, itemsCollected) {
        const baseScore = GameConfig.SCORE.baseScore;
        const timeBonus = Math.max(0, (config.targetTime - time) * GameConfig.SCORE.timeBonus / 1000);
        const itemBonus = itemsCollected * GameConfig.SCORE.itemBonus;
        const perfectBonus = stars === 3 ? GameConfig.SCORE.perfectBonus : 0;

        return Math.floor(baseScore + timeBonus + itemBonus + perfectBonus);
    },

    getTrackLength() {
        return GameConfig.GAME.TRACK_LENGTH;
    }
};