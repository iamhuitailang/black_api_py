const API_BASE_URL = '/api';

const ApiService = {
    async request(url, options = {}) {
        const token = Storage.getToken();
        const adminToken = Storage.getAdminToken();

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token && !options.useAdminToken) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        if (adminToken && options.useAdminToken) {
            headers['Authorization'] = `Bearer ${adminToken}`;
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
                if (options.useAdminToken) {
                    Storage.removeAdminToken();
                    Storage.removeAdmin();
                } else {
                    Storage.removeToken();
                    Storage.removeUser();
                }
                if (window.Router) {
                    window.Router.navigate(options.useAdminToken ? 'adminLogin' : 'login');
                }
                throw new Error('登录已过期，请重新登录');
            }

            return result;
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    },

    async get(url, params = {}, options = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'GET', ...options });
    },

    async post(url, data = {}, options = {}) {
        return this.request(url, { method: 'POST', data, ...options });
    },

    async put(url, data = {}, options = {}) {
        return this.request(url, { method: 'PUT', data, ...options });
    },

    async delete(url, params = {}, options = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'DELETE', ...options });
    }
};

window.ApiService = ApiService;
