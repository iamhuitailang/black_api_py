(function() {
    'use strict';

    window.Router = {
        currentPage: null,
        pages: {},
        history: [],

        init: function() {
            var self = this;
            window.addEventListener('hashchange', function() {
                self._handleHashChange();
            });
        },

        register: function(pageName, pageObj) {
            this.pages[pageName] = pageObj;
        },

        navigate: function(pageName, params) {
            if (this.currentPage) {
                this.history.push({
                    page: this.currentPage,
                    params: this.currentParams
                });
            }
            this._goTo(pageName, params);
        },

        back: function() {
            if (this.history.length > 0) {
                var prev = this.history.pop();
                this._goTo(prev.page, prev.params, true);
            }
        },

        _goTo: function(pageName, params, isBack) {
            var page = this.pages[pageName];
            if (!page) {
                console.error('Page not found:', pageName);
                return;
            }

            if (this.currentPage && this.pages[this.currentPage] && this.pages[this.currentPage].onHide) {
                this.pages[this.currentPage].onHide();
            }

            this.currentPage = pageName;
            this.currentParams = params || {};

            if (!isBack) {
                window.location.hash = pageName;
            }

            if (page.onShow) {
                page.onShow(this.currentParams);
            }

            if (page.render) {
                page.render();
            }
        },

        _handleHashChange: function() {
            var hash = window.location.hash.slice(1) || 'login';
            if (hash !== this.currentPage) {
                this._goTo(hash, {}, true);
            }
        },

        getCurrentPage: function() {
            return this.currentPage;
        }
    };
})();
