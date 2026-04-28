const QAService = {
    async getList(page = 1, pageSize = 10, marketId = null, isAnswered = null) {
        const params = { page, page_size: pageSize };
        if (marketId !== null) params.market_id = marketId;
        if (isAnswered !== null) params.is_answered = isAnswered;
        return ApiService.get('/dj/qa/list', params);
    },
    
    async getDetail(qaId) {
        return ApiService.get('/dj/qa/detail', { qa_id: qaId });
    },
    
    async createQuestion(data) {
        return ApiService.post('/dj/qa/question/create', data);
    },
    
    async createAnswer(data) {
        return ApiService.post('/dj/qa/answer/create', data);
    },
    
    async getMyQuestions(page = 1, pageSize = 20) {
        return ApiService.get('/dj/qa/my/questions', { page, page_size: pageSize });
    },
    
    async getMyAnswers(page = 1, pageSize = 20) {
        return ApiService.get('/dj/qa/my/answers', { page, page_size: pageSize });
    }
};
