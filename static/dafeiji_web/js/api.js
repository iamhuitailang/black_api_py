var Api = {
  BASE_URL: '/api/dafeiji',

  _request: function(method, url, data, params) {
    var token = GameStorage.getToken();
    var headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    var config = {
      method: method,
      headers: headers
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    var fullUrl = this.BASE_URL + url;
    if (params) {
      var queryParts = [];
      for (var key in params) {
        if (params[key] !== null && params[key] !== undefined) {
          queryParts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
        }
      }
      if (queryParts.length > 0) {
        fullUrl += '?' + queryParts.join('&');
      }
    }

    return fetch(fullUrl, config)
      .then(function(response) {
        if (response.status === 401) {
          GameStorage.clearAll();
          Router.navigate('login');
          return Promise.reject({ message: '登录已过期，请重新登录' });
        }
        return response.json().then(function(data) {
          if (!response.ok) {
            return Promise.reject(data);
          }
          if (data.code !== 0) {
            return Promise.reject({ code: data.code, message: data.msg || '操作失败', data: data.data });
          }
          return data;
        });
      })
      .catch(function(error) {
        if (error.message === '登录已过期，请重新登录') {
          return Promise.reject(error);
        }
        return Promise.reject(error || { message: '网络请求失败' });
      });
  },

  _get: function(url, params) {
    return this._request('GET', url, null, params);
  },

  _post: function(url, data) {
    return this._request('POST', url, data);
  },

  _put: function(url, data) {
    return this._request('PUT', url, data);
  },

  _delete: function(url) {
    return this._request('DELETE', url);
  },

  auth: {
    register: function(data) {
      return Api._post('/user/register', data);
    },
    login: function(data) {
      return Api._post('/user/login', data);
    },
    logout: function() {
      return Api._post('/user/logout', {});
    },
    getCurrentUser: function() {
      return Api._get('/user/current/get');
    },
    changePassword: function(data) {
      return Api._post('/user/password/change', data);
    },
    updateProfile: function(data) {
      return Api._post('/user/profile/update', data);
    },
    getUserDetail: function(id) {
      return Api._get('/user/detail/get', { id: id });
    },
    getUserList: function(page, pageSize, _sort, _order, keyword) {
      var params = { page: page || 1, page_size: pageSize || 10 };
      if (keyword) {
        params.keyword = keyword;
      }
      return Api._get('/user/list/get', params);
    },
    banUser: function(id) {
      return Api._request('POST', '/user/ban', null, { user_id: id });
    },
    unbanUser: function(id) {
      return Api._request('POST', '/user/unban', null, { user_id: id });
    },
    deleteUser: function(id) {
      return Api._request('POST', '/user/delete', null, { user_id: id });
    }
  },

  aircraft: {
    getAircraftList: function(page, pageSize) {
      return Api._get('/aircraft/list/get', { page: page || 1, page_size: pageSize || 10 });
    },
    getAircraftAll: function() {
      return Api._get('/aircraft/all/get');
    },
    getAircraftDetail: function(id) {
      return Api._get('/aircraft/detail/get', { id: id });
    },
    createAircraft: function(data) {
      return Api._post('/aircraft/create', data);
    },
    updateAircraft: function(data) {
      var id = data.id;
      var body = {};
      for (var k in data) { if (k !== 'id' && data[k] !== undefined) body[k] = data[k]; }
      return Api._request('POST', '/aircraft/update', body, { aircraft_id: id });
    },
    deleteAircraft: function(id) {
      return Api._request('POST', '/aircraft/delete', null, { aircraft_id: id });
    }
  },

  game: {
    saveGameState: function(data) {
      return Api._post('/game/state/save', data);
    },
    loadGameState: function() {
      return Api._get('/game/state/load/get');
    },
    submitScore: function(data) {
      return Api._post('/game/score/submit', data);
    },
    getGameRecords: function(page, pageSize) {
      return Api._get('/game/records/get', { page: page || 1, page_size: pageSize || 10 });
    }
  },

  achievement: {
    getAchievementList: function(page, pageSize) {
      return Api._get('/achievement/list/get', { page: page || 1, page_size: pageSize || 10 });
    },
    getUserAchievements: function() {
      return Api._get('/achievement/user/get');
    },
    checkAchievements: function() {
      return Api._post('/achievement/check', {});
    },
    createAchievement: function(data) {
      return Api._post('/achievement/create', data);
    },
    updateAchievement: function(data) {
      var id = data.id;
      var body = {};
      for (var k in data) { if (k !== 'id' && data[k] !== undefined) body[k] = data[k]; }
      return Api._request('POST', '/achievement/update', body, { achievement_id: id });
    },
    deleteAchievement: function(id) {
      return Api._request('POST', '/achievement/delete', null, { achievement_id: id });
    }
  },

  leaderboard: {
    getTopPlayers: function(limit) {
      return Api._get('/leaderboard/top/get', { limit: limit || 10 });
    },
    getUserBest: function() {
      var user = GameStorage.getUser();
      return Api._get('/leaderboard/user/best/get', { user_id: user ? user.id : null });
    },
    getUserRank: function() {
      var user = GameStorage.getUser();
      return Api._get('/leaderboard/user/rank/get', { user_id: user ? user.id : null });
    },
    getUserHistory: function(page, pageSize) {
      var user = GameStorage.getUser();
      return Api._get('/leaderboard/user/history/get', { user_id: user ? user.id : null, page: page || 1, page_size: pageSize || 10 });
    },
    getLeaderboardAll: function(page, pageSize) {
      return Api._get('/leaderboard/all/get', { page: page || 1, page_size: pageSize || 10 });
    }
  },

  wave: {
    getWaveList: function(page, pageSize) {
      return Api._get('/wave/list/get', { page: page || 1, page_size: pageSize || 10 });
    },
    getWaveAll: function() {
      return Api._get('/wave/all/get');
    },
    getWaveDetail: function(id) {
      return Api._get('/wave/detail/get', { id: id });
    },
    getWaveByNumber: function(number) {
      return Api._get('/wave/number/get', { number: number });
    },
    createWave: function(data) {
      return Api._post('/wave/create', data);
    },
    updateWave: function(data) {
      var id = data.id;
      var body = {};
      for (var k in data) { if (k !== 'id' && data[k] !== undefined) body[k] = data[k]; }
      return Api._request('POST', '/wave/update', body, { wave_id: id });
    },
    deleteWave: function(id) {
      return Api._request('POST', '/wave/delete', null, { wave_id: id });
    }
  },

  item: {
    getItemList: function(page, pageSize) {
      return Api._get('/item/list/get', { page: page || 1, page_size: pageSize || 10 });
    },
    getItemAll: function() {
      return Api._get('/item/all/get');
    },
    getItemDetail: function(id) {
      return Api._get('/item/detail/get', { id: id });
    },
    createItem: function(data) {
      return Api._post('/item/create', data);
    },
    updateItem: function(data) {
      var id = data.id;
      var body = {};
      for (var k in data) { if (k !== 'id' && data[k] !== undefined) body[k] = data[k]; }
      return Api._request('POST', '/item/update', body, { item_id: id });
    },
    deleteItem: function(id) {
      return Api._request('POST', '/item/delete', null, { item_id: id });
    }
  },

  dashboard: {
    getOverview: function() {
      return Api._get('/dashboard/overview/get');
    },
    getDailyStats: function(days) {
      return Api._get('/dashboard/daily/stats/get', { days: days || 7 });
    },
    getPopularAircraft: function(limit) {
      return Api._get('/dashboard/popular/aircraft/get', { limit: limit || 5 });
    },
    getTopPlayers: function(limit) {
      return Api._get('/dashboard/top/players/get', { limit: limit || 5 });
    }
  }
};
