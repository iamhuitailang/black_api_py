class GameAPI {
    constructor() {
        this.baseURL = '/api/game';
    }

    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return {
                code: 500,
                message: 'Network error',
                data: null
            };
        }
    }

    async saveScore(playerName, score, wave, kills, energyCollected = 0, bossKilled = false) {
        return await this.request('/savescore', {
            method: 'POST',
            body: JSON.stringify({
                player_name: playerName,
                score,
                wave,
                kills,
                energy_collected: energyCollected,
                boss_killed: bossKilled
            })
        });
    }

    async getTopScores(limit = 10) {
        return await this.request(`/topscores?limit=${limit}`);
    }

    async getPlayerProgress(playerName) {
        return await this.request(`/playerprogress?player_name=${encodeURIComponent(playerName)}`);
    }

    async getPlayerScores(playerName) {
        return await this.request(`/playerscores?player_name=${encodeURIComponent(playerName)}`);
    }

    async getLeaderboard(page = 1, pageSize = 10) {
        return await this.request(`/leaderboard?page=${page}&page_size=${pageSize}`);
    }
}

const gameAPI = new GameAPI();
