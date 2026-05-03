const STORAGE_KEYS = {
    SETTINGS: 'maoyu_settings',
    HISTORY: 'maoyu_history',
    LEARN_PROGRESS: 'maoyu_learn_progress',
    CHAT_MESSAGES: 'maoyu_chat_messages',
    EASTER_EGG: 'maoyu_easter_egg',
    CURRENT_STATE: 'maoyu_current_state'
};

const defaultSettings = {
    soundEnabled: true,
    currentMode: 'cat-to-human',
    currentCatType: null,
    loveYouCount: 0,
    translateCount: 0,
    lastUsed: Date.now()
};

const defaultLearnProgress = {
    learnedCommands: [],
    totalLearned: 0
};

export const Storage = {
    getItem(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Storage getItem error:', e);
            return null;
        }
    },

    setItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage setItem error:', e);
            return false;
        }
    },

    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage removeItem error:', e);
            return false;
        }
    },

    clear() {
        try {
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (e) {
            console.error('Storage clear error:', e);
            return false;
        }
    },

    getSettings() {
        const settings = this.getItem(STORAGE_KEYS.SETTINGS);
        return { ...defaultSettings, ...settings };
    },

    saveSettings(settings) {
        const currentSettings = this.getSettings();
        return this.setItem(STORAGE_KEYS.SETTINGS, { ...currentSettings, ...settings });
    },

    getHistory() {
        const history = this.getItem(STORAGE_KEYS.HISTORY);
        return history || [];
    },

    addHistory(item) {
        const history = this.getHistory();
        const newItem = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...item
        };
        history.unshift(newItem);
        if (history.length > 50) {
            history.pop();
        }
        return this.setItem(STORAGE_KEYS.HISTORY, history);
    },

    clearHistory() {
        return this.setItem(STORAGE_KEYS.HISTORY, []);
    },

    getLearnProgress() {
        const progress = this.getItem(STORAGE_KEYS.LEARN_PROGRESS);
        return { ...defaultLearnProgress, ...progress };
    },

    saveLearnProgress(progress) {
        return this.setItem(STORAGE_KEYS.LEARN_PROGRESS, progress);
    },

    markCommandLearned(commandId) {
        const progress = this.getLearnProgress();
        if (!progress.learnedCommands.includes(commandId)) {
            progress.learnedCommands.push(commandId);
            progress.totalLearned = progress.learnedCommands.length;
            return this.saveLearnProgress(progress);
        }
        return false;
    },

    isCommandLearned(commandId) {
        const progress = this.getLearnProgress();
        return progress.learnedCommands.includes(commandId);
    },

    getChatMessages() {
        const messages = this.getItem(STORAGE_KEYS.CHAT_MESSAGES);
        return messages || [];
    },

    addChatMessage(message) {
        const messages = this.getChatMessages();
        const newMessage = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...message
        };
        messages.push(newMessage);
        if (messages.length > 100) {
            messages.shift();
        }
        return this.setItem(STORAGE_KEYS.CHAT_MESSAGES, messages);
    },

    clearChatMessages() {
        return this.setItem(STORAGE_KEYS.CHAT_MESSAGES, []);
    },

    getEasterEggState() {
        const state = this.getItem(STORAGE_KEYS.EASTER_EGG);
        return state || {
            loveYouCount: 0,
            translateCount: 0,
            videoCallTriggered: false,
            heartAnimationTriggered: false
        };
    },

    saveEasterEggState(state) {
        return this.setItem(STORAGE_KEYS.EASTER_EGG, state);
    },

    incrementLoveYouCount() {
        const state = this.getEasterEggState();
        state.loveYouCount += 1;
        this.saveEasterEggState(state);
        return state.loveYouCount;
    },

    incrementTranslateCount() {
        const state = this.getEasterEggState();
        state.translateCount += 1;
        this.saveEasterEggState(state);
        return state.translateCount;
    },

    saveCurrentState(state) {
        return this.setItem(STORAGE_KEYS.CURRENT_STATE, {
            ...state,
            timestamp: Date.now()
        });
    },

    getCurrentState() {
        return this.getItem(STORAGE_KEYS.CURRENT_STATE);
    }
};

export default Storage;
