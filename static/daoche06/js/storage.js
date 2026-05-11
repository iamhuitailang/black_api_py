const storageManager = {
    saveData: null,
    
    init() {
        this.load();
    },
    
    load() {
        try {
            const saved = localStorage.getItem(GAME_CONFIG.storageKey);
            if (saved) {
                this.saveData = JSON.parse(saved);
                this.saveData = this.mergeDefault(this.saveData);
            } else {
                this.saveData = JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
            }
            return this.saveData;
        } catch (e) {
            console.error('加载存档失败:', e);
            this.saveData = JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
            return this.saveData;
        }
    },
    
    save() {
        try {
            this.saveData.lastSaveTime = Date.now();
            const json = JSON.stringify(this.saveData);
            localStorage.setItem(GAME_CONFIG.storageKey, json);
            return true;
        } catch (e) {
            console.error('保存存档失败:', e);
            return false;
        }
    },
    
    mergeDefault(data) {
        const defaultData = JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
        const result = {};
        
        for (const key in defaultData) {
            if (data.hasOwnProperty(key)) {
                result[key] = data[key];
            } else {
                result[key] = defaultData[key];
            }
        }
        
        return result;
    },
    
    reset() {
        this.saveData = JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
        this.save();
    },
    
    getLevel() {
        return this.saveData.currentLevel;
    },
    
    setLevel(level) {
        this.saveData.currentLevel = level;
        if (level > this.saveData.unlockedLevels) {
            this.saveData.unlockedLevels = level;
        }
        this.save();
    },
    
    addSuccess() {
        this.saveData.totalSuccess++;
        this.save();
    },
    
    addFailed() {
        this.saveData.totalFailed++;
        this.save();
    },
    
    updateBestTime(levelId, time) {
        if (!this.saveData.bestTimes[levelId] || time < this.saveData.bestTimes[levelId]) {
            this.saveData.bestTimes[levelId] = time;
            this.save();
        }
    },
    
    getGameState() {
        return this.saveData.gameState;
    },
    
    setGameState(state) {
        this.saveData.gameState = state;
        this.save();
    }
};
