const PREFIX = 'blog_web_'

const storage = {
  getToken(): string {
    return localStorage.getItem(PREFIX + 'token') || ''
  },
  setToken(token: string) {
    localStorage.setItem(PREFIX + 'token', token)
  },
  clearToken() {
    localStorage.removeItem(PREFIX + 'token')
  },
  getTheme(): string {
    return localStorage.getItem(PREFIX + 'theme') || ''
  },
  setTheme(theme: string) {
    localStorage.setItem(PREFIX + 'theme', theme)
  },
  getUser(): Record<string, unknown> {
    try {
      const raw = localStorage.getItem(PREFIX + 'user')
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  },
  setUser(user: Record<string, unknown>) {
    localStorage.setItem(PREFIX + 'user', JSON.stringify(user))
  },
  clearUser() {
    localStorage.removeItem(PREFIX + 'user')
  },
  clear() {
    storage.clearToken()
    storage.clearUser()
  }
}

export default storage
