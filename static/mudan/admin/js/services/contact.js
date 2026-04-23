const ContactService = {
    async get() {
        return ApiService.get('/mudan/commercial/contact/get');
    },
    
    async set(phone, wechat) {
        return ApiService.post('/mudan/commercial/contact/set', {
            phone: phone || '',
            wechat: wechat || ''
        });
    },
    
    async getCommercial() {
        return ApiService.get('/mudan/commercial/get');
    }
};
