const Router = {
    currentRoute: null,
    routes: {},
    params: {},
    currentPageRef: null,

    init(options) {
        this.currentPageRef = options.currentPage;
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
        let hash = window.location.hash.slice(1);
        if (!hash) hash = 'login';
        
        const [path, ...args] = hash.split('/');

        const isLoggedIn = AuthService.isLoggedIn();
        const isAdmin = AuthService.isAdmin();

        const isAdminPage = path.startsWith('admin');

        if (isAdminPage && path !== 'admin-login') {
            if (!isAdmin) {
                this.navigate('admin-login');
                return;
            }
        } else if (!['login', 'register', 'admin-login'].includes(path)) {
            if (!isLoggedIn) {
                this.navigate('login');
                return;
            }
        }

        if (['login', 'register'].includes(path) && isLoggedIn) {
            this.navigate('home');
            return;
        }

        if (path === 'admin-login' && isAdmin) {
            this.navigate('admin-dashboard');
            return;
        }

        this.currentRoute = path;
        const handler = this.routes[path];

        if (handler) {
            handler(args);
            if (this.currentPageRef) {
                this.currentPageRef.value = path;
            }
        } else {
            if (isAdmin) {
                this.navigate('admin-dashboard');
            } else if (isLoggedIn) {
                this.navigate('home');
            } else {
                this.navigate('login');
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
