const DwRouter = {
    routes: {},
    currentRoute: '',
    currentParams: {},
    _onChange: null,

    init(onChange) {
        this._onChange = onChange;
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },

    register(path, handler) {
        this.routes[path] = handler;
    },

    navigate(path, params = {}) {
        this.currentParams = params;
        let hash = '#/' + path;
        Object.keys(params).forEach(key => {
            hash = hash.replace(':' + key, params[key]);
        });
        window.location.hash = hash;
    },

    handleRoute() {
        const hash = window.location.hash.slice(1) || '/login';
        const parts = hash.split('/').filter(Boolean);
        const route = parts[0] || 'login';
        const param = parts[1] || null;

        this.currentRoute = route;
        this.currentParams = { id: param };

        if (!DwAuth.isLoggedIn() && !['login', 'register'].includes(route)) {
            this.navigate('login');
            return;
        }

        if (['login', 'register'].includes(route) && DwAuth.isLoggedIn()) {
            this.navigate('dashboard');
            return;
        }

        if (this._onChange) {
            this._onChange(route, this.currentParams);
        }
    },

    getCurrentRoute() {
        return this.currentRoute;
    },

    getParams() {
        return this.currentParams;
    },

    back() {
        window.history.back();
    }
};

window.DwRouter = DwRouter;
