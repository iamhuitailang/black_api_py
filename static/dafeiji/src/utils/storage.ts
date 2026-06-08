const TOKEN_KEY = 'dafeiji_token'

export const storage = {
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token)
  },
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },
  removeToken() {
    localStorage.removeItem(TOKEN_KEY)
  }
}
