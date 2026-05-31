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
        const hash = window.location.hash.slice(1) || '/home';
        const path = hash.startsWith('/') ? hash.slice(1) : hash;

        if (this.routes[path]) {
            this.currentRoute = path;
            this.routes[path]();
        } else if (this.routes['home']) {
            this.currentRoute = 'home';
            this.routes['home']();
        }
    },

    navigate(path) {
        window.location.hash = `#/${path}`;
    }
};
