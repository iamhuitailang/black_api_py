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
        login: (username, password) => API.post('/bm/admin/login', { username, password }),
        logout: () => API.post('/bm/admin/logout'),
        current: () => API.get('/bm/admin/current')
    },

    activity: {
        list: (page = 1, pageSize = 10, status = null, keyword = '') =>
            API.get('/bm/activity/list', { page, page_size: pageSize, status, keyword }),
        detail: (id) => API.get(`/bm/activity/detail?activity_id=${id}`),
        create: (data) => API.post('/bm/activity/create', data),
        update: (id, data) => API.post(`/bm/activity/update?activity_id=${id}`, data),
        delete: (id) => API.post(`/bm/activity/delete?activity_id=${id}`),
        statistics: (id) => API.get(`/bm/admin/activity/statistics?activity_id=${id}`)
    },

    registration: {
        list: (activityId = null, page = 1, pageSize = 10, status = null, keyword = '') =>
            API.get('/bm/admin/registration/list', { activity_id: activityId, page, page_size: pageSize, status, keyword }),
        approve: (id) => API.post(`/bm/admin/registration/approve?registration_id=${id}`),
        reject: (id) => API.post(`/bm/admin/registration/reject?registration_id=${id}`)
    },

    checkin: {
        byQrcode: (qrcode) => API.post('/bm/admin/checkin/by/qrcode', { qrcode }),
        byId: (registrationId) => API.post('/bm/admin/checkin/by/id', { registration_id: registrationId }),
        logs: (registrationId = null, page = 1, pageSize = 10) =>
            API.get('/bm/admin/checkin/logs', { registration_id: registrationId, page, page_size: pageSize })
    }
};
