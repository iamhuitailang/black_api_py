const App = {
    init() {
        this.createApp();
    },

    createApp() {
        const { createApp } = Vue;

        const app = createApp({
            data() {
                return {
                    currentPage: 'login',
                    pageParams: {}
                };
            },
            computed: {
                currentComponent() {
                    const pageMap = {
                        'login': LoginPage,
                        'register': RegisterPage,
                        'home': HomePage,
                        'doodle': DoodlePage,
                        'battle': BattlePage,
                        'backpack': BackpackPage,
                        'skill': SkillPage,
                        'workshop': WorkshopPage
                    };
                    return pageMap[this.currentPage] || LoginPage;
                }
            },
            template: `
                <component :is="currentComponent" :params="pageParams" />
            `,
            mounted() {
                Router.init();
                
                Router.onRouteChange = (page, params) => {
                    this.currentPage = page;
                    this.pageParams = params;
                };
                
                const initialPage = Router.getCurrentPage();
                const isLoggedIn = AuthService.isLoggedIn();
                
                if (initialPage === 'login' || initialPage === 'register') {
                    this.currentPage = initialPage;
                } else if (isLoggedIn) {
                    this.currentPage = initialPage || 'home';
                } else {
                    this.currentPage = 'login';
                    Router.navigate('login');
                }
                
                this.pageParams = Router.getParams();
            }
        });

        app.component('doodle-canvas', DoodleCanvas);

        app.mount('#app');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
