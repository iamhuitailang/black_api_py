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

        Router.register('user', () => {
            UserPage.render();
        });

        Router.register('post', () => {
            PostPage.render();
        });

        Router.register('category', () => {
            CategoryPage.render();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
