const Storage = {
    KEY_PREFIX: 'maoyu_',
    
    DEFAULT_STATE: {
        settings: {
            soundEnabled: true,
            animationEnabled: true,
            theme: 'default',
            catType: 'lihua'
        },
        history: [],
        learnedCommands: [],
        stats: {
            totalTranslations: 0,
            loveYouCount: 0,
            lastActiveTab: 'translate'
        },
        chatHistory: [],
        version: 1
    },

    getState() {
        try {
            const saved = localStorage.getItem(this.KEY_PREFIX + 'state');
            if (saved) {
                const parsed = JSON.parse(saved);
                return this.mergeDefaults(parsed, this.DEFAULT_STATE);
            }
        } catch (e) {
            console.error('Storage read error:', e);
        }
        return JSON.parse(JSON.stringify(this.DEFAULT_STATE));
    },

    setState(state) {
        try {
            localStorage.setItem(this.KEY_PREFIX + 'state', JSON.stringify(state));
        } catch (e) {
            console.error('Storage write error:', e);
        }
    },

    mergeDefaults(target, defaults) {
        const result = { ...defaults };
        for (const key in target) {
            if (target.hasOwnProperty(key)) {
                if (typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key])) {
                    result[key] = this.mergeDefaults(target[key], defaults[key] || {});
                } else {
                    result[key] = target[key];
                }
            }
        }
        return result;
    },

    get(key) {
        const state = this.getState();
        return state[key];
    },

    set(key, value) {
        const state = this.getState();
        state[key] = value;
        this.setState(state);
    },

    getSettings() {
        return this.get('settings');
    },

    setSettings(settings) {
        const state = this.getState();
        state.settings = { ...state.settings, ...settings };
        this.setState(state);
    },

    addHistory(item) {
        const state = this.getState();
        state.history.unshift({
            id: Date.now(),
            ...item,
            timestamp: new Date().toISOString()
        });
        if (state.history.length > 100) {
            state.history = state.history.slice(0, 100);
        }
        this.setState(state);
    },

    getHistory() {
        return this.get('history') || [];
    },

    clearHistory() {
        const state = this.getState();
        state.history = [];
        this.setState(state);
    },

    addLearnedCommand(command, translation) {
        const state = this.getState();
        state.learnedCommands.push({
            id: Date.now(),
            command,
            translation,
            timestamp: new Date().toISOString()
        });
        this.setState(state);
    },

    getLearnedCommands() {
        return this.get('learnedCommands') || [];
    },

    deleteLearnedCommand(id) {
        const state = this.getState();
        state.learnedCommands = state.learnedCommands.filter(c => c.id !== id);
        this.setState(state);
    },

    incrementTranslationCount() {
        const state = this.getState();
        state.stats.totalTranslations++;
        this.setState(state);
        return state.stats.totalTranslations;
    },

    incrementLoveYouCount() {
        const state = this.getState();
        state.stats.loveYouCount++;
        this.setState(state);
        return state.stats.loveYouCount;
    },

    getStats() {
        return this.get('stats') || {};
    },

    setLastTab(tab) {
        const state = this.getState();
        state.stats.lastActiveTab = tab;
        this.setState(state);
    },

    getLastTab() {
        const stats = this.getStats();
        return stats.lastActiveTab || 'translate';
    },

    addChatMessage(message) {
        const state = this.getState();
        state.chatHistory.push({
            id: Date.now(),
            ...message,
            timestamp: new Date().toISOString()
        });
        if (state.chatHistory.length > 50) {
            state.chatHistory = state.chatHistory.slice(-50);
        }
        this.setState(state);
    },

    getChatHistory() {
        return this.get('chatHistory') || [];
    },

    clearChatHistory() {
        const state = this.getState();
        state.chatHistory = [];
        this.setState(state);
    }
};
