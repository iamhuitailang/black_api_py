const Auth = {
    async login(phone, password, role = 'user') {
        const result = await API.post('/user/login', {
            phone,
            password
        });

        if (result.code === 0) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
        }

        return result;
    },

    async register(phone, password, nickname = '') {
        const result = await API.post('/user/register', {
            phone,
            password,
            nickname
        });

        return result;
    },

    async logout() {
        try {
            await API.post('/user/logout');
        } catch (e) {
            console.error('Logout API error:', e);
        }

        Storage.removeToken();
        Storage.removeUser();
    },

    async getCurrentUser() {
        const result = await API.get('/user/current/get');
        
        if (result.code === 0) {
            Storage.setUser(result.data);
        }

        return result;
    },

    isLoggedIn() {
        const token = Storage.getToken();
        return !!token;
    },

    getUser() {
        return Storage.getUser();
    },

    isCollector() {
        const user = this.getUser();
        return user && user.role === 'collector';
    },

    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    },

    checkAuth() {
        if (!this.isLoggedIn()) {
            Router.navigate('login');
            return false;
        }
        return true;
    },

    async applyCollector(nickname, phone) {
        const result = await API.post('/user/apply/collector', {
            nickname,
            phone
        });

        if (result.code === 0) {
            const user = this.getUser();
            if (user) {
                user.role = 'collector';
                Storage.setUser(user);
            }
        }

        return result;
    }
};
