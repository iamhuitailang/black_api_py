var App = {
    init: function() {
        this.registerRoutes();
        Router.init();
        Toast.init();
    },
    
    registerRoutes: function() {
        Router.register('/login', function() {
            LoginPage.render();
        });
        
        Router.register('/dashboard', function() {
            DashboardPage.render();
        });
        
        Router.register('/users', function() {
            UsersPage.render();
        });
        
        Router.register('/items', function() {
            ItemsPage.render();
        });
        
        Router.register('/exchanges', function() {
            ExchangesPage.render();
        });
        
        Router.register('/reports', function() {
            ReportsPage.render();
        });
        
        Router.register('/', function() {
            if (Auth.isLoggedIn()) {
                Router.navigate('/dashboard');
            } else {
                Router.navigate('/login');
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', function() {
    App.init();
});
