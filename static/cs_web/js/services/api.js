const API_BASE = 'http://localhost:8002';

const API = {
    async request(url, options = {}) {
        const token = Storage.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_BASE}${url}`, {
                ...options,
                headers
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            return { code: 500, message: '网络错误' };
        }
    },

    get(url) {
        return this.request(url, { method: 'GET' });
    },

    post(url, data) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    put(url, data) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    delete(url) {
        return this.request(url, { method: 'DELETE' });
    },

    user: {
        login(data) { return API.post('/api/user/login', data); },
        register(data) { return API.post('/api/user/register', data); },
        getInfo(id) { return API.get(`/api/user/info/${id}`); },
        update(id, data) { return API.put(`/api/user/update/${id}`, data); },
        changePassword(id, data) { return API.post(`/api/user/change-password/${id}`, data); },
        getList(skip, limit) { return API.get(`/api/user/list?skip=${skip}&limit=${limit}`); },
        delete(id) { return API.delete(`/api/user/${id}`); },
        getLeaderboard(limit = 20) { return API.get(`/api/user/leaderboard?limit=${limit}`); }
    },

    weapon: {
        getList(skip, limit, type) {
            let url = `/api/weapon/list?skip=${skip}&limit=${limit}`;
            if (type) url += `&weapon_type=${type}`;
            return API.get(url);
        },
        get(id) { return API.get(`/api/weapon/${id}`); },
        create(data) { return API.post('/api/weapon/create', data); },
        update(id, data) { return API.put(`/api/weapon/update/${id}`, data); },
        delete(id) { return API.delete(`/api/weapon/${id}`); }
    },

    map: {
        getList(skip, limit) { return API.get(`/api/map/list?skip=${skip}&limit=${limit}`); },
        get(id) { return API.get(`/api/map/${id}`); },
        create(data) { return API.post('/api/map/create', data); },
        update(id, data) { return API.put(`/api/map/update/${id}`, data); },
        delete(id) { return API.delete(`/api/map/${id}`); }
    },

    game: {
        createRecord(data) { return API.post('/api/game/record', data); },
        getUserRecords(userId, skip, limit) { return API.get(`/api/game/records/${userId}?skip=${skip}&limit=${limit}`); },
        getUserStats(userId) { return API.get(`/api/game/stats/${userId}`); },
        getAllRecords(skip, limit) { return API.get(`/api/game/records?skip=${skip}&limit=${limit}`); },
        deleteRecord(id) { return API.delete(`/api/game/record/${id}`); }
    },

    achievement: {
        getList(skip, limit) { return API.get(`/api/achievement/list?skip=${skip}&limit=${limit}`); },
        get(id) { return API.get(`/api/achievement/${id}`); },
        create(data) { return API.post('/api/achievement/create', data); },
        update(id, data) { return API.put(`/api/achievement/update/${id}`, data); },
        delete(id) { return API.delete(`/api/achievement/${id}`); },
        getUserAchievements(userId) { return API.get(`/api/achievement/user/${userId}`); },
        unlock(userId, achievementId) { return API.post(`/api/achievement/unlock/${userId}/${achievementId}`); }
    },

    admin: {
        getStats() { return API.get('/api/admin/stats'); }
    }
};
