const ApiService = {
    baseUrl: '/api',

    async request(method, endpoint, data = null, headers = {}) {
        const url = this.baseUrl + endpoint;
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const token = Storage.get('token');
        if (token) {
            options.headers['Authorization'] = 'Bearer ' + token;
        }

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        } else if (data && method === 'GET') {
            const queryParams = new URLSearchParams(data).toString();
            url += '?' + queryParams;
        }

        try {
            const response = await fetch(url, options);
            const result = await response.json();

            if (result.code === 401) {
                Storage.remove('token');
                Storage.remove('user');
                Router.navigate('login');
                return null;
            }

            return result;
        } catch (error) {
            console.error('API request error:', error);
            return {
                code: 500,
                msg: 'Network error',
                data: null
            };
        }
    },

    async get(endpoint, params = null) {
        return this.request('GET', endpoint, params);
    },

    async post(endpoint, data = null) {
        return this.request('POST', endpoint, data);
    },

    async put(endpoint, data = null) {
        return this.request('PUT', endpoint, data);
    },

    async delete(endpoint, data = null) {
        return this.request('DELETE', endpoint, data);
    },

    async upload(endpoint, file, extraData = {}) {
        const formData = new FormData();
        formData.append('file', file);
        Object.keys(extraData).forEach(key => {
            formData.append(key, extraData[key]);
        });

        const url = this.baseUrl + endpoint;
        const token = Storage.get('token');
        const headers = {};
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: formData
            });
            return await response.json();
        } catch (error) {
            console.error('API upload error:', error);
            return {
                code: 500,
                msg: 'Upload error',
                data: null
            };
        }
    }
};
