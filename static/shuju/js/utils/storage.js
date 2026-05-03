const Storage = {
    PREFIX: 'shuju_dashboard_',

    set(key, value) {
        try {
            const storageKey = this.PREFIX + key;
            const serialized = typeof value === 'object' 
                ? JSON.stringify(value) 
                : value;
            localStorage.setItem(storageKey, serialized);
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },

    get(key, defaultValue = null) {
        try {
            const storageKey = this.PREFIX + key;
            const value = localStorage.getItem(storageKey);
            
            if (value === null) {
                return defaultValue;
            }

            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    },

    remove(key) {
        try {
            const storageKey = this.PREFIX + key;
            localStorage.removeItem(storageKey);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    },

    clear() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.PREFIX)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (e) {
            console.error('Storage clear error:', e);
            return false;
        }
    },

    getAll() {
        const result = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.PREFIX)) {
                const shortKey = key.slice(this.PREFIX.length);
                result[shortKey] = this.get(shortKey);
            }
        }
        return result;
    },

    has(key) {
        const storageKey = this.PREFIX + key;
        return localStorage.getItem(storageKey) !== null;
    }
};

window.Storage = Storage;
