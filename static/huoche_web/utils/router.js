const Router = {
    currentPage: (() => {
        const saved = localStorage.getItem('huoche_current_page');
        const hasToken = !!localStorage.getItem('huoche_token');
        if (hasToken && saved) return saved;
        if (hasToken) return 'dashboard';
        return 'login';
    })(),
    listeners: [],

    navigate(page, params = {}) {
        this.currentPage = page;
        this.params = params;
        localStorage.setItem('huoche_current_page', page);
        if (params && Object.keys(params).length > 0) {
            try {
                localStorage.setItem('huoche_page_params', JSON.stringify(params));
            } catch (e) {}
        } else {
            localStorage.removeItem('huoche_page_params');
        }
        this.notifyListeners();
    },

    getParams() {
        if (this.params) return this.params;
        try {
            const saved = localStorage.getItem('huoche_page_params');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    },

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    },

    notifyListeners() {
        this.listeners.forEach(listener => listener(this.currentPage, this.getParams()));
    }
};
