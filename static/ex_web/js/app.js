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
        
        Router.register('/register', function() {
            RegisterPage.render();
        });
        
        Router.register('/', function() {
            if (!Auth.isLoggedIn()) {
                Router.navigate('/login');
            } else {
                HomePage.render();
            }
        });
        
        Router.register('/home', function() {
            if (!Auth.checkAuth()) return;
            HomePage.render();
        });
        
        Router.register('/item/:id', function(params) {
            ItemPage.render(params);
        });
        
        Router.register('/publish', function() {
            PublishPage.render();
        });
        
        Router.register('/profile', function() {
            ProfilePage.render();
        });
        
        Router.register('/profile/:id', function(params) {
            ProfilePage.render(params);
        });
        
        Router.register('/exchange', function() {
            ExchangePage.render();
        });
        
        Router.register('/message', function() {
            MessagePage.render();
        });
        
        Router.register('/search', function() {
            SearchPage.render();
        });
    }
};

document.addEventListener('DOMContentLoaded', function() {
    App.init();
});
