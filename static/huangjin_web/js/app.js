const app = Vue.createApp({
    data() {
        return {
            loading: true,
            currentUser: null,
            currentRoute: 'home'
        };
    },
    computed: {
        isLoggedIn() {
            return !!this.currentUser;
        },
        isAdmin() {
            return this.currentUser && this.currentUser.role === 1;
        },
        currentComponent() {
            const routeMap = {
                'login': 'login-page',
                'register': 'register-page',
                'home': 'home-page',
                'game': 'game-page',
                'leaderboard': 'leaderboard-page',
                'achievements': 'achievements-page',
                'profile': 'profile-page',
                'admin-dashboard': 'admin-dashboard-page',
                'admin-users': 'admin-users-page',
                'admin-ores': 'admin-ores-page',
                'admin-achievements': 'admin-achievements-page',
                'admin-stats': 'admin-stats-page'
            };
            return routeMap[this.currentRoute] || 'home-page';
        }
    },
    async mounted() {
        try {
            const user = await Auth.init();
            if (user) {
                this.currentUser = user;
                const savedRoute = Storage.getRoute();
                if (savedRoute && savedRoute !== 'login' && savedRoute !== 'register') {
                    this.currentRoute = savedRoute;
                } else {
                    this.currentRoute = user.role === 1 ? 'admin-dashboard' : 'home';
                }
            } else {
                this.currentRoute = 'home';
            }
        } catch (e) {
            console.error('Init error:', e);
            this.currentRoute = 'home';
        }
        this.loading = false;
    },
    methods: {
        navigate(route) {
            this.currentRoute = route;
            Storage.setRoute(route);
        },
        onLoginSuccess(user) {
            this.currentUser = user;
            if (user.role === 1) {
                this.navigate('admin-dashboard');
            } else {
                this.navigate('home');
            }
        },
        async handleLogout() {
            await Auth.logout();
            this.currentUser = null;
            this.navigate('home');
        },
        async refreshUser() {
            const user = await Auth.refreshUser();
            if (user) {
                this.currentUser = user;
            }
        }
    }
});

app.component('login-page', LoginPage);
app.component('register-page', RegisterPage);
app.component('home-page', HomePage);
app.component('game-page', GamePage);
app.component('leaderboard-page', LeaderboardPage);
app.component('achievements-page', AchievementsPage);
app.component('profile-page', ProfilePage);
app.component('admin-dashboard-page', AdminDashboardPage);
app.component('admin-users-page', AdminUsersPage);
app.component('admin-ores-page', AdminOresPage);
app.component('admin-achievements-page', AdminAchievementsPage);
app.component('admin-stats-page', AdminStatsPage);

app.mount('#app');
