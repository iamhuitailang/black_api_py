const API = {
    BASE_URL: '/api/ty',

    async request(endpoint, options = {}) {
        const url = this.BASE_URL + endpoint;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        const token = Storage.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method: 'GET',
            headers,
            ...options
        };

        if (options.body && typeof options.body !== 'string') {
            config.body = JSON.stringify(options.body);
        }

        const response = await fetch(url, config);
        const data = await response.json();

        if (data.code === 1 && data.msg === '请先登录') {
            Storage.removeToken();
            Storage.removeUser();
            if (Router.getCurrentPage() !== 'login') {
                Router.navigate('login');
            }
        }

        return data;
    },

    get(endpoint, params = {}) {
        const filteredParams = {};
        for (const key in params) {
            if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                filteredParams[key] = params[key];
            }
        }
        const queryString = new URLSearchParams(filteredParams).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    },

    post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: data
        });
    },

    auth: {
        register(data) {
            return API.post('/auth/register', data);
        },
        login(data) {
            return API.post('/auth/login', data);
        },
        logout() {
            return API.post('/auth/logout');
        },
        getCurrentUser() {
            return API.get('/auth/current/get');
        }
    },

    weapon: {
        create(data) {
            return API.post('/weapon/create', {
                name: data.name,
                doodle_data: data.doodle_data || data.image || '',
                weapon_type: data.weapon_type || 'custom',
                attack: data.attack || 10,
                defense: data.defense || 5,
                speed: data.speed || 5,
                doodle_style: data.doodle_style || data.style || 'normal',
                color_palette: data.color_palette || '',
                description: data.description || ''
            });
        },
        getById(id) {
            return API.get('/weapon/detail/get', { weapon_id: id });
        },
        getMyList(params = {}) {
            return API.get('/weapon/list/get', params);
        },
        getSharedList(params = {}) {
            return API.get('/weapon/shared/list/get', params);
        },
        update(id, data) {
            const params = new URLSearchParams();
            params.append('weapon_id', id);
            return API.request('/weapon/update?' + params.toString(), {
                method: 'POST',
                body: data
            });
        },
        share(id) {
            const params = new URLSearchParams();
            params.append('weapon_id', id);
            params.append('is_shared', '1');
            return API.request('/weapon/share?' + params.toString(), { method: 'POST' });
        },
        repair(id) {
            const params = new URLSearchParams();
            params.append('weapon_id', id);
            return API.request('/weapon/repair?' + params.toString(), { method: 'POST' });
        },
        delete(id) {
            const params = new URLSearchParams();
            params.append('weapon_id', id);
            return API.request('/weapon/delete?' + params.toString(), { method: 'POST' });
        }
    },

    resource: {
        getShopList(params = {}) {
            return API.get('/resource/list/get', params);
        },
        getMyResources(params = {}) {
            return API.get('/resource/my/list/get', params);
        },
        buy(resourceId, quantity = 1) {
            return API.post('/resource/buy', {
                resource_id: resourceId,
                quantity: quantity
            });
        },
        use(resourceId, quantity = 1) {
            return API.post('/resource/use', {
                resource_id: resourceId,
                quantity: quantity
            });
        }
    },

    skill: {
        getList(params = {}) {
            return API.get('/skill/list/get', params);
        },
        getMySkills(params = {}) {
            return API.get('/skill/my/list/get', params);
        },
        getEquipped() {
            return API.get('/skill/equipped/list/get');
        },
        unlock(skillId) {
            const params = new URLSearchParams();
            params.append('skill_id', skillId);
            return API.request('/skill/unlock?' + params.toString(), { method: 'POST' });
        },
        upgrade(skillId) {
            const params = new URLSearchParams();
            params.append('skill_id', skillId);
            return API.request('/skill/upgrade?' + params.toString(), { method: 'POST' });
        },
        equip(skillId) {
            return API.post('/skill/equip', { skill_id: skillId, equip: true });
        },
        unequip(skillId) {
            return API.post('/skill/equip', { skill_id: skillId, equip: false });
        }
    },

    battle: {
        createPVE(weaponId) {
            return API.post('/battle/create/pve', { weapon_id: weaponId });
        },
        executeRound(battleId) {
            const params = new URLSearchParams();
            params.append('battle_id', battleId);
            return API.request('/battle/round/execute?' + params.toString(), { method: 'POST' });
        },
        getById(battleId) {
            return API.get('/battle/detail/get', { battle_id: battleId });
        },
        getMyHistory(params = {}) {
            return API.get('/battle/my/list/get', params);
        },
        cancel(battleId) {
            const params = new URLSearchParams();
            params.append('battle_id', battleId);
            return API.request('/battle/cancel?' + params.toString(), { method: 'POST' });
        },
        autoBattle(battleId) {
            const params = new URLSearchParams();
            params.append('battle_id', battleId);
            return API.request('/battle/auto?' + params.toString(), { method: 'POST' });
        }
    },

    workshop: {
        publish(data) {
            return API.post('/workshop/publish', {
                weapon_id: data.weapon_id,
                title: data.title,
                description: data.description || '',
                tags: data.tags || ''
            });
        },
        getList(params = {}) {
            return API.get('/workshop/list/get', params);
        },
        getById(id) {
            return API.get('/workshop/detail/get', { workshop_id: id });
        },
        like(id) {
            const params = new URLSearchParams();
            params.append('workshop_id', id);
            return API.request('/workshop/like?' + params.toString(), { method: 'POST' });
        },
        copyWeapon(id) {
            const params = new URLSearchParams();
            params.append('workshop_id', id);
            return API.request('/workshop/copy?' + params.toString(), { method: 'POST' });
        },
        update(id, data) {
            const params = new URLSearchParams();
            params.append('workshop_id', id);
            return API.request('/workshop/update?' + params.toString(), {
                method: 'POST',
                body: data
            });
        },
        delete(id) {
            const params = new URLSearchParams();
            params.append('workshop_id', id);
            return API.request('/workshop/delete?' + params.toString(), { method: 'POST' });
        },
        getMyWorks(params = {}) {
            return API.get('/workshop/my/list/get', params);
        }
    }
};
