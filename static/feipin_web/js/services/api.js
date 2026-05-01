const API = {
    baseURL: '/api/feipin',

    async request(method, url, data = null, options = {}) {
        const token = Storage.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method,
            headers,
            ...options
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(this.baseURL + url, config);
            const result = await response.json();

            if (result.code === 401) {
                Storage.removeToken();
                Storage.removeUser();
                Router.navigate('login');
                throw new Error('登录已过期，请重新登录');
            }

            return result;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    },

    async get(url, params = {}, options = {}) {
        let queryString = '';
        if (Object.keys(params).length > 0) {
            queryString = '?' + new URLSearchParams(params).toString();
        }
        return this.request('GET', url + queryString, null, options);
    },

    async post(url, data = {}, options = {}) {
        return this.request('POST', url, data, options);
    },

    async put(url, data = {}, options = {}) {
        return this.request('PUT', url, data, options);
    },

    async delete(url, options = {}) {
        return this.request('DELETE', url, null, options);
    }
};
