const Router = {
  routes: {},
  currentRoute: '',
  defaultRoute: 'home',

  init(routes, defaultRoute = 'home') {
    this.routes = routes;
    this.defaultRoute = defaultRoute;
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  },

  handleRoute() {
    const hash = window.location.hash.slice(1) || this.defaultRoute;
    const [routeName, ...params] = hash.split('/');
    this.currentRoute = routeName;

    const route = this.routes[routeName];
    if (route) {
      if (route.auth && !Storage.isLoggedIn()) {
        this.navigate('login');
        return;
      }
      if (route.admin && !Storage.isAdmin()) {
        this.navigate('home');
        return;
      }
      route.component(...params);
    } else {
      this.navigate(this.defaultRoute);
    }
  },

  navigate(route) {
    window.location.hash = route;
  },

  getCurrentRoute() {
    return this.currentRoute;
  }
};

window.Router = Router;
