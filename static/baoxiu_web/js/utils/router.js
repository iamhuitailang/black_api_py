const Router = {
    currentRoute: null,
    routes: {},
    params: {},

    rolePermissions: {
        student: ['login', 'register', 'home', 'orders', 'orderDetail', 'createOrder', 'profile', 'editProfile', 'changePassword', 'notifications'],
        repairman: ['login', 'register', 'home', 'orders', 'orderDetail', 'profile', 'editProfile', 'changePassword', 'notifications'],
        admin: ['login', 'register', 'home', 'orders', 'orderDetail', 'profile', 'editProfile', 'changePassword', 'notifications', 'users', 'dormitories', 'statistics', 'logs']
    },

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
        const hash = window.location.hash.slice(1) || 'login';
        const [path, ...args] = hash.split('/');

        if (!AuthService.isLoggedIn() && !['login', 'register'].includes(path)) {
            this.navigate('login');
            return;
        }

        if (['login', 'register'].includes(path) && AuthService.isLoggedIn()) {
            this.navigate('home');
            return;
        }

        if (AuthService.isLoggedIn()) {
            const user = AuthService.getCurrentUser();
            const role = user?.role;
            const allowedRoutes = this.rolePermissions[role] || [];

            if (!allowedRoutes.includes(path)) {
                Utils.showToast('权限不足');
                this.navigate('home');
                return;
            }
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
