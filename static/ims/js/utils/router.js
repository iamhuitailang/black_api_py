const Router = {
    routes: {},
    currentRoute: null,
    
    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    },
    
    register(route, handler) {
        this.routes[route] = handler;
    },
    
    navigate(route) {
        window.location.hash = route;
    },
    
    getCurrentRoute() {
        const hash = window.location.hash.slice(1);
        return hash || 'login';
    },
    
    handleRoute() {
        const route = this.getCurrentRoute();
        const token = Storage.getToken();
        
        if (route !== 'login' && !token) {
            this.navigate('login');
            return;
        }
        
        if (route === 'login' && token) {
            this.navigate('dashboard');
            return;
        }
        
        const handler = this.routes[route];
        if (handler) {
            this.currentRoute = route;
            handler();
        } else {
            const defaultRoute = token ? 'dashboard' : 'login';
            this.navigate(defaultRoute);
        }
    },
    
    setActiveMenu() {
        const route = this.getCurrentRoute();
        document.querySelectorAll('.menu-item').forEach(item => {
            const itemRoute = item.dataset.route;
            if (itemRoute === route) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
};
