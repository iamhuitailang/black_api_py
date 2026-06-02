const { createApp, reactive, ref, computed, onMounted, watch } = Vue;

const AppState = reactive({
    user: null,
    token: '',
    loading: false,
    currentRoute: '',
    currentCase: null,
    gameState: null,
    notifications: []
});

const App = {
    vueApp: null,

    init() {
        this.initVueApp();
        this.loadStoredState();
        this.registerRoutes();
        Router.init();
        this.setupGlobalListeners();
    },

    initVueApp() {
        this.vueApp = createApp({
            setup() {
                return {
                    state: AppState,
                    isLoggedIn: computed(() => !!AppState.token),
                    userLevel: computed(() => Utils.calculateLevel(AppState.user?.exp || 0))
                };
            }
        });

        this.vueApp.config.globalProperties.$utils = Utils;
        this.vueApp.config.globalProperties.$router = Router;
        this.vueApp.config.globalProperties.$auth = AuthService;
        this.vueApp.config.globalProperties.$api = PoanApi;

        this.vueApp.mount('#app');
    },

    loadStoredState() {
        const token = Storage.getToken();
        const user = Storage.getUser();

        if (token) {
            AppState.token = token;
        }
        if (user) {
            AppState.user = user;
        }
    },

    registerRoutes() {
        Router.register('login', () => {
            if (AuthService.isLoggedIn()) {
                Router.navigate('home');
                return;
            }
            AppState.currentRoute = 'login';
            LoginPage.render();
        });

        Router.register('register', () => {
            if (AuthService.isLoggedIn()) {
                Router.navigate('home');
                return;
            }
            AppState.currentRoute = 'register';
            RegisterPage.render();
        });

        Router.register('home', () => {
            AppState.currentRoute = 'home';
            HomePage.render();
        });

        Router.register('case_detail', () => {
            AppState.currentRoute = 'case_detail';
            CaseDetailPage.render();
        });

        Router.register('game', () => {
            if (!AuthService.isLoggedIn()) {
                Toast.warning('请先登录');
                Router.navigate('login');
                return;
            }
            AppState.currentRoute = 'game';
            GamePage.render();
        });

        Router.register('evidence', () => {
            if (!AuthService.isLoggedIn()) {
                Toast.warning('请先登录');
                Router.navigate('login');
                return;
            }
            AppState.currentRoute = 'evidence';
            EvidencePage.render();
        });

        Router.register('timeline', () => {
            if (!AuthService.isLoggedIn()) {
                Toast.warning('请先登录');
                Router.navigate('login');
                return;
            }
            AppState.currentRoute = 'timeline';
            TimelinePage.render();
        });

        Router.register('quiz', () => {
            if (!AuthService.isLoggedIn()) {
                Toast.warning('请先登录');
                Router.navigate('login');
                return;
            }
            AppState.currentRoute = 'quiz';
            QuizPage.render();
        });

        Router.register('ending', () => {
            if (!AuthService.isLoggedIn()) {
                Toast.warning('请先登录');
                Router.navigate('login');
                return;
            }
            AppState.currentRoute = 'ending';
            EndingPage.render();
        });

        Router.register('profile', () => {
            if (!AuthService.isLoggedIn()) {
                Toast.warning('请先登录');
                Router.navigate('login');
                return;
            }
            AppState.currentRoute = 'profile';
            ProfilePage.render();
        });
    },

    setupGlobalListeners() {
        window.addEventListener('online', () => {
            Toast.success('网络已恢复');
        });

        window.addEventListener('offline', () => {
            Toast.error('网络已断开');
        });

        window.addEventListener('hashchange', () => {
            AppState.currentRoute = Router.getCurrentPath();
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modals = document.querySelectorAll('.modal-overlay');
                modals.forEach(modal => modal.remove());
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                e.target.remove();
            }
        });

        this.setupErrorHandling();
    },

    setupErrorHandling() {
        window.onerror = (msg, url, line, col, error) => {
            console.error('Global error:', msg, url, line, col);
            if (error) {
                console.error('Error stack:', error.stack);
            }
            Loading.hide();
            return false;
        };

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            Loading.hide();
            if (event.reason?.message) {
                Toast.error(event.reason.message);
            }
        });
    },

    setUser(user) {
        AppState.user = user;
        Storage.setUser(user);
    },

    setToken(token) {
        AppState.token = token;
        Storage.setToken(token);
    },

    clearAuth() {
        AppState.user = null;
        AppState.token = '';
        Storage.clearToken();
        Storage.clearUser();
    },

    showLoading() {
        AppState.loading = true;
        Loading.show();
    },

    hideLoading() {
        AppState.loading = false;
        Loading.hide();
    },

    async refreshUser() {
        if (!AuthService.isLoggedIn()) {
            return null;
        }
        try {
            const result = await PoanApi.getCurrentUser();
            if (result.code === 0 && result.data) {
                this.setUser(result.data);
                return result.data;
            }
        } catch (error) {
            console.error('Refresh user failed:', error);
        }
        return null;
    }
};

window.App = App;
window.AppState = AppState;

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
