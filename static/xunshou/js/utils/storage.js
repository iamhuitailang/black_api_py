const Storage = {
    PREFIX: 'xunshou_game_',
    
    save(key, value) {
        try {
            const fullKey = this.PREFIX + key;
            localStorage.setItem(fullKey, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage save error:', e);
            return false;
        }
    },
    
    load(key, defaultValue = null) {
        try {
            const fullKey = this.PREFIX + key;
            const value = localStorage.getItem(fullKey);
            if (value === null) {
                return defaultValue;
            }
            return JSON.parse(value);
        } catch (e) {
            console.error('Storage load error:', e);
            return defaultValue;
        }
    },
    
    remove(key) {
        try {
            const fullKey = this.PREFIX + key;
            localStorage.removeItem(fullKey);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    },
    
    getHighScore() {
        return this.load('highScore', 0);
    },
    
    setHighScore(score) {
        const current = this.getHighScore();
        if (score > current) {
            this.save('highScore', score);
            return true;
        }
        return false;
    },
    
    getUnlockedLevels() {
        return this.load('unlockedLevels', [1]);
    },
    
    unlockLevel(levelId) {
        const unlocked = this.getUnlockedLevels();
        if (!unlocked.includes(levelId)) {
            unlocked.push(levelId);
            this.save('unlockedLevels', unlocked);
            return true;
        }
        return false;
    },
    
    getSelectedCharacter() {
        return this.load('selectedCharacter', 'lion');
    },
    
    setSelectedCharacter(characterId) {
        this.save('selectedCharacter', characterId);
    },
    
    getSelectedLevel() {
        return this.load('selectedLevel', 1);
    },
    
    setSelectedLevel(levelId) {
        this.save('selectedLevel', levelId);
    },
    
    saveGameState(state) {
        this.save('gameState', state);
    },
    
    loadGameState() {
        return this.load('gameState', null);
    },
    
    clearGameState() {
        this.remove('gameState');
    },
    
    getLevelScore(levelId) {
        const scores = this.load('levelScores', {});
        return scores[levelId] || 0;
    },
    
    setLevelScore(levelId, score) {
        const scores = this.load('levelScores', {});
        const current = scores[levelId] || 0;
        if (score > current) {
            scores[levelId] = score;
            this.save('levelScores', scores);
            return true;
        }
        return false;
    }
};
