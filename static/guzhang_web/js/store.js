const STORAGE_KEY = 'guzhang_game_state';

const savedState = localStorage.getItem(STORAGE_KEY);
const initialState = savedState ? JSON.parse(savedState) : {};

const store = Vue.reactive({
  user: initialState.user || null,
  token: initialState.token || null,
  gameState: initialState.gameState || null,
  
  setUser(user, token) {
    this.user = user;
    this.token = token;
    this.saveState();
  },
  
  logout() {
    this.user = null;
    this.token = null;
    this.gameState = null;
    this.saveState();
  },
  
  setGameState(gameState) {
    this.gameState = gameState;
    this.saveState();
  },
  
  clearGameState() {
    this.gameState = null;
    this.saveState();
  },
  
  saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      user: this.user,
      token: this.token,
      gameState: this.gameState
    }));
  },
  
  isLoggedIn() {
    return !!this.token;
  }
});
