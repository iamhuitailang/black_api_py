const GameAPI = {
    baseURL: 'http://localhost:8080/api/gear/game',

    async saveGame(level, score, maxCombo, stepsUsed, isWin) {
        try {
            const response = await fetch(`${this.baseURL}/set`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    level,
                    score,
                    max_combo: maxCombo,
                    steps_used: stepsUsed,
                    is_win: isWin
                })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('保存游戏记录失败:', error);
            return null;
        }
    },

    async getHighestScore(level = null) {
        try {
            const url = level 
                ? `${this.baseURL}/highest/score?level=${level}`
                : `${this.baseURL}/highest/score`;
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('获取最高分失败:', error);
            return { data: { score: 0, max_combo: 0 } };
        }
    },

    async getHighestCombo(level = null) {
        try {
            const url = level 
                ? `${this.baseURL}/highest/combo?level=${level}`
                : `${this.baseURL}/highest/combo`;
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('获取最高连击失败:', error);
            return { data: { max_combo: 0, score: 0 } };
        }
    },

    async getGameStats(level = null) {
        try {
            const url = level 
                ? `${this.baseURL}/stats?level=${level}`
                : `${this.baseURL}/stats`;
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('获取游戏统计失败:', error);
            return { data: { highest_score: 0, highest_combo: 0, total_games: 0 } };
        }
    },

    async getRecords(level = null, page = 1, pageSize = 10) {
        try {
            let url = `${this.baseURL}/records?page=${page}&page_size=${pageSize}`;
            if (level) {
                url += `&level=${level}`;
            }
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('获取游戏记录失败:', error);
            return { data: { items: [], total: 0 } };
        }
    }
};
