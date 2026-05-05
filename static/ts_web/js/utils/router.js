const Router = {
    currentRoute: null,
    routes: {},
    params: {},

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    },

    register(path, handler) {
        this.routes[path] = handler;
    },

    navigate(path, params = {}) {
        this.params = params;
        window.location.hash = path;
    },

    getParams() {
        return this.params;
    },

    handleRoute() {
        const hash = window.location.hash.slice(1) || 'home';
        const [path, ...args] = hash.split('/');

        if (!AuthService.isLoggedIn() && !['login', 'register'].includes(path)) {
            this.navigate('login');
            return;
        }

        if (['login', 'register'].includes(path) && AuthService.isLoggedIn()) {
            this.navigate('home');
            return;
        }

        this.currentRoute = path;
        const handler = this.routes[path];

        if (handler) {
            handler(args);
        } else {
            this.navigate('home');
        }
    },

    getCurrentRoute() {
        return this.currentRoute;
    },

    back() {
        window.history.back();
    }
};

window.Router = Router;
