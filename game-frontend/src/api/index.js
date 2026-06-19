const API_BASE = '/api'

async function request(url, options = {}) {
  try {
    const resp = await fetch(API_BASE + url, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    })
    return await resp.json()
  } catch (e) {
    console.error('API request failed:', e)
    return { code: -1, message: 'Network error', data: null }
  }
}

export function submitScore(data) {
  return request('/game/score/set', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export function getLevelScores(levelId, limit = 20) {
  return request(`/game/score/get?level_id=${levelId}&limit=${limit}`)
}

export function getRanking(limit = 20) {
  return request(`/game/ranking/get?limit=${limit}`)
}

export function getPlayerProgress(playerName) {
  return request(`/game/progress/get?player_name=${encodeURIComponent(playerName)}`)
}
