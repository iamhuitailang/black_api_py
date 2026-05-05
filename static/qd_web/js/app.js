(function() {
    'use strict';

    const App = {
        init() {
            this.registerRoutes();
            Router.init();
            AuthService.checkAndShowNotification();
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

            Router.register('history', () => {
                HistoryPage.render();
            });

            Router.register('settings', () => {
                SettingsPage.render();
            });
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        App.init();
    });

    window.App = App;
})();
