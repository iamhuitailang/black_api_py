var Auth = {
    login: function(phone, password) {
        return API.post('/ex/user/login', {
            phone: phone,
            password: password
        }).then(function(response) {
            var data = response.data;
            Storage.setToken(data.token);
            Storage.setUser(data.user);
            return data;
        });
    },
    
    register: function(phone, password, nickname) {
        return API.post('/ex/user/register', {
            phone: phone,
            password: password,
            nickname: nickname
        }).then(function(response) {
            var data = response.data;
            Storage.setToken(data.token);
            Storage.setUser(data.user);
            return data;
        });
    },
    
    logout: function() {
        var token = Storage.getToken();
        if (token) {
            API.post('/ex/user/logout', {}).catch(function() {});
        }
        Storage.removeToken();
        Storage.removeUser();
    },
    
    isLoggedIn: function() {
        return !!Storage.getToken();
    },
    
    getCurrentUser: function() {
        return Storage.getUser();
    },
    
    refreshUser: function() {
        var self = this;
        return API.get('/ex/user/current/get')
            .then(function(response) {
                var user = response.data;
                Storage.setUser(user);
                return user;
            })
            .catch(function(error) {
                console.error('刷新用户信息失败:', error);
                throw error;
            });
    },
    
    checkAuth: function() {
        if (!this.isLoggedIn()) {
            if (window.location.hash !== '#/login' && window.location.hash !== '#/register') {
                Router.navigate('/login?redirect=' + encodeURIComponent(window.location.hash.slice(1) || '/'));
                return false;
            }
        }
        return true;
    }
};
