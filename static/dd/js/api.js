const API_BASE = '/api/dd';

const Api = {
    async request(url, options = {}) {
        const token = Auth.getToken();
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

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(API_BASE + url, config);
            const data = await response.json();

            if (data.code !== 0 && data.code !== 200) {
                if (data.code === 1 && (data.msg === '请先登录' || data.msg.includes('登录'))) {
                    Auth.logout();
                    Router.navigate('login');
                }
                throw new Error(data.msg || '请求失败');
            }

            return data;
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('网络连接失败，请检查网络');
            }
            throw error;
        }
    },

    get(url, params = {}) {
        const queryString = Utils.buildQueryString(params);
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'GET' });
    },

    post(url, data = {}) {
        return this.request(url, { method: 'POST', body: data });
    },

    put(url, data = {}) {
        return this.request(url, { method: 'PUT', body: data });
    },

    delete(url, data = {}) {
        return this.request(url, { method: 'DELETE', body: data });
    },

    user: {
        register(phone, password) {
            return Api.post('/user/register', { phone, password });
        },

        login(phone, password) {
            return Api.post('/user/login', { phone, password });
        },

        logout() {
            return Api.post('/user/logout');
        },

        getCurrent() {
            return Api.get('/user/current/get');
        },

        verifyRealName(realName, idCard) {
            return Api.post('/user/verify', { real_name: realName, id_card: idCard });
        },

        updateProfile(data) {
            return Api.post('/user/profile/update', data);
        },

        updateContact(data) {
            return Api.post('/user/contact/update', data);
        },

        changePassword(oldPassword, newPassword) {
            return Api.post('/user/password/change', {
                old_password: oldPassword,
                new_password: newPassword
            });
        },

        getDetail(userId) {
            return Api.get('/user/detail/get', { user_id: userId });
        },

        getList(page = 1, pageSize = 10) {
            return Api.get('/user/list/get', { page, page_size: pageSize });
        }
    },

    task: {
        publish(data) {
            return Api.post('/task/publish', data);
        },

        getDetail(taskId) {
            return Api.get('/task/detail/get', { task_id: taskId });
        },

        getList(params = {}) {
            const { page = 1, pageSize = 10, category, keyword } = params;
            return Api.get('/task/list/get', {
                page,
                page_size: pageSize,
                category,
                keyword
            });
        },

        getMyPublished(params = {}) {
            const { page = 1, pageSize = 10, status } = params;
            return Api.get('/task/my/published/get', {
                page,
                page_size: pageSize,
                status
            });
        },

        getMyReceived(params = {}) {
            const { page = 1, pageSize = 10, status } = params;
            return Api.get('/task/my/received/get', {
                page,
                page_size: pageSize,
                status
            });
        },

        update(taskId, data) {
            const queryString = Utils.buildQueryString({ task_id: taskId });
            return Api.post(`/task/update?${queryString}`, data);
        },

        cancel(taskId) {
            const queryString = Utils.buildQueryString({ task_id: taskId });
            return Api.post(`/task/cancel?${queryString}`);
        },

        getCategories() {
            return Api.get('/task/categories/get');
        },

        getStatuses() {
            return Api.get('/task/statuses/get');
        }
    },

    claim: {
        claim(taskId) {
            const queryString = Utils.buildQueryString({ task_id: taskId });
            return Api.post(`/claim?${queryString}`);
        },

        cancel(taskId) {
            const queryString = Utils.buildQueryString({ task_id: taskId });
            return Api.post(`/claim/cancel?${queryString}`);
        },

        getMyList(params = {}) {
            const { page = 1, pageSize = 10, isCancelled } = params;
            return Api.get('/claim/my/list/get', {
                page,
                page_size: pageSize,
                is_cancelled: isCancelled
            });
        },

        getStatus(taskId) {
            return Api.get('/claim/status/get', { task_id: taskId });
        }
    },

    contact: {
        get(taskId) {
            return Api.get('/contact/get', { task_id: taskId });
        },

        getParticipants(taskId) {
            return Api.get('/contact/participants/get', { task_id: taskId });
        }
    },

    review: {
        markComplete(taskId) {
            const queryString = Utils.buildQueryString({ task_id: taskId });
            return Api.post(`/review/mark/complete?${queryString}`);
        },

        confirmComplete(taskId) {
            const queryString = Utils.buildQueryString({ task_id: taskId });
            return Api.post(`/review/confirm/complete?${queryString}`);
        },

        submit(taskId, rating, content = '') {
            return Api.post('/review/submit', {
                task_id: taskId,
                rating,
                content
            });
        },

        getTaskList(taskId) {
            return Api.get('/review/task/list/get', { task_id: taskId });
        },

        getUserList(userId, page = 1, pageSize = 10) {
            return Api.get('/review/user/list/get', {
                user_id: userId,
                page,
                page_size: pageSize
            });
        },

        getStatus(taskId) {
            return Api.get('/review/status/get', { task_id: taskId });
        }
    },

    report: {
        submit(reportedId, reason, taskId = null) {
            return Api.post('/report/submit', {
                reported_id: reportedId,
                reason,
                task_id: taskId
            });
        },

        getMyList(page = 1, pageSize = 10) {
            return Api.get('/report/my/list/get', {
                page,
                page_size: pageSize
            });
        },

        getDetail(reportId) {
            return Api.get('/report/detail/get', { report_id: reportId });
        },

        getPendingList(page = 1, pageSize = 10) {
            return Api.get('/report/pending/list/get', {
                page,
                page_size: pageSize
            });
        },

        handle(reportId, result, creditAdjust = 0) {
            return Api.post('/report/handle', {
                report_id: reportId,
                result,
                credit_adjust: creditAdjust
            });
        }
    }
};

window.Api = Api;
