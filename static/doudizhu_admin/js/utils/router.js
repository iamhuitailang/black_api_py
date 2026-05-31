const Router = {
    routes: {},
    currentRoute: null,

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },

    register(path, handler) {
        this.routes[path] = handler;
    },

    handleRoute() {
        const hash = window.location.hash.slice(1) || '/dashboard';
        const path = hash.startsWith('/') ? hash.slice(1) : hash;

        if (this.routes[path]) {
            this.currentRoute = path;
            this.routes[path]();
        } else if (this.routes['dashboard']) {
            this.currentRoute = 'dashboard';
            this.routes['dashboard']();
        }
    },

    navigate(path) {
        window.location.hash = `#/${path}`;
    }
};
