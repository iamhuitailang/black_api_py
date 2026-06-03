(function() {
const Router = {
    currentRoute: null,
    routes: {},
    params: {},

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    },

    register(name, handler) {
        this.routes[name] = handler;
    },

    navigate(name, params = {}) {
        this.params = params;
        let hash = name;
        if (Object.keys(params).length > 0) {
            const queryString = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
            hash = name + '?' + queryString;
        }
        window.location.hash = hash;
    },

    getParams() {
        return this.params;
    },

    handleRoute() {
        const hash = window.location.hash.slice(1) || 'home';
        const [pathAndQuery, ...pathArgs] = hash.split('/');
        const [path, queryString] = pathAndQuery.split('?');
        
        const queryParams = {};
        if (queryString) {
            queryString.split('&').forEach(pair => {
                const [key, value] = pair.split('=');
                if (key && value !== undefined) {
                    queryParams[key] = decodeURIComponent(value);
                }
            });
        }
        
        const pathParams = {};
        if (pathArgs.length > 0) {
            pathParams['pathArgs'] = pathArgs;
        }
        
        this.params = { ...queryParams, ...pathParams, ...this.params };

        if (!AuthService.isLoggedIn() && !['login', 'register'].includes(path)) {
            this.navigate('login');
            return;
        }

        if (['login', 'register'].includes(path) && AuthService.isLoggedIn()) {
            this.navigate('home');
            return;
        }

        this.currentRoute = path;
        const handler = this.routes[path];

        if (handler) {
            handler(this.params);
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
})();
