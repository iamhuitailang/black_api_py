const AuthService = {
    async login(username, password) {
        const data = await Api.post('/api/dianying/user/login', { username, password });
        Storage.set('token', data.access_token);
        Storage.set('user', data.user);
        return data;
    },

    async register(username, password, email) {
        const data = await Api.post('/api/dianying/user/register', { username, password, email: email || '' });
        return data;
    },

    logout() {
        Storage.remove('token');
        Storage.remove('user');
    },

    async getCurrentUser() {
        const user = await Api.get('/api/dianying/user/info/get');
        Storage.set('user', user);
        return user;
    },

    async changePassword(oldPassword, newPassword) {
        return Api.post('/api/dianying/user/change/password', {
            old_password: oldPassword,
            new_password: newPassword
        });
    },

    isLoggedIn() {
        return !!Storage.get('token');
    },

    getUser() {
        return Storage.get('user');
    },

    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    },

    getToken() {
        return Storage.get('token');
    }
};
