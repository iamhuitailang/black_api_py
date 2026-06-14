const API_BASE = '/api/cyber_ninja';

const api = {
    async submitScore(playerName, score, level) {
        try {
            const response = await fetch(`${API_BASE}/submit_score`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    player_name: playerName,
                    score: score,
                    level: level
                })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('提交成绩失败:', error);
            return { code: 1, message: '网络错误', data: null };
        }
    },

    async getLeaderboard(limit = 10) {
        try {
            const response = await fetch(`${API_BASE}/leaderboard?limit=${limit}`);
            const data = await response.json();
            
            if (data.code === 0) {
                return data.data;
            }
            return null;
        } catch (error) {
            console.error('获取排行榜失败:', error);
            return null;
        }
    },

    async getPlayerBest(playerName) {
        try {
            const response = await fetch(`${API_BASE}/player_best?player_name=${encodeURIComponent(playerName)}`);
            const data = await response.json();
            
            if (data.code === 0) {
                return data.data;
            }
            return null;
        } catch (error) {
            console.error('获取玩家最佳成绩失败:', error);
            return null;
        }
    }
};
