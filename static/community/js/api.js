const API_BASE = '/api';

class CommunityApi {
  constructor() {
    this.userId = Number(localStorage.getItem('community_user_id') || 0);
    this.userInfo = JSON.parse(localStorage.getItem('community_user_info') || 'null');
  }

  setUser(user) {
    this.userId = user.id;
    this.userInfo = user;
    localStorage.setItem('community_user_id', user.id);
    localStorage.setItem('community_user_info', JSON.stringify(user));
  }

  logout() {
    this.userId = 0;
    this.userInfo = null;
    localStorage.removeItem('community_user_id');
    localStorage.removeItem('community_user_info');
  }

  isLoggedIn() {
    return !!this.userId;
  }

  async request(method, path, params = {}, body = null) {
    let url = API_BASE + path;
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    const qs = query.toString();
    if (qs) url += '?' + qs;

    const opts = { method, headers: {} };
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify({ ...body, user_id: this.userId || undefined });
    }
    try {
      const res = await fetch(url, opts);
      return await res.json();
    } catch (e) {
      return { code: -1, message: '网络错误: ' + e.message, data: null };
    }
  }

  login(username, password) {
    return this.request('POST', '/auth/login', {}, { username, password });
  }

  publishItem(data) {
    return this.request('POST', '/community/item/publish', {}, data);
  }

  getItemList(params) {
    return this.request('GET', '/community/item/list/get', params);
  }

  getItemDetail(itemId) {
    return this.request('GET', '/community/item/detail/get', { item_id: itemId });
  }

  updateItem(itemId, data) {
    return this.request('PUT', '/community/item/update', { item_id: itemId }, data);
  }

  deleteItem(itemId) {
    return this.request('DELETE', '/community/item/delete', { item_id: itemId });
  }

  submitBorrowRequest(data) {
    return this.request('POST', '/community/borrow/request/submit', {}, data);
  }

  getMyBorrowRequests(status) {
    return this.request('GET', '/community/borrow/request/my/get', { status, user_id: this.userId });
  }

  getReceivedBorrowRequests(status) {
    return this.request('GET', '/community/borrow/request/received/get', { status, user_id: this.userId });
  }

  approveRequest(requestId) {
    return this.request('POST', '/community/borrow/request/approve', { request_id: requestId }, {});
  }

  rejectRequest(requestId, reason) {
    return this.request('POST', '/community/borrow/request/reject', { request_id: requestId }, { reason });
  }

  cancelRequest(requestId) {
    return this.request('POST', '/community/borrow/request/cancel', { request_id: requestId }, {});
  }

  markBorrowed(recordId) {
    return this.request('POST', '/community/borrow/record/mark/borrowed', { record_id: recordId }, {});
  }

  markReturned(recordId) {
    return this.request('POST', '/community/borrow/record/mark/returned', { record_id: recordId }, {});
  }

  getMyBorrowRecords(status) {
    return this.request('GET', '/community/borrow/record/my/get', { status, user_id: this.userId });
  }

  getMyLentRecords(status) {
    return this.request('GET', '/community/borrow/record/lent/get', { status, user_id: this.userId });
  }

  submitReview(data) {
    return this.request('POST', '/community/review/submit', {}, data);
  }

  getUserCredit(userId) {
    return this.request('GET', '/community/user/credit/get', { user_id: userId });
  }

  getMyOverdue() {
    return this.request('GET', '/community/overdue/my/get', { user_id: this.userId });
  }

  getContact(recordId) {
    return this.request('GET', '/community/contact/get', { record_id: recordId, user_id: this.userId });
  }
}

const api = new CommunityApi();
