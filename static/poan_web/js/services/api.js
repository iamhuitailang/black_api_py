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

const PoanApi = {
    async register(username, password, nickname) {
        return await ApiService.post('/poan/user/register', { username, password, nickname });
    },

    async login(username, password) {
        return await ApiService.post('/poan/user/login', { username, password });
    },

    async logout() {
        return await ApiService.post('/poan/user/logout');
    },

    async getCurrentUser() {
        return await ApiService.get('/poan/user/current/get');
    },

    async updateProfile(data) {
        return await ApiService.post('/poan/user/profile/update', data);
    },

    async changePassword(oldPassword, newPassword) {
        return await ApiService.post('/poan/user/password/change', { old_password: oldPassword, new_password: newPassword });
    },

    async getCaseList(params = {}) {
        return await ApiService.get('/poan/case/list/get', params);
    },

    async getCaseDetail(caseId) {
        return await ApiService.get('/poan/case/detail/get', { case_id: caseId });
    },

    async getEras() {
        return await ApiService.get('/poan/case/eras/get');
    },

    async initCases() {
        return await ApiService.post('/poan/case/init');
    },

    async startGame(caseId) {
        return await ApiService.post('/poan/game/start', { case_id: caseId });
    },

    async getGameProgress(caseId) {
        return await ApiService.get('/poan/game/progress/get', { case_id: caseId });
    },

    async getClues(caseId) {
        return await ApiService.get('/poan/game/clues/get', { case_id: caseId });
    },

    async collectClue(caseId, clueId) {
        return await ApiService.post('/poan/game/clue/collect', { case_id: caseId, clue_id: clueId });
    },

    async getCharacters(caseId) {
        return await ApiService.get('/poan/game/characters/get', { case_id: caseId });
    },

    async talkToCharacter(caseId, characterId, message = '') {
        return await ApiService.post('/poan/game/character/talk', { case_id: caseId, character_id: characterId, message });
    },

    async getDialogues(characterId, caseId) {
        return await ApiService.get('/poan/game/dialogues/get', { character_id: characterId, case_id: caseId });
    },

    async getTimeline(caseId) {
        return await ApiService.get('/poan/game/timeline/get', { case_id: caseId });
    },

    async submitEvidence(caseId, clueIds, conclusion) {
        return await ApiService.post('/poan/game/evidence/submit', { case_id: caseId, clue_ids: clueIds, conclusion });
    },

    async getQuiz(caseId) {
        return await ApiService.get('/poan/game/quiz/get', { case_id: caseId });
    },

    async answerQuiz(caseId, quizId, answer) {
        return await ApiService.post('/poan/game/quiz/answer', { case_id: caseId, quiz_id: quizId, answer });
    },

    async submitEnding(caseId, endingType) {
        return await ApiService.post('/poan/game/ending/submit', { case_id: caseId, ending_type: endingType });
    },

    async getMyCases(params = {}) {
        return await ApiService.get('/poan/game/my/cases/get', params);
    }
};

window.ApiService = ApiService;
window.PoanApi = PoanApi;
