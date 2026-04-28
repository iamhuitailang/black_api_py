const BoothService = {
    async getList(page = 1, pageSize = 10, marketId = null, category = null) {
        const params = { page, page_size: pageSize };
        if (marketId !== null) params.market_id = marketId;
        if (category) params.category = category;
        return ApiService.get('/dj/booth/list', params);
    },
    
    async getDetail(boothId) {
        return ApiService.get('/dj/booth/detail', { booth_id: boothId });
    },
    
    async getByMarket(marketId, page = 1, pageSize = 20) {
        return ApiService.get('/dj/booth/by/market', { 
            market_id: marketId, 
            page, 
            page_size: pageSize 
        });
    },
    
    async getByCategory(category, page = 1, pageSize = 20) {
        return ApiService.get('/dj/booth/by/category', { 
            category, 
            page, 
            page_size: pageSize 
        });
    },
    
    async applyForVendor(data) {
        return ApiService.post('/dj/booth/apply', data);
    },
    
    async getMyBooth() {
        return ApiService.get('/dj/booth/my');
    },
    
    async updateMyBooth(data) {
        return ApiService.post('/dj/booth/my/update', data);
    },
    
    async getStatistics() {
        return ApiService.get('/dj/booth/statistics');
    }
};
