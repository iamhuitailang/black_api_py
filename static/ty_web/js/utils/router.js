const Router = {
    currentPage: 'home',
    routes: {},
    params: {},

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },

    register(name, component) {
        this.routes[name] = component;
    },

    navigate(page, params = {}) {
        this.params = params;
        const hash = params.id ? `#${page}/${params.id}` : `#${page}`;
        window.location.hash = hash;
    },

    handleRoute() {
        const hash = window.location.hash.slice(1) || 'home';
        const parts = hash.split('/');
        this.currentPage = parts[0];
        if (parts[1]) {
            this.params.id = parts[1];
        }
        if (this.onRouteChange) {
            this.onRouteChange(this.currentPage, this.params);
        }
    },

    getCurrentPage() {
        return this.currentPage;
    },

    getParams() {
        return this.params;
    },

    back() {
        window.history.back();
    }
};
