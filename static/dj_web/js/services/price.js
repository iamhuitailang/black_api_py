const PriceService = {
    async getList(page = 1, pageSize = 10, marketId = null, category = null) {
        const params = { page, page_size: pageSize, report_status: 1 };
        if (marketId !== null) params.market_id = marketId;
        if (category) params.category = category;
        return ApiService.get('/dj/price/list', params);
    },
    
    async getByMarket(marketId, page = 1, pageSize = 20) {
        return ApiService.get('/dj/price/by/market', { 
            market_id: marketId, 
            page, 
            page_size: pageSize 
        });
    },
    
    async getTrend(itemName, marketId = null, days = 30) {
        const params = { item_name: itemName, days };
        if (marketId !== null) params.market_id = marketId;
        return ApiService.get('/dj/price/trend', params);
    },
    
    async report(data) {
        return ApiService.post('/dj/price/report', data);
    },
    
    async getMyReports() {
        return ApiService.get('/dj/price/my/reports');
    },
    
    async getStatistics() {
        return ApiService.get('/dj/price/statistics');
    }
};
