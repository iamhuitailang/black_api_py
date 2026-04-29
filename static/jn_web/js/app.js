const App = {
    init() {
        this.registerRoutes();
        this.setupNavigation();
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

        Router.register('skill', () => {
            SkillPage.render();
        });

        Router.register('match', (params) => {
            MatchPage.render();
        });

        Router.register('exchange', () => {
            ExchangePage.render();
        });

        Router.register('profile', () => {
            ProfilePage.render();
        });

        Router.register('settings', () => {
            SettingsPage.render();
        });
    },

    setupNavigation() {
        Router.setOnRouteChange((route) => {
            this.updateBottomNav(route);
        });
    },

    updateBottomNav(route) {
        const navItems = document.querySelectorAll('.bottom-nav .nav-item[data-route]');
        navItems.forEach(item => {
            const itemRoute = item.dataset.route;
            item.classList.toggle('active', itemRoute === route);
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

window.App = App;
