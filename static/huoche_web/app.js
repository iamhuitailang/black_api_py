const { createApp, ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } = Vue;

const App = {
    setup() {
        let initialPage = 'login';
        if (Storage.isLoggedIn()) {
            initialPage = Router.currentPage;
            if (initialPage === 'game') {
                const params = Router.getParams();
                if (!params.gameData || !params.train || !params.route) {
                    initialPage = 'dashboard';
                }
            }
        }
        const validPages = ['login', 'register', 'dashboard', 'train_shop', 'route_select', 'game', 'history'];
        const currentPage = ref(validPages.includes(initialPage) ? initialPage : 'dashboard');
        const user = ref(Storage.getUser());
        const userGame = ref(null);
        const toast = reactive({
            show: false,
            message: '',
            type: 'success'
        });

        let toastTimer = null;

        const showToast = (message, type = 'success') => {
            toast.message = message;
            toast.type = type;
            toast.show = true;
            if (toastTimer && clearTimeout(toastTimer));
            toastTimer = setTimeout(() => {
                toast.show = false;
            }, 3000);
        };

        const loadUserInfo = async () => {
            if (Storage.isLoggedIn()) {
                const result = await API.huoche.getUserInfo();
                if (result.code === 0) {
                    user.value = Storage.getUser();
                    userGame.value = result.data.user_game;
                }
            }
        };

        const handleLogout = async () => {
            await API.auth.logout();
            Storage.clearAll();
            localStorage.removeItem('huoche_current_page');
            localStorage.removeItem('huoche_page_params');
            user.value = null;
            userGame.value = null;
            Router.navigate('login');
        };

        const handleLogin = (userData, token) => {
            Storage.setToken(token);
            Storage.setUser(userData);
            user.value = userData;
            loadUserInfo();
            Router.navigate('dashboard');
        };

        onMounted(() => {
            Router.subscribe((page) => {
                currentPage.value = page;
            });

            if (Storage.isLoggedIn()) {
                loadUserInfo();
            }
        });

        return {
            currentPage,
            user,
            userGame,
            toast,
            showToast,
            handleLogout,
            handleLogin,
            loadUserInfo
        };
    },
    template: `
        <div>
            <div v-if="toast.show" :class="['toast', toast.type]">
                {{ toast.message }}
            </div>

            <login-page v-if="currentPage === 'login'" @login="handleLogin" />
            <register-page v-else-if="currentPage === 'register'" />
            <dashboard-page v-else-if="currentPage === 'dashboard'" :user="user" :userGame="userGame" @refresh="loadUserInfo" @logout="handleLogout" />
            <train-shop-page v-else-if="currentPage === 'train_shop'" :user="user" :userGame="userGame" @refresh="loadUserInfo" @logout="handleLogout" />
            <route-select-page v-else-if="currentPage === 'route_select'" :user="user" :userGame="userGame" @logout="handleLogout" />
            <game-page v-else-if="currentPage === 'game'" :user="user" :userGame="userGame" @refresh="loadUserInfo" @logout="handleLogout" />
            <history-page v-else-if="currentPage === 'history'" :user="user" @logout="handleLogout" />
        </div>
    `
};

const app = createApp(App);
app.component('navbar-component', NavbarComponent);
app.component('login-page', LoginPage);
app.component('register-page', RegisterPage);
app.component('dashboard-page', DashboardPage);
app.component('train-shop-page', TrainShopPage);
app.component('route-select-page', RouteSelectPage);
app.component('game-page', GamePage);
app.component('history-page', HistoryPage);
app.config.globalProperties.$showToast = (message, type) => {
    const instance = app._instance;
    if (instance) {
        instance.setupState.showToast(message, type);
    }
};

app.mount('#app');
