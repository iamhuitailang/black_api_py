const Storage = {
    STORAGE_KEY: 'shovel_knight_save',
    
    defaultSave: {
        currentLevel: 1,
        maxLevel: 1,
        totalScore: 0,
        highScores: {},
        playerState: null,
        levelState: null,
        lastPlayed: null
    },
    
    saveData: null,
    
    init() {
        this.load();
    },
    
    load() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                this.saveData = { ...this.defaultSave, ...JSON.parse(data) };
            } else {
                this.saveData = { ...this.defaultSave };
            }
        } catch (e) {
            console.error('Failed to load save data:', e);
            this.saveData = { ...this.defaultSave };
        }
        return this.saveData;
    },
    
    save() {
        try {
            this.saveData.lastPlayed = Date.now();
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.saveData));
            return true;
        } catch (e) {
            console.error('Failed to save data:', e);
            return false;
        }
    },
    
    saveProgress(level, score, playerState, levelState) {
        this.saveData.currentLevel = level;
        this.saveData.totalScore = score;
        this.saveData.playerState = playerState;
        this.saveData.levelState = levelState;
        
        if (level > this.saveData.maxLevel) {
            this.saveData.maxLevel = level;
        }
        
        return this.save();
    },
    
    saveHighScore(level, score) {
        if (!this.saveData.highScores[level] || score > this.saveData.highScores[level]) {
            this.saveData.highScores[level] = score;
            return this.save();
        }
        return false;
    },
    
    getCurrentLevel() {
        return this.saveData.currentLevel || 1;
    },
    
    getTotalScore() {
        return this.saveData.totalScore || 0;
    },
    
    getPlayerState() {
        return this.saveData.playerState;
    },
    
    getLevelState() {
        return this.saveData.levelState;
    },
    
    hasSavedProgress() {
        return this.saveData.playerState !== null && this.saveData.levelState !== null;
    },
    
    clearProgress() {
        this.saveData.playerState = null;
        this.saveData.levelState = null;
        this.saveData.currentLevel = 1;
        this.saveData.totalScore = 0;
        return this.save();
    },
    
    resetAll() {
        this.saveData = { ...this.defaultSave };
        return this.save();
    }
};