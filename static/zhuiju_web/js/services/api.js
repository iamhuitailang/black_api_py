const API_BASE = '/api';

const ApiService = {
    async request(url, options = {}) {
        const fullUrl = url.startsWith('http') ? url : API_BASE + url;
        const opts = {
            headers: { 'Content-Type': 'application/json' },
            ...options
        };
        try {
            const resp = await fetch(fullUrl, opts);
            const json = await resp.json();
            return json;
        } catch (e) {
            return { code: 1, message: '网络错误: ' + e.message, data: null };
        }
    },

    async get(url) {
        return this.request(url, { method: 'GET' });
    },

    async post(url, body) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(body || {})
        });
    },

    async del(url) {
        return this.request(url, { method: 'DELETE' });
    },

    async listDramas(params = {}) {
        const qs = new URLSearchParams();
        Object.keys(params).forEach(k => {
            if (params[k] != null && params[k] !== '') qs.append(k, params[k]);
        });
        return this.get(`/zhuiju/list/get${qs.toString() ? '?' + qs.toString() : ''}`);
    },

    async getDrama(id) {
        return this.get(`/zhuiju/detail/get?id=${id}`);
    },

    async addDrama(data) {
        return this.post('/zhuiju/add', data);
    },

    async updateDrama(data) {
        return this.post('/zhuiju/update', data);
    },

    async deleteDrama(id) {
        return this.del(`/zhuiju/delete?id=${id}`);
    },

    async changeStatus(id, status) {
        return this.post('/zhuiju/status/set', { id, status });
    },

    async episodePlus(id, delta = 1) {
        return this.post('/zhuiju/episode/add', { id, delta });
    },

    async setProgress(id, watched) {
        return this.post('/zhuiju/progress/set', { id, watched_episodes: watched });
    },

    async setRating(id, rating, review = '', tags = '', is_rewatch = 0) {
        return this.post('/zhuiju/rating/set', { id, rating, review, tags, is_rewatch });
    },

    async batchStatus(ids, status) {
        return this.post('/zhuiju/batch/status/set', { ids, status });
    },

    async statistics() {
        return this.get('/zhuiju/statistics/get');
    },

    async filters() {
        return this.get('/zhuiju/filters/get');
    },

    async exportData() {
        return this.get('/zhuiju/export/get');
    },

    async importData(items, mode = 'merge') {
        return this.post('/zhuiju/import', { items, mode });
    },

    async clearAll() {
        return this.post('/zhuiju/clear/all', {});
    },

    async resetDefault() {
        return this.post('/zhuiju/reset/default', {});
    },

    async annualSummary(year) {
        const q = year ? `?year=${year}` : '';
        return this.get(`/zhuiju/annual/get${q}`);
    },

    async recommend(id) {
        return this.get(`/zhuiju/recommend/get?id=${id}`);
    },

    async reminderList() {
        return this.get('/zhuiju/reminder/list/get');
    },

    async reminderPending() {
        return this.get('/zhuiju/reminder/pending/get');
    },

    async reminderAdd(data) {
        return this.post('/zhuiju/reminder/add', data);
    },

    async reminderRead(id) {
        return this.post(`/zhuiju/reminder/read?id=${id}`, {});
    },

    async reminderReadAll() {
        return this.post('/zhuiju/reminder/read/all', {});
    },

    async reminderDelete(id) {
        return this.del(`/zhuiju/reminder/delete?id=${id}`);
    }
};

window.ApiService = ApiService;
