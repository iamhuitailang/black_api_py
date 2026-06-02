var GameStorage = {
  TOKEN_KEY: 'dafeiji_token',
  USER_KEY: 'dafeiji_user',
  GAME_STATE_KEY: 'dafeiji_game_state',

  setToken: function(token) {
    localStorage.setItem(this.TOKEN_KEY, token);
  },

  getToken: function() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  removeToken: function() {
    localStorage.removeItem(this.TOKEN_KEY);
  },

  setUser: function(user) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },

  getUser: function() {
    var data = localStorage.getItem(this.USER_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  },

  removeUser: function() {
    localStorage.removeItem(this.USER_KEY);
  },

  setGameState: function(state) {
    localStorage.setItem(this.GAME_STATE_KEY, JSON.stringify(state));
  },

  getGameState: function() {
    var data = localStorage.getItem(this.GAME_STATE_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  },

  removeGameState: function() {
    localStorage.removeItem(this.GAME_STATE_KEY);
  },

  clearAll: function() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.GAME_STATE_KEY);
  }
};
