const CourseService = {
    async getList(params = {}) {
        return await ApiService.get('/jianshen/course/list/get', params);
    },

    async getDetail(courseId) {
        return await ApiService.get('/jianshen/course/detail/get', { course_id: courseId });
    },

    async create(data) {
        return await ApiService.post('/jianshen/course/create', data);
    },

    async update(courseId, data) {
        return await ApiService.post('/jianshen/course/update', { course_id: courseId, ...data });
    },

    async delete(courseId) {
        return await ApiService.post('/jianshen/course/delete', { course_id: courseId });
    },

    async updateStatus(courseId, status) {
        return await ApiService.post('/jianshen/course/status/update', { course_id: courseId, status });
    },

    async getCategories() {
        return await ApiService.get('/jianshen/course/categories/get');
    }
};

window.CourseService = CourseService;
