const Storage = {
    save(data) {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存游戏数据失败:', e);
            return false;
        }
    },

    load() {
        try {
            const data = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (data) {
                return JSON.parse(data);
            }
            return null;
        } catch (e) {
            console.error('加载游戏数据失败:', e);
            return null;
        }
    },

    clear() {
        try {
            localStorage.removeItem(CONFIG.STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('清除游戏数据失败:', e);
            return false;
        }
    },

    saveHighestWave(wave) {
        try {
            const current = this.getHighestWave();
            if (wave > current) {
                localStorage.setItem(CONFIG.HIGHEST_WAVE_KEY, wave.toString());
                return true;
            }
            return false;
        } catch (e) {
            console.error('保存最高波次失败:', e);
            return false;
        }
    },

    getHighestWave() {
        try {
            const wave = localStorage.getItem(CONFIG.HIGHEST_WAVE_KEY);
            return wave ? parseInt(wave, 10) : 0;
        } catch (e) {
            console.error('读取最高波次失败:', e);
            return 0;
        }
    },

    hasSavedGame() {
        return localStorage.getItem(CONFIG.STORAGE_KEY) !== null;
    }
};
