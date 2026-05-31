const CheckinService = {
    async checkin(bookingId) {
        return await ApiService.post('/jianshen/checkin/create', { booking_id: bookingId });
    },

    async adminCheckin(userId, courseId) {
        return await ApiService.post('/jianshen/checkin/admin/create', { user_id: userId, course_id: courseId });
    },

    async getMyList(params = {}) {
        return await ApiService.get('/jianshen/checkin/my/list/get', params);
    },

    async getAllList(params = {}) {
        return await ApiService.get('/jianshen/checkin/all/list/get', params);
    },

    async updateStatus(checkinId, status) {
        return await ApiService.post('/jianshen/checkin/status/update', { checkin_id: checkinId, status });
    }
};

window.CheckinService = CheckinService;
