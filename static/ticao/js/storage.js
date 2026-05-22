const Storage = {
    STORAGE_KEY: 'gymnastics_battle_save',
    SCORE_HISTORY_KEY: 'gymnastics_battle_scores',

    defaultSave: {
        mode: null,
        event: null,
        opponent: null,
        currentEventIndex: 0,
        totalScore: 0,
        eventScores: [],
        difficultyScore: 0,
        executionScore: 0,
        landingScore: 0,
        environment: null,
        hasSavedProgress: false
    },

    saveGame(saveData) {
        try {
            const data = {
                ...saveData,
                hasSavedProgress: true,
                savedAt: Date.now()
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存游戏失败:', e);
            return false;
        }
    },

    loadGame() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                if (parsed.hasSavedProgress) {
                    return parsed;
                }
            }
        } catch (e) {
            console.error('读取游戏失败:', e);
        }
        return null;
    },

    hasSavedGame() {
        const data = this.loadGame();
        return data !== null && data.hasSavedProgress;
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

    saveScore(scoreData) {
        try {
            const history = this.getScoreHistory();
            history.push({
                ...scoreData,
                date: Date.now()
            });
            history.sort((a, b) => b.totalScore - a.totalScore);
            if (history.length > 50) {
                history.length = 50;
            }
            localStorage.setItem(this.SCORE_HISTORY_KEY, JSON.stringify(history));
            return true;
        } catch (e) {
            console.error('保存分数失败:', e);
            return false;
        }
    },

    getScoreHistory() {
        try {
            const data = localStorage.getItem(this.SCORE_HISTORY_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('读取分数历史失败:', e);
        }
        return [];
    },

    getHighScore() {
        const history = this.getScoreHistory();
        if (history.length > 0) {
            return history[0].totalScore;
        }
        return 0;
    },

    getBestRating() {
        const history = this.getScoreHistory();
        if (history.length > 0) {
            return history[0].rank || '新手';
        }
        return '新手';
    }
};
