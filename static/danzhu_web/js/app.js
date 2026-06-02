const { createApp, ref, computed, onMounted, watch, defineComponent, h } = Vue;

const App = {
    setup() {
        const currentUser = ref(null);
        const currentRoute = ref('/');
        const loading = ref(false);
        const toasts = ref([]);

        const isLoginPage = computed(() => currentRoute.value === '/login');
        const isRegisterPage = computed(() => currentRoute.value === '/register');

        const currentComponent = computed(() => {
            const route = currentRoute.value;

            if (route === '/login') return 'LoginPage';
            if (route === '/register') return 'RegisterPage';
            if (route === '/game') return 'GamePage';
            if (route === '/leaderboard') return 'LeaderboardPage';
            if (route === '/achievements') return 'AchievementsPage';
            if (route === '/profile') return 'ProfilePage';
            if (route === '/settings') return 'SettingsPage';
            if (route === '/admin/dashboard') return 'AdminDashboardPage';
            if (route === '/admin/users') return 'AdminUsersPage';
            if (route === '/admin/levels') return 'AdminLevelsPage';
            if (route === '/admin/items') return 'AdminItemsPage';
            if (route === '/admin/achievements') return 'AdminAchievementsPage';

            return 'HomePage';
        });

        const init = () => {
            const user = Storage.getUser();
            if (user) {
                currentUser.value = user;
            }

            Router.onRouteChange = (route) => {
                currentRoute.value = route;
            };

            Router.init();

            Toast.onUpdate = (newToasts) => {
                toasts.value = newToasts;
            };
        };

        const goHome = () => {
            Router.navigate('/');
        };

        const goLogin = () => {
            Router.navigate('/login');
        };

        const goRegister = () => {
            Router.navigate('/register');
        };

        const logout = async () => {
            await Auth.logout();
            currentUser.value = null;
            Router.navigate('/');
        };

        const removeToast = (id) => {
            Toast.remove(id);
        };

        onMounted(() => {
            init();
        });

        return {
            currentUser,
            currentRoute,
            currentComponent,
            loading,
            toasts,
            isLoginPage,
            isRegisterPage,
            goHome,
            goLogin,
            goRegister,
            logout,
            removeToast
        };
    }
};

const app = createApp(App);

app.component('HomePage', HomePage);
app.component('LoginPage', LoginPage);
app.component('RegisterPage', RegisterPage);
app.component('GamePage', GamePage);
app.component('LeaderboardPage', LeaderboardPage);
app.component('AchievementsPage', AchievementsPage);
app.component('ProfilePage', ProfilePage);
app.component('SettingsPage', SettingsPage);
app.component('AdminDashboardPage', AdminDashboardPage);
app.component('AdminUsersPage', AdminUsersPage);
app.component('AdminLevelsPage', AdminLevelsPage);
app.component('AdminItemsPage', AdminItemsPage);
app.component('AdminAchievementsPage', AdminAchievementsPage);

app.component('router-link', {
    props: ['to'],
    template: `<a :href="'#' + to" :class="$attrs.class"><slot></slot></a>`
});

app.mount('#app');
