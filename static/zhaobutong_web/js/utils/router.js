const ZbtRouter = {
    _vm: null,

    init(vm) {
        this._vm = vm;
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },

    navigate(path) {
        window.location.hash = '#' + path;
    },

    handleRoute() {
        const hash = window.location.hash.slice(1) || '/home';
        const path = hash.startsWith('/') ? hash : '/' + hash;

        if (!ZbtStorage.getToken() && !path.startsWith('/login') && !path.startsWith('/register')) {
            this.navigate('/login');
            return;
        }

        if (ZbtStorage.getToken() && (path.startsWith('/login') || path.startsWith('/register'))) {
            this.navigate('/home');
            return;
        }

        if (this._vm) {
            this._vm.currentRoute = path;
        }
    },

    getCurrentRoute() {
        return window.location.hash.slice(1) || '/home';
    }
};
