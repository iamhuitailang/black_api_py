const BookingService = {
    async create(courseId, remark = '') {
        return await ApiService.post('/jianshen/booking/create', {
            course_id: courseId,
            remark
        });
    },

    async cancel(bookingId) {
        return await ApiService.post('/jianshen/booking/cancel', { booking_id: bookingId });
    },

    async getMyList(params = {}) {
        return await ApiService.get('/jianshen/booking/my/list/get', params);
    },

    async getCourseBookings(courseId, params = {}) {
        return await ApiService.get('/jianshen/booking/course/list/get', { course_id: courseId, ...params });
    },

    async getAllList(params = {}) {
        return await ApiService.get('/jianshen/booking/all/list/get', params);
    },

    async updateStatus(bookingId, status) {
        return await ApiService.post('/jianshen/booking/status/update', { booking_id: bookingId, status });
    }
};

window.BookingService = BookingService;
