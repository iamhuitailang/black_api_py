const BookService = {
    async getList(params = {}) { return await ApiService.get('/ershoushu/book/list/get', params); },
    async getDetail(bookId) { return await ApiService.get('/ershoushu/book/detail/get', { book_id: bookId }); },
    async getMyBooks(params = {}) { return await ApiService.get('/ershoushu/book/my/list/get', params); },
    async create(data) { return await ApiService.post('/ershoushu/book/create', data); },
    async update(bookId, data) { return await ApiService.post('/ershoushu/book/update?book_id=' + bookId, data); },
    async delete(bookId) { return await ApiService.post('/ershoushu/book/delete?book_id=' + bookId, {}); },
    async getCategories() { return await ApiService.get('/ershoushu/book/categories/get'); },
    async getConditions() { return await ApiService.get('/ershoushu/book/conditions/get'); },
    async getStatistics() { return await ApiService.get('/ershoushu/book/statistics/get'); },
    async getAdminList(params = {}) { return await ApiService.get('/ershoushu/book/admin/list/get', params); },
    async checkBook(bookId, isChecked) { return await ApiService.post('/ershoushu/book/check?book_id=' + bookId + '&is_checked=' + isChecked, {}); }
};
