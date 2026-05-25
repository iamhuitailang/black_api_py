const Router = {
    routes: {},
    current: 'login',

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },

    register(name, handler) {
        this.routes[name] = handler;
    },

    navigate(name, params) {
        const hash = params ? `${name}?${new URLSearchParams(params).toString()}` : name;
        window.location.hash = hash;
    },

    handleRoute() {
        const hash = window.location.hash.slice(1) || 'login';
        const [name, query] = hash.split('?');
        const params = {};
        if (query) {
            new URLSearchParams(query).forEach((v, k) => params[k] = v);
        }
        this.current = name;
        const handler = this.routes[name];
        if (handler) {
            handler(params);
        } else {
            this.navigate('login');
        }
    }
};
