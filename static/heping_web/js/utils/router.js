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
        Storage.set('current_route', path);
        Storage.set('current_route_params', params);
        window.location.hash = path;
    },

    getParams() {
        return this.params;
    },

    handleRoute() {
        let hash = window.location.hash.slice(1);

        if (!hash) {
            const savedRoute = Storage.get('current_route');
            if (savedRoute) {
                const savedParams = Storage.get('current_route_params');
                if (savedParams) {
                    this.params = savedParams;
                }
                window.location.hash = savedRoute;
                return;
            }
            hash = 'home';
        }

        const [path, ...args] = hash.split('/');

        if (!AuthService.isLoggedIn() && !['login', 'register'].includes(path)) {
            this.navigate('login');
            return;
        }

        if (['login', 'register'].includes(path) && AuthService.isLoggedIn()) {
            this.navigate('home');
            return;
        }

        const savedParams = Storage.get('current_route_params');
        const savedRoute = Storage.get('current_route');
        if (savedRoute === path && Object.keys(savedParams || {}).length > 0) {
            this.params = savedParams;
        } else if (Object.keys(this.params).length === 0) {
            this.params = {};
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
