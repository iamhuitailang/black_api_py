const AuthService = {
    user: null,
    token: null,
    isAuthenticated: false,

    init() {
        this.token = Storage.getToken();
        this.user = Storage.getUser();
        this.isAuthenticated = !!this.token && !!this.user;
    },

    async register(phone, password, nickname) {
        const response = await API.auth.register({ phone, password, nickname });
        if (response.code !== 0) {
            throw new Error(response.msg || '注册失败');
        }
        const { token, user } = response.data;
        
        this.token = token;
        this.user = user;
        this.isAuthenticated = true;
        
        Storage.setToken(token);
        Storage.setUser(user);
        
        return { token, user };
    },

    async login(phone, password) {
        const response = await API.auth.login({ phone, password });
        if (response.code !== 0) {
            throw new Error(response.msg || '登录失败');
        }
        const { token, user } = response.data;
        
        this.token = token;
        this.user = user;
        this.isAuthenticated = true;
        
        Storage.setToken(token);
        Storage.setUser(user);
        
        return { token, user };
    },

    async logout() {
        try {
            await API.auth.logout();
        } catch (error) {
            console.error('Logout API error:', error);
        }
        
        this.token = null;
        this.user = null;
        this.isAuthenticated = false;
        
        Storage.removeToken();
        Storage.removeUser();
    },

    async refreshUser() {
        try {
            const response = await API.auth.getCurrentUser();
            this.user = response.data;
            Storage.setUser(this.user);
            return this.user;
        } catch (error) {
            throw error;
        }
    },

    updateUser(userData) {
        this.user = { ...this.user, ...userData };
        Storage.setUser(this.user);
    },

    requireAuth() {
        if (!this.isAuthenticated) {
            Router.navigate('login');
            return false;
        }
        return true;
    },

    getUser() {
        return this.user;
    },

    getToken() {
        return this.token;
    },

    isLoggedIn() {
        return this.isAuthenticated;
    }
};

AuthService.init();
