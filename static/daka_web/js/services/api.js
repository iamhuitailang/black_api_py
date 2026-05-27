const API_BASE = '/api';

const Api = {
    async request(url, options = {}) {
        const token = Storage.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}${url}`, {
            ...options,
            headers
        });

        const result = await response.json();
        
        if (result.code === 1 && result.msg && result.msg.includes('登录')) {
            Storage.clear();
            window.location.reload();
        }
        
        return result;
    },

    get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, {
            method: 'GET'
        });
    },

    post(url, data = {}) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    user: {
        register(phone, password, nickname = '') {
            return Api.post('/daka/user/register', { phone, password, nickname });
        },
        login(phone, password) {
            return Api.post('/daka/user/login', { phone, password });
        },
        logout() {
            return Api.post('/daka/user/logout');
        },
        getCurrent() {
            return Api.get('/daka/user/current/get');
        },
        updateProfile(data) {
            return Api.post('/daka/user/profile/update', data);
        },
        changePassword(oldPassword, newPassword) {
            return Api.post('/daka/user/password/change', { old_password: oldPassword, new_password: newPassword });
        }
    },

    task: {
        getList() {
            return Api.get('/daka/task/list/get');
        },
        getListByType(type) {
            return Api.get('/daka/task/type/list/get', { task_type: type });
        },
        getDetail(taskId) {
            return Api.get('/daka/task/detail/get', { task_id: taskId });
        },
        create(data) {
            return Api.post('/daka/task/create', data);
        },
        update(taskId, data) {
            return Api.post(`/daka/task/update?task_id=${taskId}`, data);
        },
        delete(taskId) {
            return Api.post(`/daka/task/delete?task_id=${taskId}`);
        },
        getTypes() {
            return Api.get('/daka/task/types/get');
        }
    },

    record: {
        getToday() {
            return Api.get('/daka/record/today/get');
        },
        checkin(taskId, currentValue = null, note = '') {
            const data = { task_id: taskId };
            if (currentValue !== null) {
                data.current_value = currentValue;
            }
            if (note) {
                data.note = note;
            }
            return Api.post('/daka/record/checkin', data);
        },
        getHistory(page = 1, pageSize = 20) {
            return Api.get('/daka/record/history/get', { page, page_size: pageSize });
        },
        getHeatmap(months = 6) {
            return Api.get('/daka/record/heatmap/get', { months });
        },
        getCalendar(year, month) {
            return Api.get('/daka/record/calendar/get', { year, month });
        },
        getStatistics() {
            return Api.get('/daka/record/statistics/get');
        },
        delete(recordId) {
            return Api.post(`/daka/record/delete?record_id=${recordId}`);
        }
    },

    achievement: {
        getList() {
            return Api.get('/daka/achievement/list/get');
        },
        getUserList() {
            return Api.get('/daka/achievement/user/list/get');
        },
        getListByCategory(category) {
            return Api.get('/daka/achievement/category/list/get', { category });
        },
        getDetail(achievementId) {
            return Api.get('/daka/achievement/detail/get', { achievement_id: achievementId });
        },
        checkNew() {
            return Api.get('/daka/achievement/check/get');
        },
        getCategories() {
            return Api.get('/daka/achievement/categories/get');
        }
    },

    reminder: {
        getList() {
            return Api.get('/daka/reminder/list/get');
        },
        getDetail(reminderId) {
            return Api.get('/daka/reminder/detail/get', { reminder_id: reminderId });
        },
        create(data) {
            return Api.post('/daka/reminder/create', data);
        },
        update(reminderId, data) {
            return Api.post(`/daka/reminder/update?reminder_id=${reminderId}`, data);
        },
        toggle(reminderId) {
            return Api.post(`/daka/reminder/toggle?reminder_id=${reminderId}`);
        },
        delete(reminderId) {
            return Api.post(`/daka/reminder/delete?reminder_id=${reminderId}`);
        },
        getRepeatTypes() {
            return Api.get('/daka/reminder/repeat/types/get');
        }
    }
};

window.Api = Api;
