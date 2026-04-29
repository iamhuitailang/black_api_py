const Router = {
    currentRoute: null,
    routes: {},
    onRouteChange: null,

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
        const hash = window.location.hash.slice(1) || 'login';
        const [path, ...params] = hash.split('/');

        const publicRoutes = ['login', 'register'];
        if (!publicRoutes.includes(path) && !AuthService.isLoggedIn()) {
            this.navigate('login');
            return;
        }

        if (publicRoutes.includes(path) && AuthService.isLoggedIn()) {
            this.navigate('home');
            return;
        }

        this.currentRoute = path;
        const handler = this.routes[path];

        if (this.onRouteChange) {
            this.onRouteChange(path);
        }

        if (handler) {
            handler(params);
        } else {
            if (AuthService.isLoggedIn()) {
                this.navigate('home');
            } else {
                this.navigate('login');
            }
        }
    },

    getCurrentRoute() {
        return this.currentRoute;
    },

    setOnRouteChange(callback) {
        this.onRouteChange = callback;
    }
};

window.Router = Router;
