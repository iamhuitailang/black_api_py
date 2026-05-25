const ChongwuApi = {
    async getPetList(params = {}) {
        const { page = 1, page_size = 50, species, keyword } = params;
        return ApiService.get('/chongwu/pet/list/get', { page, page_size, species, keyword });
    },

    async getPet(petId) {
        return ApiService.get('/chongwu/pet/get', { pet_id: petId });
    },

    async createPet(data) {
        return ApiService.post('/chongwu/pet/create', data);
    },

    async updatePet(petId, data) {
        return ApiService.post(`/chongwu/pet/update?pet_id=${petId}`, data);
    },

    async deletePet(petId) {
        return ApiService.post(`/chongwu/pet/delete?pet_id=${petId}`);
    },

    async getPetProfile(petId) {
        return ApiService.get('/chongwu/pet/profile/get', { pet_id: petId });
    },

    async getHealthList(petId, params = {}) {
        const { page = 1, page_size = 50 } = params;
        return ApiService.get('/chongwu/health/list/get', { pet_id: petId, page, page_size });
    },

    async createHealth(petId, data) {
        return ApiService.post(`/chongwu/health/create?pet_id=${petId}`, data);
    },

    async updateHealth(recordId, data) {
        return ApiService.post(`/chongwu/health/update?record_id=${recordId}`, data);
    },

    async deleteHealth(recordId) {
        return ApiService.post(`/chongwu/health/delete?record_id=${recordId}`);
    },

    async getDiaryList(petId, params = {}) {
        const { page = 1, page_size = 50 } = params;
        return ApiService.get('/chongwu/diary/list/get', { pet_id: petId, page, page_size });
    },

    async createDiary(petId, data) {
        return ApiService.post(`/chongwu/diary/create?pet_id=${petId}`, data);
    },

    async updateDiary(recordId, data) {
        return ApiService.post(`/chongwu/diary/update?record_id=${recordId}`, data);
    },

    async deleteDiary(recordId) {
        return ApiService.post(`/chongwu/diary/delete?record_id=${recordId}`);
    },

    async getReminderList(params = {}) {
        const { pet_id, page = 1, page_size = 50 } = params;
        const queryParams = { page, page_size };
        if (pet_id) queryParams.pet_id = pet_id;
        return ApiService.get('/chongwu/reminder/list/get', queryParams);
    },

    async createReminder(petId, data) {
        return ApiService.post(`/chongwu/reminder/create?pet_id=${petId}`, data);
    },

    async updateReminder(recordId, data) {
        return ApiService.post(`/chongwu/reminder/update?record_id=${recordId}`, data);
    },

    async deleteReminder(recordId) {
        return ApiService.post(`/chongwu/reminder/delete?record_id=${recordId}`);
    },

    async getPhotoList(params = {}) {
        const { pet_id, page = 1, page_size = 50 } = params;
        const queryParams = { page, page_size };
        if (pet_id) queryParams.pet_id = pet_id;
        return ApiService.get('/chongwu/photo/list/get', queryParams);
    },

    async createPhoto(petId, data) {
        return ApiService.post(`/chongwu/photo/create?pet_id=${petId}`, data);
    },

    async updatePhoto(recordId, data) {
        return ApiService.post(`/chongwu/photo/update?record_id=${recordId}`, data);
    },

    async deletePhoto(recordId) {
        return ApiService.post(`/chongwu/photo/delete?record_id=${recordId}`);
    },

    async getMedicalList(petId, params = {}) {
        const { page = 1, page_size = 50 } = params;
        return ApiService.get('/chongwu/medical/list/get', { pet_id: petId, page, page_size });
    },

    async createMedical(petId, data) {
        return ApiService.post(`/chongwu/medical/create?pet_id=${petId}`, data);
    },

    async updateMedical(recordId, data) {
        return ApiService.post(`/chongwu/medical/update?record_id=${recordId}`, data);
    },

    async deleteMedical(recordId) {
        return ApiService.post(`/chongwu/medical/delete?record_id=${recordId}`);
    },

    async getVaccineList(petId, params = {}) {
        const { page = 1, page_size = 50 } = params;
        return ApiService.get('/chongwu/vaccine/list/get', { pet_id: petId, page, page_size });
    },

    async createVaccine(petId, data) {
        return ApiService.post(`/chongwu/vaccine/create?pet_id=${petId}`, data);
    },

    async updateVaccine(recordId, data) {
        return ApiService.post(`/chongwu/vaccine/update?record_id=${recordId}`, data);
    },

    async deleteVaccine(recordId) {
        return ApiService.post(`/chongwu/vaccine/delete?record_id=${recordId}`);
    },

    async getWeightList(petId, params = {}) {
        const { page = 1, page_size = 50 } = params;
        return ApiService.get('/chongwu/weight/list/get', { pet_id: petId, page, page_size });
    },

    async getWeightChart(petId) {
        return ApiService.get('/chongwu/weight/chart/get', { pet_id: petId });
    },

    async createWeight(petId, data) {
        return ApiService.post(`/chongwu/weight/create?pet_id=${petId}`, data);
    },

    async updateWeight(recordId, data) {
        return ApiService.post(`/chongwu/weight/update?record_id=${recordId}`, data);
    },

    async deleteWeight(recordId) {
        return ApiService.post(`/chongwu/weight/delete?record_id=${recordId}`);
    }
};