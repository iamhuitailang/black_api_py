const Router = {
    currentPage: 'login',
    pages: {},

    register(name, page) {
        this.pages[name] = page;
    },

    navigate(name, params = {}) {
        this.currentPage = name;
        this.params = params;
        const page = this.pages[name];
        if (page && page.render) {
            page.render(params);
        }
    },

    getParams() {
        return this.params || {};
    }
};

window.Router = Router;
