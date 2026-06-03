console.log('app.js starting...');
console.log('Router before register:', typeof Router, Router ? Router.routes : 'undefined');
console.log('LoginPage:', typeof LoginPage);

const { h } = Vue;

console.log('Registering routes...');
Router.register('login', LoginPage);
Router.register('register', RegisterPage);
Router.register('home', HomePage);
Router.register('music', MusicPage);
Router.register('character', CharacterPage);
Router.register('skill', SkillPage);
Router.register('leaderboard', LeaderboardPage);
Router.register('settings', SettingsPage);
Router.register('game', GamePage);

console.log('After register, Router.routes:', Object.keys(Router.routes));
console.log('Router.routes.login:', typeof Router.routes.login);

const App = {
    data() {
        console.log('App.data() called');
        return {
            currentPage: 'login',
            currentParams: {}
        };
    },
    computed: {
        currentComponent() {
            console.log('currentComponent computed, Router.routes:', Object.keys(Router.routes));
            var comp = Router.getCurrentComponent();
            console.log('Component:', comp ? 'found' : 'NOT found');
            return comp;
        }
    },
    created() {
        console.log('App.created() called');
        console.log('Router.routes in created:', Object.keys(Router.routes));
        
        var self = this;
        Router.onRouteChange = function(page, params) {
            console.log('onRouteChange:', page);
            self.currentPage = page;
            self.currentParams = params;
        };

        if (Auth.isAuthenticated()) {
            console.log('User is authenticated, going to home');
            this.currentPage = 'home';
            Router.currentPage = 'home';
        }
    },
    mounted() {
        console.log('App.mounted() called');
        console.log('Router.routes in mounted:', Object.keys(Router.routes));
        console.log('Router.routes.login:', typeof Router.routes.login);
        
        var targetPage = Auth.isAuthenticated() ? 'home' : 'login';
        console.log('About to navigate to:', targetPage);
        
        if (!Router.routes[targetPage]) {
            console.error('ERROR: Route not found in Router.routes!');
            console.error('All routes:', Router.routes);
        }
        
        Router.navigate(targetPage);

        window.addEventListener('resize', Utils.debounce(function() {
            var canvas = document.getElementById('gameCanvas');
            if (canvas) {
                var container = canvas.parentElement;
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
            }
        }, 250));
    },
    render() {
        console.log('App.render() called, page:', this.currentPage);
        var Component = this.currentComponent;
        return h(Component, { 
            params: this.currentParams,
            key: this.currentPage
        });
    }
};

console.log('Creating Vue app...');
var app = Vue.createApp(App);
console.log('App created, mounting...');
app.mount('#app');
console.log('App mounted!');
