const API_BASE_URL = '/api/dw';

const ApiService = {
    async request(url, options = {}) {
        const token = DwAuth.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const config = {
            method: options.method || 'GET',
            headers,
            ...options
        };
        if (options.data && config.method !== 'GET') {
            config.body = JSON.stringify(options.data);
        }
        try {
            const response = await fetch(`${API_BASE_URL}${url}`, config);
            const result = await response.json();
            if (response.status === 401 || (result.code === 1 && result.msg && result.msg.includes('token'))) {
                DwAuth.removeToken();
                DwAuth.removeUser();
                if (window.DwRouter) {
                    DwRouter.navigate('login');
                }
                throw new Error('登录已过期，请重新登录');
            }
            return result;
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    },

    async get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'GET' });
    },

    async post(url, data = {}) {
        return this.request(url, { method: 'POST', data });
    },

    async put(url, data = {}) {
        return this.request(url, { method: 'PUT', data });
    },

    async delete(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'DELETE' });
    }
};

const DwApi = {
    auth: {
        register: (data) => ApiService.post('/auth/register', data),
        login: (data) => ApiService.post('/auth/login', data),
        logout: () => ApiService.post('/auth/logout'),
        getCurrentUser: () => ApiService.get('/auth/me')
    },
    zoo: {
        getInfo: () => ApiService.get('/zoo/info'),
        update: (data) => ApiService.put('/zoo/update', data),
        expand: () => ApiService.post('/zoo/expand'),
        upgrade: () => ApiService.post('/zoo/upgrade'),
        getDashboard: () => ApiService.get('/zoo/dashboard')
    },
    animal: {
        getSpecies: (params) => ApiService.get('/animal/species', params),
        buyAnimal: (data) => ApiService.post('/animal/buy', data),
        getMyAnimals: (params) => ApiService.get('/animal/my', params),
        getDetail: (id) => ApiService.get(`/animal/detail/${id}`),
        feed: (id) => ApiService.post(`/animal/feed/${id}`),
        pet: (id) => ApiService.post(`/animal/pet/${id}`),
        move: (id, data) => ApiService.post(`/animal/move/${id}`, data),
        sell: (id) => ApiService.post(`/animal/sell/${id}`)
    },
    habitat: {
        getTypes: () => ApiService.get('/habitat/types'),
        getMyHabitats: () => ApiService.get('/habitat/my'),
        build: (data) => ApiService.post('/habitat/build', data),
        getDetail: (id) => ApiService.get(`/habitat/detail/${id}`),
        upgrade: (id) => ApiService.post(`/habitat/upgrade/${id}`),
        clean: (id) => ApiService.post(`/habitat/clean/${id}`),
        adjustTemp: (id, data) => ApiService.post(`/habitat/temperature/${id}`, data)
    },
    visitor: {
        generate: () => ApiService.post('/visitor/generate'),
        getStats: () => ApiService.get('/visitor/stats'),
        getSatisfaction: () => ApiService.get('/visitor/satisfaction')
    },
    breed: {
        start: (data) => ApiService.post('/breed/start', data),
        check: () => ApiService.post('/breed/check'),
        getRecords: (params) => ApiService.get('/breed/records', params)
    },
    disease: {
        getList: () => ApiService.get('/disease/list'),
        getSick: () => ApiService.get('/disease/sick'),
        diagnose: (id) => ApiService.post(`/disease/diagnose/${id}`),
        cure: (id) => ApiService.post(`/disease/cure/${id}`),
        randomCheck: () => ApiService.post('/disease/check')
    },
    rare: {
        getCollection: () => ApiService.get('/rare/collection'),
        getStats: () => ApiService.get('/rare/stats'),
        getRareSpecies: () => ApiService.get('/rare/species')
    }
};
