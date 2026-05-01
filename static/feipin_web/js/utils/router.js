const Router = {
    currentRoute: '',
    params: {},
    routes: {},

    register(name, handler) {
        this.routes[name] = handler;
    },

    navigate(route, params = {}) {
        this.currentRoute = route;
        this.params = params;

        let url = '#' + route;
        if (Object.keys(params).length > 0) {
            url += '?' + new URLSearchParams(params).toString();
        }
        window.location.hash = url;

        this.render();
    },

    parse(hash) {
        if (!hash || hash === '#') {
            return { route: 'home', params: {} };
        }

        const hashWithoutHash = hash.slice(1);
        const [route, queryString] = hashWithoutHash.split('?');
        const params = {};

        if (queryString) {
            const searchParams = new URLSearchParams(queryString);
            searchParams.forEach((value, key) => {
                params[key] = value;
            });
        }

        return { route: route || 'home', params };
    },

    render() {
        const { route, params } = this.parse(window.location.hash);
        this.currentRoute = route;
        this.params = params;

        if (this.routes[route]) {
            this.routes[route](params);
        } else {
            this.navigate('home');
        }

        this.updateTabbar();
    },

    updateTabbar() {
        const tabbar = document.querySelector('.tabbar');
        if (!tabbar) return;

        const tabMap = {
            'home': 'home',
            'price': 'price',
            'order': 'order',
            'collector': 'collector',
            'profile': 'profile'
        };

        const tabItems = tabbar.querySelectorAll('.tabbar-item');
        tabItems.forEach(item => {
            item.classList.remove('active');
            const dataRoute = item.dataset.route;
            if (tabMap[this.currentRoute] === dataRoute || 
                this.currentRoute.startsWith(dataRoute)) {
                item.classList.add('active');
            }
        });
    },

    init() {
        window.addEventListener('hashchange', () => this.render());
        window.addEventListener('load', () => this.render());
    },

    back() {
        window.history.back();
    },

    getParam(key, defaultValue = null) {
        return this.params[key] !== undefined ? this.params[key] : defaultValue;
    }
};
