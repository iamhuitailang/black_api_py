const API_BASE = '/api/jieyong';

const Api = {
  async request(url, options = {}) {
    const token = Storage.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      return { code: 1, msg: '网络请求失败', data: null };
    }
  },

  get(url, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    return this.request(fullUrl, { method: 'GET' });
  },

  post(url, data = {}) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

window.Api = Api;
