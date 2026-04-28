const FavoriteService = {
    async toggle(marketId) {
        return ApiService.post('/dj/favorite/toggle', { market_id: marketId });
    },
    
    async getList(page = 1, pageSize = 20) {
        return ApiService.get('/dj/favorite/list', { page, page_size: pageSize });
    },
    
    async check(marketId) {
        return ApiService.get('/dj/favorite/check', { market_id: marketId });
    },
    
    async add(marketId) {
        return ApiService.post('/dj/favorite/add', { market_id: marketId });
    },
    
    async remove(marketId) {
        return ApiService.post('/dj/favorite/remove', { market_id: marketId });
    }
};

const CheckinService = {
    async checkin(marketId) {
        return ApiService.post('/dj/checkin/add', { market_id: marketId });
    },
    
    async getList(page = 1, pageSize = 20) {
        return ApiService.get('/dj/checkin/list', { page, page_size: pageSize });
    },
    
    async getStatistics() {
        return ApiService.get('/dj/checkin/statistics');
    },
    
    async checkToday(marketId) {
        return ApiService.get('/dj/checkin/today', { market_id: marketId });
    }
};
