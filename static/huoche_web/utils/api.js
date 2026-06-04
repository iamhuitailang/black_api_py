const API = {
    baseURL: '/api',

    async request(path, options = {}) {
        const url = `${this.baseURL}${path}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        const token = Storage.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method: 'GET',
            credentials: 'include',
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            return {
                code: 1,
                message: '网络请求失败',
                data: null
            };
        }
    },

    async get(path, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullPath = queryString ? `${path}?${queryString}` : path;
        return this.request(fullPath, { method: 'GET' });
    },

    async post(path, data = {}) {
        return this.request(path, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    auth: {
        async login(username, password) {
            return API.post('/auth/login', { username, password });
        },

        async logout() {
            return API.post('/auth/logout', {});
        },

        async getCurrentUser() {
            return API.get('/auth/current/user/get');
        }
    },

    huoche: {
        async register(username, password) {
            return API.post('/huoche/register', { username, password });
        },

        async getUserInfo() {
            return API.get('/huoche/user/info/get');
        },

        async getTrainTypes() {
            return API.get('/huoche/train/types/get');
        },

        async getRoutes() {
            return API.get('/huoche/routes/get');
        },

        async getRouteStations(routeId) {
            return API.get('/huoche/route/stations/get', { route_id: routeId });
        },

        async buyTrain(trainTypeId, trainName) {
            return API.post('/huoche/train/buy', { train_type_id: trainTypeId, train_name: trainName });
        },

        async upgradeTrain(trainId, attribute) {
            return API.post('/huoche/train/upgrade', { train_id: trainId, attribute });
        },

        async repairTrain(trainId) {
            return API.post('/huoche/train/repair', { train_id: trainId });
        },

        async startGame(trainId, routeId) {
            return API.post('/huoche/game/start', { train_id: trainId, route_id: routeId });
        },

        async completeGame(gameData) {
            return API.post('/huoche/game/complete', gameData);
        },

        async getGameHistory(limit = 20) {
            return API.get('/huoche/game/history/get', { limit });
        },

        async getBestScores(limit = 10) {
            return API.get('/huoche/best/scores/get', { limit });
        }
    }
};
