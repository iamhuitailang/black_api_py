const { reactive, computed } = Vue;

const store = reactive({
    isLoading: false,
    isAuthenticated: !!localStorage.getItem('yeshi_token'),
    token: localStorage.getItem('yeshi_token'),
    
    user: null,
    gameUser: null,
    currentSession: null,
    weather: null,
    
    unlockedFoods: [],
    unlockableFoods: [],
    availableUpgrades: [],
    userUpgrades: [],
    
    pendingOrders: [],
    activeGuests: [],
    
    toasts: [],
    
    gameConfig: null
});

const storeActions = {
    setLoading(value) {
        store.isLoading = value;
    },

    setAuthenticated(value, token = null) {
        store.isAuthenticated = value;
        if (token) {
            store.token = token;
            api.setToken(token);
        } else {
            store.token = null;
            api.clearToken();
        }
    },

    setUser(user) {
        store.user = user;
    },

    setGameUser(gameUser) {
        store.gameUser = gameUser;
    },

    setCurrentSession(session) {
        store.currentSession = session;
    },

    setWeather(weather) {
        store.weather = weather;
    },

    setUnlockedFoods(foods) {
        store.unlockedFoods = foods;
    },

    setUnlockableFoods(foods) {
        store.unlockableFoods = foods;
    },

    setAvailableUpgrades(upgrades) {
        store.availableUpgrades = upgrades;
    },

    setUserUpgrades(upgrades) {
        store.userUpgrades = upgrades;
    },

    setPendingOrders(orders) {
        store.pendingOrders = orders;
    },

    addPendingOrder(order) {
        store.pendingOrders.push(order);
    },

    updatePendingOrder(orderId, updates) {
        const index = store.pendingOrders.findIndex(o => o.id === orderId);
        if (index !== -1) {
            store.pendingOrders[index] = { ...store.pendingOrders[index], ...updates };
        }
    },

    removePendingOrder(orderId) {
        store.pendingOrders = store.pendingOrders.filter(o => o.id !== orderId);
    },

    setActiveGuests(guests) {
        store.activeGuests = guests;
    },

    addActiveGuest(guest) {
        store.activeGuests.push(guest);
    },

    removeActiveGuest(guestId) {
        store.activeGuests = store.activeGuests.filter(g => g.id !== guestId);
    },

    setGameConfig(config) {
        store.gameConfig = config;
    },

    showToast(message, type = 'success', duration = 3000) {
        const id = Date.now();
        store.toasts.push({ id, message, type });
        
        setTimeout(() => {
            store.toasts = store.toasts.filter(t => t.id !== id);
        }, duration);
    },

    async loadGameData() {
        this.setLoading(true);
        
        const safeCall = async (apiFn, setter) => {
            try {
                const result = await apiFn();
                if (result.code === 0 && result.data !== null && result.data !== undefined) {
                    setter(result.data);
                }
            } catch (e) {
                console.warn('API call failed:', e);
            }
        };
        
        await Promise.allSettled([
            safeCall(() => api.getGameUser(), (d) => this.setGameUser(d)),
            safeCall(() => api.getUnlockedFoods(), (d) => this.setUnlockedFoods(d)),
            safeCall(() => api.getUnlockableFoods(), (d) => this.setUnlockableFoods(d)),
            safeCall(() => api.getAvailableUpgrades(), (d) => this.setAvailableUpgrades(d)),
            safeCall(() => api.getPendingOrders(), (d) => this.setPendingOrders(d)),
            safeCall(() => api.getActiveGuests(), (d) => this.setActiveGuests(d)),
            safeCall(() => api.getWeather(), (d) => this.setWeather(d)),
            safeCall(() => api.getGameConfig(), (d) => this.setGameConfig(d)),
        ]);
        
        this.setLoading(false);
    },

    async refreshGameUser() {
        const result = await api.getGameUser();
        if (result.code === 0) {
            this.setGameUser(result.data);
        }
    },

    async refreshOrders() {
        const result = await api.getPendingOrders();
        if (result.code === 0) {
            this.setPendingOrders(result.data);
        }
    },

    async refreshUpgrades() {
        const result = await api.getAvailableUpgrades();
        if (result.code === 0) {
            this.setAvailableUpgrades(result.data);
        }
    },

    async refreshFoods() {
        const [unlockedResult, unlockableResult] = await Promise.all([
            api.getUnlockedFoods(),
            api.getUnlockableFoods()
        ]);
        
        if (unlockedResult.code === 0) {
            this.setUnlockedFoods(unlockedResult.data);
        }
        
        if (unlockableResult.code === 0) {
            this.setUnlockableFoods(unlockableResult.data);
        }
    }
};
