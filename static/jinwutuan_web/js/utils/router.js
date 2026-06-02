const Router = {
    routes: {},
    currentRoute: null,
    defaultRoute: 'login',
    onRouteChange: null,

    register(route, handler) {
        this.routes[route] = handler;
    },

    init(onRouteChange, autoHandle = true) {
        this.onRouteChange = onRouteChange;
        window.addEventListener('hashchange', () => this.handleRouteChange());
        if (autoHandle) {
            this.handleRouteChange();
        }
    },

    navigate(route) {
        if (route.startsWith('#')) {
            window.location.hash = route;
        } else {
            window.location.hash = '#' + route;
        }
    },

    handleRouteChange() {
        const hash = window.location.hash.slice(1) || this.defaultRoute;
        const { route, params } = this.parseRoute(hash);
        
        if (this.routes[route]) {
            this.currentRoute = route;
            if (this.onRouteChange) {
                this.onRouteChange(route, params);
            }
        } else {
            this.navigate(this.defaultRoute);
        }
    },

    parseRoute(hash) {
        const parts = hash.split('/');
        const route = parts[0];
        const params = {};
        
        for (let i = 1; i < parts.length; i += 2) {
            if (parts[i + 1] !== undefined) {
                params[parts[i]] = decodeURIComponent(parts[i + 1]);
            }
        }
        
        return { route, params };
    },

    getCurrentRoute() {
        return this.currentRoute;
    },

    getParams() {
        const hash = window.location.hash.slice(1) || this.defaultRoute;
        return this.parseRoute(hash).params;
    }
};
