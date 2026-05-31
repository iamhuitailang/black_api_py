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

        Router.register('editor', (args) => {
            EditorPage.render(args);
        });

        Router.register('templates', () => {
            TemplatesPage.render();
        });

        Router.register('settings', () => {
            SettingsPage.render();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
