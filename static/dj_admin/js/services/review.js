const ReviewService = {
    async getList(page = 1, pageSize = 10, status = null) {
        const params = { page, page_size: pageSize };
        if (status !== null) params.status = status;
        return ApiService.get('/dj/review/list', params);
    },
    
    async getDetail(reviewId) {
        return ApiService.get('/dj/review/detail', { review_id: reviewId });
    },
    
    async updateStatus(reviewId, status) {
        return ApiService.post('/dj/review/status/update', { review_id: reviewId, status });
    },
    
    async delete(reviewId) {
        return ApiService.post('/dj/review/delete', { review_id: reviewId });
    },
    
    async getStatistics() {
        return ApiService.get('/dj/review/statistics');
    }
};
