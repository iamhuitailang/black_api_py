const { createApp, ref, onMounted } = Vue;

const App = {
    setup() {
        const currentPage = ref('login');
        const pageComponent = ref(null);

        const pageComponents = {
            login: LoginPage,
            register: RegisterPage,
            game: GamePage,
            profile: ProfilePage,
            leaderboard: LeaderboardPage,
            achievements: AchievementsPage
        };

        const initStore = () => {
            if (AuthService.isLoggedIn() && !GameStore.state) {
                GameStore.init();
            }
        };

        const registerRoutes = () => {
            Router.register('login', () => {
                currentPage.value = 'login';
                pageComponent.value = pageComponents.login;
            });

            Router.register('register', () => {
                currentPage.value = 'register';
                pageComponent.value = pageComponents.register;
            });

            Router.register('game', () => {
                initStore();
                GameStore.ensureState();
                currentPage.value = 'game';
                pageComponent.value = pageComponents.game;
            });

            Router.register('profile', () => {
                initStore();
                GameStore.ensureState();
                currentPage.value = 'profile';
                pageComponent.value = pageComponents.profile;
            });

            Router.register('leaderboard', () => {
                initStore();
                GameStore.ensureState();
                currentPage.value = 'leaderboard';
                pageComponent.value = pageComponents.leaderboard;
            });

            Router.register('achievements', () => {
                initStore();
                GameStore.ensureState();
                currentPage.value = 'achievements';
                pageComponent.value = pageComponents.achievements;
            });
        };

        onMounted(() => {
            initStore();
            registerRoutes();
            Router.init();
        });

        return {
            currentPage,
            pageComponent
        };
    },
    template: `
        <div>
            <component :is="pageComponent" v-if="pageComponent" :key="currentPage" />
        </div>
    `
};

document.addEventListener('DOMContentLoaded', () => {
    createApp(App).mount('#app');
});
