const Router = {
    currentPage: 'home',
    pages: {},
    init: function() {
        const params = this.parseUrl();
        this.currentPage = params.page || 'home';
        this.navigate(this.currentPage, params);
        window.addEventListener('popstate', function(e) {
            const params = e.state || {};
            Router.navigate(params.page || 'home', params);
        });
    },
    parseUrl: function() {
        const params = {};
        const urlParams = new URLSearchParams(window.location.search);
        for (const [key, value] of urlParams.entries()) {
            params[key] = value;
        }
        return params;
    },
    go: function(page, params) {
        const url = this.buildUrl(page, params);
        window.history.pushState({ page: page, ...params }, '', url);
        this.navigate(page, params);
    },
    buildUrl: function(page, params) {
        const urlParams = new URLSearchParams();
        urlParams.set('page', page);
        if (params) {
            for (const [key, value] of Object.entries(params)) {
                if (value !== null && value !== undefined) {
                    urlParams.set(key, value);
                }
            }
        }
        return '?' + urlParams.toString();
    },
    navigate: function(page, params) {
        this.currentPage = page;
        this.updateNav();
        if (this.pages[page]) {
            this.pages[page](params);
        } else {
            this.pages['home'](params);
        }
    },
    register: function(page, handler) {
        this.pages[page] = handler;
    },
    updateNav: function() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const page = link.dataset.page;
            if (page === this.currentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
};
