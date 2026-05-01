const App = {
    init() {
        this.registerRoutes();
        Router.init();
    },

    registerRoutes() {
        Router.register('login', () => {
            LoginPage.render();
        });

        Router.register('home', () => {
            HomePage.render();
        });

        Router.register('price', () => {
            PricePage.render();
        });

        Router.register('create-order', (params) => {
            CreateOrderPage.render();
        });

        Router.register('order', () => {
            OrderPage.render();
        });

        Router.register('collector-orders', () => {
            OrderPage.render();
        });

        Router.register('order-detail', (params) => {
            OrderDetailPage.render();
        });

        Router.register('review', (params) => {
            ReviewPage.render();
        });

        Router.register('collector', () => {
            CollectorPage.render();
        });

        Router.register('profile', () => {
            ProfilePage.render();
        });

        Router.register('order-hall', () => {
            OrderHallPage.render();
        });

        Router.register('income', () => {
            IncomePage.render();
        });

        Router.register('stats', () => {
            StatsPage.render();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
