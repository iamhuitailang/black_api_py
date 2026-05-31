const TradeService = {
    async create(bookId) { return await ApiService.post('/ershoushu/trade/create', { book_id: bookId }); },
    async confirm(tradeId) { return await ApiService.post('/ershoushu/trade/confirm?trade_id=' + tradeId, {}); },
    async complete(tradeId) { return await ApiService.post('/ershoushu/trade/complete?trade_id=' + tradeId, {}); },
    async cancel(tradeId) { return await ApiService.post('/ershoushu/trade/cancel?trade_id=' + tradeId, {}); },
    async getDetail(tradeId) { return await ApiService.get('/ershoushu/trade/detail/get', { trade_id: tradeId }); },
    async getMyTrades(params = {}) { return await ApiService.get('/ershoushu/trade/my/list/get', params); },
    async getAdminList(params = {}) { return await ApiService.get('/ershoushu/trade/admin/list/get', params); },
    async getStatistics() { return await ApiService.get('/ershoushu/trade/statistics/get'); },
    async createReview(data) { return await ApiService.post('/ershoushu/trade/review', data); },
    async getTradeReviews(tradeId) { return await ApiService.get('/ershoushu/trade/reviews/get', { trade_id: tradeId }); }
};
