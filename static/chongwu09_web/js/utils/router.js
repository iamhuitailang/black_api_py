const Router = {
    currentRoute: null,
    routes: {},
    params: {},

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    },

    register(path, handler) { this.routes[path] = handler; },

    navigate(path, params = {}) {
        this.params = params;
        window.location.hash = path;
    },

    getParams() { return this.params; },

    handleRoute() {
        const hash = window.location.hash.slice(1) || 'home';
        const [path, ...args] = hash.split('/');

        const adminRoutes = ['adminLogin', 'adminDashboard', 'adminServices', 'adminBookings', 'adminPets', 'adminOrders', 'adminProfile'];
        const publicRoutes = ['login', 'register', 'adminLogin'];

        if (adminRoutes.includes(path)) {
            if (!AuthService.isAdminLoggedIn() && path !== 'adminLogin') {
                this.navigate('adminLogin');
                return;
            }
        } else if (!publicRoutes.includes(path)) {
            if (!AuthService.isLoggedIn()) {
                this.navigate('login');
                return;
            }
        }

        if (path === 'login' && AuthService.isLoggedIn()) {
            this.navigate('home');
            return;
        }
        if (path === 'adminLogin' && AuthService.isAdminLoggedIn()) {
            this.navigate('adminDashboard');
            return;
        }

        this.currentRoute = path;
        const handler = this.routes[path];
        if (handler) { handler(args); } else { this.navigate('home'); }
    },

    getCurrentRoute() { return this.currentRoute; },
    back() { window.history.back(); }
};

window.Router = Router;
