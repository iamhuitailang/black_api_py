const Storage = (function() {
    const STORAGE_KEYS = {
        HISTORY: 'pirate_translator_history',
        SETTINGS: 'pirate_translator_settings',
        CURRENT_STATE: 'pirate_translator_state'
    };

    const MAX_HISTORY_ITEMS = 50;

    const defaultSettings = {
        theme: 'pirate',
        autoSpeak: false,
        lastInput: '',
        lastOutput: ''
    };

    const defaultState = {
        currentTheme: 'pirate',
        historyModalOpen: false,
        animationFrame: 0
    };

    function isLocalStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    function get(key, defaultValue = null) {
        if (!isLocalStorageAvailable()) {
            return defaultValue;
        }
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    }

    function set(key, value) {
        if (!isLocalStorageAvailable()) {
            return false;
        }
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    }

    function remove(key) {
        if (!isLocalStorageAvailable()) {
            return false;
        }
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    }

    function getHistory() {
        return get(STORAGE_KEYS.HISTORY, []);
    }

    function addHistoryItem(original, translated) {
        const history = getHistory();
        const newItem = {
            id: Date.now(),
            original: original,
            translated: translated,
            timestamp: new Date().toISOString()
        };
        
        history.unshift(newItem);
        
        if (history.length > MAX_HISTORY_ITEMS) {
            history.splice(MAX_HISTORY_ITEMS);
        }
        
        set(STORAGE_KEYS.HISTORY, history);
        return newItem;
    }

    function clearHistory() {
        return set(STORAGE_KEYS.HISTORY, []);
    }

    function removeHistoryItem(id) {
        const history = getHistory();
        const filtered = history.filter(item => item.id !== id);
        set(STORAGE_KEYS.HISTORY, filtered);
        return filtered;
    }

    function getSettings() {
        const saved = get(STORAGE_KEYS.SETTINGS, defaultSettings);
        return { ...defaultSettings, ...saved };
    }

    function saveSettings(settings) {
        const current = getSettings();
        const updated = { ...current, ...settings };
        set(STORAGE_KEYS.SETTINGS, updated);
        return updated;
    }

    function getTheme() {
        return getSettings().theme || 'pirate';
    }

    function setTheme(theme) {
        return saveSettings({ theme });
    }

    function getLastInput() {
        return getSettings().lastInput || '';
    }

    function setLastInput(input) {
        return saveSettings({ lastInput: input });
    }

    function getLastOutput() {
        return getSettings().lastOutput || '';
    }

    function setLastOutput(output) {
        return saveSettings({ lastOutput: output });
    }

    function getState() {
        const saved = get(STORAGE_KEYS.CURRENT_STATE, defaultState);
        return { ...defaultState, ...saved };
    }

    function saveState(state) {
        const current = getState();
        const updated = { ...current, ...state };
        set(STORAGE_KEYS.CURRENT_STATE, updated);
        return updated;
    }

    function formatTimestamp(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) {
            return '刚刚';
        } else if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes} 分钟前`;
        } else if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours} 小时前`;
        } else if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `${days} 天前`;
        } else {
            return date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    return {
        isLocalStorageAvailable,
        get,
        set,
        remove,
        getHistory,
        addHistoryItem,
        clearHistory,
        removeHistoryItem,
        getSettings,
        saveSettings,
        getTheme,
        setTheme,
        getLastInput,
        setLastInput,
        getLastOutput,
        setLastOutput,
        getState,
        saveState,
        formatTimestamp,
        STORAGE_KEYS
    };
})();
