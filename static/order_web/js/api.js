const API_BASE = '/api';

async function apiRequest(url, method = 'GET', data = null) {
    const headers = {
        'Content-Type': 'application/json'
    };

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

const OrderWebAPI = {
    auth: {
        login: (username, password) => apiRequest('/order/user/login', 'POST', { username, password }),
        register: (data) => apiRequest('/order/user/register', 'POST', data),
        getUser: (id) => apiRequest(`/order/user/get?user_id=${id}`)
    },

    dailyMenu: {
        get: (date, mealType) => apiRequest(`/order/daily/menu/list/get?menu_date=${date}&meal_type=${mealType}`),
        mealTypes: () => apiRequest('/order/meal/type/get')
    },

    orders: {
        create: (data) => apiRequest('/order/create', 'POST', data),
        cancel: (data) => apiRequest('/order/cancel', 'POST', data),
        getByUser: (userId, page = 1, pageSize = 100) => apiRequest(`/order/user/list/get?user_id=${userId}&page=${page}&page_size=${pageSize}`),
        get: (id) => apiRequest(`/order/detail/get?order_id=${id}`),
        reorder: (orderId, userId) => apiRequest(`/order/reorder?order_id=${orderId}&user_id=${userId}`, 'POST')
    }
};