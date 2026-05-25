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

        Router.register('orders', () => {
            OrdersPage.render();
        });

        Router.register('orderDetail', () => {
            OrderDetailPage.render();
        });

        Router.register('createOrder', () => {
            CreateOrderPage.render();
        });

        Router.register('profile', () => {
            ProfilePage.render();
        });

        Router.register('editProfile', () => {
            EditProfilePage.render();
        });

        Router.register('changePassword', () => {
            ChangePasswordPage.render();
        });

        Router.register('notifications', () => {
            NotificationsPage.render();
        });

        Router.register('users', () => {
            UsersPage.render();
        });

        Router.register('dormitories', () => {
            DormitoriesPage.render();
        });

        Router.register('statistics', () => {
            StatisticsPage.render();
        });

        Router.register('logs', () => {
            LogsPage.render();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
