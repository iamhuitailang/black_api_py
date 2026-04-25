const InventoryService = {
    async getList(params = {}) {
        return API.get('/ims/inventory/list/get', params);
    },
    
    async getById(id) {
        return API.get('/ims/inventory/item/get', { id });
    },
    
    async getByVariety(varietyId) {
        return API.get('/ims/inventory/by_variety/get', { variety_id: varietyId });
    },
    
    async update(data) {
        return API.post('/ims/inventory/update', data);
    },
    
    async delete(id) {
        return API.delete('/ims/inventory/delete', { id });
    },
    
    async getWarnings() {
        return API.get('/ims/inventory/warning/get');
    }
};
