const MindmapService = {
    async createMap(title, description = '', theme = 'classic', layout = 'right') {
        return await ApiService.post('/siwei/map/create', { title, description, theme, layout });
    },

    async createMapFromTemplate(templateId, title = '') {
        return await ApiService.post('/siwei/map/from/template/create', { template_id: templateId, title });
    },

    async getMapDetail(mapId) {
        return await ApiService.get('/siwei/map/detail/get', { map_id: mapId });
    },

    async updateMap(mapId, data) {
        return await ApiService.post(`/siwei/map/update?map_id=${mapId}`, data);
    },

    async deleteMap(mapId) {
        return await ApiService.post(`/siwei/map/delete?map_id=${mapId}`);
    },

    async getMyMaps(page = 1, pageSize = 10, keyword = '') {
        const params = { page, page_size: pageSize };
        if (keyword) params.keyword = keyword;
        return await ApiService.get('/siwei/map/my/list/get', params);
    },

    async getSharedMaps(page = 1, pageSize = 10, keyword = '') {
        const params = { page, page_size: pageSize };
        if (keyword) params.keyword = keyword;
        return await ApiService.get('/siwei/map/shared/list/get', params);
    },

    async createNode(mapId, data) {
        return await ApiService.post(`/siwei/node/create?map_id=${mapId}`, data);
    },

    async updateNode(mapId, nodeId, data) {
        return await ApiService.post(`/siwei/node/update?map_id=${mapId}&node_id=${nodeId}`, data);
    },

    async deleteNode(mapId, nodeId) {
        return await ApiService.post(`/siwei/node/delete?map_id=${mapId}&node_id=${nodeId}`);
    },

    async batchUpdateNodes(mapId, nodes) {
        return await ApiService.post(`/siwei/node/batch/update?map_id=${mapId}`, { nodes });
    },

    async createEdge(mapId, data) {
        return await ApiService.post(`/siwei/edge/create?map_id=${mapId}`, data);
    },

    async updateEdge(mapId, edgeId, data) {
        return await ApiService.post(`/siwei/edge/update?map_id=${mapId}&edge_id=${edgeId}`, data);
    },

    async deleteEdge(mapId, edgeId) {
        return await ApiService.post(`/siwei/edge/delete?map_id=${mapId}&edge_id=${edgeId}`);
    },

    async getThemes() {
        return await ApiService.get('/siwei/theme/list/get');
    },

    async getLayouts() {
        return await ApiService.get('/siwei/layout/list/get');
    },

    async getTemplateList(page = 1, pageSize = 10, category = '') {
        const params = { page, page_size: pageSize };
        if (category) params.category = category;
        return await ApiService.get('/siwei/template/list/get', params);
    },

    async getTemplateDetail(templateId) {
        return await ApiService.get('/siwei/template/detail/get', { template_id: templateId });
    },

    async getTemplateCategories() {
        return await ApiService.get('/siwei/template/categories/get');
    },

    async addCollaborator(mapId, username, role = 'viewer') {
        return await ApiService.post(`/siwei/collaborator/add?map_id=${mapId}`, { username, role });
    },

    async removeCollaborator(mapId, userId) {
        return await ApiService.post(`/siwei/collaborator/remove?map_id=${mapId}&user_id=${userId}`);
    },

    async updateCollaboratorRole(mapId, userId, role) {
        return await ApiService.post(`/siwei/collaborator/role/update?map_id=${mapId}&user_id=${userId}`, { role });
    },

    async getCollaborators(mapId) {
        return await ApiService.get('/siwei/collaborator/list/get', { map_id: mapId });
    },

    async searchUser(username) {
        return await ApiService.get('/siwei/user/search/get', { username });
    }
};
