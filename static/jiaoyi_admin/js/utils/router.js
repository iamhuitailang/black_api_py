const Router = {
    routes: {},
    currentRoute: null,

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },

    register(name, handler) {
        this.routes[name] = handler;
    },

    navigate(name, params = {}) {
        const queryString = Object.keys(params)
            .map(key => `${key}=${encodeURIComponent(params[key])}`)
            .join('&');
        window.location.hash = name + (queryString ? '?' + queryString : '');
    },

    handleRoute() {
        const hash = window.location.hash.slice(1) || 'login';
        const [routeName, queryString] = hash.split('?');
        const params = {};

        if (queryString) {
            queryString.split('&').forEach(pair => {
                const [key, value] = pair.split('=');
                params[key] = decodeURIComponent(value);
            });
        }

        this.currentRoute = routeName;
        this.params = params;

        const handler = this.routes[routeName];
        if (handler) {
            handler(params);
        } else {
            this.navigate('login');
        }
    },

    getParams() {
        return this.params || {};
    }
};
