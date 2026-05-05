const API_BASE_URL = '/api';

const ApiService = {
    async request(url, options = {}) {
        const token = Storage.getToken();

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method: options.method || 'GET',
            headers,
            ...options
        };

        if (options.data && config.method !== 'GET') {
            config.body = JSON.stringify(options.data);
        }

        try {
            const response = await fetch(`${API_BASE_URL}${url}`, config);
            const result = await response.json();

            if (response.status === 401 || (result.code === 1 && result.msg && result.msg.includes('token'))) {
                Storage.removeToken();
                Storage.removeUser();
                Storage.removeCurrentHero();
                if (window.Router) {
                    window.Router.navigate('login');
                }
                throw new Error('登录已过期，请重新登录');
            }

            return result;
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    },

    async get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'GET' });
    },

    async post(url, data = {}) {
        return this.request(url, { method: 'POST', data });
    },

    async put(url, data = {}) {
        return this.request(url, { method: 'PUT', data });
    },

    async delete(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'DELETE' });
    }
};

const DotaApi = {
    async register(username, password, nickname) {
        return ApiService.post('/dota/user/register', {
            username,
            password,
            nickname
        });
    },

    async login(username, password) {
        return ApiService.post('/dota/user/login', {
            username,
            password
        });
    },

    async logout() {
        return ApiService.post('/dota/user/logout');
    },

    async getCurrentUser() {
        return ApiService.get('/dota/user/current/get');
    },

    async getUserInfo() {
        return ApiService.get('/dota/user/info/get');
    },

    async getAllHeroes() {
        return ApiService.get('/dota/hero/all/get');
    },

    async getHeroesForUser() {
        return ApiService.get('/dota/hero/list/get');
    },

    async getOwnedHeroes() {
        return ApiService.get('/dota/hero/owned/get');
    },

    async getHeroDetail(heroId) {
        return ApiService.get('/dota/hero/detail/get', { hero_id: heroId });
    },

    async buyHero(heroId) {
        return ApiService.post('/dota/hero/buy', { hero_id: heroId });
    },

    async selectHero(heroId) {
        return ApiService.post('/dota/hero/select', { hero_id: heroId });
    },

    async getHeroStats(heroId) {
        return ApiService.get('/dota/hero/stats/get', { hero_id: heroId });
    },

    async healHero(heroId) {
        return ApiService.post('/dota/hero/heal', { hero_id: heroId });
    },

    async upgradeSkill(heroId, skillId) {
        return ApiService.post('/dota/hero/skill/upgrade', {
            hero_id: heroId,
            skill_id: skillId
        });
    },

    async getAllEquipment() {
        return ApiService.get('/dota/equipment/all/get');
    },

    async getShopItems(heroType) {
        const params = {};
        if (heroType) {
            params.hero_type = heroType;
        }
        return ApiService.get('/dota/equipment/shop/get', params);
    },

    async getInventory() {
        return ApiService.get('/dota/equipment/inventory/get');
    },

    async getEquippedItems() {
        return ApiService.get('/dota/equipment/equipped/get');
    },

    async buyEquipment(equipmentId, quantity = 1) {
        return ApiService.post('/dota/equipment/buy', {
            equipment_id: equipmentId,
            quantity
        });
    },

    async equipItem(equipmentId) {
        return ApiService.post('/dota/equipment/equip', {
            equipment_id: equipmentId
        });
    },

    async unequipItem(equipmentId) {
        return ApiService.post('/dota/equipment/unequip', {
            equipment_id: equipmentId
        });
    },

    async getEquipBonuses() {
        return ApiService.get('/dota/equipment/bonuses/get');
    },

    async getStageInfo(stageId) {
        const params = {};
        if (stageId) {
            params.stage_id = stageId;
        }
        return ApiService.get('/dota/stage/info/get', params);
    },

    async getChapterStages(chapter = 1) {
        return ApiService.get('/dota/stage/chapter/get', { chapter });
    },

    async getCurrentStage() {
        return ApiService.get('/dota/stage/current/get');
    },

    async startBattle(heroId, stageId) {
        return ApiService.post('/dota/battle/start', {
            hero_id: heroId,
            stage_id: stageId
        });
    },

    async executeBattleRound(heroId, stageId, skillId = null, targetIndex = 0) {
        const data = {
            hero_id: heroId,
            stage_id: stageId,
            target_index: targetIndex
        };
        if (skillId) {
            data.skill_id = skillId;
        }
        return ApiService.post('/dota/battle/round', data);
    },

    async autoBattle(heroId, stageId) {
        return ApiService.post('/dota/battle/auto', {
            hero_id: heroId,
            stage_id: stageId
        });
    },

    async getBattleHistory(limit = 20) {
        return ApiService.get('/dota/battle/history/get', { limit });
    },

    async getBattleStats() {
        return ApiService.get('/dota/battle/stats/get');
    }
};
