const API_BASE = '/api/chefei';

const ApiService = {
    async request(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, mergedOptions);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            try {
                return JSON.parse(text);
            } catch (e) {
                console.error('JSON parse error:', text);
                return {
                    code: 500,
                    message: '服务器响应格式错误',
                    data: null
                };
            }
        } catch (error) {
            console.error('API Error:', error);
            return {
                code: 500,
                message: '网络请求失败',
                data: null
            };
        }
    },

    async getVehicleTypes() {
        return this.request(`${API_BASE}/vehicle/types/get`);
    },

    async addVehicleType(data) {
        return this.request(`${API_BASE}/vehicle/type/add`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async updateVehicleType(data) {
        return this.request(`${API_BASE}/vehicle/type/update`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async deleteVehicleType(id) {
        return this.request(`${API_BASE}/vehicle/type/delete?id=${id}`, {
            method: 'DELETE'
        });
    },

    async vehicleEntry(data) {
        return this.request(`${API_BASE}/parking/entry`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async vehicleExit(data) {
        return this.request(`${API_BASE}/parking/exit`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async calculateFeePreview(data) {
        return this.request(`${API_BASE}/parking/fee/preview`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async getParkingList() {
        return this.request(`${API_BASE}/parking/list/get`);
    },

    async getParkingRecord(id) {
        return this.request(`${API_BASE}/parking/record/get?id=${id}`);
    },

    async updateParkingRecord(data) {
        return this.request(`${API_BASE}/parking/record/update`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async deleteParkingRecord(id) {
        return this.request(`${API_BASE}/parking/record/delete?id=${id}`, {
            method: 'DELETE'
        });
    },

    async getHistoryList(params = {}) {
        const queryParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                queryParams.append(key, params[key]);
            }
        });
        const queryString = queryParams.toString();
        const url = `${API_BASE}/history/list/get${queryString ? '?' + queryString : ''}`;
        return this.request(url);
    },

    async getStatistics() {
        return this.request(`${API_BASE}/statistics/get`);
    }
};
