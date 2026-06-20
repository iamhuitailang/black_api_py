const TutorService = {
    async createDemand(data) {
        return ApiService.post('/tutor/demand/create', data);
    },

    async getMyDemands() {
        return ApiService.get('/tutor/demand/my/get');
    },

    async getActiveDemands() {
        return ApiService.get('/tutor/demand/list/get');
    },

    async updateDemand(id, data) {
        return ApiService.post('/tutor/demand/update', data, { id });
    },

    async deleteDemand(id) {
        return ApiService.post('/tutor/demand/delete', {}, { id });
    },

    async listTeachers() {
        return ApiService.get('/tutor/teacher/list/get');
    },

    async getTeacherDetail(id) {
        return ApiService.get('/tutor/teacher/detail/get', { id });
    },

    async matchTeachers(demandId) {
        return ApiService.get('/tutor/match/teachers/get', { demand_id: demandId });
    },

    async matchDemands() {
        return ApiService.get('/tutor/match/demands/get');
    },

    async createCourse(data) {
        return ApiService.post('/tutor/course/create', data);
    },

    async getMyCourses() {
        return ApiService.get('/tutor/course/my/get');
    },

    async getWeekCourses(weekStart, weekEnd) {
        return ApiService.get('/tutor/course/week/get', { week_start: weekStart, week_end: weekEnd });
    },

    async confirmCourse(id) {
        return ApiService.post('/tutor/course/confirm', {}, { id });
    },

    async cancelCourse(id) {
        return ApiService.post('/tutor/course/cancel', {}, { id });
    }
};
