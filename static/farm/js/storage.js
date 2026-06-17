const Storage = {
    KEY_ROLE: 'farm_role',
    KEY_FARMER: 'farm_farmer',
    KEY_CONSUMER: 'farm_consumer',

    getRole() {
        return localStorage.getItem(this.KEY_ROLE) || 'consumer';
    },
    setRole(role) {
        localStorage.setItem(this.KEY_ROLE, role);
    },

    getFarmer() {
        const v = localStorage.getItem(this.KEY_FARMER);
        return v ? JSON.parse(v) : null;
    },
    setFarmer(data) {
        localStorage.setItem(this.KEY_FARMER, JSON.stringify(data));
    },
    clearFarmer() {
        localStorage.removeItem(this.KEY_FARMER);
    },

    getConsumer() {
        const v = localStorage.getItem(this.KEY_CONSUMER);
        return v ? JSON.parse(v) : null;
    },
    setConsumer(data) {
        localStorage.setItem(this.KEY_CONSUMER, JSON.stringify(data));
    },
    clearConsumer() {
        localStorage.removeItem(this.KEY_CONSUMER);
    },

    logout() {
        this.clearFarmer();
        this.clearConsumer();
    }
};
