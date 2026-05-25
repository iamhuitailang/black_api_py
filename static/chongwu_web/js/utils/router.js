const Router = {
    currentRoute: null,
    routes: {},
    params: {},
    historyStack: [],

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    },

    register(path, handler) {
        this.routes[path] = handler;
    },

    navigate(path, params = {}) {
        if (this.currentRoute && this.currentRoute !== path) {
            this.historyStack.push(this.currentRoute);
        }
        this.params = params;
        window.location.hash = path;
    },

    getParams() {
        return this.params;
    },

    handleRoute() {
        const hash = window.location.hash.slice(1) || 'home';
        const [path, ...args] = hash.split('/');

        if (this.currentRoute && this.currentRoute !== path) {
            window.scrollTo(0, 0);
        }

        this.currentRoute = path;
        const handler = this.routes[path];

        if (handler) {
            handler(args);
        } else {
            this.navigate('home');
        }
    },

    getCurrentRoute() {
        return this.currentRoute;
    },

    back() {
        const prevRoute = this.historyStack.pop();
        if (prevRoute && this.routes[prevRoute]) {
            window.location.hash = prevRoute;
        } else {
            window.location.hash = 'home';
        }
    }
};

window.Router = Router;