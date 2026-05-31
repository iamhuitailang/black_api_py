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

        Router.register('serviceDetail', () => {
            ServiceDetailPage.render();
        });

        Router.register('orderCreate', () => {
            OrderCreatePage.render();
        });

        Router.register('myOrders', () => {
            MyOrdersPage.render();
        });

        Router.register('orderDetail', () => {
            OrderDetailPage.render();
        });

        Router.register('reviewCreate', () => {
            ReviewCreatePage.render();
        });

        Router.register('notifications', () => {
            NotificationsPage.render();
        });

        Router.register('profile', () => {
            ProfilePage.render();
        });

        Router.register('settings', () => {
            SettingsPage.render();
        });

        Router.register('admin/dashboard', () => {
            AdminDashboardPage.render();
        });

        Router.register('admin/services', () => {
            AdminServicesPage.render();
        });

        Router.register('admin/orders', () => {
            AdminOrdersPage.render();
        });

        Router.register('admin/staff', () => {
            AdminStaffPage.render();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
