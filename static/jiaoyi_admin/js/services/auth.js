const AuthService = {
    async login(username, password) {
        const response = await fetch('/api/jiaoyi/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || '登录失败');
        }

        if (data.code === 0) {
            Storage.setToken(data.data.token);
            Storage.setUser(data.data.admin);
        }

        return data;
    },

    async getProfile() {
        return Api.get('/profile');
    }
};
