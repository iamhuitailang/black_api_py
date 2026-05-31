const API_BASE_URL = '/api';

const ZbtApi = {
    async request(url, options = {}) {
        const token = ZbtStorage.getToken();
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
        };

        if (options.data && config.method !== 'GET') {
            config.body = JSON.stringify(options.data);
        }

        try {
            const queryString = options.params ? '?' + new URLSearchParams(options.params).toString() : '';
            const response = await fetch(`${API_BASE_URL}${url}${queryString}`, config);
            const result = await response.json();

            if (response.status === 401 || (result.code === 1 && result.msg && result.msg.includes('token'))) {
                ZbtStorage.removeToken();
                ZbtStorage.removeUser();
                ZbtRouter.navigate('/login');
                throw new Error('登录已过期，请重新登录');
            }

            return result;
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    },

    async get(url, params = {}) {
        return this.request(url, { method: 'GET', params });
    },

    async post(url, data = {}) {
        return this.request(url, { method: 'POST', data });
    },

    async put(url, data = {}) {
        return this.request(url, { method: 'PUT', data });
    },

    async del(url, params = {}) {
        return this.request(url, { method: 'DELETE', params });
    }
};
