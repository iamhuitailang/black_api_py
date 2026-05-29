const API_BASE_URL = '';

const Api = {
    async request(url, options = {}) {
        const token = Storage.get('token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };

        try {
            const response = await fetch(`${API_BASE_URL}${url}`, {
                headers,
                ...options
            });
            const data = await response.json();

            if (data.code !== 0) {
                throw new Error(data.message || '请求失败');
            }

            return data.data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    get(url, params = {}) {
        const filteredParams = {};
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                filteredParams[key] = params[key];
            }
        });
        const query = new URLSearchParams(filteredParams).toString();
        return this.request(query ? `${url}?${query}` : url, {
            method: 'GET'
        });
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

    delete(url) {
        return this.request(url, {
            method: 'DELETE'
        });
    }
};
