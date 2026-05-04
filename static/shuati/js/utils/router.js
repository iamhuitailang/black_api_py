const Router = {
    currentRoute: null,
    routes: {},
    params: {},

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
        
        const studyState = Storage.getStudyState();
        if (studyState.currentRoute && !window.location.hash) {
            window.location.hash = studyState.currentRoute;
        }
    },

    register(path, handler) {
        this.routes[path] = handler;
    },

    navigate(path, params = {}) {
        let hash = path;
        if (Object.keys(params).length > 0) {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                searchParams.append(key, value);
            });
            hash = `${path}?${searchParams.toString()}`;
        }
        window.location.hash = hash;
    },

    handleRoute() {
        const hash = window.location.hash.slice(1) || 'home';
        const [path, queryString] = hash.split('?');
        
        this.params = {};
        if (queryString) {
            const searchParams = new URLSearchParams(queryString);
            searchParams.forEach((value, key) => {
                this.params[key] = value;
            });
        }

        this.currentRoute = path;
        const handler = this.routes[path];

        this.updateNavActive(path);

        const studyState = Storage.getStudyState();
        studyState.currentRoute = path;
        Storage.saveStudyState(studyState);

        if (handler) {
            handler(this.params);
        } else {
            this.navigate('home');
        }
    },

    updateNavActive(route) {
        document.querySelectorAll('.nav-item').forEach(item => {
            const itemRoute = item.dataset.route;
            if (itemRoute === route) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },

    getCurrentRoute() {
        return this.currentRoute;
    },

    getParams() {
        return this.params;
    },

    getParam(key, defaultValue = null) {
        return this.params[key] || defaultValue;
    },

    back() {
        window.history.back();
    }
};

window.Router = Router;
