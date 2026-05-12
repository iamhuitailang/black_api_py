const Storage = {
    STORAGE_KEYS: {
        FORM_DATA: 'yunfei_form_data',
        HISTORY: 'yunfei_history',
        FAVORITES: 'yunfei_favorites',
        CALCULATION_RESULTS: 'yunfei_calculation_results'
    },

    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Storage save error:', e);
            return false;
        }
    },

    load(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('Storage load error:', e);
            return defaultValue;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    },

    saveFormData(formData) {
        return this.save(this.STORAGE_KEYS.FORM_DATA, formData);
    },

    loadFormData() {
        return this.load(this.STORAGE_KEYS.FORM_DATA, {
            senderProvince: '',
            senderCity: '',
            senderDistrict: '',
            receiverProvince: '',
            receiverCity: '',
            receiverDistrict: '',
            weight: '',
            weightUnit: 'kg',
            length: '',
            width: '',
            height: '',
            billingType: 'auto'
        });
    },

    saveHistory(history) {
        return this.save(this.STORAGE_KEYS.HISTORY, history);
    },

    loadHistory() {
        return this.load(this.STORAGE_KEYS.HISTORY, []);
    },

    addHistoryItem(item) {
        const history = this.loadHistory();
        item.id = Date.now();
        item.timestamp = new Date().toISOString();
        history.unshift(item);
        if (history.length > 10) {
            history.pop();
        }
        return this.saveHistory(history);
    },

    saveFavorites(favorites) {
        return this.save(this.STORAGE_KEYS.FAVORITES, favorites);
    },

    loadFavorites() {
        return this.load(this.STORAGE_KEYS.FAVORITES, []);
    },

    saveCalculationResults(results) {
        return this.save(this.STORAGE_KEYS.CALCULATION_RESULTS, results);
    },

    loadCalculationResults() {
        return this.load(this.STORAGE_KEYS.CALCULATION_RESULTS, null);
    },

    clearCalculationResults() {
        return this.remove(this.STORAGE_KEYS.CALCULATION_RESULTS);
    },

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) {
            return '刚刚';
        } else if (diff < 3600000) {
            return Math.floor(diff / 60000) + '分钟前';
        } else if (diff < 86400000) {
            return Math.floor(diff / 3600000) + '小时前';
        } else {
            return (date.getMonth() + 1) + '月' + date.getDate() + '日 ' + 
                   date.getHours().toString().padStart(2, '0') + ':' + 
                   date.getMinutes().toString().padStart(2, '0');
        }
    }
};