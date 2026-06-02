const Api = {
    BASE_URL: '/api',

    async request(path, options = {}) {
        const token = Storage.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(options.headers || {})
        };

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(`${this.BASE_URL}${path}`, config);
            const data = await response.json();
            if (data.code === 1 && data.msg && data.msg.includes('token')) {
                Storage.clear();
                window.location.reload();
            }
            return data;
        } catch (error) {
            return { code: 1, msg: '网络请求失败', data: null };
        }
    },

    get(path) {
        return this.request(path, { method: 'GET' });
    },

    post(path, body) {
        return this.request(path, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined
        });
    },

    put(path, body) {
        return this.request(path, {
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined
        });
    },

    delete(path) {
        return this.request(path, { method: 'DELETE' });
    },

    auth: {
        register(username, password, nickname) {
            return Api.post('/huangjin/auth/register', { username, password, nickname });
        },
        login(username, password) {
            return Api.post('/huangjin/auth/login', { username, password });
        },
        logout() {
            return Api.post('/huangjin/auth/logout');
        },
        getCurrent() {
            return Api.get('/huangjin/auth/current/get');
        },
        changePassword(oldPassword, newPassword) {
            return Api.post('/huangjin/auth/password/change', {
                old_password: oldPassword,
                new_password: newPassword
            });
        },
        updateProfile(data) {
            return Api.post('/huangjin/auth/profile/update', data);
        }
    },

    game: {
        start() {
            return Api.get('/huangjin/game/start/get');
        },
        submit(score, duration, oresCollected) {
            return Api.post('/huangjin/game/submit', {
                score,
                duration,
                ores_collected: oresCollected
            });
        },
        getRecords(page = 1, pageSize = 10) {
            return Api.get(`/huangjin/game/records/get?page=${page}&page_size=${pageSize}`);
        },
        getLeaderboard(page = 1, pageSize = 10) {
            return Api.get(`/huangjin/game/leaderboard/get?page=${page}&page_size=${pageSize}`);
        },
        getAllRecords(page = 1, pageSize = 10, userId = null) {
            let url = `/huangjin/game/all/records/get?page=${page}&page_size=${pageSize}`;
            if (userId) url += `&user_id=${userId}`;
            return Api.get(url);
        }
    },

    ore: {
        getList(page = 1, pageSize = 10, status = null, rarity = null) {
            let url = `/huangjin/ore/list/get?page=${page}&page_size=${pageSize}`;
            if (status !== null) url += `&status=${status}`;
            if (rarity !== null) url += `&rarity=${rarity}`;
            return Api.get(url);
        },
        getEnabled() {
            return Api.get('/huangjin/ore/enabled/get');
        },
        getDetail(oreId) {
            return Api.get(`/huangjin/ore/detail/get?ore_id=${oreId}`);
        },
        create(data) {
            return Api.post('/huangjin/ore/create', data);
        },
        update(oreId, data) {
            return Api.post(`/huangjin/ore/update?ore_id=${oreId}`, data);
        },
        delete(oreId) {
            return Api.post(`/huangjin/ore/delete?ore_id=${oreId}`);
        },
        toggleStatus(oreId) {
            return Api.post(`/huangjin/ore/toggle/status?ore_id=${oreId}`);
        }
    },

    achievement: {
        getList(page = 1, pageSize = 10, status = null, conditionType = null) {
            let url = `/huangjin/achievement/list/get?page=${page}&page_size=${pageSize}`;
            if (status !== null) url += `&status=${status}`;
            if (conditionType) url += `&condition_type=${conditionType}`;
            return Api.get(url);
        },
        getUserAchievements() {
            return Api.get('/huangjin/achievement/user/get');
        },
        create(data) {
            return Api.post('/huangjin/achievement/create', data);
        },
        update(achievementId, data) {
            return Api.post(`/huangjin/achievement/update?achievement_id=${achievementId}`, data);
        },
        delete(achievementId) {
            return Api.post(`/huangjin/achievement/delete?achievement_id=${achievementId}`);
        },
        toggleStatus(achievementId) {
            return Api.post(`/huangjin/achievement/toggle/status?achievement_id=${achievementId}`);
        }
    },

    admin: {
        login(username, password) {
            return Api.post('/huangjin/admin/login', { username, password });
        },
        getDashboard() {
            return Api.get('/huangjin/admin/dashboard/get');
        },
        getUserList(page = 1, pageSize = 10, status = null, role = null, keyword = null) {
            let url = `/huangjin/admin/user/list/get?page=${page}&page_size=${pageSize}`;
            if (status !== null) url += `&status=${status}`;
            if (role !== null) url += `&role=${role}`;
            if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
            return Api.get(url);
        },
        banUser(userId) {
            return Api.post(`/huangjin/admin/user/ban?user_id=${userId}`);
        },
        unbanUser(userId) {
            return Api.post(`/huangjin/admin/user/unban?user_id=${userId}`);
        },
        deleteUser(userId) {
            return Api.post(`/huangjin/admin/user/delete?user_id=${userId}`);
        },
        resetPassword(userId, newPassword) {
            return Api.post(`/huangjin/admin/user/reset/password?user_id=${userId}`, {
                new_password: newPassword
            });
        },
        setUserRole(userId, role) {
            return Api.post(`/huangjin/admin/user/set/role?user_id=${userId}&role=${role}`);
        },
        getScoreStats() {
            return Api.get('/huangjin/admin/stats/score/get');
        },
        getOreStats() {
            return Api.get('/huangjin/admin/stats/ore/get');
        },
        getAchievementStats() {
            return Api.get('/huangjin/admin/stats/achievement/get');
        }
    }
};
