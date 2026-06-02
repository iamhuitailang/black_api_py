const AuthService = {
    mockUsers: [
        { id: 1, phone: '13800138000', password: '123456', nickname: '金币达人', avatar: '🤑' }
    ],

    async login(phone, password) {
        const user = this.mockUsers.find(u => u.phone === phone && u.password === password);
        
        if (user) {
            const token = 'mock_token_' + Date.now();
            Storage.setToken(token);
            Storage.setUser({ id: user.id, phone: user.phone, nickname: user.nickname, avatar: user.avatar });
            return { code: 0, data: { token, user: { id: user.id, phone: user.phone, nickname: user.nickname, avatar: user.avatar } } };
        }
        
        return { code: 1, msg: '手机号或密码错误' };
    },

    async register(phone, password, nickname = '') {
        if (this.mockUsers.find(u => u.phone === phone)) {
            return { code: 1, msg: '该手机号已注册' };
        }

        const newUser = {
            id: this.mockUsers.length + 1,
            phone,
            password,
            nickname: nickname || '玩家' + (this.mockUsers.length + 1),
            avatar: '😊'
        };

        this.mockUsers.push(newUser);
        const token = 'mock_token_' + Date.now();
        Storage.setToken(token);
        Storage.setUser({ id: newUser.id, phone: newUser.phone, nickname: newUser.nickname, avatar: newUser.avatar });
        
        return { code: 0, data: { token, user: { id: newUser.id, phone: newUser.phone, nickname: newUser.nickname, avatar: newUser.avatar } } };
    },

    async logout() {
        Storage.removeToken();
        Storage.removeUser();
        return { code: 0 };
    },

    isLoggedIn() {
        return !!Storage.getToken();
    },

    getCurrentUser() {
        return Storage.getUser();
    },

    async changePassword(oldPassword, newPassword) {
        const user = this.getCurrentUser();
        if (!user) {
            return { code: 1, msg: '请先登录' };
        }

        const mockUser = this.mockUsers.find(u => u.id === user.id);
        if (!mockUser || mockUser.password !== oldPassword) {
            return { code: 1, msg: '原密码错误' };
        }

        mockUser.password = newPassword;
        return { code: 0, msg: '密码修改成功' };
    },

    async updateProfile(data) {
        const user = this.getCurrentUser();
        if (!user) {
            return { code: 1, msg: '请先登录' };
        }

        const mockUser = this.mockUsers.find(u => u.id === user.id);
        if (mockUser) {
            if (data.nickname) mockUser.nickname = data.nickname;
            if (data.avatar) mockUser.avatar = data.avatar;
            
            const updatedUser = { id: mockUser.id, phone: mockUser.phone, nickname: mockUser.nickname, avatar: mockUser.avatar };
            Storage.setUser(updatedUser);
            return { code: 0, data: updatedUser };
        }

        return { code: 1, msg: '用户不存在' };
    }
};

window.AuthService = AuthService;
