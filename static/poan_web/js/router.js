const Router = {
    currentRoute: null,
    routes: {},
    params: {},

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    },

    register(path, handler) {
        this.routes[path] = handler;
    },

    navigate(path, params = {}) {
        this.params = params;
        if (params && Object.keys(params).length > 0) {
            const qs = new URLSearchParams(params).toString();
            window.location.hash = path + '?' + qs;
        } else {
            window.location.hash = path;
        }
    },

    getParams() {
        const hash = window.location.hash.slice(1) || '';
        const qIndex = hash.indexOf('?');
        if (qIndex === -1) {
            return this.params;
        }
        const qs = hash.substring(qIndex + 1);
        const urlParams = {};
        new URLSearchParams(qs).forEach((v, k) => { urlParams[k] = v; });
        return { ...this.params, ...urlParams };
    },

    _parseHash() {
        const hash = window.location.hash.slice(1) || 'home';
        const qIndex = hash.indexOf('?');
        if (qIndex === -1) {
            return { path: hash, params: {} };
        }
        const path = hash.substring(0, qIndex);
        const qs = hash.substring(qIndex + 1);
        const params = {};
        new URLSearchParams(qs).forEach((v, k) => { params[k] = v; });
        return { path, params };
    },

    handleRoute() {
        const { path, params } = this._parseHash();
        this.params = { ...this.params, ...params };

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
            handler();
        } else {
            this.navigate('home');
        }
    },

    getCurrentRoute() {
        return this.currentRoute;
    },

    getCurrentPath() {
        const hash = window.location.hash.slice(1) || 'home';
        const qIndex = hash.indexOf('?');
        return qIndex === -1 ? hash : hash.substring(0, qIndex);
    },

    back() {
        window.history.back();
    }
};

window.Router = Router;
