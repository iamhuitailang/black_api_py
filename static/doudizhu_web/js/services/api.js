const API_BASE = 'http://localhost:8001/api/doudizhu/model';

const Api = {
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
            ...options,
            headers
        };

        try {
            const response = await fetch(`${API_BASE}${url}`, config);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            return {
                code: 500,
                msg: '网络请求失败',
                data: null
            };
        }
    },

    get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'GET' });
    },

    post(url, data = {}) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    put(url, data = {}) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    delete(url, data = {}) {
        return this.request(url, {
            method: 'DELETE',
            body: JSON.stringify(data)
        });
    }
};
