const Router = {
  routes: {},
  currentRoute: null,
  params: {},
  listeners: [],

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  },

  register(path, handler) {
    this.routes[path] = handler;
  },

  navigate(path, params = {}) {
    let hash = `#${path}`;
    if (Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      hash += `?${queryString}`;
    }
    window.location.hash = hash;
  },

  handleRoute() {
    const hash = window.location.hash.slice(1) || '/home';
    const [path, queryString] = hash.split('?');

    this.params = {};
    if (queryString) {
      this.params = Object.fromEntries(new URLSearchParams(queryString));
    }

    this.currentRoute = path;

    let matched = false;
    for (const [routePath, handler] of Object.entries(this.routes)) {
      const params = this.matchRoute(routePath, path);
      if (params !== null) {
        this.params = { ...this.params, ...params };
        handler(this.params);
        matched = true;
        break;
      }
    }

    if (!matched && this.routes['/home']) {
      this.routes['/home']({});
    }

    this.listeners.forEach(fn => fn(path, this.params));
  },

  matchRoute(pattern, path) {
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);

    if (patternParts.length !== pathParts.length) {
      return null;
    }

    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }
    return params;
  },

  onChange(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }
};