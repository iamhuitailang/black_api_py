const NotificationService = {
    async getMyList(params = {}) {
        return await ApiService.get('/jianshen/notification/my/list/get', params);
    },

    async getUnreadList(params = {}) {
        return await ApiService.get('/jianshen/notification/unread/list/get', params);
    },

    async getUnreadCount() {
        return await ApiService.get('/jianshen/notification/unread/count/get');
    },

    async markAsRead(notificationId) {
        return await ApiService.post('/jianshen/notification/read', { notification_id: notificationId });
    },

    async markAllAsRead() {
        return await ApiService.post('/jianshen/notification/read/all');
    },

    async sendCourseReminder(courseId) {
        return await ApiService.post('/jianshen/notification/course/reminder', { course_id: courseId });
    },

    async deleteNotification(notificationId) {
        return await ApiService.post('/jianshen/notification/delete', { notification_id: notificationId });
    }
};

window.NotificationService = NotificationService;
