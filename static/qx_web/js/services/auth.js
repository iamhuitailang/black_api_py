const Auth = {
    isLoggedIn: function() {
        return !!Storage.getToken();
    },
    login: async function(phone, password) {
        const result = await API.post('/user/login', {
            phone: phone,
            password: password
        });
        if (result.code === 0 && result.data) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
        }
        return result;
    },
    logout: async function() {
        const result = await API.post('/user/logout', {});
        Storage.clear();
        return result;
    },
    register: async function(data) {
        return await API.post('/user/register', data);
    },
    getCurrentUser: async function() {
        const result = await API.get('/user/current/get');
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data);
        }
        return result;
    },
    updateUserInfo: function(user) {
        Storage.setUser(user);
    }
};
