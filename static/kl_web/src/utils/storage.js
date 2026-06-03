const TOKEN_KEY = 'kl_token'
const USER_INFO_KEY = 'kl_user_info'

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function setUserInfo(userInfo) {
  if (userInfo) {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo))
  }
}

export function getUserInfo() {
  const value = localStorage.getItem(USER_INFO_KEY)
  try {
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

export function removeUserInfo() {
  localStorage.removeItem(USER_INFO_KEY)
}

export function setStorage(key, value) {
  if (typeof value === 'object') {
    value = JSON.stringify(value)
  }
  localStorage.setItem(key, value)
}

export function getStorage(key) {
  const value = localStorage.getItem(key)
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

export function removeStorage(key) {
  localStorage.removeItem(key)
}

export function clearStorage() {
  localStorage.clear()
}
