const App = {
    init() {
        this.registerRoutes();
        Router.init();
    },

    registerRoutes() {
        Router.register('login', () => { LoginPage.render(); });
        Router.register('register', () => { RegisterPage.render(); });
        Router.register('home', () => { HomePage.render(); });
        Router.register('discover', () => { DiscoverPage.render(); });
        Router.register('detail', () => { DetailPage.render(); });
        Router.register('publish', () => { PublishPage.render(); });
        Router.register('profile', () => { ProfilePage.render(); });
        Router.register('myActivities', () => { MyActivitiesPage.render(); });
        Router.register('myFavorites', () => { MyFavoritesPage.render(); });
        Router.register('messages', () => { MessagesPage.render(); });
        Router.register('settings', () => { SettingsPage.render(); });
        Router.register('editActivity', () => { EditActivityPage.render(); });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
