const API_BASE = '/api/qx';

const API = {
    request: async function(url, options = {}) {
        const token = Storage.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
        try {
            const response = await fetch(url, {
                ...options,
                headers: headers
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            return {
                code: -1,
                msg: '网络请求失败',
                data: null
            };
        }
    },
    get: function(url, params) {
        let fullUrl = API_BASE + url;
        if (params) {
            const urlParams = new URLSearchParams();
            for (const [key, value] of Object.entries(params)) {
                if (value !== null && value !== undefined) {
                    urlParams.set(key, value);
                }
            }
            const queryString = urlParams.toString();
            if (queryString) {
                fullUrl += '?' + queryString;
            }
        }
        return this.request(fullUrl, {
            method: 'GET'
        });
    },
    post: function(url, data) {
        return this.request(API_BASE + url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
};
