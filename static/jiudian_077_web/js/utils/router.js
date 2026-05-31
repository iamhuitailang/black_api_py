const Router = {
  routes: {},
  currentRoute: null,

  register(path, component) {
    this.routes[path] = component;
  },

  navigate(path, params = {}) {
    const hash = params ? `${path}?${new URLSearchParams(params).toString()}` : path;
    window.location.hash = hash;
  },

  getCurrentPath() {
    const hash = window.location.hash.slice(1) || '/';
    return hash.split('?')[0];
  },

  getParams() {
    const hash = window.location.hash.slice(1) || '';
    const queryString = hash.split('?')[1];
    const params = {};
    if (queryString) {
      new URLSearchParams(queryString).forEach((value, key) => {
        params[key] = value;
      });
    }
    return params;
  },

  render() {
    const path = this.getCurrentPath();
    const component = this.routes[path] || this.routes['/404'] || this.routes['/'];
    this.currentRoute = path;
    
    if (component && typeof component.render === 'function') {
      var result = component.render();
      if (result !== undefined && result !== null) {
        var app = document.getElementById('app');
        app.innerHTML = result;
      }
      if (typeof component.mounted === 'function') {
        component.mounted();
      }
    }
  },

  init() {
    window.addEventListener('hashchange', () => this.render());
    this.render();
  }
};
