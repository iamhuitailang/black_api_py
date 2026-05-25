const Storage = {
    get(key, defaultValue = null) {
        try {
            const v = localStorage.getItem(key);
            return v ? JSON.parse(v) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {}
    },
    remove(key) {
        localStorage.removeItem(key);
    }
};
