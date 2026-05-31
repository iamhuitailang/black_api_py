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
        const fullHash = hash;
        const [path, ...args] = hash.split('/');

        const role = Storage.getRole();
        const isUserLoggedIn = Storage.getUserToken();
        const isAdminLoggedIn = Storage.getAdminToken();

        if (!isUserLoggedIn && !isAdminLoggedIn) {
            if (!['login', 'register', 'home'].includes(path)) {
                this.navigate('login');
                return;
            }
        }

        if (role === 'user' && path.startsWith('admin')) {
            this.navigate('home');
            return;
        }

        if (role === 'admin' && !path.startsWith('admin') && !['login', 'register'].includes(path)) {
            this.navigate('admin/dashboard');
            return;
        }

        this.currentRoute = fullHash;
        let handler = this.routes[fullHash];

        if (!handler) {
            this.currentRoute = path;
            handler = this.routes[path];
        }

        if (handler) {
            handler(args);
        } else {
            if (role === 'admin') {
                this.navigate('admin/dashboard');
            } else {
                this.navigate('home');
            }
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
