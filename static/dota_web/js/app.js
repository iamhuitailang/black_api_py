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

        Router.register('hero', (args) => {
            const params = Router.getParams();
            if (params.action === 'detail' || (args && args.length > 0)) {
                HeroPage.renderDetail();
            } else {
                HeroPage.render();
            }
        });

        Router.register('battle', () => {
            BattlePage.render();
        });

        Router.register('shop', () => {
            ShopPage.render();
        });

        Router.register('inventory', () => {
            InventoryPage.render();
        });

        Router.register('profile', () => {
            ProfilePage.render();
        });

        Router.register('rank', () => {
            RankPage.render();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
