const Storage = {
    prefix: 'jinwutuan_',

    save(key, value) {
        try {
            const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
            localStorage.setItem(this.prefix + key, serializedValue);
            return true;
        } catch (e) {
            console.error('Storage save error:', e);
            return false;
        }
    },

    get(key) {
        try {
            const value = localStorage.getItem(this.prefix + key);
            if (value === null) return null;
            
            try {
                return JSON.parse(value);
            } catch (e) {
                return value;
            }
        } catch (e) {
            console.error('Storage get error:', e);
            return null;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    },

    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (e) {
            console.error('Storage clear error:', e);
            return false;
        }
    }
};
