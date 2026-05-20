const Storage = {
    STORAGE_KEY: 'paodan_game_state',

    saveGameState(state) {
        try {
            const stateToSave = {
                gameState: state.gameState,
                selectedCannon: state.selectedCannon,
                playerHealth: state.playerHealth,
                enemyHealth: state.enemyHealth,
                playerAngle: state.playerAngle,
                enemyAngle: state.enemyAngle,
                currentTurn: state.currentTurn,
                isPaused: state.isPaused,
                totalDamage: state.totalDamage,
                hitCount: state.hitCount,
                lastSaveTime: Date.now()
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateToSave));
            return true;
        } catch (e) {
            console.error('保存游戏状态失败:', e);
            return false;
        }
    },

    loadGameState() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                const state = JSON.parse(saved);
                const maxAge = 24 * 60 * 60 * 1000;
                if (Date.now() - state.lastSaveTime < maxAge) {
                    return state;
                } else {
                    this.clearGameState();
                }
            }
            return null;
        } catch (e) {
            console.error('加载游戏状态失败:', e);
            return null;
        }
    },

    clearGameState() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('清除游戏状态失败:', e);
            return false;
        }
    },

    hasSavedGame() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            try {
                const state = JSON.parse(saved);
                const maxAge = 24 * 60 * 60 * 1000;
                return Date.now() - state.lastSaveTime < maxAge;
            } catch (e) {
                return false;
            }
        }
        return false;
    },

    saveSettings(settings) {
        try {
            localStorage.setItem('paodan_settings', JSON.stringify(settings));
            return true;
        } catch (e) {
            console.error('保存设置失败:', e);
            return false;
        }
    },

    loadSettings() {
        try {
            const saved = localStorage.getItem('paodan_settings');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error('加载设置失败:', e);
            return null;
        }
    }
};
