window.GameRouter = {
  routes: {
    lobby: 'LobbyPage',
    shop: 'ShopPage',
    dress: 'DressPage',
    maps: 'MapsPage',
    profile: 'ProfilePage',
    activity: 'ActivityPage',
    props: 'PropsPage',
    game: 'GamePage'
  },

  _callbacks: [],

  init: function () {
    window.addEventListener('hashchange', this._onHashChange.bind(this));
    this._onHashChange();
  },

  navigate: function (route, params) {
    if (params && Object.keys(params).length > 0) {
      var qs = Object.keys(params)
        .map(function (k) { return k + '=' + params[k]; })
        .join('&');
      window.location.hash = '#' + route + '?' + qs;
    } else {
      window.location.hash = '#' + route;
    }
  },

  getCurrentRoute: function () {
    var hash = window.location.hash.slice(1) || 'lobby';
    var parts = hash.split('?');
    var route = parts[0] || 'lobby';
    var params = {};
    if (parts[1]) {
      parts[1].split('&').forEach(function (pair) {
        var kv = pair.split('=');
        if (kv.length === 2) {
          params[kv[0]] = kv[1];
        }
      });
    }
    return { route: route, params: params };
  },

  onRouteChange: function (callback) {
    this._callbacks.push(callback);
  },

  _onHashChange: function () {
    var current = this.getCurrentRoute();
    this._callbacks.forEach(function (cb) {
      cb(current.route, current.params);
    });
  }
};
