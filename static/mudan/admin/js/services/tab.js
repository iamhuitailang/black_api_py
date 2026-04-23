const TabService = {
    async getList() {
        return ApiService.get('/mudan/tab/list/get');
    },
    
    async set(tabId, tabName, sortOrder) {
        const data = { tab_name: tabName };
        if (tabId !== null && tabId !== undefined) data.tab_id = tabId;
        if (sortOrder !== null && sortOrder !== undefined) data.sort_order = sortOrder;
        return ApiService.post('/mudan/tab/list/set', data);
    },
    
    async delete(tabId) {
        return ApiService.delete('/mudan/tab/list/delete', { tab_id: tabId });
    },
    
    async getDetail(tabId) {
        return ApiService.get('/mudan/tab/detail/get', { tab_id: tabId });
    },
    
    async setDetail(tabId, title, content) {
        return ApiService.post('/mudan/tab/detail/set', {
            tab_id: tabId,
            title: title || '',
            content: content || ''
        });
    }
};
