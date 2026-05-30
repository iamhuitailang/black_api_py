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

        Router.register('adminLogin', () => {
            AdminLoginPage.render();
        });

        Router.register('admin', () => {
            AdminPage.render();
        });

        Router.register('home', () => {
            HomePage.render();
        });

        Router.register('post', () => {
            PostPage.render();
        });

        Router.register('detail', () => {
            DetailPage.render();
        });

        Router.register('profile', () => {
            ProfilePage.render();
        });

        Router.register('myPosts', () => {
            MyPostsPage.render();
        });

        Router.register('myClaims', () => {
            MyClaimsPage.render();
        });

        Router.register('settings', () => {
            SettingsPage.render();
        });

        Router.register('map', () => {
            MapPage.render();
        });

        Router.register('office', () => {
            OfficePage.render();
        });

        Router.register('notifications', () => {
            NotificationsPage.render();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
