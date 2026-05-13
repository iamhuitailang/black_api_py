const StorageManager = {
    STORAGE_KEY: 'batman_gotham_save',
    
    save(gameState) {
        try {
            const data = {
                timestamp: Date.now(),
                currentLevel: gameState.currentLevel,
                score: gameState.score,
                playerHealth: gameState.player.health,
                playerX: gameState.player.x,
                playerY: gameState.player.y,
                unlockedLevels: gameState.unlockedLevels,
                enemiesDefeated: gameState.enemiesDefeated,
                combo: gameState.combat.combo
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存失败:', e);
            return false;
        }
    },
    
    load() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                const timePassed = Date.now() - data.timestamp;
                if (timePassed < 7 * 24 * 60 * 60 * 1000) {
                    return data;
                }
            }
        } catch (e) {
            console.error('加载失败:', e);
        }
        return null;
    },
    
    hasSave() {
        return localStorage.getItem(this.STORAGE_KEY) !== null;
    },
    
    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
    },
    
    saveSettings(settings) {
        localStorage.setItem('batman_settings', JSON.stringify(settings));
    },
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('batman_settings');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    }
};