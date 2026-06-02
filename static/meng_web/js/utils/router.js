const Router = {
    currentRoute: null,
    routes: {},
    params: {},
    beforeEachHooks: [],
    afterEachHooks: [],

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },

    register(path, handler) {
        this.routes[path] = handler;
    },

    beforeEach(hook) {
        this.beforeEachHooks.push(hook);
    },

    afterEach(hook) {
        this.afterEachHooks.push(hook);
    },

    async navigate(path, params = {}) {
        this.params = params;
        window.location.hash = path;
    },

    getParams() {
        return this.params;
    },

    async handleRoute() {
        const hash = window.location.hash.slice(1) || 'home';
        const [path, ...args] = hash.split('/');

        const prevRoute = this.currentRoute;

        const canProceed = await this.runBeforeEachHooks(path, prevRoute);
        if (!canProceed) {
            return;
        }

        if (!this.isLoggedIn() && !this.isPublicRoute(path)) {
            this.navigate('login');
            return;
        }

        if (this.isAuthRoute(path) && this.isLoggedIn()) {
            this.navigate('home');
            return;
        }

        this.currentRoute = path;
        const handler = this.routes[path];

        if (handler) {
            handler(args);
            this.runAfterEachHooks(path, prevRoute);
        } else {
            this.navigate('home');
        }
    },

    async runBeforeEachHooks(to, from) {
        for (const hook of this.beforeEachHooks) {
            const result = await hook(to, from);
            if (result === false) {
                return false;
            }
        }
        return true;
    },

    runAfterEachHooks(to, from) {
        this.afterEachHooks.forEach(hook => hook(to, from));
    },

    isLoggedIn() {
        if (typeof AuthService !== 'undefined' && AuthService.isLoggedIn) {
            return AuthService.isLoggedIn();
        }
        return !!Storage.getToken();
    },

    isPublicRoute(path) {
        return ['login', 'register'].includes(path);
    },

    isAuthRoute(path) {
        return ['login', 'register'].includes(path);
    },

    getCurrentRoute() {
        return this.currentRoute;
    },

    back() {
        window.history.back();
    },

    replace(path, params = {}) {
        this.params = params;
        window.location.replace(`#${path}`);
    },

    go(n) {
        window.history.go(n);
    },

    addRouteGuard() {
        this.beforeEach((to, from) => {
            console.log(`Route changing: ${from} -> ${to}`);
            return true;
        });
    }
};

window.Router = Router;
