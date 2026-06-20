const API_BASE = window.location.origin + '/api';

const IceSledAPI = {
  async request(url, options = {}) {
    const fullUrl = url.startsWith('http') ? url : API_BASE + url;
    const res = await fetch(fullUrl, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  getTrack(id) {
    const q = id ? `?id=${id}` : '';
    return this.request(`/icesled/track/get${q}`);
  },
  getTrackList() {
    return this.request('/icesled/track/getlist');
  },
  generateTrack(difficulty = 'normal') {
    return this.request('/icesled/track/generate', {
      method: 'POST',
      body: { difficulty }
    });
  },

  startRace(payload = {}) {
    return this.request('/icesled/race/start', {
      method: 'POST',
      body: payload
    });
  },
  getHistory(page = 1, pageSize = 20) {
    return this.request(`/icesled/race/gethistory?page=${page}&page_size=${pageSize}`);
  },
  getRaceDetail(id) {
    return this.request(`/icesled/race/getdetail?id=${id}`);
  },

  getPlayerStats(playerName = '玩家') {
    return this.request(`/icesled/player/getstats?player_name=${encodeURIComponent(playerName)}`);
  },
  getLeaderboard(limit = 10) {
    return this.request(`/icesled/player/getleaderboard?limit=${limit}`);
  },
};
