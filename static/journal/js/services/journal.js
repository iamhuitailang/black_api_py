const JournalService = {
    // Auth
    async login(username, password) {
        const res = await Http.post('/auth/login', { username, password });
        if (res.code === 0 && res.data) {
            Storage.setToken(res.data.token);
            Storage.setUser(res.data.user);
        }
        return res;
    },
    async logout() {
        const token = Storage.getToken();
        if (token) {
            await Http.post('/auth/logout', { token });
        }
        Storage.clear();
        return { code: 0, message: 'success' };
    },
    async getCurrentUser() {
        return Http.get('/auth/current/get');
    },

    // User Profile & Role
    async getProfile() {
        return Http.get('/journal/profile/get');
    },
    async updateProfile(data) {
        return Http.post('/journal/profile/set', data);
    },
    async getRoleInfo() {
        return Http.get('/journal/role/get');
    },
    async getReviewerList() {
        return Http.get('/journal/reviewer/list/get');
    },

    // Sections (栏目)
    async getSections() {
        return Http.get('/journal/section/list/get');
    },

    // Manuscript (投稿/稿件)
    async uploadFile(file, onProgress) {
        return Http.upload('/journal/manuscript/upload', file, onProgress);
    },
    async createManuscript(data) {
        return Http.post('/journal/manuscript/set', {
            ...data,
            manuscript_id: undefined
        });
    },
    async updateManuscript(data) {
        return Http.post('/journal/manuscript/set', data);
    },
    async submitManuscript(manuscript_id) {
        return Http.post('/journal/manuscript/submit', { manuscript_id });
    },
    async deleteManuscript(manuscript_id) {
        return Http.post('/journal/manuscript/delete', { manuscript_id });
    },
    async getMySubmissions(page = 1, page_size = 10) {
        return Http.get('/journal/manuscript/list/get', { page, page_size });
    },
    async getManuscriptDetail(manuscript_id) {
        return Http.get('/journal/manuscript/detail/get', { manuscript_id });
    },

    // Review (审稿)
    async assignReviewer(manuscript_id, reviewer_user_id) {
        return Http.post('/journal/review/assign', { manuscript_id, reviewer_user_id });
    },
    async removeAssignment(assignment_id) {
        return Http.post('/journal/review/assign/delete', { assignment_id });
    },
    async acceptAssignment(assignment_id) {
        return Http.post('/journal/review/assignment/accept', { assignment_id });
    },
    async declineAssignment(assignment_id) {
        return Http.post('/journal/review/assignment/decline', { assignment_id });
    },
    async submitReview(data) {
        return Http.post('/journal/review/submit', data);
    },
    async getReviewTasks(status = null, page = 1, page_size = 20) {
        const params = { page, page_size };
        if (status) params.status = status;
        return Http.get('/journal/review/task/list/get', params);
    },
    async getReviewTaskStats() {
        return Http.get('/journal/review/task/stats/get');
    },
    async getManuscriptAssignments(manuscript_id) {
        return Http.get('/journal/manuscript/assignments/get', { manuscript_id });
    },
    async getReviewDetail(review_id) {
        return Http.get('/journal/review/detail/get', { review_id });
    },

    // Editor (编辑)
    async getAllManuscripts(status = null, page = 1, page_size = 10) {
        const params = { page, page_size };
        if (status) params.status = status;
        return Http.get('/journal/editor/all/list/get', params);
    },
    async makeEditorDecision(manuscript_id, decision, comment = '') {
        return Http.post('/journal/editor/decision', { manuscript_id, decision, comment });
    },
    async markAsPublished(manuscript_id) {
        return Http.post('/journal/editor/published', { manuscript_id });
    },
    async sendBackRevision(manuscript_id) {
        return Http.post('/journal/editor/revision/back', { manuscript_id });
    },
    async getEditorDashboard() {
        return Http.get('/journal/editor/dashboard/get');
    }
};
