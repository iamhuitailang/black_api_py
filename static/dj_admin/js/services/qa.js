const QAService = {
    async getList(page = 1, pageSize = 10, status = null, isAnswered = null) {
        const params = { page, page_size: pageSize };
        if (status !== null) params.status = status;
        if (isAnswered !== null) params.is_answered = isAnswered;
        return ApiService.get('/dj/qa/list', params);
    },
    
    async getDetail(qaId) {
        return ApiService.get('/dj/qa/detail', { qa_id: qaId });
    },
    
    async updateStatus(qaId, status) {
        return ApiService.post('/dj/qa/status/update', { qa_id: qaId, status });
    },
    
    async delete(qaId) {
        return ApiService.post('/dj/qa/delete', { qa_id: qaId });
    },
    
    async getStatistics() {
        return ApiService.get('/dj/qa/statistics');
    }
};
