const BorrowService = {
  async borrow(data) {
    return await Api.post('/borrow/create', data);
  },

  async returnItem(borrow_id, fine_amount = 0) {
    return await Api.post('/borrow/return', { borrow_id, fine_amount });
  },

  async approve(borrow_id) {
    return await Api.post('/borrow/approve', { borrow_id });
  },

  async reject(borrow_id, reject_reason) {
    return await Api.post('/borrow/reject', { borrow_id, reject_reason });
  },

  async getDetail(borrow_id) {
    return await Api.get('/borrow/detail/get', { borrow_id });
  },

  async getMyBorrows(params = {}) {
    return await Api.get('/borrow/my/get', params);
  },

  async getList(params = {}) {
    return await Api.get('/borrow/list/get', params);
  },

  async getOverdueList(params = {}) {
    return await Api.get('/borrow/overdue/get', params);
  },

  async checkOverdue() {
    return await Api.post('/borrow/check/overdue');
  }
};

window.BorrowService = BorrowService;
