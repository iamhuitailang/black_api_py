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
        
        Router.register('variety', () => {
            VarietyPage.render();
        });
        
        Router.register('contact', () => {
            ContactPage.render();
        });
        
        Router.register('purchase', () => {
            PurchasePage.render();
        });
        
        Router.register('sale', () => {
            SalePage.render();
        });
        
        Router.register('inventory', () => {
            InventoryPage.render();
        });
        
        Router.register('statistics', () => {
            StatisticsPage.render();
        });
        
        Router.register('log', () => {
            LogPage.render();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
