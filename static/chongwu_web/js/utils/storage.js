const Storage = {
    PREFIX: 'chongwu_',

    set(key, value) {
        if (typeof value === 'object') {
            value = JSON.stringify(value);
        }
        localStorage.setItem(this.PREFIX + key, value);
    },

    get(key) {
        const value = localStorage.getItem(this.PREFIX + key);
        if (!value) return null;
        try {
            return JSON.parse(value);
        } catch (e) {
            return value;
        }
    },

    remove(key) {
        localStorage.removeItem(this.PREFIX + key);
    },

    clear() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.PREFIX)) {
                keys.push(key);
            }
        }
        keys.forEach(k => localStorage.removeItem(k));
    },

    getCurrentPetId() {
        return this.get('current_pet_id');
    },

    setCurrentPetId(id) {
        this.set('current_pet_id', id);
    },

    removeCurrentPetId() {
        this.remove('current_pet_id');
    }
};