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

        Router.register('complaint', () => {
            ComplaintPage.render();
        });

        Router.register('myComplaints', () => {
            MyComplaintsPage.render();
        });

        Router.register('complaintDetail', () => {
            ComplaintDetailPage.render();
        });

        Router.register('handle', () => {
            HandlePage.render();
        });

        Router.register('notification', () => {
            NotificationPage.render();
        });

        Router.register('profile', () => {
            ProfilePage.render();
        });

        Router.register('settings', () => {
            SettingsPage.render();
        });

        Router.register('admin', () => {
            if (AuthService.isAdmin()) {
                AdminPage.render();
            } else {
                Router.navigate('home');
            }
        });

        Router.register('adminUsers', () => {
            if (AuthService.isAdmin()) {
                AdminPage.currentView = 'adminUsers';
                AdminPage.render();
            } else {
                Router.navigate('home');
            }
        });

        Router.register('adminCategories', () => {
            if (AuthService.isAdmin()) {
                AdminPage.currentView = 'adminCategories';
                AdminPage.render();
            } else {
                Router.navigate('home');
            }
        });

        Router.register('adminDepartments', () => {
            if (AuthService.isAdmin()) {
                AdminPage.currentView = 'adminDepartments';
                AdminPage.render();
            } else {
                Router.navigate('home');
            }
        });

        Router.register('adminAnnouncements', () => {
            if (AuthService.isAdmin()) {
                AdminPage.currentView = 'adminAnnouncements';
                AdminPage.render();
            } else {
                Router.navigate('home');
            }
        });

        Router.register('adminLogs', () => {
            if (AuthService.isAdmin()) {
                AdminPage.currentView = 'adminLogs';
                AdminPage.render();
            } else {
                Router.navigate('home');
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});