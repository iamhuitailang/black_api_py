const API_BASE = '/api/jiudian077';

const ApiService = {
  async request(url, options = {}) {
    const token = TokenStorage.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers
      });
      
      const result = await response.json();
      
      if (result.code === 1 && result.msg === '请先登录') {
        TokenStorage.clear();
        Router.navigate('/login');
        return result;
      }
      
      return result;
    } catch (error) {
      console.error('API Error:', error);
      return {
        code: 1,
        msg: '网络错误，请稍后重试',
        data: null
      };
    }
  },

  get(url, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    return this.request(fullUrl, { method: 'GET' });
  },

  post(url, data = {}) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

const UserApi = {
  register(data) {
    return ApiService.post('/user/register', data);
  },
  login(data) {
    return ApiService.post('/user/login', data);
  },
  logout() {
    return ApiService.post('/user/logout');
  },
  getCurrent() {
    return ApiService.get('/user/current/get');
  },
  updateProfile(data) {
    return ApiService.post('/user/profile/update', data);
  },
  changePassword(data) {
    return ApiService.post('/user/password/change', data);
  }
};

const RoomApi = {
  getList(params) {
    return ApiService.get('/room/list/get', params);
  },
  getAvailable(params) {
    return ApiService.get('/room/available/get', params);
  },
  getDetail(roomId) {
    return ApiService.get('/room/detail/get', { room_id: roomId });
  },
  getTypes() {
    return ApiService.get('/room/types/get');
  },
  create(data) {
    return ApiService.post('/room/create', data);
  },
  update(roomId, data) {
    return ApiService.post(`/room/update?room_id=${roomId}`, data);
  },
  updateStatus(roomId, status) {
    return ApiService.post(`/room/status/update?room_id=${roomId}&status=${status}`);
  },
  delete(roomId) {
    return ApiService.post(`/room/delete?room_id=${roomId}`);
  }
};

const BookingApi = {
  create(data) {
    return ApiService.post('/booking/create', data);
  },
  cancel(bookingId) {
    return ApiService.post(`/booking/cancel?booking_id=${bookingId}`);
  },
  getMy(params) {
    return ApiService.get('/booking/my/get', params);
  },
  getList(params) {
    return ApiService.get('/booking/list/get', params);
  },
  getDetail(bookingId) {
    return ApiService.get('/booking/detail/get', { booking_id: bookingId });
  },
  confirm(bookingId) {
    return ApiService.post(`/booking/confirm?booking_id=${bookingId}`);
  },
  checkIn(bookingId) {
    return ApiService.post(`/booking/check/in?booking_id=${bookingId}`);
  },
  checkOut(bookingId) {
    return ApiService.post(`/booking/check/out?booking_id=${bookingId}`);
  },
  getStatusList() {
    return ApiService.get('/booking/status/list/get');
  },
  delete(bookingId) {
    return ApiService.post(`/booking/delete?booking_id=${bookingId}`);
  }
};

const MessageApi = {
  getMy(params) {
    return ApiService.get('/message/my/get', params);
  },
  getDetail(messageId) {
    return ApiService.get('/message/detail/get', { message_id: messageId });
  },
  markAsRead(messageId) {
    return ApiService.post('/message/read', { message_id: messageId });
  },
  markAllAsRead() {
    return ApiService.post('/message/read/all');
  },
  getUnreadCount() {
    return ApiService.get('/message/unread/count/get');
  },
  delete(messageId) {
    return ApiService.post('/message/delete', { message_id: messageId });
  },
  send(data) {
    return ApiService.post('/message/send', data);
  },
  getList(params) {
    return ApiService.get('/message/list/get', params);
  },
  getTypes() {
    return ApiService.get('/message/types/get');
  }
};

const AdminApi = {
  getDashboard() {
    return ApiService.get('/admin/dashboard/get');
  },
  getBookingStats(params) {
    return ApiService.get('/admin/booking/stats/get', params);
  },
  getRoomStats() {
    return ApiService.get('/admin/room/stats/get');
  },
  getUserStats() {
    return ApiService.get('/admin/user/stats/get');
  },
  getUserList(params) {
    return ApiService.get('/admin/user/list/get', params);
  },
  updateUserStatus(userId, status) {
    return ApiService.post('/admin/user/status/update', { user_id: userId, status });
  }
};
