const BASE_URL = '/api';

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = window.XiangqiAuth ? window.XiangqiAuth.getToken() : null;
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }
  return headers;
}

function getAdminHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = window.XiangqiAuth ? window.XiangqiAuth.getAdminToken() : null;
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }
  return headers;
}

async function request(url, options = {}) {
  const resp = await fetch(BASE_URL + url, {
    ...options,
    headers: { ...getHeaders(), ...options.headers }
  });
  return resp.json();
}

async function adminRequest(url, options = {}) {
  const resp = await fetch(BASE_URL + url, {
    ...options,
    headers: { ...getAdminHeaders(), ...options.headers }
  });
  return resp.json();
}

const Api = {
  register(data) {
    return request('/xiangqi/user/register', { method: 'POST', body: JSON.stringify(data) });
  },
  login(data) {
    return request('/xiangqi/user/login', { method: 'POST', body: JSON.stringify(data) });
  },
  logout() {
    return request('/xiangqi/user/logout', { method: 'POST' });
  },
  getCurrentUser() {
    return request('/xiangqi/user/current/get');
  },
  updateProfile(data) {
    return request('/xiangqi/user/profile/update', { method: 'POST', body: JSON.stringify(data) });
  },
  changePassword(data) {
    return request('/xiangqi/user/password/change', { method: 'POST', body: JSON.stringify(data) });
  },

  createPveGame(data) {
    return request('/xiangqi/game/pve/create', { method: 'POST', body: JSON.stringify(data) });
  },
  createPvpGame(data) {
    return request('/xiangqi/game/pvp/create', { method: 'POST', body: JSON.stringify(data || {}) });
  },
  joinPvpGame(gameId) {
    return request('/xiangqi/game/pvp/join?game_id=' + gameId, { method: 'POST' });
  },
  getGame(gameId) {
    return request('/xiangqi/game/detail/get?game_id=' + gameId);
  },
  makeMove(gameId, data) {
    return request('/xiangqi/game/move?game_id=' + gameId, { method: 'POST', body: JSON.stringify(data) });
  },
  requestUndo(gameId) {
    return request('/xiangqi/game/undo/request?game_id=' + gameId, { method: 'POST' });
  },
  acceptUndo(gameId) {
    return request('/xiangqi/game/undo/accept?game_id=' + gameId, { method: 'POST' });
  },
  rejectUndo(gameId) {
    return request('/xiangqi/game/undo/reject?game_id=' + gameId, { method: 'POST' });
  },
  requestDraw(gameId) {
    return request('/xiangqi/game/draw/request?game_id=' + gameId, { method: 'POST' });
  },
  acceptDraw(gameId) {
    return request('/xiangqi/game/draw/accept?game_id=' + gameId, { method: 'POST' });
  },
  rejectDraw(gameId) {
    return request('/xiangqi/game/draw/reject?game_id=' + gameId, { method: 'POST' });
  },
  resign(gameId) {
    return request('/xiangqi/game/resign?game_id=' + gameId, { method: 'POST' });
  },
  finishGame(gameId, result) {
    return request('/xiangqi/game/finish?game_id=' + gameId + '&result=' + result, { method: 'POST' });
  },
  getGameMoves(gameId) {
    return request('/xiangqi/game/moves/get?game_id=' + gameId);
  },
  getGameState(gameId) {
    return request('/xiangqi/game/state/get?game_id=' + gameId);
  },
  getWaitingGames(page, page_size) {
    const p = page || 1;
    const ps = page_size || 20;
    return request('/xiangqi/game/waiting/list/get?page=' + p + '&page_size=' + ps);
  },
  getMyGames(page, page_size) {
    const p = page || 1;
    const ps = page_size || 20;
    return request('/xiangqi/game/my/list/get?page=' + p + '&page_size=' + ps);
  },
  getActiveGames() {
    return request('/xiangqi/game/active/list/get');
  },

  sendMessage(data) {
    return request('/xiangqi/chat/send', { method: 'POST', body: JSON.stringify(data) });
  },
  getGameMessages(gameId, limit) {
    const l = limit || 50;
    return request('/xiangqi/chat/game/messages/get?game_id=' + gameId + '&limit=' + l);
  },
  getHallMessages(limit) {
    const l = limit || 50;
    return request('/xiangqi/chat/hall/messages/get?limit=' + l);
  },

  getLeaderboard(period, limit) {
    const p = period || 3;
    const l = limit || 50;
    return request('/xiangqi/leaderboard/list/get?period=' + p + '&limit=' + l);
  },
  getUserRank(period) {
    const p = period || 3;
    return request('/xiangqi/leaderboard/user/rank/get?period=' + p);
  },

  getEnabledAIConfigs() {
    return request('/xiangqi/ai/config/enabled/list/get');
  },

  joinSpectate(gameId) {
    return request('/xiangqi/spectator/join?game_id=' + gameId, { method: 'POST' });
  },
  leaveSpectate(gameId) {
    return request('/xiangqi/spectator/leave?game_id=' + gameId, { method: 'POST' });
  },
  getSpectators(gameId) {
    return request('/xiangqi/spectator/list/get?game_id=' + gameId);
  },
  getSpectatorCount(gameId) {
    return request('/xiangqi/spectator/count/get?game_id=' + gameId);
  },
  getSpectatorGames() {
    return request('/xiangqi/spectator/games/get');
  },

  adminLogin(data) {
    return adminRequest('/xiangqi/admin/login', { method: 'POST', body: JSON.stringify(data) });
  },
  adminLogout() {
    return adminRequest('/xiangqi/admin/logout', { method: 'POST' });
  },
  adminGetCurrent() {
    return adminRequest('/xiangqi/admin/current/get');
  },
  adminGetUsers(params) {
    let url = '/xiangqi/admin/user/list/get';
    if (params) {
      const q = new URLSearchParams(params).toString();
      if (q) url += '?' + q;
    }
    return adminRequest(url);
  },
  adminMuteUser(userId) {
    return adminRequest('/xiangqi/admin/user/mute?user_id=' + userId, { method: 'POST' });
  },
  adminBanUser(userId) {
    return adminRequest('/xiangqi/admin/user/ban?user_id=' + userId, { method: 'POST' });
  },
  adminUnbanUser(userId) {
    return adminRequest('/xiangqi/admin/user/unban?user_id=' + userId, { method: 'POST' });
  },
  adminDeleteUser(userId) {
    return adminRequest('/xiangqi/admin/user/delete?user_id=' + userId, { method: 'POST' });
  },
  adminGetGames(params) {
    let url = '/xiangqi/admin/game/list/get';
    if (params) {
      const q = new URLSearchParams(params).toString();
      if (q) url += '?' + q;
    }
    return adminRequest(url);
  },
  adminGetDashboard() {
    return adminRequest('/xiangqi/admin/dashboard/get');
  },
  adminGetAIConfigs(page, page_size) {
    const p = page || 1;
    const ps = page_size || 20;
    return adminRequest('/xiangqi/ai/config/list/get?page=' + p + '&page_size=' + ps);
  },
  adminCreateAIConfig(data) {
    return adminRequest('/xiangqi/ai/config/create', { method: 'POST', body: JSON.stringify(data) });
  },
  adminUpdateAIConfig(id, data) {
    return adminRequest('/xiangqi/ai/config/update?config_id=' + id, { method: 'POST', body: JSON.stringify(data) });
  },
  adminDeleteAIConfig(id) {
    return adminRequest('/xiangqi/ai/config/delete?config_id=' + id, { method: 'POST' });
  },
  adminEnableAIConfig(id) {
    return adminRequest('/xiangqi/ai/config/enable?config_id=' + id, { method: 'POST' });
  },
  adminDisableAIConfig(id) {
    return adminRequest('/xiangqi/ai/config/disable?config_id=' + id, { method: 'POST' });
  },
  adminGetLeaderboard(page, page_size, period) {
    const p = page || 1;
    const ps = page_size || 20;
    const pe = period !== undefined ? '&period=' + period : '';
    return adminRequest('/xiangqi/leaderboard/all/get?page=' + p + '&page_size=' + ps + pe);
  },
  adminGetStatsDashboard() {
    return adminRequest('/xiangqi/stats/dashboard/get');
  },
  adminGetRecentGames() {
    return adminRequest('/xiangqi/stats/recent/games/get');
  },
  adminGetGameTypeStats() {
    return adminRequest('/xiangqi/stats/game/type/get');
  }
};

window.XiangqiApi = Api;
