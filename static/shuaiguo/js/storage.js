const StorageManager = {
    STORAGE_KEY: 'office_blame_game_save',

    saveGameState(gameState) {
        try {
            const data = {
                timestamp: Date.now(),
                gameState: gameState
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存游戏状态失败:', e);
            return false;
        }
    },

    loadGameState() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) return null;
            
            const parsed = JSON.parse(data);
            if (!parsed || !parsed.gameState) return null;
            
            const timeDiff = (Date.now() - parsed.timestamp) / 1000 / 60;
            if (timeDiff > 30) {
                this.clearSave();
                return null;
            }
            
            return parsed.gameState;
        } catch (e) {
            console.error('加载游戏状态失败:', e);
            return null;
        }
    },

    hasSavedGame() {
        return this.loadGameState() !== null;
    },

    clearSave() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('清除存档失败:', e);
            return false;
        }
    },

    saveSettings(settings) {
        try {
            localStorage.setItem(this.STORAGE_KEY + '_settings', JSON.stringify(settings));
            return true;
        } catch (e) {
            console.error('保存设置失败:', e);
            return false;
        }
    },

    loadSettings() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY + '_settings');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('加载设置失败:', e);
            return null;
        }
    },

    saveSelectedCharacter(characterId) {
        try {
            localStorage.setItem(this.STORAGE_KEY + '_character', characterId);
            return true;
        } catch (e) {
            console.error('保存角色选择失败:', e);
            return false;
        }
    },

    loadSelectedCharacter() {
        try {
            return localStorage.getItem(this.STORAGE_KEY + '_character') || 'programmer';
        } catch (e) {
            console.error('加载角色选择失败:', e);
            return 'programmer';
        }
    }
};