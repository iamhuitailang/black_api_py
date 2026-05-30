const API_BASE = '/api';

const API = {
    getToken() {
        return Utils.storage.get('chouchou_token');
    },

    setToken(token) {
        return Utils.storage.set('chouchou_token', token);
    },

    clearToken() {
        return Utils.storage.remove('chouchou_token');
    },

    async request(url, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = token;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(`${API_BASE}${url}`, config);
            const data = await response.json();

            if (data.code === 401) {
                this.clearToken();
                Utils.storage.remove('chouchou_user');
                if (window.location.hash !== '#/login' && window.location.hash !== '#/register') {
                    window.location.hash = '#/login';
                }
                Utils.error('登录已过期，请重新登录');
                return null;
            }

            if (data.code !== 0) {
                Utils.error(data.msg || data.message || '请求失败');
                return null;
            }

            return data.data;
        } catch (error) {
            console.error('API request error:', error);
            Utils.error('网络请求失败，请检查网络连接');
            return null;
        }
    },

    get(url, params = {}) {
        const filteredParams = {};
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== '') {
                filteredParams[key] = value;
            }
        }
        const queryString = new URLSearchParams(filteredParams).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'GET' });
    },

    post(url, data = {}) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    user: {
        login(username, password) {
            return API.post('/chouchou/user/login', { username, password });
        },

        register(username, password, nickname = '', phone = '') {
            return API.post('/chouchou/user/register', { username, password, nickname, phone });
        },

        logout() {
            return API.post('/chouchou/user/logout');
        },

        getProfile() {
            return API.get('/chouchou/user/current/get');
        },

        updateProfile(data) {
            return API.post('/chouchou/user/profile/update', data);
        },

        changePassword(oldPassword, newPassword) {
            return API.post('/chouchou/user/password/change', { old_password: oldPassword, new_password: newPassword });
        },

        list(page = 1, pageSize = 10) {
            return API.get('/chouchou/user/list/get', { page, page_size: pageSize });
        },

        getById(id) {
            return API.get('/chouchou/user/detail/get', { user_id: id });
        }
    },

    game: {
        create(data) {
            return API.post('/chouchou/game/create', data);
        },

        join(roomCode) {
            return API.post('/chouchou/game/join', { room_code: roomCode });
        },

        leave(gameId) {
            return API.post('/chouchou/game/leave', { game_id: gameId });
        },

        start(gameId) {
            return API.post('/chouchou/game/start', { game_id: gameId });
        },

        get(gameId) {
            return API.get('/chouchou/game/info/get', { game_id: gameId });
        },

        list(status = '', page = 1, pageSize = 10) {
            const params = { page, page_size: pageSize };
            if (status) params.status = status;
            return API.get('/chouchou/game/active/get', params);
        },

        myGames(page = 1, pageSize = 10) {
            return API.get('/chouchou/game/my/games/get', { page, page_size: pageSize });
        },

        getCommands() {
            return API.get('/chouchou/game/commands/get');
        },

        issueCommand(gameId, commandType, content, duration) {
            return API.post('/chouchou/game/command/publish', {
                game_id: gameId,
                command_type: commandType,
                custom_content: content,
                duration: duration
            });
        },

        submitAction(gameId, commandId, playerId, action) {
            return API.post('/chouchou/game/action/submit', {
                game_id: gameId,
                command_id: commandId,
                player_id: playerId,
                action: action
            });
        },

        resolveCommand(gameId, commandId) {
            return API.post('/chouchou/game/command/resolve', {
                game_id: gameId,
                command_id: commandId
            });
        },

        nextRound(gameId) {
            return API.post('/chouchou/game/round/next', { game_id: gameId });
        },

        changeTheme(gameId, theme) {
            return API.post('/chouchou/game/theme/change', { game_id: gameId, theme: theme });
        }
    },

    theme: {
        get() {
            return API.get('/chouchou/theme/my/get');
        },

        all() {
            return API.get('/chouchou/theme/all/get');
        },

        setCurrent(themeCode) {
            return API.post('/chouchou/theme/set', { theme_code: themeCode });
        },

        unlock(themeCode) {
            return API.post('/chouchou/theme/unlock', { theme_code: themeCode });
        }
    },

    setting: {
        get() {
            return API.get('/chouchou/setting/get');
        },

        update(data) {
            return API.post('/chouchou/setting/update', data);
        },

        setValue(key, value) {
            return API.post('/chouchou/setting/value/set', { key, value });
        },

        reset() {
            return API.post('/chouchou/setting/reset');
        }
    },

    highScore: {
        list(type = 'all', page = 1, pageSize = 20) {
            return API.get('/chouchou/highscore/leaderboard/get', { score_type: type, page, page_size: pageSize });
        },

        personal() {
            return API.get('/chouchou/highscore/my/get');
        },

        allLeaderboards() {
            return API.get('/chouchou/highscore/all/leaderboards/get');
        },

        types() {
            return API.get('/chouchou/highscore/types/get');
        }
    }
};
