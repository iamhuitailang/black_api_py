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

    navigate(path, params = {}) {
        let hash = `#${path}`;
        if (Object.keys(params).length > 0) {
            const queryString = new URLSearchParams(params).toString();
            hash += `?${queryString}`;
        }
        if (window.location.hash !== hash) {
            window.location.hash = hash;
        } else {
            this.handleRoute();
        }
    },

    handleRoute() {
        let hash = window.location.hash.slice(1);
        let route = hash;
        let queryParams = {};

        if (hash.includes('?')) {
            const [routePart, queryPart] = hash.split('?');
            route = routePart;
            const params = new URLSearchParams(queryPart);
            params.forEach((value, key) => {
                queryParams[key] = value;
            });
        }

        if (!route) {
            const user = Storage.getUser();
            if (user) {
                route = 'dashboard';
            } else {
                route = 'login';
            }
        }

        this.currentRoute = route;
        this.currentParams = queryParams;

        const handler = this.routes[route];
        if (handler) {
            handler(queryParams);
        } else if (this.routes['404']) {
            this.routes['404']();
        } else {
            document.getElementById('app').innerHTML = '<div class="empty-state"><div class="icon">🔍</div><p>页面不存在</p></div>';
        }
    },

    getParams() {
        return this.currentParams || {};
    }
};
