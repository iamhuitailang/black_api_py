const USER_KEY = 'feixingqi_user'

export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getUser() {
  const data = localStorage.getItem(USER_KEY)
  return data ? JSON.parse(data) : null
}

export function removeUser() {
  localStorage.removeItem(USER_KEY)
}

export function isLoggedIn() {
  return !!getUser()
}

export function isAdmin() {
  const user = getUser()
  return user && user.role === 'admin'
}
