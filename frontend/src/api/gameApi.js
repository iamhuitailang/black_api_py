import axios from 'axios'

const API_BASE = '/api/dragongame'

export const gameApi = {
  startGame: (playerName = 'Player') =>
    axios.post(`${API_BASE}/start`, { player_name: playerName }),

  saveProgress: (recordId, waveReached, enemiesKilled, score) =>
    axios.post(`${API_BASE}/saveprogress`, {
      record_id: recordId,
      wave_reached: waveReached,
      enemies_killed: enemiesKilled,
      score: score
    }),

  finishGame: (recordId, waveReached, enemiesKilled, score) =>
    axios.post(`${API_BASE}/finish`, {
      record_id: recordId,
      wave_reached: waveReached,
      enemies_killed: enemiesKilled,
      score: score
    }),

  getRecord: (id) =>
    axios.get(`${API_BASE}/getrecord`, { params: { id } }),

  getPlayerRecords: (playerName) =>
    axios.get(`${API_BASE}/getplayerrecords`, { params: { player_name: playerName } }),

  getLeaderboard: (limit = 10) =>
    axios.get(`${API_BASE}/getleaderboard`, { params: { limit } }),

  collectEssence: (statusId, amount = 1) =>
    axios.post(`${API_BASE}/collectessence`, {
      status_id: statusId,
      amount: amount
    }),

  upgradeFlame: (statusId, essenceCost = 1) =>
    axios.post(`${API_BASE}/upgradeflame`, {
      status_id: statusId,
      essence_cost: essenceCost
    }),

  getDragonStatus: (id) =>
    axios.get(`${API_BASE}/getdragonstatus`, { params: { id } })
}
