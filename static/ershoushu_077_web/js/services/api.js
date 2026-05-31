const API_BASE_URL = '/api';

const ApiService = {
    async request(url, options = {}) {
        const token = Storage.getToken();
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const config = { method: options.method || 'GET', headers, ...options };
        if (options.data && config.method !== 'GET') config.body = JSON.stringify(options.data);
        try {
            const response = await fetch(`${API_BASE_URL}${url}`, config);
            const result = await response.json();
            if (response.status === 401 || (result.code === 1 && result.msg && result.msg.includes('token'))) {
                Storage.removeToken();
                Storage.removeUser();
                if (window.appInstance) window.appInstance.navigate('login');
                throw new Error('登录已过期');
            }
            return result;
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    },
    async get(url, params = {}) {
        const qs = new URLSearchParams(params).toString();
        const fullUrl = qs ? `${url}?${qs}` : url;
        return this.request(fullUrl, { method: 'GET' });
    },
    async post(url, data = {}) { return this.request(url, { method: 'POST', data }); },
    async put(url, data = {}) { return this.request(url, { method: 'PUT', data }); },
    async delete(url, params = {}) {
        const qs = new URLSearchParams(params).toString();
        const fullUrl = qs ? `${url}?${qs}` : url;
        return this.request(fullUrl, { method: 'DELETE' });
    }
};
