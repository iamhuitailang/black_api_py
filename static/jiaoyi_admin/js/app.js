const App = {
    init() {
        this.registerRoutes();
        Router.init();
        Toast.init();
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

        Router.register('book', () => {
            BookPage.render();
        });

        Router.register('category', () => {
            CategoryPage.render();
        });

        Router.register('order', () => {
            OrderPage.render();
        });

        Router.register('announcement', () => {
            AnnouncementPage.render();
        });

        Router.register('report', () => {
            ReportPage.render();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
