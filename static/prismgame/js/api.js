class PrismGameAPI {
    constructor() {
        this.baseUrl = '/api/prismgame';
    }

    async _request(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            return {
                code: 500,
                message: 'Network error',
                data: null
            };
        }
    }

    async getLevels() {
        return this._request(`${this.baseUrl}/levels/get`);
    }

    async getLevel(levelId = null, levelNumber = null) {
        let url = `${this.baseUrl}/level/get?`;
        if (levelId) {
            url += `level_id=${levelId}`;
        } else if (levelNumber) {
            url += `level_number=${levelNumber}`;
        }
        return this._request(url);
    }

    async generateLevels() {
        return this._request(`${this.baseUrl}/levels/generate`, {
            method: 'POST'
        });
    }

    async saveSolution(levelId, playerName, rotationsUsed, isSuccess, 
                       lightPath = '', prismRotations = '', lightIntensity = 1.0) {
        return this._request(`${this.baseUrl}/solution/save`, {
            method: 'POST',
            body: JSON.stringify({
                level_id: levelId,
                player_name: playerName,
                rotations_used: rotationsUsed,
                is_success: isSuccess,
                light_path: lightPath,
                prism_rotations: prismRotations,
                light_intensity: lightIntensity
            })
        });
    }

    async getLevelSolutions(levelId, limit = 10) {
        return this._request(`${this.baseUrl}/solutions/get?level_id=${levelId}&limit=${limit}`);
    }

    async getSolution(solutionId) {
        return this._request(`${this.baseUrl}/solution/get?solution_id=${solutionId}`);
    }

    async validatePath(levelId, prismRotations) {
        return this._request(`${this.baseUrl}/validate/path`, {
            method: 'POST',
            body: JSON.stringify({
                level_id: levelId,
                prism_rotations: prismRotations
            })
        });
    }

    async getTopScores(limit = 10) {
        return this._request(`${this.baseUrl}/scoreboard/top/get?limit=${limit}`);
    }

    async getPlayerRank(playerName) {
        return this._request(`${this.baseUrl}/scoreboard/player/get?player_name=${encodeURIComponent(playerName)}`);
    }

    async addScore(playerName, score, rotations = 0, levelCleared = false) {
        return this._request(`${this.baseUrl}/scoreboard/add`, {
            method: 'POST',
            body: JSON.stringify({
                player_name: playerName,
                score: score,
                rotations: rotations,
                level_cleared: levelCleared
            })
        });
    }

    async getScoreboard(page = 1, pageSize = 10) {
        return this._request(`${this.baseUrl}/scoreboard/list/get?page=${page}&page_size=${pageSize}`);
    }
}

const prismGameAPI = new PrismGameAPI();
