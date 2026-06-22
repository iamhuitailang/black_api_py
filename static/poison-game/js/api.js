const GameAPI = {
    baseUrl: '/api/poison/game',

    getPlayerId() {
        let playerId = localStorage.getItem('poison_game_player_id');
        if (!playerId) {
            playerId = 'player_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
            localStorage.setItem('poison_game_player_id', playerId);
        }
        return playerId;
    },

    async getProgress() {
        const playerId = this.getPlayerId();
        try {
            const response = await fetch(`${this.baseUrl}/progress/get?player_id=${encodeURIComponent(playerId)}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to get progress:', error);
            return {
                code: 0,
                data: {
                    player_id: playerId,
                    unlocked_level: 1,
                    total_completions: 0
                }
            };
        }
    },

    async getRecords(level = null) {
        const playerId = this.getPlayerId();
        let url = `${this.baseUrl}/records/get?player_id=${encodeURIComponent(playerId)}`;
        if (level) {
            url += `&level=${level}`;
        }
        try {
            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            console.error('Failed to get records:', error);
            return { code: 0, data: [] };
        }
    },

    async getBestRecord(level) {
        const playerId = this.getPlayerId();
        try {
            const response = await fetch(
                `${this.baseUrl}/records/bestget?player_id=${encodeURIComponent(playerId)}&level=${level}`
            );
            return await response.json();
        } catch (error) {
            console.error('Failed to get best record:', error);
            return { code: 0, data: null };
        }
    },

    async submitRecord(level, completionTime, purificationFound, purificationTotal, deathCount) {
        const playerId = this.getPlayerId();
        try {
            const response = await fetch(`${this.baseUrl}/records/set`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    player_id: playerId,
                    level: level,
                    completion_time: completionTime,
                    purification_found: purificationFound,
                    purification_total: purificationTotal,
                    death_count: deathCount
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Failed to submit record:', error);
            return { code: 0, data: null };
        }
    },

    async getCompletedLevels() {
        const result = await this.getRecords();
        if (result.code === 0 && result.data) {
            const completed = new Set();
            result.data.forEach(record => {
                if (record.level) {
                    completed.add(record.level);
                }
            });
            return Array.from(completed);
        }
        return [];
    }
};
