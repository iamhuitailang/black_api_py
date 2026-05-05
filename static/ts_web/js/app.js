const App = {
    init() {
        this.registerRoutes();
        Router.init();
    },

    registerRoutes() {
        Router.register('login', () => {
            LoginPage.render();
        });

        Router.register('register', () => {
            RegisterPage.render();
        });

        Router.register('home', () => {
            HomePage.render();
        });

        Router.register('record', () => {
            RecordPage.render();
        });

        Router.register('stats', () => {
            StatsPage.render();
        });

        Router.register('goal', () => {
            GoalPage.render();
        });

        Router.register('social', () => {
            SocialPage.render();
        });

        Router.register('profile', () => {
            ProfilePage.render();
        });

        Router.register('achievements', () => {
            AchievementsPage.render();
        });

        Router.register('friends', () => {
            FriendsPage.render();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
