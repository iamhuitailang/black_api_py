const API = {
    baseURL: '/api',
    
    async request(endpoint, options = {}) {
        const url = this.baseURL + endpoint;
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
            const response = await fetch(url, config);
            const result = await response.json();
            
            if (response.status === 401 || (result.code && result.code !== 0 && result.message && result.message.includes('登录'))) {
                Storage.removeToken();
                Storage.removeUser();
                Router.navigate('login');
                throw new Error('登录已过期，请重新登录');
            }
            
            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    },
    
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            data
        });
    },
    
    async delete(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'DELETE' });
    }
};
