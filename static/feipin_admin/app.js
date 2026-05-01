const App = {
    async init() {
        Router.register('login', LoginPage);
        Router.register('dashboard', DashboardPage);
        Router.register('users', UsersPage);
        Router.register('collectors', CollectorsPage);
        Router.register('categories', CategoriesPage);
        Router.register('orders', OrdersPage);

        const isLoggedIn = await this.checkAuth();
        
        if (!isLoggedIn) {
            Router.navigate('login');
        } else {
            Router.navigate('dashboard');
        }
    },

    async checkAuth() {
        if (!AuthService.isLoggedIn()) {
            return false;
        }

        try {
            return await AuthService.checkAuth();
        } catch (error) {
            return false;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

window.App = App;
