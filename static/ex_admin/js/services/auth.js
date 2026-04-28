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
    
    checkAuth: function() {
        if (!this.isLoggedIn()) {
            if (window.location.hash !== '#/login') {
                Router.navigate('/login');
                return false;
            }
        }
        return true;
    }
};
