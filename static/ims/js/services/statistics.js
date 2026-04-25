const StatisticsService = {
    async getToday() {
        return API.get('/ims/statistics/today/get');
    },
    
    async getDashboard() {
        return API.get('/ims/statistics/dashboard/get');
    },
    
    async getRange(startDate, endDate) {
        return API.get('/ims/statistics/range/get', {
            start_date: startDate,
            end_date: endDate
        });
    },
    
    async getTrendChart(startDate, endDate) {
        return API.get('/ims/statistics/trend/get', {
            start_date: startDate,
            end_date: endDate
        });
    },
    
    async getPurchaseVarietyChart(startDate = null, endDate = null) {
        const params = {};
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        return API.get('/ims/statistics/purchase_variety/get', params);
    },
    
    async getSaleVarietyChart(startDate = null, endDate = null) {
        const params = {};
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        return API.get('/ims/statistics/sale_variety/get', params);
    },
    
    async getInventoryDistributionChart() {
        return API.get('/ims/statistics/inventory_distribution/get');
    }
};
