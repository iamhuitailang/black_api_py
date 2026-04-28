const App = {
    init() {
        this.registerRoutes();
        Router.init();
    },
    
    registerRoutes() {
        Router.register('login', () => {
            LoginPage.render();
        });
        
        Router.register('dashboard', () => {
            DashboardPage.render();
        });
        
        Router.register('market', () => {
            MarketPage.render();
        });
        
        Router.register('booth', () => {
            BoothPage.render();
        });
        
        Router.register('price', () => {
            PricePage.render();
        });
        
        Router.register('user', () => {
            UserPage.render();
        });
        
        Router.register('review', () => {
            ReviewPage.render();
        });
        
        Router.register('qa', () => {
            QAPage.render();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
