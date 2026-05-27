const API_BASE_URL = '/api';

const ApiService = {
    async request(url, options = {}) {
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
            const response = await fetch(`${API_BASE_URL}${url}`, config);
            const result = await response.json();

            if (response.status === 401 || (result.code === 1 && result.msg && result.msg.includes('token'))) {
                Storage.removeToken();
                Storage.removeUser();
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
    },

    user: {
        register(data) {
            return ApiService.post('/jiaoyi/user/register', data);
        },
        login(data) {
            return ApiService.post('/jiaoyi/user/login', data);
        },
        logout() {
            return ApiService.post('/jiaoyi/user/logout');
        },
        getProfile() {
            return ApiService.get('/jiaoyi/user/current/get');
        },
        updateProfile(data) {
            return ApiService.post('/jiaoyi/user/profile/update', data);
        },
        updatePassword(data) {
            return ApiService.post('/jiaoyi/user/password/change', data);
        }
    },

    book: {
        getList(params = {}) {
            return ApiService.get('/jiaoyi/book/list/get', params);
        },
        getDetail(id) {
            return ApiService.get(`/jiaoyi/book/detail/get`, { book_id: id });
        },
        create(data) {
            return ApiService.post('/jiaoyi/book/create', data);
        },
        update(id, data) {
            return ApiService.post('/jiaoyi/book/update', { book_id: id, ...data });
        },
        delete(id) {
            return ApiService.post('/jiaoyi/book/delete', { book_id: id });
        },
        getMyList(params = {}) {
            return ApiService.get('/jiaoyi/book/my/get', params);
        },
        offline(id) {
            return ApiService.post('/jiaoyi/book/off/shelf', { book_id: id });
        },
        online(id) {
            return ApiService.post('/jiaoyi/book/on/shelf', { book_id: id });
        }
    },

    category: {
        getList() {
            return ApiService.get('/jiaoyi/category/list/get');
        }
    },

    favorite: {
        getList(params = {}) {
            return ApiService.get('/jiaoyi/favorite/list/get', params);
        },
        toggle(bookId) {
            return ApiService.post('/jiaoyi/favorite/toggle', { book_id: bookId });
        },
        check(bookId) {
            return ApiService.get('/jiaoyi/favorite/check/get', { book_id: bookId });
        }
    },

    order: {
        create(data) {
            return ApiService.post('/jiaoyi/order/create', data);
        },
        getList(params = {}) {
            return ApiService.get('/jiaoyi/order/buyer/list/get', params);
        },
        getSellerList(params = {}) {
            return ApiService.get('/jiaoyi/order/seller/list/get', params);
        },
        getDetail(id) {
            return ApiService.get('/jiaoyi/order/detail/get', { order_id: id });
        },
        pay(id) {
            return ApiService.post('/jiaoyi/order/pay', { order_id: id });
        },
        ship(id, data) {
            return ApiService.post('/jiaoyi/order/ship', { order_id: id, ...data });
        },
        receive(id) {
            return ApiService.post('/jiaoyi/order/receive', { order_id: id });
        },
        complete(id) {
            return ApiService.post('/jiaoyi/order/complete', { order_id: id });
        },
        cancel(id, data) {
            return ApiService.post('/jiaoyi/order/cancel', { order_id: id, ...data });
        }
    },

    review: {
        getList(bookId, params = {}) {
            return ApiService.get('/jiaoyi/review/book/list/get', { book_id: bookId, ...params });
        },
        create(data) {
            return ApiService.post('/jiaoyi/review/create', data);
        },
        getMyList(params = {}) {
            return ApiService.get('/jiaoyi/review/my/get', params);
        }
    },

    announcement: {
        getList(params = {}) {
            return ApiService.get('/jiaoyi/announcement/list/get', params);
        },
        getDetail(id) {
            return ApiService.get(`/jiaoyi/announcement/detail/get/${id}`);
        }
    },

    chat: {
        getList(userId, params = {}) {
            return ApiService.get(`/jiaoyi/chat/conversation/get/${userId}`, params);
        },
        send(data) {
            return ApiService.post('/jiaoyi/chat/send', data);
        },
        getConversations() {
            return ApiService.get('/jiaoyi/chat/list/get');
        }
    },

    refund: {
        create(data) {
            return ApiService.post('/jiaoyi/refund/create', data);
        },
        getList(params = {}) {
            return ApiService.get('/jiaoyi/refund/list/get', params);
        },
        getDetail(id) {
            return ApiService.get(`/jiaoyi/refund/detail/get/${id}`);
        }
    },

    report: {
        create(data) {
            return ApiService.post('/jiaoyi/report/create', data);
        }
    },

    statistics: {
        getUser() {
            return ApiService.get('/jiaoyi/statistics/user/get');
        }
    }
};

window.ApiService = ApiService;
