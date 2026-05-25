const App = {
    init() {
        this.registerRoutes();
        Router.init();
    },

    registerRoutes() {
        Router.register('home', () => HomePage.render());
        Router.register('want', () => WantPage.render());
        Router.register('watching', () => WatchingPage.render());
        Router.register('finished', () => FinishedPage.render());
        Router.register('dropped', () => DroppedPage.render());
        Router.register('detail', () => DetailPage.render());
        Router.register('add', () => AddPage.render());
        Router.register('stats', () => StatsPage.render());
        Router.register('settings', () => SettingsPage.render());
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
