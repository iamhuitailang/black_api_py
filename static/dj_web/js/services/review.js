const ReviewService = {
    async getList(page = 1, pageSize = 10, marketId = null, boothId = null) {
        const params = { page, page_size: pageSize };
        if (marketId !== null) params.market_id = marketId;
        if (boothId !== null) params.booth_id = boothId;
        return ApiService.get('/dj/review/list', params);
    },
    
    async getDetail(reviewId) {
        return ApiService.get('/dj/review/detail', { review_id: reviewId });
    },
    
    async create(data) {
        return ApiService.post('/dj/review/create', data);
    },
    
    async getMyList(page = 1, pageSize = 20) {
        return ApiService.get('/dj/review/my/list', { page, page_size: pageSize });
    }
};
