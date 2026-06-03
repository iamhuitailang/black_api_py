const API_BASE_URL = 'http://localhost:8000/api';

class ApiService {
    constructor() {
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    async request(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${url}`, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || '请求失败');
            }

            return data;
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    }

    async get(url) {
        return this.request(url, { method: 'GET' });
    }

    async post(url, data) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(url, data) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(url) {
        return this.request(url, { method: 'DELETE' });
    }

    async register(userData) {
        return this.post('/auth/register', userData);
    }

    async login(credentials) {
        return this.post('/auth/login', credentials);
    }

    async getCurrentUser() {
        return this.get('/auth/me');
    }

    async getSubmarines() {
        return this.get('/submarines/');
    }

    async getUnlockedSubmarines() {
        return this.get('/submarines/unlocked');
    }

    async getCreatures() {
        return this.get('/creatures/');
    }

    async getCreaturesByDepth(depth) {
        return this.get(`/creatures/depth/${depth}`);
    }

    async collectCreature(creatureId) {
        return this.post(`/creatures/${creatureId}/collect`);
    }

    async getTreasures() {
        return this.get('/treasures/');
    }

    async getTreasuresByDepth(depth) {
        return this.get(`/treasures/depth/${depth}`);
    }

    async collectTreasure(treasureId) {
        return this.post(`/treasures/${treasureId}/collect`);
    }

    async getEquipments() {
        return this.get('/equipments/');
    }

    async getUnlockedEquipments() {
        return this.get('/equipments/unlocked');
    }

    async upgradeEquipment(equipmentId) {
        return this.post(`/equipments/${equipmentId}/upgrade`);
    }

    async getMusic() {
        return this.get('/music/');
    }

    async getUnlockedMusic() {
        return this.get('/music/unlocked');
    }

    async getRuins() {
        return this.get('/ruins/');
    }

    async getAvailableRuins() {
        return this.get('/ruins/available');
    }

    async getCollections() {
        return this.get('/collections/');
    }

    async getCollectionsByType(type) {
        return this.get(`/collections/type/${type}`);
    }

    async getProgress() {
        return this.get('/progress/');
    }

    async saveGameState(gameState) {
        return this.post('/progress/game-state', gameState);
    }

    async loadGameState() {
        return this.get('/progress/game-state');
    }

    async updateDepth(depth) {
        return this.put('/progress/depth', { depth });
    }

    async unlockSubmarine(submarineId) {
        return this.post(`/progress/unlock/submarine/${submarineId}`);
    }

    async unlockEquipment(equipmentId) {
        return this.post(`/progress/unlock/equipment/${equipmentId}`);
    }

    async unlockMusic(musicId) {
        return this.post(`/progress/unlock/music/${musicId}`);
    }

    async discoverRuin(ruinId) {
        return this.post(`/progress/discover/ruin/${ruinId}`);
    }

    async updateUser(userId, userData) {
        return this.put(`/users/${userId}`, userData);
    }
}

export const apiService = new ApiService();
