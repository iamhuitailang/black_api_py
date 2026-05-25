const App = {
    init() {
        this.registerRoutes();
        Router.init();
    },

    registerRoutes() {
        Router.register('login', () => LoginPage.render());
        Router.register('dashboard', () => DashboardPage.render());
        Router.register('user', () => UserPage.render());
        Router.register('checkin', () => CheckinPage.render());
        Router.register('quote', () => QuotePage.render());
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
