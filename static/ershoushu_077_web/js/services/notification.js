const NotificationService = {
    async getList(params = {}) { return await ApiService.get('/ershoushu/notification/list/get', params); },
    async getUnreadCount() { return await ApiService.get('/ershoushu/notification/unread/count/get'); },
    async markAsRead(notificationId) { return await ApiService.post('/ershoushu/notification/read?notification_id=' + notificationId, {}); },
    async markAllAsRead() { return await ApiService.post('/ershoushu/notification/read/all', {}); }
};
