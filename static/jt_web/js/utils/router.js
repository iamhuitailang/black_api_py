const Router = {
    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    },

    navigate(path) {
        window.location.hash = path;
    },

    handleRoute() {
        const hash = window.location.hash.slice(1) || 'dashboard';
        const [path] = hash.split('/');

        const publicRoutes = ['login', 'register'];
        const isPublicRoute = publicRoutes.includes(path);
        const isLoggedIn = window.AuthService ? window.AuthService.isLoggedIn() : !!Storage.getToken();

        if (!isLoggedIn && !isPublicRoute) {
            this.navigate('login');
            return;
        }

        if (isLoggedIn && isPublicRoute) {
            this.navigate('dashboard');
            return;
        }
    },

    getCurrentRoute() {
        return window.location.hash.slice(1) || 'dashboard';
    },

    back() {
        window.history.back();
    }
};

window.Router = Router;
