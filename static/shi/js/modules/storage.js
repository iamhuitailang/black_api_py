const Storage = (function() {
    'use strict';

    const STORAGE_KEY = 'poem_generator_data';
    const MAX_HISTORY = 50;

    function getStorageData() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('读取localStorage失败:', e);
        }
        return {
            history: [],
            settings: {
                form: 'five',
                style: 'classical'
            },
            lastGenerated: null
        };
    }

    function saveStorageData(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存到localStorage失败:', e);
            return false;
        }
    }

    function getSettings() {
        const data = getStorageData();
        return data.settings || {
            form: 'five',
            style: 'classical'
        };
    }

    function saveSettings(settings) {
        const data = getStorageData();
        data.settings = {
            ...data.settings,
            ...settings
        };
        return saveStorageData(data);
    }

    function getHistory() {
        const data = getStorageData();
        return data.history || [];
    }

    function addToHistory(poemData) {
        const data = getStorageData();
        const historyItem = {
            id: Date.now(),
            keywords: poemData.keywords,
            form: poemData.form,
            style: poemData.style,
            lines: poemData.lines,
            createdAt: new Date().toISOString()
        };

        data.history.unshift(historyItem);
        
        if (data.history.length > MAX_HISTORY) {
            data.history = data.history.slice(0, MAX_HISTORY);
        }

        data.lastGenerated = historyItem;
        
        return saveStorageData(data);
    }

    function removeFromHistory(id) {
        const data = getStorageData();
        data.history = data.history.filter(item => item.id !== id);
        return saveStorageData(data);
    }

    function clearHistory() {
        const data = getStorageData();
        data.history = [];
        return saveStorageData(data);
    }

    function getLastGenerated() {
        const data = getStorageData();
        return data.lastGenerated;
    }

    function clearAll() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('清除localStorage失败:', e);
            return false;
        }
    }

    return {
        getStorageData,
        saveStorageData,
        getSettings,
        saveSettings,
        getHistory,
        addToHistory,
        removeFromHistory,
        clearHistory,
        getLastGenerated,
        clearAll
    };
})();
