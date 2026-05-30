const AuthService = {
  async login(phone, password) {
    const result = await Api.post('/auth/login', { phone, password });
    if (result.code === 0 && result.data) {
      Storage.setToken(result.data.token);
      Storage.setUser(result.data.user);
    }
    return result;
  },

  async register(phone, password, nickname = '') {
    const result = await Api.post('/auth/register', { phone, password, nickname });
    if (result.code === 0 && result.data) {
      Storage.setToken(result.data.token);
      Storage.setUser(result.data.user);
    }
    return result;
  },

  async logout() {
    const result = await Api.post('/auth/logout');
    Storage.clear();
    return result;
  },

  async getCurrentUser() {
    return await Api.get('/auth/current/get');
  },

  async updateProfile(data) {
    return await Api.post('/auth/profile/update', data);
  },

  async changePassword(old_password, new_password) {
    return await Api.post('/auth/password/change', { old_password, new_password });
  },

  async getUserList(params = {}) {
    return await Api.get('/auth/user/list/get', params);
  },

  async updateUserStatus(user_id, status) {
    return await Api.post('/auth/user/status/update', { user_id, status });
  }
};

window.AuthService = AuthService;
