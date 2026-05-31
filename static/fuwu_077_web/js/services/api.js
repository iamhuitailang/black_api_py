const API_BASE_URL = '/api';

const ApiService = {
    async request(url, options = {}) {
        const role = Storage.getRole();
        let token = null;
        if (role === 'admin') {
            token = Storage.getAdminToken();
        } else {
            token = Storage.getUserToken();
        }

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
            const response = await fetch(`${API_BASE_URL}${url}`, config);
            const result = await response.json();

            if (response.status === 401 || (result.code === 1 && result.msg && (result.msg.includes('token') || result.msg.includes('登录')))) {
                Storage.removeUserToken();
                Storage.removeAdminToken();
                Storage.removeUser();
                Storage.removeAdmin();
                Storage.removeRole();
                if (window.Router) {
                    window.Router.navigate('login');
                }
                throw new Error('登录已过期，请重新登录');
            }

            return result;
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    },

    async get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'GET' });
    },

    async post(url, data = {}) {
        return this.request(url, { method: 'POST', data });
    },

    async put(url, data = {}) {
        return this.request(url, { method: 'PUT', data });
    },

    async delete(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'DELETE' });
    }
};

const UserApi = {
    register(data) {
        return ApiService.post('/fuwu_077_model/auth/register', data);
    },
    login(data) {
        return ApiService.post('/fuwu_077_model/auth/login', data);
    },
    logout() {
        return ApiService.post('/fuwu_077_model/auth/logout');
    },
    getProfile() {
        return ApiService.get('/fuwu_077_model/auth/current/get');
    },
    updateProfile(data) {
        return ApiService.post('/fuwu_077_model/auth/profile/update', data);
    },
    changePassword(data) {
        return ApiService.post('/fuwu_077_model/auth/password/change', data);
    }
};

const AdminApi = {
    login(data) {
        return ApiService.post('/fuwu_077_model/admin/auth/login', data);
    },
    logout() {
        return ApiService.post('/fuwu_077_model/admin/auth/logout');
    },
    getProfile() {
        return ApiService.get('/fuwu_077_model/admin/auth/current/get');
    },
    changePassword(data) {
        return ApiService.post('/fuwu_077_model/admin/auth/password/change', data);
    }
};

const ServiceApi = {
    list(params = {}) {
        return ApiService.get('/fuwu_077_model/service/list/get', params);
    },
    all(params = {}) {
        return ApiService.get('/fuwu_077_model/service/all/get', params);
    },
    categories() {
        return ApiService.get('/fuwu_077_model/service/categories/get');
    },
    get(id) {
        return ApiService.get(`/fuwu_077_model/service/detail/get`, { service_id: id });
    },
    create(data) {
        return ApiService.post('/fuwu_077_model/service/create', data);
    },
    update(data, id) {
        return ApiService.post('/fuwu_077_model/service/update?service_id=' + id, data);
    },
    toggleStatus(id) {
        return ApiService.post('/fuwu_077_model/service/status/toggle?service_id=' + id);
    },
    delete(id) {
        return ApiService.post('/fuwu_077_model/service/delete?service_id=' + id);
    }
};

const StaffApi = {
    list(params = {}) {
        return ApiService.get('/fuwu_077_model/staff/list/get', params);
    },
    available() {
        return ApiService.get('/fuwu_077_model/staff/available/get');
    },
    get(id) {
        return ApiService.get(`/fuwu_077_model/staff/detail/get`, { staff_id: id });
    },
    create(data) {
        return ApiService.post('/fuwu_077_model/staff/create', data);
    },
    update(data, id) {
        return ApiService.post('/fuwu_077_model/staff/update?staff_id=' + id, data);
    },
    toggleStatus(id) {
        return ApiService.post('/fuwu_077_model/staff/status/toggle?staff_id=' + id);
    },
    delete(id) {
        return ApiService.post('/fuwu_077_model/staff/delete?staff_id=' + id);
    }
};

const OrderApi = {
    list(params = {}) {
        return ApiService.get('/fuwu_077_model/order/list/get', params);
    },
    myList(params = {}) {
        return ApiService.get('/fuwu_077_model/order/my/get', params);
    },
    get(id) {
        return ApiService.get(`/fuwu_077_model/order/detail/get`, { order_id: id });
    },
    create(data) {
        return ApiService.post('/fuwu_077_model/order/create', data);
    },
    assign(data, orderId) {
        return ApiService.post('/fuwu_077_model/order/assign?order_id=' + orderId, data);
    },
    confirm(id) {
        return ApiService.post('/fuwu_077_model/order/confirm?order_id=' + id);
    },
    cancel(id) {
        return ApiService.post('/fuwu_077_model/order/cancel?order_id=' + id);
    }
};

const ReviewApi = {
    list(params = {}) {
        return ApiService.get('/fuwu_077_model/review/list/get', params);
    },
    myList(params = {}) {
        return ApiService.get('/fuwu_077_model/review/my/get', params);
    },
    getByStaff(staffId, params = {}) {
        return ApiService.get(`/fuwu_077_model/review/staff/get`, { staff_id: staffId, ...params });
    },
    getByService(serviceId, params = {}) {
        return ApiService.get(`/fuwu_077_model/review/service/get`, { service_id: serviceId, ...params });
    },
    get(id) {
        return ApiService.get(`/fuwu_077_model/review/detail/get`, { review_id: id });
    },
    create(data) {
        return ApiService.post('/fuwu_077_model/review/create', data);
    }
};

const NotificationApi = {
    list(params = {}) {
        return ApiService.get('/fuwu_077_model/notification/list/get', params);
    },
    read(id) {
        return ApiService.post('/fuwu_077_model/notification/read?notification_id=' + id);
    },
    readAll() {
        return ApiService.post('/fuwu_077_model/notification/read/all');
    },
    delete(id) {
        return ApiService.post('/fuwu_077_model/notification/delete?notification_id=' + id);
    },
    unreadCount() {
        return ApiService.get('/fuwu_077_model/notification/unread/count/get');
    }
};

const StatisticsApi = {
    overview(params = {}) {
        return ApiService.get('/fuwu_077_model/statistics/overview/get', params);
    },
    daily(params = {}) {
        return ApiService.get('/fuwu_077_model/statistics/daily/get', params);
    },
    serviceStats(params = {}) {
        return ApiService.get('/fuwu_077_model/statistics/service/get', params);
    },
    full(params = {}) {
        return ApiService.get('/fuwu_077_model/statistics/full/get', params);
    }
};
