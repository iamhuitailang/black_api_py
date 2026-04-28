const MarketService = {
    async getList(page = 1, pageSize = 10, status = null, keyword = null) {
        const params = { page, page_size: pageSize };
        if (status !== null) params.status = status;
        if (keyword) params.keyword = keyword;
        return ApiService.get('/dj/market/list', params);
    },
    
    async getDetail(marketId) {
        return ApiService.get('/dj/market/detail', { market_id: marketId });
    },
    
    async getByDate(date) {
        return ApiService.get('/dj/market/by/date', { date });
    },
    
    async getToday() {
        return ApiService.get('/dj/market/today');
    },
    
    async getTomorrow() {
        return ApiService.get('/dj/market/tomorrow');
    },
    
    async getNearby(lat = null, lng = null, radius = 5000) {
        const params = { radius };
        if (lat !== null) params.lat = lat;
        if (lng !== null) params.lng = lng;
        return ApiService.get('/dj/market/nearby', params);
    },
    
    async getStatistics() {
        return ApiService.get('/dj/market/statistics');
    }
};
