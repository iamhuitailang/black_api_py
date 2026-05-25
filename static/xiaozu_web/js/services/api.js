const API_BASE = 'http://localhost:8128/api';

const ApiService = {
    async request(url, options = {}) {
        const token = Storage.get('xz_token');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}${url}`, {
            ...options,
            headers
        });

        const data = await response.json();
        return data;
    },

    get(url) {
        return this.request(url, { method: 'GET' });
    },

    post(url, body) {
        return this.request(url, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined
        });
    },

    put(url, body) {
        return this.request(url, {
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined
        });
    },

    delete(url) {
        return this.request(url, { method: 'DELETE' });
    }
};

window.ApiService = ApiService;
