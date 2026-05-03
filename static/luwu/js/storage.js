const Storage = {
    get(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            if (value === null) return defaultValue;
            return JSON.parse(value);
        } catch (e) {
            console.warn('Storage get error:', e);
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn('Storage set error:', e);
            return false;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.warn('Storage remove error:', e);
            return false;
        }
    },

    clearAll() {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.warn('Storage clear error:', e);
            return false;
        }
    },

    getGifts() {
        return this.get(Config.STORAGE_KEYS.GIFTS, null);
    },

    setGifts(gifts) {
        return this.set(Config.STORAGE_KEYS.GIFTS, gifts);
    },

    getFavorites() {
        return this.get(Config.STORAGE_KEYS.FAVORITES, []);
    },

    setFavorites(favorites) {
        return this.set(Config.STORAGE_KEYS.FAVORITES, favorites);
    },

    addFavorite(giftId) {
        const favorites = this.getFavorites();
        if (!favorites.includes(giftId)) {
            favorites.push(giftId);
            this.setFavorites(favorites);
        }
        return favorites;
    },

    removeFavorite(giftId) {
        const favorites = this.getFavorites();
        const index = favorites.indexOf(giftId);
        if (index > -1) {
            favorites.splice(index, 1);
            this.setFavorites(favorites);
        }
        return favorites;
    },

    isFavorite(giftId) {
        const favorites = this.getFavorites();
        return favorites.includes(giftId);
    },

    getCustomGifts() {
        return this.get(Config.STORAGE_KEYS.CUSTOM_GIFTS, []);
    },

    setCustomGifts(gifts) {
        return this.set(Config.STORAGE_KEYS.CUSTOM_GIFTS, gifts);
    },

    addCustomGift(gift) {
        const gifts = this.getCustomGifts();
        gift.id = Utils.uniqueId();
        gift.isCustom = true;
        gift.createdAt = Date.now();
        gifts.push(gift);
        this.setCustomGifts(gifts);
        return gift;
    },

    updateCustomGift(id, updates) {
        const gifts = this.getCustomGifts();
        const index = gifts.findIndex(g => g.id === id);
        if (index > -1) {
            gifts[index] = { ...gifts[index], ...updates, updatedAt: Date.now() };
            this.setCustomGifts(gifts);
            return gifts[index];
        }
        return null;
    },

    deleteCustomGift(id) {
        const gifts = this.getCustomGifts();
        const filtered = gifts.filter(g => g.id !== id);
        this.setCustomGifts(filtered);
        this.removeFavorite(id);
        return filtered;
    },

    getLastRecommend() {
        return this.get(Config.STORAGE_KEYS.LAST_RECOMMEND, null);
    },

    setLastRecommend(data) {
        return this.set(Config.STORAGE_KEYS.LAST_RECOMMEND, {
            ...data,
            timestamp: Date.now()
        });
    },

    migrate() {
        const version = this.get('luwu_version', 0);
        if (version < 1) {
            console.log('Running migration v1...');
            this.set('luwu_version', 1);
        }
    }
};

window.Storage = Storage;
