const ContactService = {
    async getList(params = {}) {
        return API.get('/ims/contact/list/get', params);
    },
    
    async getById(id) {
        return API.get('/ims/contact/item/get', { id });
    },
    
    async add(data) {
        return API.post('/ims/contact/add', data);
    },
    
    async update(data) {
        return API.post('/ims/contact/update', data);
    },
    
    async delete(id) {
        return API.delete('/ims/contact/delete', { id });
    },
    
    async getSuppliers(params = {}) {
        return API.get('/ims/supplier/list/get', params);
    },
    
    async getAllSuppliers() {
        return API.get('/ims/supplier/all/get');
    },
    
    async getCustomers(params = {}) {
        return API.get('/ims/customer/list/get', params);
    },
    
    async getAllCustomers() {
        return API.get('/ims/customer/all/get');
    }
};
