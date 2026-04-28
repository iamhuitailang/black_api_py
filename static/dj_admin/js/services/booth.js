const BoothService = {
    async getList(page = 1, pageSize = 10, marketId = null, status = null, applyStatus = null) {
        const params = { page, page_size: pageSize };
        if (marketId !== null) params.market_id = marketId;
        if (status !== null) params.status = status;
        if (applyStatus !== null) params.apply_status = applyStatus;
        return ApiService.get('/dj/booth/list', params);
    },
    
    async getDetail(boothId) {
        return ApiService.get('/dj/booth/detail', { booth_id: boothId });
    },
    
    async getPending() {
        return ApiService.get('/dj/booth/pending');
    },
    
    async verify(boothId, isVerified) {
        return ApiService.post('/dj/booth/verify', { booth_id: boothId, is_verified: isVerified });
    },
    
    async updateStatus(boothId, status) {
        return ApiService.post('/dj/booth/status/update', { booth_id: boothId, status });
    },
    
    async delete(boothId) {
        return ApiService.post('/dj/booth/delete', { booth_id: boothId });
    },
    
    async getStatistics() {
        return ApiService.get('/dj/booth/statistics');
    }
};
