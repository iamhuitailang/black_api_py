const Router = {
    currentRoute: null,
    routes: {},
    params: {},
    queryParams: {},

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    },

    register(path, handler) {
        this.routes[path] = handler;
    },

    navigate(path, params = {}) {
        this.params = params;
        const qs = new URLSearchParams(params).toString();
        window.location.hash = path + (qs ? '?' + qs : '');
    },

    getParams() {
        return this.params;
    },

    handleRoute() {
        const hash = window.location.hash.slice(1) || 'home';
        const [pathWithQuery, ...args] = hash.split('/');
        const [path, query] = pathWithQuery.split('?');
        this.queryParams = {};
        if (query) {
            const sp = new URLSearchParams(query);
            sp.forEach((v, k) => { this.queryParams[k] = v; });
        }

        this.currentRoute = path;
        const handler = this.routes[path];

        if (handler) {
            handler(args);
        } else {
            this.navigate('home');
        }

        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.route === path);
        });
        window.scrollTo({ top: 0, behavior: 'instant' });
    },

    getCurrentRoute() {
        return this.currentRoute;
    },

    back() {
        window.history.back();
    }
};

window.Router = Router;
