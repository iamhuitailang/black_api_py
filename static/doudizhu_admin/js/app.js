const App = {
    init() {
        this.registerRoutes();
        Router.init();
    },

    registerRoutes() {
        Router.register('login', () => {
            LoginPage.render();
        });

        Router.register('dashboard', () => {
            DashboardPage.render();
        });

        Router.register('users', () => {
            UsersPage.render();
        });

        Router.register('ai-config', () => {
            AiConfigPage.render();
        });

        Router.register('achievements', () => {
            AchievementsPage.render();
        });

        Router.register('game-records', () => {
            GameRecordsPage.render();
        });

        Router.register('stats', () => {
            StatsPage.render();
        });

        Router.register('admins', () => {
            AdminsPage.render();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
