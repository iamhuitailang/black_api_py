export async function request(url, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  }
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  }
  try {
    const res = await fetch(url, config)
    const data = await res.json()
    return data
  } catch (e) {
    return {
      code: 999,
      message: e.message || '网络请求失败',
      data: null,
    }
  }
}

export const api = {
  newGame: (playerName) => request('/api/game/newgame', {
    method: 'POST',
    body: JSON.stringify({ player_name: playerName }),
  }),
  getState: (saveId) => request(`/api/game/state/get?save_id=${saveId}`),
  getSaves: () => request('/api/game/save/list/get'),
  deleteSave: (saveId) => request(`/api/game/save/delete?save_id=${saveId}`, {
    method: 'DELETE',
  }),
  getPlanets: () => request('/api/game/planet/list/get'),
  travel: (saveId, planetId) => request('/api/game/travel', {
    method: 'POST',
    body: JSON.stringify({ save_id: saveId, planet_id: planetId }),
  }),
  repair: (saveId) => request(`/api/game/repair?save_id=${saveId}`, {
    method: 'POST',
  }),
  equip: (saveId, invId) => request('/api/game/equip', {
    method: 'POST',
    body: JSON.stringify({ save_id: saveId, inventory_id: invId }),
  }),
  unequip: (saveId, invId) => request('/api/game/unequip', {
    method: 'POST',
    body: JSON.stringify({ save_id: saveId, inventory_id: invId }),
  }),
  getSkills: () => request('/api/game/skill/list/get'),
  getReputation: (saveId) => request(`/api/game/reputation/get?save_id=${saveId}`),
  initCombat: (payload) => request('/api/combat/init', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  combatAction: (payload) => request('/api/combat/action', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getShop: (saveId) => request(`/api/shop/inventory/get?save_id=${saveId}`),
  buyEquipment: (saveId, eqId) => request('/api/shop/equipment/buy', {
    method: 'POST',
    body: JSON.stringify({ save_id: saveId, equipment_id: eqId }),
  }),
  buyItem: (saveId, itemId, qty = 1) => request('/api/shop/item/buy', {
    method: 'POST',
    body: JSON.stringify({ save_id: saveId, item_id: itemId, quantity: qty }),
  }),
  sellItem: (saveId, invId, qty = 1) => request('/api/shop/item/sell', {
    method: 'POST',
    body: JSON.stringify({ save_id: saveId, inventory_id: invId, quantity: qty }),
  }),
  getMissions: (saveId) => request(`/api/mission/available/get?save_id=${saveId}`),
  acceptMission: (saveId, tplId) => request('/api/mission/accept', {
    method: 'POST',
    body: JSON.stringify({ save_id: saveId, template_id: tplId }),
  }),
  getMissionEnemies: (saveId) => request(`/api/mission/enemies/get?save_id=${saveId}`),
  advanceMission: (saveId, defeated = 1) => request('/api/mission/advance', {
    method: 'POST',
    body: JSON.stringify({ save_id: saveId, defeated }),
  }),
  completeMission: (saveId, missionId = null) => request('/api/mission/complete', {
    method: 'POST',
    body: JSON.stringify({ save_id: saveId, mission_id: missionId }),
  }),
  abandonMission: (saveId) => request(`/api/mission/abandon?save_id=${saveId}`, {
    method: 'POST',
  }),
  failMission: (saveId) => request(`/api/mission/fail?save_id=${saveId}`, {
    method: 'POST',
  }),
}
