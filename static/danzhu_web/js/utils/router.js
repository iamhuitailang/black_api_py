const Router = {
    currentRoute: '/',
    routes: {},

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },

    handleRoute() {
        const hash = window.location.hash.slice(1) || '/';
        this.currentRoute = hash;
        
        if (this.onRouteChange) {
            this.onRouteChange(hash);
        }
    },

    navigate(path) {
        window.location.hash = path;
    },

    onRouteChange: null
};

function routerLink(path) {
    return `#${path}`;
}
