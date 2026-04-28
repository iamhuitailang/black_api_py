const AuthService = {
    async login(phone, password) {
        const result = await ApiService.post('/dj/auth/login', {
            phone,
            password
        });
        
        if (result.code === 0 && result.data) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
        }
        
        return result;
    },
    
    async register(data) {
        return ApiService.post('/dj/auth/register', data);
    },
    
    async logout() {
        try {
            await ApiService.post('/dj/auth/logout', {});
        } catch (e) {
            console.error('Logout API error:', e);
        }
        Storage.removeToken();
        Storage.removeUser();
    },
    
    async getCurrentUser() {
        return ApiService.get('/dj/auth/current/user/get');
    },
    
    async changePassword(oldPassword, newPassword) {
        return ApiService.post('/dj/auth/password/change', {
            old_password: oldPassword,
            new_password: newPassword
        });
    },
    
    async resetPassword(phone, verifyCode, newPassword) {
        return ApiService.post('/dj/auth/password/reset', {
            phone,
            verify_code: verifyCode,
            new_password: newPassword
        });
    },
    
    async updateProfile(data) {
        const result = await ApiService.post('/dj/auth/profile/update', data);
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data);
        }
        return result;
    },
    
    isLoggedIn() {
        return !!Storage.getToken();
    },
    
    getUser() {
        return Storage.getUser();
    }
};
