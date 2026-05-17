const Storage = {
    STORAGE_KEY: 'fantasy_bubble_dragon_game',
    
    getDefaultData() {
        return {
            highScore: 0,
            currentLevel: 1,
            selectedLauncher: 'balance',
            unlockedLevels: 1,
            gameState: null,
            settings: {
                soundEnabled: true,
                musicEnabled: true
            }
        };
    },
    
    load() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                return { ...this.getDefaultData(), ...parsed };
            }
        } catch (e) {
            console.error('Failed to load game data:', e);
        }
        return this.getDefaultData();
    },
    
    save(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Failed to save game data:', e);
            return false;
        }
    },
    
    saveGameState(gameState) {
        const data = this.load();
        data.gameState = gameState;
        return this.save(data);
    },
    
    loadGameState() {
        const data = this.load();
        return data.gameState;
    },
    
    clearGameState() {
        const data = this.load();
        data.gameState = null;
        return this.save(data);
    },
    
    updateHighScore(score) {
        const data = this.load();
        if (score > data.highScore) {
            data.highScore = score;
            this.save(data);
            return true;
        }
        return false;
    },
    
    getHighScore() {
        const data = this.load();
        return data.highScore;
    },
    
    setCurrentLevel(level) {
        const data = this.load();
        data.currentLevel = level;
        return this.save(data);
    },
    
    getCurrentLevel() {
        const data = this.load();
        return data.currentLevel;
    },
    
    unlockLevel(level) {
        const data = this.load();
        if (level > data.unlockedLevels) {
            data.unlockedLevels = level;
            return this.save(data);
        }
        return false;
    },
    
    getUnlockedLevels() {
        const data = this.load();
        return data.unlockedLevels;
    },
    
    setSelectedLauncher(launcherId) {
        const data = this.load();
        data.selectedLauncher = launcherId;
        return this.save(data);
    },
    
    getSelectedLauncher() {
        const data = this.load();
        return data.selectedLauncher;
    },
    
    resetAll() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
};
