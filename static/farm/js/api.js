const API_BASE = '/api';

async function apiRequest(url, method = 'GET', body = null, query = null) {
    let fullUrl = API_BASE + url;
    if (query) {
        const params = new URLSearchParams();
        Object.entries(query).forEach(([k, v]) => {
            if (v !== null && v !== undefined && v !== '') params.append(k, v);
        });
        const qs = params.toString();
        if (qs) fullUrl += '?' + qs;
    }

    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
    }

    try {
        const res = await fetch(fullUrl, options);
        const data = await res.json();
        return data;
    } catch (e) {
        return { code: 500, message: '网络错误: ' + e.message, data: null };
    }
}

const FarmerAPI = {
    register: (data) => apiRequest('/farm/farmer/register', 'POST', data),
    login: (data) => apiRequest('/farm/farmer/login', 'POST', data),
    get: (farmer_id) => apiRequest('/farm/farmer/get', 'GET', null, { farmer_id }),
    updateShop: (data) => apiRequest('/farm/farmer/shop/update', 'POST', data),
    list: (status) => apiRequest('/farm/farmer/list/get', 'GET', null, { status }),
    approve: (farmer_id) => apiRequest('/farm/farmer/approve', 'POST', null, { farmer_id }),
    reject: (farmer_id) => apiRequest('/farm/farmer/reject', 'POST', null, { farmer_id }),
};

const ConsumerAPI = {
    register: (data) => apiRequest('/farm/consumer/register', 'POST', data),
    login: (data) => apiRequest('/farm/consumer/login', 'POST', data),
    get: (consumer_id) => apiRequest('/farm/consumer/get', 'GET', null, { consumer_id }),
};

const ProductAPI = {
    add: (data) => apiRequest('/farm/product/add', 'POST', data),
    update: (data) => apiRequest('/farm/product/update', 'POST', data),
    delete: (product_id) => apiRequest('/farm/product/delete', 'DELETE', null, { product_id }),
    get: (product_id) => apiRequest('/farm/product/get', 'GET', null, { product_id }),
    getByFarmer: (farmer_id) => apiRequest('/farm/product/farmer/get', 'GET', null, { farmer_id }),
    list: (category, delivery_range) => apiRequest('/farm/product/list/get', 'GET', null, { category, delivery_range }),
    filters: () => apiRequest('/farm/product/filters/get'),
};

const OrderAPI = {
    create: (data) => apiRequest('/farm/order/create', 'POST', data),
    get: (order_id) => apiRequest('/farm/order/get', 'GET', null, { order_id }),
    getByFarmer: (farmer_id, status) => apiRequest('/farm/order/farmer/get', 'GET', null, { farmer_id, status }),
    getByConsumer: (consumer_id, status) => apiRequest('/farm/order/consumer/get', 'GET', null, { consumer_id, status }),
    list: (status) => apiRequest('/farm/order/list/get', 'GET', null, { status }),
    advance: (order_id) => apiRequest('/farm/order/advance', 'POST', null, { order_id }),
    cancel: (order_id) => apiRequest('/farm/order/cancel', 'POST', null, { order_id }),
};

const StatsAPI = {
    overview: () => apiRequest('/farm/stats/overview/get'),
    categorySales: () => apiRequest('/farm/stats/category/sales/get'),
    farmerDelivery: () => apiRequest('/farm/stats/farmer/delivery/get'),
};
