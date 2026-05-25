const Router = {
    routes: {},
    current: 'login',
    tabRoutes: ['home', 'checkin', 'statistics', 'plans', 'profile'],

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },

    register(name, handler) {
        this.routes[name] = handler;
    },

    navigate(name) {
        window.location.hash = name;
        window.scrollTo(0, 0);
    },

    handleRoute() {
        const hash = window.location.hash.slice(1) || 'login';
        const [name, query] = hash.split('?');
        const params = {};
        if (query) new URLSearchParams(query).forEach((v, k) => params[k] = v);
        this.current = name;
        const handler = this.routes[name];
        if (handler) handler(params);
        else this.navigate('login');
    },

    isTabRoute(name) {
        return this.tabRoutes.includes(name);
    }
};
