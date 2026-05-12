const API_BASE = '/api';

async function apiRequest(url, method = 'GET', data = null, requiresAuth = true) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (requiresAuth) {
        const token = localStorage.getItem('order_admin_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    const options = {
        method,
        headers
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE}${url}`, options);
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API Error:', error);
        return {
            code: 1,
            msg: '网络错误',
            data: null
        };
    }
}

const OrderAdminAPI = {
    auth: {
        login: (username, password) => apiRequest('/order/admin/login', 'POST', { username, password }, false),
        logout: () => apiRequest('/order/admin/logout', 'POST'),
        currentUser: () => apiRequest('/order/admin/current/user/get', 'GET')
    },

    dishes: {
        list: (categoryId = null, status = null, keyword = null) => {
            let params = [];
            if (categoryId) params.push(`category_id=${categoryId}`);
            if (status !== null) params.push(`status=${status}`);
            if (keyword) params.push(`keyword=${keyword}`);
            const query = params.length ? `?${params.join('&')}` : '';
            return apiRequest(`/order/dish/list/get${query}`);
        },
        all: (page = 1, pageSize = 100, categoryId = null, status = null) => {
            let params = [`page=${page}`, `page_size=${pageSize}`];
            if (categoryId) params.push(`category_id=${categoryId}`);
            if (status !== null) params.push(`status=${status}`);
            return apiRequest(`/order/dish/all/get?${params.join('&')}`);
        },
        get: (id) => apiRequest(`/order/dish/detail/get?dish_id=${id}`),
        create: (data) => apiRequest('/order/dish/create', 'POST', data),
        update: (id, data) => apiRequest(`/order/dish/update?dish_id=${id}`, 'POST', data),
        delete: (id) => apiRequest(`/order/dish/delete?dish_id=${id}`, 'POST')
    },

    categories: {
        list: () => apiRequest('/order/category/list/get'),
        all: () => apiRequest('/order/category/all/get'),
        get: (id) => apiRequest(`/order/category/detail/get?category_id=${id}`),
        create: (data) => apiRequest('/order/category/create', 'POST', data),
        update: (id, data) => apiRequest(`/order/category/update?category_id=${id}`, 'POST', data),
        delete: (id) => apiRequest(`/order/category/delete?category_id=${id}`, 'POST')
    },

    dailyMenu: {
        get: (date, mealType) => apiRequest(`/order/daily/menu/list/get?menu_date=${date}&meal_type=${mealType}`),
        create: (data) => apiRequest('/order/daily/menu/create', 'POST', data),
        update: (id, data) => apiRequest(`/order/daily/menu/update?menu_id=${id}`, 'POST', data),
        delete: (id) => apiRequest(`/order/daily/menu/delete?menu_id=${id}`, 'POST'),
        mealTypes: () => apiRequest('/order/meal/type/get')
    },

    orders: {
        all: (page = 1, pageSize = 100, status = null, menuDate = null, mealType = null) => {
            let params = [`page=${page}`, `page_size=${pageSize}`];
            if (status) params.push(`status=${status}`);
            if (menuDate) params.push(`menu_date=${menuDate}`);
            if (mealType) params.push(`meal_type=${mealType}`);
            return apiRequest(`/order/all/get?${params.join('&')}`);
        },
        get: (id) => apiRequest(`/order/detail/get?order_id=${id}`),
        getByQrcode: (qrcode) => apiRequest(`/order/by/qrcode/get?qrcode=${qrcode}`),
        create: (data) => apiRequest('/order/create', 'POST', data),
        cancel: (data) => apiRequest('/order/cancel', 'POST', data),
        verify: (data) => apiRequest('/order/verify', 'POST', data),
        reorder: (orderId, userId) => apiRequest(`/order/reorder?order_id=${orderId}&user_id=${userId}`, 'POST')
    },

    statistics: {
        get: (startDate = null, endDate = null) => {
            let params = [];
            if (startDate) params.push(`start_date=${startDate}`);
            if (endDate) params.push(`end_date=${endDate}`);
            const query = params.length ? `?${params.join('&')}` : '';
            return apiRequest(`/order/statistics/get${query}`);
        },
        daily: (date) => apiRequest(`/order/daily/statistics/get?date=${date}`)
    }
};