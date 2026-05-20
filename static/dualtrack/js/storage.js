const STORAGE_KEY = 'dualtrack_game_save';

export class Storage {
    static save(gameState) {
        try {
            const data = {
                timestamp: Date.now(),
                state: gameState
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存游戏失败:', e);
            return false;
        }
    }

    static load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) return null;
            const parsed = JSON.parse(data);
            return parsed.state;
        } catch (e) {
            console.error('加载游戏失败:', e);
            return null;
        }
    }

    static clear() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('清除存档失败:', e);
            return false;
        }
    }

    static hasSave() {
        return localStorage.getItem(STORAGE_KEY) !== null;
    }

    static saveSettings(settings) {
        try {
            localStorage.setItem(STORAGE_KEY + '_settings', JSON.stringify(settings));
            return true;
        } catch (e) {
            console.error('保存设置失败:', e);
            return false;
        }
    }

    static loadSettings() {
        try {
            const data = localStorage.getItem(STORAGE_KEY + '_settings');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('加载设置失败:', e);
            return null;
        }
    }

    static saveHighScore(score) {
        try {
            const scores = this.getHighScores();
            scores.push({ ...score, date: Date.now() });
            scores.sort((a, b) => a.time - b.time);
            if (scores.length > 10) scores.length = 10;
            localStorage.setItem(STORAGE_KEY + '_scores', JSON.stringify(scores));
            return true;
        } catch (e) {
            console.error('保存最高分失败:', e);
            return false;
        }
    }

    static getHighScores() {
        try {
            const data = localStorage.getItem(STORAGE_KEY + '_scores');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('获取最高分失败:', e);
            return [];
        }
    }
}
