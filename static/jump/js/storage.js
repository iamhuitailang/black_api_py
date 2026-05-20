const Storage = {
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    },
    
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    },
    
    getHighScore() {
        return this.get(CONFIG.STORAGE_KEYS.HIGH_SCORE, 0);
    },
    
    setHighScore(score) {
        const current = this.getHighScore();
        if (score > current) {
            this.set(CONFIG.STORAGE_KEYS.HIGH_SCORE, score);
            return true;
        }
        return false;
    },
    
    getGameState() {
        return this.get(CONFIG.STORAGE_KEYS.GAME_STATE, null);
    },
    
    saveGameState(state) {
        this.set(CONFIG.STORAGE_KEYS.GAME_STATE, state);
    },
    
    clearGameState() {
        this.remove(CONFIG.STORAGE_KEYS.GAME_STATE);
    },
    
    getUnlockedTerrains() {
        const unlocked = this.get(CONFIG.STORAGE_KEYS.UNLOCKED_TERRAINS, null);
        if (!unlocked) {
            const currentLevel = this.getCurrentLevel();
            const terrains = CONFIG.TERRAIN.TYPES;
            const initialUnlocked = [];
            
            for (const [id, terrain] of Object.entries(terrains)) {
                if (currentLevel >= terrain.unlockLevel) {
                    initialUnlocked.push(id);
                }
            }
            
            if (initialUnlocked.length === 0) {
                initialUnlocked.push('grass');
            }
            
            this.set(CONFIG.STORAGE_KEYS.UNLOCKED_TERRAINS, initialUnlocked);
            return initialUnlocked;
        }
        return unlocked;
    },
    
    unlockTerrain(terrainId) {
        const unlocked = this.getUnlockedTerrains();
        if (!unlocked.includes(terrainId)) {
            unlocked.push(terrainId);
            this.set(CONFIG.STORAGE_KEYS.UNLOCKED_TERRAINS, unlocked);
            return true;
        }
        return false;
    },
    
    getCurrentLevel() {
        return this.get(CONFIG.STORAGE_KEYS.CURRENT_LEVEL, 1);
    },
    
    setCurrentLevel(level) {
        this.set(CONFIG.STORAGE_KEYS.CURRENT_LEVEL, level);
    },
    
    checkTerrainUnlocks(level) {
        const terrains = CONFIG.TERRAIN.TYPES;
        const unlocked = this.getUnlockedTerrains();
        const newlyUnlocked = [];
        
        for (const [id, terrain] of Object.entries(terrains)) {
            if (level >= terrain.unlockLevel && !unlocked.includes(id)) {
                newlyUnlocked.push(id);
                this.unlockTerrain(id);
            }
        }
        
        return newlyUnlocked;
    }
};
