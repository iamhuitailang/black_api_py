const Auth = {
  setToken(token) {
    localStorage.setItem('xiangqi_token', token);
  },
  getToken() {
    return localStorage.getItem('xiangqi_token');
  },
  removeToken() {
    localStorage.removeItem('xiangqi_token');
  },
  setUser(user) {
    localStorage.setItem('xiangqi_user', JSON.stringify(user));
  },
  getUser() {
    const data = localStorage.getItem('xiangqi_user');
    return data ? JSON.parse(data) : null;
  },
  removeUser() {
    localStorage.removeItem('xiangqi_user');
  },
  isAuthenticated() {
    return !!this.getToken();
  },
  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'admin';
  },

  setAdminToken(token) {
    localStorage.setItem('xiangqi_admin_token', token);
  },
  getAdminToken() {
    return localStorage.getItem('xiangqi_admin_token');
  },
  removeAdminToken() {
    localStorage.removeItem('xiangqi_admin_token');
  },
  setAdmin(admin) {
    localStorage.setItem('xiangqi_admin', JSON.stringify(admin));
  },
  getAdmin() {
    const data = localStorage.getItem('xiangqi_admin');
    return data ? JSON.parse(data) : null;
  },
  isAdminAuthenticated() {
    return !!this.getAdminToken();
  }
};

window.XiangqiAuth = Auth;
