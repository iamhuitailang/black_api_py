const { createApp, ref, computed } = Vue;

const app = createApp({
    data() {
        return {
            currentRoute: '/home'
        };
    },
    computed: {
        currentView() {
            const route = this.currentRoute;
            const routes = {
                '/login': LoginPage,
                '/register': RegisterPage,
                '/home': HomePage,
                '/game': GamePage,
                '/leaderboard': LeaderboardPage,
                '/achievements': AchievementsPage,
                '/profile': ProfilePage,
                '/admin/dashboard': AdminDashboardPage,
                '/admin/users': AdminUsersPage,
                '/admin/levels': AdminLevelsPage,
                '/admin/images': AdminImagesPage,
                '/admin/stats': AdminStatsPage
            };
            return routes[route] || HomePage;
        }
    },
    mounted() {
        ZbtRouter.init(this);
    }
});

app.mount('#app');
