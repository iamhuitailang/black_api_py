const Storage = {
  TOKEN_KEY: 'jieyong_token',
  USER_KEY: 'jieyong_user',

  setToken(token) {
    localStorage.setItem(this.TOKEN_KEY, token);
  },

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  removeToken() {
    localStorage.removeItem(this.TOKEN_KEY);
  },

  setUser(user) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },

  getUser() {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  removeUser() {
    localStorage.removeItem(this.USER_KEY);
  },

  clear() {
    this.removeToken();
    this.removeUser();
  },

  isLoggedIn() {
    return !!this.getToken() && !!this.getUser();
  },

  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'admin';
  }
};

window.Storage = Storage;
