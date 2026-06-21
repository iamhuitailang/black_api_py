const API = {
    base: '/api',

    async get(url, params = {}) {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${this.base}${url}${query ? '?' + query : ''}`);
        return await res.json();
    },

    async post(url, body = {}) {
        const res = await fetch(`${this.base}${url}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return await res.json();
    },

    venue: {
        list: () => API.get('/campus/venue/getlist')
    },
    student: {
        list: (params) => API.get('/campus/student/getlist', params),
        get: (student_no) => API.get('/campus/student/get', { student_no })
    },
    organizer: {
        list: () => API.get('/campus/organizer/getlist')
    },
    activity: {
        get: (id) => API.get('/campus/activity/get', { id }),
        list: (params) => API.get('/campus/activity/getlist', params),
        create: (data) => API.post('/campus/activity/set', data),
        approve: (data) => API.post('/campus/activity/approve', data),
        cancel: (data) => API.post('/campus/activity/cancel', data),
        complete: (id) => API.get('/campus/activity/complete', { id })
    },
    calendar: {
        get: (params) => API.get('/campus/calendar/get', params)
    },
    conflict: {
        check: (params) => API.get('/campus/conflict/check', params)
    },
    registration: {
        set: (data) => API.post('/campus/registration/set', data),
        list: (params) => API.get('/campus/registration/getlist', params),
        count: (activity_id) => API.get('/campus/registration/count', { activity_id })
    },
    checkin: {
        set: (data) => API.post('/campus/checkin/set', data),
        list: (activity_id) => API.get('/campus/checkin/getlist', { activity_id }),
        stats: (activity_id) => API.get('/campus/checkin/getstats', { activity_id }),
        markAbsent: (activity_id) => API.get('/campus/checkin/markabsent', { activity_id })
    },
    summary: {
        set: (data) => API.post('/campus/summary/set', data),
        get: (activity_id) => API.get('/campus/summary/get', { activity_id })
    },
    stats: {
        overview: (semester) => API.get('/campus/stats/overview', semester ? { semester } : {}),
        byType: (semester) => API.get('/campus/stats/bytype', semester ? { semester } : {}),
        byDept: (semester) => API.get('/campus/stats/bydepartment', semester ? { semester } : {}),
        bySemester: () => API.get('/campus/stats/bysemester')
    }
};
