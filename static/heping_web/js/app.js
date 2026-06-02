const App = {
    currentPage: null,

    init() {
        this.registerRoutes();
        Router.init();
    },

    switchPage(pageName, renderFn) {
        if (this.currentPage === 'game' && pageName !== 'game') {
            GamePage.destroy();
        }
        this.currentPage = pageName;
        renderFn();
    },

    registerRoutes() {
        Router.register('login', () => {
            this.switchPage('login', () => LoginPage.render());
        });

        Router.register('register', () => {
            this.switchPage('register', () => RegisterPage.render());
        });

        Router.register('home', () => {
            this.switchPage('home', () => HomePage.render());
        });

        Router.register('game', () => {
            this.switchPage('game', () => GamePage.render());
        });

        Router.register('leaderboard', () => {
            this.switchPage('leaderboard', () => LeaderboardPage.render());
        });

        Router.register('achievements', () => {
            this.switchPage('achievements', () => AchievementsPage.render());
        });

        Router.register('profile', () => {
            this.switchPage('profile', () => ProfilePage.render());
        });

        Router.register('admin', () => {
            this.switchPage('admin', () => AdminPage.render());
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
