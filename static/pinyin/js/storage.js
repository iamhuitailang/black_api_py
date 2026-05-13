const StorageManager = (function() {
    const HISTORY_KEY = 'pinyin_converter_history';
    const SETTINGS_KEY = 'pinyin_converter_settings';
    const MAX_HISTORY = 10;

    function getHistory() {
        try {
            const history = localStorage.getItem(HISTORY_KEY);
            return history ? JSON.parse(history) : [];
        } catch (e) {
            console.error('Error getting history:', e);
            return [];
        }
    }

    function saveHistory(history) {
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        } catch (e) {
            console.error('Error saving history:', e);
        }
    }

    function addToHistory(input, output, settings) {
        const history = getHistory();
        const newItem = {
            id: Date.now(),
            input: input,
            output: output,
            settings: settings,
            timestamp: new Date().toISOString()
        };
        
        history.unshift(newItem);
        
        if (history.length > MAX_HISTORY) {
            history.pop();
        }
        
        saveHistory(history);
        return history;
    }

    function clearHistory() {
        localStorage.removeItem(HISTORY_KEY);
        return [];
    }

    function deleteHistoryItem(id) {
        let history = getHistory();
        history = history.filter(item => item.id !== id);
        saveHistory(history);
        return history;
    }

    function getSettings() {
        try {
            const settings = localStorage.getItem(SETTINGS_KEY);
            return settings ? JSON.parse(settings) : {
                tone: true,
                separator: 'space',
                customSeparator: '-',
                caseMode: 'lower'
            };
        } catch (e) {
            console.error('Error getting settings:', e);
            return {
                tone: true,
                separator: 'space',
                customSeparator: '-',
                caseMode: 'lower'
            };
        }
    }

    function saveSettings(settings) {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('Error saving settings:', e);
        }
    }

    function getInputState() {
        try {
            const input = localStorage.getItem('pinyin_input_state');
            return input || '';
        } catch (e) {
            return '';
        }
    }

    function saveInputState(input) {
        try {
            localStorage.setItem('pinyin_input_state', input);
        } catch (e) {
            console.error('Error saving input state:', e);
        }
    }

    function getOutputState() {
        try {
            const output = localStorage.getItem('pinyin_output_state');
            return output || '';
        } catch (e) {
            return '';
        }
    }

    function saveOutputState(output) {
        try {
            localStorage.setItem('pinyin_output_state', output);
        } catch (e) {
            console.error('Error saving output state:', e);
        }
    }

    return {
        getHistory: getHistory,
        addToHistory: addToHistory,
        clearHistory: clearHistory,
        deleteHistoryItem: deleteHistoryItem,
        getSettings: getSettings,
        saveSettings: saveSettings,
        getInputState: getInputState,
        saveInputState: saveInputState,
        getOutputState: getOutputState,
        saveOutputState: saveOutputState
    };
})();