const Router = {
    routes: {},
    currentRoute: '',
    app: null,

    init(app) {
        this.app = app;
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },

    register(path, component) {
        this.routes[path] = component;
    },

    navigate(path) {
        if (window.location.hash === '#' + path) {
            this.handleRoute();
        } else {
            window.location.hash = path;
        }
    },

    handleRoute() {
        const hash = window.location.hash.slice(1) || '/login';
        this.currentRoute = hash;
        
        let route = this.routes[hash];
        
        if (!route) {
            for (const path in this.routes) {
                if (hash.startsWith(path)) {
                    route = this.routes[path];
                    break;
                }
            }
        }
        
        if (!route) {
            route = this.routes['/login'];
            this.currentRoute = '/login';
        }
        
        if (this.app) {
            this.app.currentPage = this.currentRoute;
        }
    },

    getParams() {
        const hash = window.location.hash.slice(1);
        const queryIndex = hash.indexOf('?');
        if (queryIndex === -1) return {};
        
        const queryString = hash.slice(queryIndex + 1);
        const params = {};
        queryString.split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        });
        return params;
    }
};
