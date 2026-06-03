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

        Router.register('tracks', () => {
            TracksPage.render();
        });

        Router.register('piano', () => {
            PianoPage.render();
        });

        Router.register('magic', () => {
            MagicPage.render();
        });

        Router.register('instruments', () => {
            InstrumentsPage.render();
        });

        Router.register('competition', () => {
            CompetitionPage.render();
        });

        Router.register('profile', () => {
            ProfilePage.render();
        });

        Router.register('settings', () => {
            SettingsPage.render();
        });

        Router.register('my_scores', () => {
            Toast.info('我的成绩功能开发中...');
            Router.back();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
