const Storage = (function() {
    const CURRENT_STATE_KEY = 'pixel_avatar_current';
    const HISTORY_KEY = 'pixel_avatar_history';
    const MAX_HISTORY = 20;

    function getDefaultState() {
        return {
            face: 'round',
            skinColor: '#F5D6BA',
            hair: 'short',
            hairColor: '#4A3728',
            eyes: 'round',
            eyebrow: 'normal',
            mouth: 'smile',
            nose: 'small',
            blush: 'none',
            shirt: 'tshirt',
            shirtColor: '#E94560',
            headwear: 'none',
            faceAccessory: 'none',
            background: 'transparent',
            backgroundColor: '#2A2A4E',
            animation: {
                blink: false,
                breathe: false
            },
            activeTab: 'face',
            timestamp: Date.now()
        };
    }

    function saveCurrentState(state) {
        try {
            state.timestamp = Date.now();
            localStorage.setItem(CURRENT_STATE_KEY, JSON.stringify(state));
            return true;
        } catch (e) {
            console.error('保存状态失败:', e);
            return false;
        }
    }

    function loadCurrentState() {
        try {
            const saved = localStorage.getItem(CURRENT_STATE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return Object.assign(getDefaultState(), parsed);
            }
        } catch (e) {
            console.error('加载状态失败:', e);
        }
        return getDefaultState();
    }

    function saveToHistory(state, imageData) {
        try {
            let history = getHistory();
            const record = {
                id: Date.now(),
                state: JSON.parse(JSON.stringify(state)),
                imageData: imageData,
                timestamp: Date.now()
            };
            history.unshift(record);
            
            if (history.length > MAX_HISTORY) {
                history = history.slice(0, MAX_HISTORY);
            }
            
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
            return true;
        } catch (e) {
            console.error('保存到历史记录失败:', e);
            return false;
        }
    }

    function getHistory() {
        try {
            const saved = localStorage.getItem(HISTORY_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('获取历史记录失败:', e);
        }
        return [];
    }

    function deleteFromHistory(id) {
        try {
            let history = getHistory();
            history = history.filter(item => item.id !== id);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
            return true;
        } catch (e) {
            console.error('删除历史记录失败:', e);
            return false;
        }
    }

    function clearCurrentState() {
        localStorage.removeItem(CURRENT_STATE_KEY);
    }

    function clearAll() {
        localStorage.removeItem(CURRENT_STATE_KEY);
        localStorage.removeItem(HISTORY_KEY);
    }

    return {
        getDefaultState,
        saveCurrentState,
        loadCurrentState,
        saveToHistory,
        getHistory,
        deleteFromHistory,
        clearCurrentState,
        clearAll
    };
})();