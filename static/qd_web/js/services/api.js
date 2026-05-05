const API_BASE_URL = '/api';

const ApiService = {
    async request(url, options = {}) {
        const token = Storage.getToken();

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
                Storage.removeToken();
                Storage.removeUser();
                if (window.Router) {
                    window.Router.navigate('login');
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

const SignApi = {
    async getStatus() {
        return ApiService.get('/qd/sign/status/get');
    },

    async sign() {
        return ApiService.post('/qd/sign');
    },

    async supplementSign(targetDate) {
        return ApiService.post('/qd/sign/supplement', { target_date: targetDate });
    },

    async getCalendar(year, month) {
        const params = {};
        if (year) params.year = year;
        if (month) params.month = month;
        return ApiService.get('/qd/sign/calendar/get', params);
    },

    async getHistory(page = 1, pageSize = 10) {
        return ApiService.get('/qd/sign/history/get', { page, page_size: pageSize });
    },

    async getConfig() {
        return ApiService.get('/qd/sign/config/get');
    }
};

const UserApi = {
    async register(phone, password, nickname = '') {
        return ApiService.post('/qd/user/register', { phone, password, nickname });
    },

    async login(phone, password) {
        return ApiService.post('/qd/user/login', { phone, password });
    },

    async logout() {
        return ApiService.post('/qd/user/logout');
    },

    async getCurrentUser() {
        return ApiService.get('/qd/user/current/get');
    },

    async updateProfile(data) {
        return ApiService.post('/qd/user/profile/update', data);
    },

    async changePassword(oldPassword, newPassword) {
        return ApiService.post('/qd/user/password/change', { old_password: oldPassword, new_password: newPassword });
    }
};
