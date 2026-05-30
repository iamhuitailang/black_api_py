
const Store = Vue.reactive({
    user: Utils.storage.get('chouchou_user', null),
    token: Utils.storage.get('chouchou_token', null),
    currentTheme: Utils.storage.get('chouchou_theme', 'carnival'),
    currentGame: null,
    settings: {
        soundEnabled: true,
        musicEnabled: true,
        animationEnabled: true,
        notificationEnabled: true
    },
    loading: false,
    notifications: [],

    isLoggedIn: Vue.computed(() => !!Store.token && !!Store.user),

    setUser(user) {
        Store.user = user;
        Utils.storage.set('chouchou_user', user);
    },

    setToken(token) {
        Store.token = token;
        Utils.storage.set('chouchou_token', token);
        API.setToken(token);
    },

    logout() {
        API.user.logout().finally(() => {
            Store.user = null;
            Store.token = null;
            Store.currentGame = null;
            Utils.storage.remove('chouchou_user');
            API.clearToken();
            window.location.hash = '#/login';
            Utils.success('已退出登录');
        });
    },

    setTheme(theme) {
        Store.currentTheme = theme;
        Utils.storage.set('chouchou_theme', theme);
        document.body.setAttribute('data-theme', theme);

        document.getElementById('theme-carnival').disabled = theme !== 'carnival';
        document.getElementById('theme-vintage').disabled = theme !== 'vintage';
        document.getElementById('theme-dark').disabled = theme !== 'dark';

        if (Store.user) {
            API.theme.setCurrent(theme);
        }
    },

    setCurrentGame(game) {
        Store.currentGame = game;
    },

    clearCurrentGame() {
        Store.currentGame = null;
    },

    updateSettings(settings) {
        Store.settings = { ...Store.settings, ...settings };
        Utils.storage.set('chouchou_settings', Store.settings);
    },

    setLoading(loading) {
        Store.loading = loading;
    },

    addNotification(notification) {
        Store.notifications.push({
            id: Utils.generateId(),
            timestamp: Date.now(),
            read: false,
            ...notification
        });
    },

    markNotificationRead(id) {
        const notification = Store.notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
        }
    },

    clearNotifications() {
        Store.notifications = [];
    },

    async loadUserProfile() {
        if (Store.token) {
            const profile = await API.user.getProfile();
            if (profile) {
                Store.setUser(profile);
            }
        }
    },

    async loadUserSettings() {
        const settings = await API.setting.get();
        if (settings) {
            Store.updateSettings(settings);
        }
    },

    async loadUserTheme() {
        const themeData = await API.theme.get();
        if (themeData && themeData.current_theme) {
            Store.setTheme(themeData.current_theme);
        }
    },

    init() {
        const savedSettings = Utils.storage.get('chouchou_settings');
        if (savedSettings) {
            Store.settings = { ...Store.settings, ...savedSettings };
        }

        const savedTheme = Utils.storage.get('chouchou_theme', 'carnival');
        Store.currentTheme = savedTheme;
        document.body.setAttribute('data-theme', savedTheme);
        document.getElementById('theme-carnival').disabled = savedTheme !== 'carnival';
        document.getElementById('theme-vintage').disabled = savedTheme !== 'vintage';
        document.getElementById('theme-dark').disabled = savedTheme !== 'dark';
    }
});

Store.init();
