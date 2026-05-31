const App = {
    init() {
        this.registerRoutes();
        Router.init();
    },

    registerRoutes() {
        Router.register('home', () => { HomePage.render(); });
        Router.register('login', () => { LoginPage.render(); });
        Router.register('register', () => { RegisterPage.render(); });
        Router.register('game', () => { GamePage.render(); });
        Router.register('leaderboard', () => { LeaderboardPage.render(); });
        Router.register('achievements', () => { AchievementsPage.render(); });
        Router.register('profile', () => { ProfilePage.render(); });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
