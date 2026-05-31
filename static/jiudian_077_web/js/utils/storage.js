const Storage = {
  get(key) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (e) {
      return localStorage.getItem(key);
    }
  },
  set(key, value) {
    localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
  },
  remove(key) {
    localStorage.removeItem(key);
  },
  clear() {
    localStorage.clear();
  }
};

const TokenStorage = {
  TOKEN_KEY: 'jiudian_077_token',
  USER_KEY: 'jiudian_077_user',

  getToken() {
    return Storage.get(this.TOKEN_KEY);
  },
  setToken(token) {
    Storage.set(this.TOKEN_KEY, token);
  },
  removeToken() {
    Storage.remove(this.TOKEN_KEY);
  },
  getUser() {
    return Storage.get(this.USER_KEY);
  },
  setUser(user) {
    Storage.set(this.USER_KEY, user);
  },
  removeUser() {
    Storage.remove(this.USER_KEY);
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
