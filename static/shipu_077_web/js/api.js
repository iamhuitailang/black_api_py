const API_BASE = '/api/shipu';

class ApiService {
    constructor(isAdmin = false) {
        this.isAdmin = isAdmin;
        this.tokenKey = isAdmin ? 'shipu_admin_token' : 'shipu_token';
        this.token = localStorage.getItem(this.tokenKey) || '';
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem(this.tokenKey, token);
    }

    clearToken() {
        this.token = '';
        localStorage.removeItem(this.tokenKey);
    }

    async request(method, url, data = null, params = null, useAdminToken = null) {
        const tokenKey = useAdminToken !== null 
            ? (useAdminToken ? 'shipu_admin_token' : 'shipu_token') 
            : this.tokenKey;
        const currentToken = localStorage.getItem(tokenKey) || this.token;

        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (currentToken) {
            options.headers['Authorization'] = `Bearer ${currentToken}`;
        }

        let fullUrl = API_BASE + url;
        if (params) {
            const filteredParams = {};
            Object.entries(params).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    filteredParams[key] = value;
                }
            });
            const searchParams = new URLSearchParams(filteredParams);
            if (searchParams.toString()) {
                fullUrl += '?' + searchParams.toString();
            }
        }

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(fullUrl, options);
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API Error:', error);
            return { code: -1, msg: '网络错误', data: null };
        }
    }

    get(url, params = null, useAdminToken = null) {
        return this.request('GET', url, null, params, useAdminToken);
    }

    post(url, data = null, params = null, useAdminToken = null) {
        return this.request('POST', url, data, params, useAdminToken);
    }
}

const api = new ApiService(false);
const adminApi = new ApiService(true);
