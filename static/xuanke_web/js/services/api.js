const API = {
    baseURL: '/api',
    timeout: 15000,

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        const token = Storage.getToken();
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
        return headers;
    },

    async request(method, url, data = null, params = null) {
        try {
            const config = {
                method: method,
                url: this.baseURL + url,
                headers: this.getHeaders(),
                timeout: this.timeout
            };

            if (data) {
                config.data = data;
            }

            if (params) {
                config.params = params;
            }

            const response = await axios(config);
            
            if (response.data.code === 401) {
                Storage.clear();
                Router.navigate('/login');
                return response.data;
            }
            
            return response.data;
        } catch (error) {
            console.error('API Error:', error);
            if (error.response && error.response.status === 401) {
                Storage.clear();
                Router.navigate('/login');
            }
            return {
                code: 1,
                msg: error.message || '请求失败',
                data: null
            };
        }
    },

    get(url, params = null) {
        return this.request('GET', url, null, params);
    },

    post(url, data = null) {
        return this.request('POST', url, data);
    },

    put(url, data = null) {
        return this.request('PUT', url, data);
    },

    delete(url) {
        return this.request('DELETE', url);
    },

    user: {
        register(data) {
            return API.post('/xuanke/user/register', data);
        },
        login(data) {
            return API.post('/xuanke/user/login', data);
        },
        logout() {
            return API.post('/xuanke/user/logout');
        },
        getCurrent() {
            return API.get('/xuanke/user/current/get');
        },
        updateProfile(data) {
            return API.post('/xuanke/user/profile/update', data);
        },
        changePassword(data) {
            return API.post('/xuanke/user/password/change', data);
        },
        getDetail(userId) {
            return API.get('/xuanke/user/detail/get', { user_id: userId });
        },
        getList(params) {
            return API.get('/xuanke/user/list/get', params);
        }
    },

    course: {
        getList(params) {
            return API.get('/xuanke/course/list/get', params);
        },
        getAll() {
            return API.get('/xuanke/course/all/get');
        },
        getDetail(courseId) {
            return API.get('/xuanke/course/detail/get', { course_id: courseId });
        },
        getTeachers() {
            return API.get('/xuanke/course/teachers/get');
        },
        getStatistics() {
            return API.get('/xuanke/course/statistics/get');
        },
        create(data) {
            return API.post('/xuanke/course/create', data);
        },
        update(data) {
            return API.post('/xuanke/course/update?course_id=' + data.id, data);
        },
        delete(courseId) {
            return API.post('/xuanke/course/delete?course_id=' + courseId);
        }
    },

    enrollment: {
        enroll(courseId) {
            return API.post('/xuanke/enrollment/enroll', { course_id: courseId });
        },
        drop(courseId) {
            return API.post('/xuanke/enrollment/drop', { course_id: courseId });
        },
        getMyCourses() {
            return API.get('/xuanke/enrollment/my/courses/get');
        },
        getSchedule() {
            return API.get('/xuanke/enrollment/schedule/get');
        },
        getPhase() {
            return API.get('/xuanke/enrollment/phase/get');
        },
        getCourseStudents(courseId) {
            return API.get('/xuanke/enrollment/course/students/get', { course_id: courseId });
        },
        batchRequired() {
            return API.post('/xuanke/enrollment/batch/required');
        }
    },

    grade: {
        getMyGrades() {
            return API.get('/xuanke/grade/my/grades/get');
        },
        getCourseGrades(courseId) {
            return API.get('/xuanke/grade/course/grades/get', { course_id: courseId });
        },
        getGpaRanking() {
            return API.get('/xuanke/grade/gpa/ranking/get');
        },
        getPointTable() {
            return API.get('/xuanke/grade/point/table/get');
        },
        input(data) {
            return API.post('/xuanke/grade/input', data);
        },
        batchInput(data) {
            return API.post('/xuanke/grade/batch/input', data);
        },
        update(data) {
            return API.post('/xuanke/grade/update?grade_id=' + data.grade_id, data);
        },
        delete(gradeId) {
            return API.post('/xuanke/grade/delete?grade_id=' + gradeId);
        }
    },

    review: {
        create(data) {
            return API.post('/xuanke/review/create', data);
        },
        update(data) {
            return API.post('/xuanke/review/update', data);
        },
        delete(reviewId) {
            return API.post('/xuanke/review/delete?review_id=' + reviewId);
        },
        getMyReviews() {
            return API.get('/xuanke/review/my/reviews/get');
        },
        getCourseReviews(courseId) {
            return API.get('/xuanke/review/course/reviews/get', { course_id: courseId });
        },
        getList(params) {
            return API.get('/xuanke/review/list/get', params);
        },
        updateStatus(data) {
            return API.post('/xuanke/review/status/update', data);
        }
    },

    admin: {
        getRules() {
            return API.get('/xuanke/admin/rules/get');
        },
        updateRule(data) {
            return API.post('/xuanke/admin/rule/update', data);
        },
        createRule(data) {
            return API.post('/xuanke/admin/rule/create', data);
        },
        deleteRule(ruleId) {
            return API.post('/xuanke/admin/rule/delete?rule_id=' + ruleId);
        },
        setPhase(phase) {
            return API.post('/xuanke/admin/phase/set', { phase: phase });
        },
        runLottery() {
            return API.post('/xuanke/admin/lottery/run');
        },
        getStatistics() {
            return API.get('/xuanke/admin/statistics/get');
        },
        createUser(data) {
            return API.post('/xuanke/admin/user/create', data);
        },
        updateUser(data) {
            return API.post('/xuanke/admin/user/update?user_id=' + data.id, data);
        },
        deleteUser(userId) {
            return API.post('/xuanke/admin/user/delete?user_id=' + userId);
        },
        exportEnrollments() {
            return API.get('/xuanke/admin/export/enrollments/get');
        }
    }
};
