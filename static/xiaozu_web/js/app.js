const App = {
    init() {
        this.registerRoutes();
        Router.init();
    },

    registerRoutes() {
        Router.register('login', () => LoginPage.render());
        Router.register('register', () => RegisterPage.render());
        Router.register('home', () => HomePage.render());
        Router.register('tasks', () => TaskPage.render());
        Router.register('team', () => TeamPage.render());
        Router.register('profile', () => ProfilePage.render());
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
