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

        Router.register('register', () => {
            RegisterPage.render();
        });

        Router.register('home', () => {
            HomePage.render();
        });

        Router.register('bookList', () => {
            BookListPage.render();
        });

        Router.register('bookDetail', () => {
            BookDetailPage.render();
        });

        Router.register('publish', () => {
            PublishPage.render();
        });

        Router.register('orders', () => {
            OrdersPage.render();
        });

        Router.register('favorites', () => {
            FavoritesPage.render();
        });

        Router.register('profile', () => {
            ProfilePage.render();
        });

        Router.register('myBooks', () => {
            MyBooksPage.render();
        });

        Router.register('sellOrders', () => {
            SellOrdersPage.render();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
