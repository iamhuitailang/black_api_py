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
        
        Router.register('banner', () => {
            BannerPage.render();
        });
        
        Router.register('tab', () => {
            TabPage.render();
        });
        
        Router.register('product', () => {
            ProductPage.render();
        });
        
        Router.register('contact', () => {
            ContactPage.render();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
