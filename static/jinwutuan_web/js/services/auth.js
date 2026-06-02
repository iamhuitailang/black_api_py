const AuthService = {
    async login(username, password) {
        const result = await ApiService.post('/jinwutuan/user/login', { username, password });
        
        if (result && result.code === 0 && result.data) {
            Storage.save('token', result.data.token);
            Storage.save('user', result.data.user);
        }
        
        return result;
    },

    async register(username, password, nickname) {
        const result = await ApiService.post('/jinwutuan/user/register', { 
            username, 
            password, 
            nickname 
        });
        
        return result;
    },

    logout() {
        Storage.remove('token');
        Storage.remove('user');
        Router.navigate('login');
    },

    getCurrentUser() {
        return Storage.get('user');
    },

    getToken() {
        return Storage.get('token');
    },

    async changePassword(oldPassword, newPassword) {
        const result = await ApiService.post('/jinwutuan/user/password/change', {
            old_password: oldPassword,
            new_password: newPassword
        });
        
        return result;
    },

    async updateProfile(data) {
        const result = await ApiService.post('/jinwutuan/user/profile/update', data);
        
        if (result && result.code === 0 && result.data) {
            Storage.save('user', result.data);
        }
        
        return result;
    },

    async verifyToken() {
        const token = Storage.get('token');
        if (!token) {
            return { code: 1, msg: 'No token', data: null };
        }

        const result = await ApiService.get('/jinwutuan/user/current/get');
        
        if (result && result.code === 0 && result.data) {
            Storage.save('user', result.data);
        } else {
            Storage.remove('token');
            Storage.remove('user');
        }
        
        return result;
    },

    isAuthenticated() {
        return !!Storage.get('token');
    },

    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.is_admin === true;
    }
};
