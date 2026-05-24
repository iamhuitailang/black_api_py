const API_BASE_URL = '/api';

const ApiService = {
    async request(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        const config = {
            method: options.method || 'GET',
            headers
        };

        if (options.data && config.method !== 'GET') {
            config.body = JSON.stringify(options.data);
        }

        try {
            const response = await fetch(`${API_BASE_URL}${url}`, config);
            const result = await response.json();
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

    async getHome() {
        return this.get('/mxt/home/get');
    },

    async getJobs() {
        return this.get('/mxt/job/list/get');
    },

    async getJob(id) {
        return this.get('/mxt/job/get', { id });
    },

    async submitApplication(data) {
        return this.post('/mxt/application/submit', data);
    },

    async getApplication(id) {
        return this.get('/mxt/application/get', { id });
    },

    async generateEmployeeCard(applicationId) {
        return this.post(`/mxt/employee/card/generate?application_id=${applicationId}`);
    },

    async getEmployeeCard(params) {
        return this.get('/mxt/employee/card/get', params);
    },

    async shareEmployeeCard(id, userKey = '') {
        const params = new URLSearchParams({ id }).toString();
        let url = `/mxt/employee/card/share?${params}`;
        if (userKey) {
            url += `&user_key=${encodeURIComponent(userKey)}`;
        }
        return this.post(url);
    },

    async getUserCoins(userKey) {
        return this.get('/mxt/coin/get', { user_key: userKey });
    },

    async dailyLogin(userKey) {
        return this.post(`/mxt/coin/daily/login?user_key=${userKey}`);
    },

    async getCoinLogs(userKey) {
        return this.get('/mxt/coin/logs/get', { user_key: userKey });
    },

    async refreshHotJobs(userKey) {
        return this.post(`/mxt/coin/refresh/hot?user_key=${userKey}`);
    },

    async getHotJobs() {
        return this.get('/mxt/hot/get');
    },

    async getWelfares() {
        return this.get('/mxt/welfare/list/get');
    }
};
