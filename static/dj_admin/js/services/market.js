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
    
    async create(data) {
        return ApiService.post('/dj/market/create', data);
    },
    
    async update(marketId, data) {
        return ApiService.post('/dj/market/update', { ...data, market_id: marketId });
    },
    
    async updateStatus(marketId, status) {
        return ApiService.post('/dj/market/status/update', { market_id: marketId, status });
    },
    
    async delete(marketId) {
        return ApiService.post('/dj/market/delete', { market_id: marketId });
    },
    
    async getStatistics() {
        return ApiService.get('/dj/market/statistics');
    }
};
