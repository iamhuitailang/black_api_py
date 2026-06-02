const Router = {
  routes: {},
  currentRoute: null,
  beforeEachHook: null,

  register(path, handler) {
    this.routes[path] = handler;
  },

  navigate(path) {
    window.location.hash = '#' + path;
  },

  getCurrentRoute() {
    const hash = window.location.hash.slice(1) || '/hall';
    return hash;
  },

  resolve() {
    const path = this.getCurrentRoute();
    this.currentRoute = path;

    if (this.beforeEachHook) {
      this.beforeEachHook(path);
    }

    const handler = this.routes[path];
    if (handler) {
      handler(path);
    }
  },

  beforeEach(hook) {
    this.beforeEachHook = hook;
  },

  init() {
    window.addEventListener('hashchange', () => this.resolve());
    this.resolve();
  }
};

window.XiangqiRouter = Router;
