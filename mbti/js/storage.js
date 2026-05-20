const MBTIStorage = (function() {
    const STORAGE_KEY = 'mbti_test_state';
    const HISTORY_KEY = 'mbti_test_history';

    const defaultState = {
        currentQuestionIndex: 0,
        answers: {},
        isCompleted: false,
        result: null,
        startTime: null,
        lastSaveTime: null
    };

    function saveState(state) {
        try {
            state.lastSaveTime = Date.now();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            return true;
        } catch (e) {
            console.error('保存状态失败:', e);
            return false;
        }
    }

    function loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const state = JSON.parse(saved);
                return { ...defaultState, ...state };
            }
        } catch (e) {
            console.error('加载状态失败:', e);
        }
        return { ...defaultState };
    }

    function clearState() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('清除状态失败:', e);
            return false;
        }
    }

    function saveHistory(result) {
        if (MBTIData.config.anonymousMode) {
            return false;
        }
        try {
            let history = loadHistory();
            const record = {
                ...result,
                date: Date.now()
            };
            history.unshift(record);
            if (history.length > MBTIData.config.historyLimit) {
                history = history.slice(0, MBTIData.config.historyLimit);
            }
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
            return true;
        } catch (e) {
            console.error('保存历史记录失败:', e);
            return false;
        }
    }

    function loadHistory() {
        try {
            const saved = localStorage.getItem(HISTORY_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('加载历史记录失败:', e);
        }
        return [];
    }

    function clearHistory() {
        try {
            localStorage.removeItem(HISTORY_KEY);
            return true;
        } catch (e) {
            console.error('清除历史记录失败:', e);
            return false;
        }
    }

    function setAnswer(questionId, optionIndex) {
        const state = loadState();
        state.answers[questionId] = optionIndex;
        saveState(state);
        return state;
    }

    function getAnswer(questionId) {
        const state = loadState();
        return state.answers[questionId];
    }

    function setCurrentQuestion(index) {
        const state = loadState();
        state.currentQuestionIndex = index;
        saveState(state);
        return state;
    }

    function completeTest(result) {
        const state = loadState();
        state.isCompleted = true;
        state.result = result;
        saveState(state);
        saveHistory(result);
        return state;
    }

    function resetTest() {
        clearState();
        const newState = {
            ...defaultState,
            startTime: Date.now()
        };
        saveState(newState);
        return newState;
    }

    function initState() {
        let state = loadState();
        if (!state.startTime) {
            state.startTime = Date.now();
            saveState(state);
        }
        return state;
    }

    return {
        saveState,
        loadState,
        clearState,
        saveHistory,
        loadHistory,
        clearHistory,
        setAnswer,
        getAnswer,
        setCurrentQuestion,
        completeTest,
        resetTest,
        initState
    };
})();
