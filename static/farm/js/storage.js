const Storage = {
    KEY_ROLE: 'farm_role',
    KEY_FARMER: 'farm_farmer',
    KEY_CONSUMER: 'farm_consumer',
    KEY_PRODUCT_DRAFT: 'farm_product_draft',
    KEY_CURRENT_PAGE: 'farm_current_page',

    _sanitize(data) {
        if (!data || typeof data !== 'object') return data;
        const safe = { ...data };
        delete safe.password;
        delete safe.token;
        delete safe.secret;
        return safe;
    },

    getRole() {
        return localStorage.getItem(this.KEY_ROLE) || 'consumer';
    },
    setRole(role) {
        localStorage.setItem(this.KEY_ROLE, role);
    },

    getCurrentPage() {
        return localStorage.getItem(this.KEY_CURRENT_PAGE) || 'home';
    },
    setCurrentPage(page) {
        if (page) localStorage.setItem(this.KEY_CURRENT_PAGE, page);
    },

    getFarmer() {
        const v = localStorage.getItem(this.KEY_FARMER);
        return v ? JSON.parse(v) : null;
    },
    setFarmer(data) {
        const safe = this._sanitize(data);
        localStorage.setItem(this.KEY_FARMER, JSON.stringify(safe));
    },
    clearFarmer() {
        localStorage.removeItem(this.KEY_FARMER);
    },

    getConsumer() {
        const v = localStorage.getItem(this.KEY_CONSUMER);
        return v ? JSON.parse(v) : null;
    },
    setConsumer(data) {
        const safe = this._sanitize(data);
        localStorage.setItem(this.KEY_CONSUMER, JSON.stringify(safe));
    },
    clearConsumer() {
        localStorage.removeItem(this.KEY_CONSUMER);
    },

    getProductDraft() {
        const v = localStorage.getItem(this.KEY_PRODUCT_DRAFT);
        return v ? JSON.parse(v) : null;
    },
    setProductDraft(data) {
        localStorage.setItem(this.KEY_PRODUCT_DRAFT, JSON.stringify(data || {}));
    },
    clearProductDraft() {
        localStorage.removeItem(this.KEY_PRODUCT_DRAFT);
    },

    logout() {
        this.clearFarmer();
        this.clearConsumer();
    }
};
