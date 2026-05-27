const Api = {
    baseUrl: '/api/jiaoyi',

    async request(url, options = {}) {
        const token = Storage.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(this.baseUrl + url, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    Storage.removeToken();
                    Storage.removeUser();
                    Router.navigate('login');
                }
                throw new Error(data.message || '请求失败');
            }

            return data;
        } catch (error) {
            Toast.error(error.message);
            throw error;
        }
    },

    get(url, params = {}) {
        const queryString = Object.keys(params)
            .map(key => `${key}=${encodeURIComponent(params[key])}`)
            .join('&');
        return this.request(url + (queryString ? '?' + queryString : ''), {
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
