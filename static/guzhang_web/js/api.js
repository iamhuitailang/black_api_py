const API_BASE = 'http://localhost:8000';

const api = {
  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (store.token) {
      headers['Authorization'] = `Bearer ${store.token}`;
    }
    
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      return { code: 500, message: '网络错误', data: null };
    }
  },
  
  async register(username, password, nickname) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, nickname })
    });
  },
  
  async login(username, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },
  
  async updatePassword(oldPassword, newPassword) {
    return this.request('/api/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
    });
  },
  
  async getUserInfo() {
    return this.request('/api/auth/user-info');
  },
  
  async saveGameRecord(playerScore, opponentScore, isWin, duration, maxCheer, comboCount) {
    const params = new URLSearchParams({
      player_score: playerScore,
      opponent_score: opponentScore,
      is_win: isWin,
      duration: duration,
      max_cheer: maxCheer,
      combo_count: comboCount
    });
    return this.request(`/api/auth/save-record?${params.toString()}`, {
      method: 'POST'
    });
  },
  
  async getGameRecords(limit = 10) {
    return this.request(`/api/auth/game-records?limit=${limit}`);
  }
};
