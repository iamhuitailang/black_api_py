const API_BASE = '/api';

class ApiClient {
    constructor() {
        this.token = localStorage.getItem('kuaidi_token') || '';
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('kuaidi_token', token);
    }

    clearToken() {
        this.token = '';
        localStorage.removeItem('kuaidi_token');
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    async request(method, url, data = null, params = null) {
        let fullUrl = API_BASE + url;
        
        if (params) {
            const searchParams = new URLSearchParams();
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined) {
                    searchParams.append(key, params[key]);
                }
            });
            const queryString = searchParams.toString();
            if (queryString) {
                fullUrl += '?' + queryString;
            }
        }

        const options = {
            method: method,
            headers: this.getHeaders()
        };

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(fullUrl, options);
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API Error:', error);
            return {
                code: 500,
                msg: '网络错误',
                data: null
            };
        }
    }

    get(url, params = null) {
        return this.request('GET', url, null, params);
    }

    post(url, data = null, params = null) {
        return this.request('POST', url, data, params);
    }

    put(url, data = null, params = null) {
        return this.request('PUT', url, data, params);
    }

    delete(url, params = null) {
        return this.request('DELETE', url, null, params);
    }

    user = {
        register: (data) => this.post('/kuaidi077/user/register', data),
        login: (data) => this.post('/kuaidi077/user/login', data),
        logout: () => this.post('/kuaidi077/user/logout'),
        getCurrent: () => this.get('/kuaidi077/user/current/get'),
        updateProfile: (data) => this.post('/kuaidi077/user/profile/update', data),
        changePassword: (data) => this.post('/kuaidi077/user/password/change', data),
        getList: (params) => this.get('/kuaidi077/user/list/get', params),
        updateStatus: (params) => this.post('/kuaidi077/user/status/update', null, params),
        delete: (params) => this.post('/kuaidi077/user/delete', null, params)
    };

    package = {
        create: (data) => this.post('/kuaidi077/package/create', data),
        getDetail: (params) => this.get('/kuaidi077/package/detail/get', params),
        getByTracking: (params) => this.get('/kuaidi077/package/tracking/get', params),
        getMyPackages: (params) => this.get('/kuaidi077/package/my/get', params),
        getByPhone: (params) => this.get('/kuaidi077/package/phone/get', params),
        getList: (params) => this.get('/kuaidi077/package/list/get', params),
        update: (data, params) => this.post('/kuaidi077/package/update', data, params),
        delete: (params) => this.post('/kuaidi077/package/delete', null, params),
        getOverdueList: (params) => this.get('/kuaidi077/package/overdue/list/get', params),
        processOverdue: (params) => this.post('/kuaidi077/package/overdue/process', null, params),
        returnPackage: (params) => this.post('/kuaidi077/package/return', null, params),
        getStatistics: () => this.get('/kuaidi077/package/statistics/get')
    };

    pickup = {
        generateCode: (params) => this.post('/kuaidi077/pickup/code/generate', null, params),
        getCodeDetail: (params) => this.get('/kuaidi077/pickup/code/detail/get', params),
        getCode: (params) => this.get('/kuaidi077/pickup/code/get', params),
        getMyCodes: (params) => this.get('/kuaidi077/pickup/code/my/get', params),
        verify: (data) => this.post('/kuaidi077/pickup/verify', data),
        getList: (params) => this.get('/kuaidi077/pickup/list/get', params),
        deleteCode: (params) => this.post('/kuaidi077/pickup/code/delete', null, params)
    };

    proxy = {
        create: (data) => this.post('/kuaidi077/proxy/create', data),
        getDetail: (params) => this.get('/kuaidi077/proxy/detail/get', params),
        getMyRequests: (params) => this.get('/kuaidi077/proxy/my/request/get', params),
        getMyProxies: (params) => this.get('/kuaidi077/proxy/my/proxy/get', params),
        getPending: (params) => this.get('/kuaidi077/proxy/pending/get', params),
        accept: (params) => this.post('/kuaidi077/proxy/accept', null, params),
        complete: (params) => this.post('/kuaidi077/proxy/complete', null, params),
        cancel: (params) => this.post('/kuaidi077/proxy/cancel', null, params),
        getList: (params) => this.get('/kuaidi077/proxy/list/get', params),
        delete: (params) => this.post('/kuaidi077/proxy/delete', null, params)
    };

    message = {
        getDetail: (params) => this.get('/kuaidi077/message/detail/get', params),
        getMyMessages: (params) => this.get('/kuaidi077/message/my/get', params),
        getUnreadCount: () => this.get('/kuaidi077/message/unread/count/get'),
        markAsRead: (params) => this.post('/kuaidi077/message/read', null, params),
        markAllAsRead: () => this.post('/kuaidi077/message/read/all'),
        delete: (params) => this.post('/kuaidi077/message/delete', null, params),
        getList: (params) => this.get('/kuaidi077/message/list/get', params),
        send: (data) => this.post('/kuaidi077/message/send', data)
    };
}

const api = new ApiClient();
