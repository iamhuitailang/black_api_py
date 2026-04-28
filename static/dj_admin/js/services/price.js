const PriceService = {
    async getList(page = 1, pageSize = 10, marketId = null, reportStatus = null) {
        const params = { page, page_size: pageSize };
        if (marketId !== null) params.market_id = marketId;
        if (reportStatus !== null) params.report_status = reportStatus;
        return ApiService.get('/dj/price/list', params);
    },
    
    async getPending() {
        return ApiService.get('/dj/price/pending');
    },
    
    async audit(priceId, reportStatus) {
        return ApiService.post('/dj/price/audit', { price_id: priceId, report_status: reportStatus });
    },
    
    async getStatistics() {
        return ApiService.get('/dj/price/statistics');
    }
};
