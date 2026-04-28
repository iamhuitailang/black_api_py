const CheckinService = {
    async checkin(marketId) {
        return ApiService.post('/dj/checkin', { market_id: marketId });
    },
    
    async checkToday(marketId) {
        return ApiService.get(`/dj/checkin/today?market_id=${marketId}`);
    },
    
    async getList(limit = 20) {
        return ApiService.get(`/dj/checkin/list?limit=${limit}`);
    },
    
    async getStatistics() {
        return ApiService.get('/dj/checkin/statistics');
    }
};
