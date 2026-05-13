const API = {
    baseUrl: '/api',

    async request(endpoint, options = {}) {
        const token = Storage.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers
        };

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            return { code: -1, msg: '网络错误', data: null };
        }
    },

    async get(endpoint, params = {}) {
        const filteredParams = Object.fromEntries(
            Object.entries(params).filter(([_, v]) => v !== null && v !== undefined)
        );
        const queryString = new URLSearchParams(filteredParams).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        console.log('GET request:', url);
        return this.request(url, { method: 'GET' });
    },

    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },

    auth: {
        register: (data) => API.post('/bm/user/register', data),
        login: (phone, password) => API.post('/bm/user/login', { phone, password }),
        logout: () => API.post('/bm/user/logout'),
        current: () => API.get('/bm/user/current')
    },

    activity: {
        list: (page = 1, pageSize = 10, status = null, keyword = '') =>
            API.get('/bm/activity/list', { page, page_size: pageSize, status, keyword }),
        detail: (id) => API.get(`/bm/activity/detail?activity_id=${id}`),
        register: (data) => API.post('/bm/activity/register', data),
        cancelRegistration: (registrationId) => API.post(`/bm/activity/cancel/registration?registration_id=${registrationId}`)
    },

    myRegistrations: (page = 1, pageSize = 10, status = null) =>
        API.get('/bm/user/registration/list', { page, page_size: pageSize, status })
};
