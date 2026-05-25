const AuthService = {
    async login(account, password) {
        const result = await ApiService.post('/xz/auth/login', { account, password });
        if (result.code === 0 && result.data) {
            Storage.set('xz_token', result.data.token);
            Storage.set('xz_user', result.data.user);
            await this.loadUserTeams();
        }
        return result;
    },

    async register(username, email, password) {
        const result = await ApiService.post('/xz/auth/register', { username, email, password });
        if (result.code === 0 && result.data) {
            Storage.set('xz_token', result.data.token);
            Storage.set('xz_user', result.data.user);
        }
        return result;
    },

    async logout() {
        await ApiService.post('/xz/auth/logout');
        Storage.remove('xz_token');
        Storage.remove('xz_user');
        Storage.remove('xz_teams');
        Storage.remove('xz_current_team');
        Router.navigate('login');
    },

    isLoggedIn() {
        return !!Storage.get('xz_token');
    },

    getCurrentUser() {
        return Storage.get('xz_user');
    },

    getCurrentTeam() {
        return Storage.get('xz_current_team');
    },

    setCurrentTeam(team) {
        Storage.set('xz_current_team', team);
    },

    getUserTeams() {
        return Storage.get('xz_teams');
    },

    async loadUserTeams() {
        const result = await ApiService.get('/xz/team/my/get');
        if (result.code === 0 && result.data) {
            Storage.set('xz_teams', result.data);
            if (result.data.length > 0 && !this.getCurrentTeam()) {
                this.setCurrentTeam(result.data[0]);
            }
        }
        return result;
    },

    async refreshCurrentUser() {
        const result = await ApiService.get('/xz/auth/current/get');
        if (result.code === 0 && result.data) {
            Storage.set('xz_user', result.data);
        }
        return result;
    }
};

window.AuthService = AuthService;
