const ComplaintService = {
    async create(data) { return await ApiService.post('/ershoushu/complaint/create', data); },
    async getMyComplaints(params = {}) { return await ApiService.get('/ershoushu/complaint/my/list/get', params); },
    async getAdminList(params = {}) { return await ApiService.get('/ershoushu/complaint/admin/list/get', params); },
    async handle(complaintId, data) { return await ApiService.post('/ershoushu/complaint/handle?complaint_id=' + complaintId, data); },
    async getStatistics() { return await ApiService.get('/ershoushu/complaint/statistics/get'); }
};
