const API_BASE = '/api';

async function apiRequest(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        ...options,
        headers
    };
    
    try {
        const response = await fetch(`${API_BASE}${url}`, config);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API请求错误:', error);
        return {
            code: -1,
            message: '网络请求失败，请稍后重试',
            data: null
        };
    }
}

async function getOrderList(status = null, page = 1, pageSize = 20) {
    let url = `/express/order/list/get?page=${page}&page_size=${pageSize}`;
    if (status) {
        url += `&status=${status}`;
    }
    return apiRequest(url);
}

async function getOrderDetail(orderId) {
    return apiRequest(`/express/order/detail/get?id=${orderId}`);
}

async function createOrder(orderData) {
    return apiRequest('/express/order/create', {
        method: 'POST',
        body: JSON.stringify(orderData)
    });
}

async function acceptOrder(orderId) {
    return apiRequest(`/express/order/accept?order_id=${orderId}`, {
        method: 'POST'
    });
}

async function pickUpOrder(orderId) {
    return apiRequest(`/express/order/pickup?order_id=${orderId}`, {
        method: 'POST'
    });
}

async function confirmDelivery(orderId) {
    return apiRequest(`/express/order/deliver?order_id=${orderId}`, {
        method: 'POST'
    });
}

async function cancelOrder(orderId) {
    return apiRequest(`/express/order/cancel?order_id=${orderId}`, {
        method: 'POST'
    });
}

async function getMyOrders(role = 'publisher', status = null, page = 1, pageSize = 20) {
    let url = `/express/order/my/get?role=${role}&page=${page}&page_size=${pageSize}`;
    if (status) {
        url += `&status=${status}`;
    }
    return apiRequest(url);
}

async function getOrderStats(role = 'publisher') {
    return apiRequest(`/express/order/stats/get?role=${role}`);
}

async function getProfile(userId = null) {
    let url = '/express/profile/get';
    if (userId) {
        url += `?user_id=${userId}`;
    }
    return apiRequest(url);
}

async function updateProfile(profileData) {
    return apiRequest('/express/profile/update', {
        method: 'POST',
        body: JSON.stringify(profileData)
    });
}

async function getRankList(limit = 20) {
    return apiRequest(`/express/rank/list/get?limit=${limit}`);
}
