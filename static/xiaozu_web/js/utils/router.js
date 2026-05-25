const Router = {
    currentRoute: null,
    routes: {},

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    },

    register(path, handler) {
        this.routes[path] = handler;
    },

    navigate(path) {
        window.location.hash = path;
    },

    handleRoute() {
        const hash = window.location.hash.slice(1) || 'home';
        const [path, ...params] = hash.split('/');

        const authPages = ['login', 'register'];
        if (!authPages.includes(path) && !AuthService.isLoggedIn()) {
            this.navigate('login');
            return;
        }

        if (authPages.includes(path) && AuthService.isLoggedIn()) {
            this.navigate('home');
            return;
        }

        this.currentRoute = path;
        const handler = this.routes[path];

        if (handler) {
            handler(params);
        } else {
            this.navigate('home');
        }
    },

    getCurrentRoute() {
        return this.currentRoute;
    }
};

window.Router = Router;
