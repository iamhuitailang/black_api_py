/**
 * 幸运777老虎机游戏 - 存储模块
 * 负责管理游戏数据的本地存储（localStorage）
 * 确保刷新页面后游戏状态和数据能够保持
 */

const Storage = (function() {
    'use strict';

    const { STORAGE_KEYS, DEFAULT_STATE } = GameConfig;

    /**
     * 检查localStorage是否可用
     * @returns {boolean} 是否可用
     */
    function isLocalStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('localStorage 不可用，数据将不会被持久化');
            return false;
        }
    }

    const STORAGE_AVAILABLE = isLocalStorageAvailable();

    /**
     * 保存游戏状态到localStorage
     * @param {Object} state - 游戏状态对象
     * @returns {boolean} 是否保存成功
     */
    function saveGameState(state) {
        if (!STORAGE_AVAILABLE) {
            return false;
        }

        try {
            const stateToSave = {
                ...state,
                savedAt: Date.now()
            };
            localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(stateToSave));
            return true;
        } catch (e) {
            console.error('保存游戏状态失败:', e);
            return false;
        }
    }

    /**
     * 从localStorage加载游戏状态
     * @returns {Object|null} 游戏状态对象或null
     */
    function loadGameState() {
        if (!STORAGE_AVAILABLE) {
            return null;
        }

        try {
            const savedState = localStorage.getItem(STORAGE_KEYS.GAME_STATE);
            if (!savedState) {
                return null;
            }

            const parsedState = JSON.parse(savedState);

            if (!isValidGameState(parsedState)) {
                console.warn('保存的游戏状态无效，使用默认状态');
                return null;
            }

            return parsedState;
        } catch (e) {
            console.error('加载游戏状态失败:', e);
            return null;
        }
    }

    /**
     * 验证游戏状态是否有效
     * @param {Object} state - 游戏状态对象
     * @returns {boolean} 是否有效
     */
    function isValidGameState(state) {
        if (!state || typeof state !== 'object') {
            return false;
        }

        const requiredFields = ['coins', 'currentBet', 'maxWin', 'winCount', 'totalSpins'];
        for (const field of requiredFields) {
            if (typeof state[field] !== 'number' || state[field] < 0) {
                return false;
            }
        }

        if (!Array.isArray(state.currentReels) || state.currentReels.length !== 3) {
            return false;
        }

        return true;
    }

    /**
     * 获取初始化的游戏状态
     * 优先从localStorage加载，如果没有则返回默认状态
     * @returns {Object} 游戏状态对象
     */
    function getInitialState() {
        const savedState = loadGameState();

        if (savedState) {
            console.log('从本地存储加载游戏状态');
            return {
                ...savedState,
                isPlaying: false,
                isPaused: false
            };
        }

        console.log('使用默认游戏状态');
        return { ...DEFAULT_STATE };
    }

    /**
     * 清除保存的游戏状态
     * @returns {boolean} 是否清除成功
     */
    function clearGameState() {
        if (!STORAGE_AVAILABLE) {
            return false;
        }

        try {
            localStorage.removeItem(STORAGE_KEYS.GAME_STATE);
            return true;
        } catch (e) {
            console.error('清除游戏状态失败:', e);
            return false;
        }
    }

    /**
     * 重置游戏状态为默认值并保存
     * @returns {Object} 重置后的游戏状态
     */
    function resetGameState() {
        const defaultState = { ...DEFAULT_STATE };
        saveGameState(defaultState);
        return defaultState;
    }

    /**
     * 保存设置
     * @param {Object} settings - 设置对象
     * @returns {boolean} 是否保存成功
     */
    function saveSettings(settings) {
        if (!STORAGE_AVAILABLE) {
            return false;
        }

        try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (e) {
            console.error('保存设置失败:', e);
            return false;
        }
    }

    /**
     * 加载设置
     * @returns {Object|null} 设置对象或null
     */
    function loadSettings() {
        if (!STORAGE_AVAILABLE) {
            return null;
        }

        try {
            const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            return savedSettings ? JSON.parse(savedSettings) : null;
        } catch (e) {
            console.error('加载设置失败:', e);
            return null;
        }
    }

    return {
        isLocalStorageAvailable: () => STORAGE_AVAILABLE,
        saveGameState,
        loadGameState,
        getInitialState,
        clearGameState,
        resetGameState,
        saveSettings,
        loadSettings
    };
})();

window.Storage = Storage;
