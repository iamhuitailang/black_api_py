const UserService = {
    async getList(page = 1, pageSize = 10, status = null) {
        const params = { page, page_size: pageSize };
        if (status !== null) params.status = status;
        return ApiService.get('/dj/user/list', params);
    },
    
    async getDetail(userId) {
        return ApiService.get('/dj/user/detail', { user_id: userId });
    },
    
    async updateStatus(userId, status) {
        return ApiService.post('/dj/user/status/update', { user_id: userId, status });
    },
    
    async getStatistics() {
        return ApiService.get('/dj/user/statistics');
    }
};
