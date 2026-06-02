var Router = {
  routes: {
    'login': { auth: false, admin: false },
    'register': { auth: false, admin: false },
    'game': { auth: true, admin: false },
    'leaderboard': { auth: true, admin: false },
    'achievement': { auth: true, admin: false },
    'profile': { auth: true, admin: false },
    'admin-dashboard': { auth: true, admin: true },
    'admin-users': { auth: true, admin: true },
    'admin-aircraft': { auth: true, admin: true },
    'admin-waves': { auth: true, admin: true },
    'admin-items': { auth: true, admin: true },
    'admin-achievements': { auth: true, admin: true }
  },

  _callback: null,

  init: function() {
    var self = this;
    window.addEventListener('hashchange', function() {
      if (self._callback) {
        self._callback(self.getCurrentPage());
      }
    });
  },

  navigate: function(page) {
    if (!this.routes[page]) {
      page = 'login';
    }
    window.location.hash = '#' + page;
  },

  getCurrentPage: function() {
    var hash = window.location.hash.replace('#', '');
    if (!hash || !this.routes[hash]) {
      var token = GameStorage.getToken();
      hash = token ? 'game' : 'login';
    }
    var route = this.routes[hash];
    if (route.auth && !GameStorage.getToken()) {
      return 'login';
    }
    if (route.admin) {
      var user = GameStorage.getUser();
      if (!user || user.role !== 'admin') {
        return 'game';
      }
    }
    return hash;
  },

  onRouteChange: function(callback) {
    this._callback = callback;
  },

  getDefaultPage: function() {
    var token = GameStorage.getToken();
    return token ? 'game' : 'login';
  }
};

Router.init();
