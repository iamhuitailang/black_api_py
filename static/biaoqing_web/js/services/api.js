const API_BASE = '/api/bq';

const axiosInstance = axios.create({
    baseURL: API_BASE,
    timeout: 10000
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = Storage.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response) => {
        const data = response.data;
        const config = response.config;
        if (data.code !== 0) {
            if (!config.skipErrorToast) {
                Utils.showToast(data.msg || '请求失败', 'error');
            }
            if (data.code === 401) {
                Storage.removeToken();
                Storage.removeUser();
                window.router.push({ name: 'login' });
            }
            return Promise.reject(data);
        }
        return data;
    },
    (error) => {
        const config = error.config || {};
        if (error.response && error.response.status === 401) {
            Storage.removeToken();
            Storage.removeUser();
            Utils.showToast('登录已过期，请重新登录', 'warning');
            window.router.push({ name: 'login' });
        } else if (!config.skipErrorToast) {
            Utils.showToast(error.message || '网络错误', 'error');
        }
        return Promise.reject(error);
    }
);

const API = {
    user: {
        register(username, email, password, nickname = '', phone = '') {
            return axiosInstance.post('/user/register', { username, email, password, nickname, phone });
        },

        login(username, password) {
            return axiosInstance.post('/user/login', { username, password });
        },

        logout() {
            return axiosInstance.post('/user/logout');
        },

        getCurrentUser() {
            return axiosInstance.get('/user/current/get');
        },

        updateProfile(data) {
            return axiosInstance.post('/user/profile/update', data);
        },

        changePassword(old_password, new_password) {
            return axiosInstance.post('/user/password/change', { old_password, new_password });
        },

        getUserById(user_id) {
            return axiosInstance.get('/user/detail/get', { params: { user_id } });
        },

        signIn() {
            return axiosInstance.post('/user/sign/in');
        },

        getPointLogs(page = 1, page_size = 20, type = null) {
            return axiosInstance.get('/user/point/logs/get', { params: { page, page_size, type } });
        },

        getUserList(page = 1, page_size = 10, status = null, role = null, keyword = null) {
            return axiosInstance.get('/user/list/get', { params: { page, page_size, status, role, keyword } });
        },

        updateUserStatus(user_id, status) {
            return axiosInstance.post('/user/status/update', null, { params: { user_id, status } });
        }
    },

    emoji: {
        create(data) {
            return axiosInstance.post('/emoji/create', data);
        },

        update(emoji_id, data) {
            return axiosInstance.post('/emoji/update', data, { params: { emoji_id } });
        },

        delete(emoji_id) {
            return axiosInstance.post('/emoji/delete', null, { params: { emoji_id } });
        },

        getById(emoji_id) {
            return axiosInstance.get('/emoji/detail/get', { params: { emoji_id } });
        },

        getList(page = 1, page_size = 20, category_id = null, sort_by = 'latest') {
            return axiosInstance.get('/emoji/list/get', { params: { page, page_size, category_id, sort_by } });
        },

        getHotList(page = 1, page_size = 20, category_id = null) {
            return axiosInstance.get('/emoji/hot/list/get', { params: { page, page_size, category_id } });
        },

        getLatestList(page = 1, page_size = 20, category_id = null) {
            return axiosInstance.get('/emoji/latest/list/get', { params: { page, page_size, category_id } });
        },

        getRecommendList(page = 1, page_size = 20) {
            return axiosInstance.get('/emoji/recommend/list/get', { params: { page, page_size } });
        },

        getRandomList(limit = 10, category_id = null) {
            return axiosInstance.get('/emoji/random/list/get', { params: { limit, category_id } });
        },

        search(keyword, page = 1, page_size = 20, sort_by = 'latest', category_id = null) {
            return axiosInstance.get('/emoji/search/get', { params: { keyword, page, page_size, sort_by, category_id } });
        },

        getMyUploads(page = 1, page_size = 20, status = null) {
            return axiosInstance.get('/emoji/my/uploads/get', { params: { page, page_size, status } });
        },

        toggleFavorite(emoji_id) {
            return axiosInstance.post('/emoji/favorite/toggle', null, { params: { emoji_id } });
        },

        getFavorites(page = 1, page_size = 20) {
            return axiosInstance.get('/emoji/favorites/get', { params: { page, page_size } });
        },

        addReview(emoji_id, content, rating = 5) {
            return axiosInstance.post('/emoji/review/add', { emoji_id, content, rating });
        },

        getReviews(emoji_id, page = 1, page_size = 20) {
            return axiosInstance.get('/emoji/reviews/get', { params: { emoji_id, page, page_size } });
        },

        recordDownload(emoji_id) {
            return axiosInstance.post('/emoji/download/record', null, { params: { emoji_id } });
        },

        getDownloads(page = 1, page_size = 20) {
            return axiosInstance.get('/emoji/downloads/get', { params: { page, page_size } });
        },

        getHotTags(limit = 20) {
            return axiosInstance.get('/emoji/hot/tags/get', { params: { limit } });
        },

        getHotKeywords(limit = 10) {
            return axiosInstance.get('/emoji/hot/keywords/get', { params: { limit } });
        },

        getSearchHistory(limit = 20) {
            return axiosInstance.get('/emoji/search/history/get', { params: { limit } });
        },

        upload(formData) {
            return axiosInstance.post('/emoji/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
        },

        clearSearchHistory() {
            return axiosInstance.post('/emoji/search/history/clear');
        },

        getPendingList(page = 1, page_size = 20) {
            return axiosInstance.get('/emoji/pending/list/get', { params: { page, page_size } });
        },

        updateStatus(emoji_id, status) {
            return axiosInstance.post('/emoji/status/update', null, { params: { emoji_id, status } });
        }
    },

    category: {
        create(name, icon = '', description = '', sort_order = 0) {
            return axiosInstance.post('/category/create', { name, icon, description, sort_order });
        },

        update(category_id, data) {
            return axiosInstance.post('/category/update', data, { params: { category_id } });
        },

        delete(category_id) {
            return axiosInstance.post('/category/delete', null, { params: { category_id } });
        },

        getById(category_id) {
            return axiosInstance.get('/category/detail/get', { params: { category_id } });
        },

        getAll(include_disabled = false) {
            return axiosInstance.get('/category/all/get', { params: { include_disabled } });
        },

        getList(page = 1, page_size = 20, status = null) {
            return axiosInstance.get('/category/list/get', { params: { page, page_size, status } });
        }
    },

    admin: {
        login(username, password) {
            return axiosInstance.post('/admin/login', { username, password });
        },

        logout() {
            return axiosInstance.post('/admin/logout');
        },

        getCurrentAdmin() {
            return axiosInstance.get('/admin/current/get');
        },

        createAdmin(username, password, nickname = '', avatar = '', role = 1) {
            return axiosInstance.post('/admin/create', { username, password, nickname, avatar, role });
        },

        getAdminList(page = 1, page_size = 10, status = null, role = null, keyword = null) {
            return axiosInstance.get('/admin/list/get', { params: { page, page_size, status, role, keyword } });
        },

        updateAdminStatus(admin_id, status) {
            return axiosInstance.post('/admin/status/update', null, { params: { admin_id, status } });
        },

        changePassword(old_password, new_password) {
            return axiosInstance.post('/admin/password/change', { old_password, new_password });
        },

        deleteAdmin(admin_id) {
            return axiosInstance.post('/admin/delete', null, { params: { admin_id } });
        }
    },

    activity: {
        create(data) {
            return axiosInstance.post('/activity/create', data);
        },

        update(activity_id, data) {
            return axiosInstance.post('/activity/update', data, { params: { activity_id } });
        },

        delete(activity_id) {
            return axiosInstance.post('/activity/delete', null, { params: { activity_id } });
        },

        getById(activity_id) {
            return axiosInstance.get('/activity/detail/get', { params: { activity_id } });
        },

        getActiveList(page = 1, page_size = 20) {
            return axiosInstance.get('/activity/active/list/get', { params: { page, page_size } });
        },

        getList(page = 1, page_size = 20, status = null) {
            return axiosInstance.get('/activity/list/get', { params: { page, page_size, status } });
        },

        register(activity_id, name = '', phone = '', email = '', extra_info = '') {
            return axiosInstance.post('/activity/register', { activity_id, name, phone, email, extra_info });
        },

        cancelRegistration(registration_id) {
            return axiosInstance.post('/activity/register/cancel', null, { params: { registration_id } });
        },

        getRegistrations(activity_id, page = 1, page_size = 20, status = null) {
            return axiosInstance.get('/activity/registrations/get', { params: { activity_id, page, page_size, status } });
        },

        getMyRegistrations(page = 1, page_size = 20, status = null) {
            return axiosInstance.get('/activity/my/registrations/get', { params: { page, page_size, status } });
        },

        updateRegistrationStatus(registration_id, status) {
            return axiosInstance.post('/activity/registration/status/update', null, { params: { registration_id, status } });
        },

        incrementViewCount(activity_id) {
            return axiosInstance.post('/activity/view/count/increment', null, { params: { activity_id } });
        }
    },

    ad: {
        create(data) {
            return axiosInstance.post('/ad/create', data);
        },

        update(ad_id, data) {
            return axiosInstance.post('/ad/update', data, { params: { ad_id } });
        },

        delete(ad_id) {
            return axiosInstance.post('/ad/delete', null, { params: { ad_id } });
        },

        getById(ad_id) {
            return axiosInstance.get('/ad/detail/get', { params: { ad_id } });
        },

        getByPosition(position, limit = 10) {
            return axiosInstance.get('/ad/position/get', { params: { position, limit } });
        },

        getList(page = 1, page_size = 20, status = null, position = null) {
            return axiosInstance.get('/ad/list/get', { params: { page, page_size, status, position } });
        },

        recordClick(ad_id) {
            return axiosInstance.post('/ad/click/record', null, { params: { ad_id } });
        }
    },

    message: {
        getList(page = 1, page_size = 20, status = null, type = null) {
            return axiosInstance.get('/message/list/get', { params: { page, page_size, status, type } });
        },

        getById(message_id) {
            return axiosInstance.get('/message/detail/get', { params: { message_id } });
        },

        getUnreadCount() {
            return axiosInstance.get('/message/unread/count/get', { skipErrorToast: true });
        },

        markAsRead(message_id) {
            return axiosInstance.post('/message/mark/read', null, { params: { message_id } });
        },

        markAllAsRead() {
            return axiosInstance.post('/message/mark/all/read');
        },

        delete(message_id) {
            return axiosInstance.post('/message/delete', null, { params: { message_id } });
        }
    },

    report: {
        create(type, target_id, reason, description = '', images = '') {
            return axiosInstance.post('/report/create', { type, target_id, reason, description, images });
        },

        getById(report_id) {
            return axiosInstance.get('/report/detail/get', { params: { report_id } });
        },

        getMyReports(page = 1, page_size = 20, status = null) {
            return axiosInstance.get('/report/my/list/get', { params: { page, page_size, status } });
        },

        getList(page = 1, page_size = 20, status = null, type = null) {
            return axiosInstance.get('/report/list/get', { params: { page, page_size, status, type } });
        },

        handle(report_id, status, handle_result = '') {
            return axiosInstance.post('/report/handle', { report_id, status, handle_result });
        }
    }
};

window.API = API;
