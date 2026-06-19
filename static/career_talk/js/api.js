const API_BASE_URL = '/api';

const CareerTalkApi = {
    async request(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

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

    getTalkList(page = 1, pageSize = 10, keyword = '') {
        return this.get('/career/talk/list/get', { page, page_size: pageSize, keyword });
    },

    getTalkDetail(id) {
        return this.get('/career/talk/detail/get', { id });
    },

    getTalkByShortCode(shortCode) {
        return this.get('/career/talk/detail/by/code/get', { short_code: shortCode });
    },

    createTalk(data) {
        return this.post('/career/talk/create', data);
    },

    updateTalk(data) {
        return this.post('/career/talk/update', data);
    },

    deleteTalk(id) {
        return this.delete('/career/talk/delete', { id });
    },

    register(data) {
        return this.post('/career/talk/register', data);
    },

    checkRegistrationStatus(talkId, studentId) {
        return this.get('/career/talk/registration/status/get', { talk_id: talkId, student_id: studentId });
    },

    getMyRegistrations(studentId) {
        return this.get('/career/talk/my/registrations/get', { student_id: studentId });
    },

    checkinByStudentId(data) {
        return this.post('/career/talk/checkin/by/student/id', data);
    },

    checkinByShortCode(data) {
        return this.post('/career/talk/checkin/by/code', data);
    },

    getCheckinStats(talkId) {
        return this.get('/career/talk/checkin/stats/get', { talk_id: talkId });
    },

    submitFeedback(data) {
        return this.post('/career/talk/feedback/submit', data);
    },

    getFeedbackStats(talkId) {
        return this.get('/career/talk/feedback/stats/get', { talk_id: talkId });
    },

    getFeedbackStatus(talkId, studentId) {
        return this.get('/career/talk/feedback/status/get', { talk_id: talkId, student_id: studentId });
    }
};

const Toast = {
    show(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer') || this.createContainer();
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span style="font-size: 18px;">${icons[type]}</span>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    createContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    },

    success(message) {
        this.show(message, 'success');
    },

    error(message) {
        this.show(message, 'error');
    },

    warning(message) {
        this.show(message, 'warning');
    },

    info(message) {
        this.show(message, 'info');
    }
};
