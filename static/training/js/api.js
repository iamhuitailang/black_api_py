const API_BASE = '/api';

const Api = {
    async request(url, options = {}) {
        try {
            const response = await fetch(API_BASE + url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            const data = await response.json();
            return data;
        } catch (error) {
            return { code: 500, message: '网络请求失败: ' + error.message, data: null };
        }
    },

    async get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(url + (queryString ? '?' + queryString : ''), { method: 'GET' });
    },

    async post(url, data = {}) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async put(url, data = {}) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async delete(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(url + (queryString ? '?' + queryString : ''), { method: 'DELETE' });
    },

    async initDemo() {
        return this.get('/training/initdemo/get');
    },

    async getEmployees() {
        return this.get('/training/employees/get');
    },

    async getDepartments() {
        return this.get('/training/departments/get');
    },

    async getCourses(status) {
        const params = {};
        if (status) params.status = status;
        return this.get('/training/courses/get', params);
    },

    async getCourse(id) {
        return this.get('/training/course/get', { id });
    },

    async createCourse(data) {
        return this.post('/training/course', data);
    },

    async updateCourse(data) {
        return this.put('/training/course/put', data);
    },

    async deleteCourse(id) {
        return this.delete('/training/course/delete', { id });
    },

    async getEmployeeCourses(employeeId) {
        return this.get('/training/employeecourses/get', { employee_id: employeeId });
    },

    async confirmEnrollment(enrollmentId) {
        return this.post('/training/confirmenrollment', { enrollment_id: enrollmentId });
    },

    async requestLeave(enrollmentId, reason) {
        return this.post('/training/requestleave', { enrollment_id: enrollmentId, reason });
    },

    async getLeaveRequests(status) {
        const params = {};
        if (status) params.status = status;
        return this.get('/training/leaverequests/get', params);
    },

    async approveLeave(leaveId) {
        return this.post('/training/approveleave', { leave_id: leaveId });
    },

    async rejectLeave(leaveId) {
        return this.post('/training/rejectleave', { leave_id: leaveId });
    },

    async checkIn(enrollmentId) {
        return this.post('/training/checkin', { enrollment_id: enrollmentId });
    },

    async getCourseAttendance(id) {
        return this.get('/training/courseattendance/get', { id });
    },

    async getQuiz(courseId) {
        return this.get('/training/quiz/get', { course_id: courseId });
    },

    async getEmployeeQuiz(courseId, employeeId) {
        return this.get('/training/employeequiz/get', { course_id: courseId, employee_id: employeeId });
    },

    async saveQuiz(courseId, questions) {
        return this.post('/training/quiz', { course_id: courseId, questions });
    },

    async submitQuiz(enrollmentId, answers) {
        return this.post('/training/submitquiz', { enrollment_id: enrollmentId, answers });
    },

    async getEmployeeProfile(employeeId) {
        return this.get('/training/employeeprofile/get', { employee_id: employeeId });
    },

    async getStatistics() {
        return this.get('/training/statistics/get');
    },

    getCertificateUrl(employeeId, courseId) {
        return API_BASE + `/training/exportcertificate/get?employee_id=${employeeId}&course_id=${courseId}`;
    },

    getCertificateHtmlUrl(employeeId, courseId) {
        return API_BASE + `/training/certificate/get?employee_id=${employeeId}&course_id=${courseId}`;
    }
};

window.Api = Api;
