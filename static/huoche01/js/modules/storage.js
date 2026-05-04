/**
 * 数据存储模块
 * 负责游戏数据的本地存储和读取
 * 使用localStorage实现持久化存储
 */

const STORAGE_KEYS = {
    GAME_STATE: 'trainGame_state',
    LEVEL_PROGRESS: 'trainGame_levelProgress',
    SETTINGS: 'trainGame_settings'
};

/**
 * Storage模块
 */
const Storage = {
    /**
     * 保存游戏状态
     * @param {Object} state - 游戏状态对象
     * @returns {boolean} 是否保存成功
     */
    saveGameState(state) {
        try {
            const serializedState = JSON.stringify({
                ...state,
                timestamp: Date.now()
            });
            localStorage.setItem(STORAGE_KEYS.GAME_STATE, serializedState);
            return true;
        } catch (error) {
            console.error('保存游戏状态失败:', error);
            return false;
        }
    },

    /**
     * 加载游戏状态
     * @returns {Object|null} 游戏状态对象，如果没有则返回null
     */
    loadGameState() {
        try {
            const serializedState = localStorage.getItem(STORAGE_KEYS.GAME_STATE);
            if (!serializedState) {
                return null;
            }
            return JSON.parse(serializedState);
        } catch (error) {
            console.error('加载游戏状态失败:', error);
            return null;
        }
    },

    /**
     * 清除游戏状态
     * @returns {boolean} 是否清除成功
     */
    clearGameState() {
        try {
            localStorage.removeItem(STORAGE_KEYS.GAME_STATE);
            return true;
        } catch (error) {
            console.error('清除游戏状态失败:', error);
            return false;
        }
    },

    /**
     * 保存关卡进度
     * @param {number} currentLevel - 当前关卡
     * @param {Object} levelData - 关卡数据
     * @returns {boolean} 是否保存成功
     */
    saveLevelProgress(currentLevel, levelData = {}) {
        try {
            const progress = {
                currentLevel,
                levelData,
                timestamp: Date.now()
            };
            localStorage.setItem(STORAGE_KEYS.LEVEL_PROGRESS, JSON.stringify(progress));
            return true;
        } catch (error) {
            console.error('保存关卡进度失败:', error);
            return false;
        }
    },

    /**
     * 加载关卡进度
     * @returns {Object|null} 关卡进度对象，如果没有则返回null
     */
    loadLevelProgress() {
        try {
            const serializedProgress = localStorage.getItem(STORAGE_KEYS.LEVEL_PROGRESS);
            if (!serializedProgress) {
                return null;
            }
            return JSON.parse(serializedProgress);
        } catch (error) {
            console.error('加载关卡进度失败:', error);
            return null;
        }
    },

    /**
     * 清除关卡进度
     * @returns {boolean} 是否清除成功
     */
    clearLevelProgress() {
        try {
            localStorage.removeItem(STORAGE_KEYS.LEVEL_PROGRESS);
            return true;
        } catch (error) {
            console.error('清除关卡进度失败:', error);
            return false;
        }
    },

    /**
     * 保存游戏设置
     * @param {Object} settings - 设置对象
     * @returns {boolean} 是否保存成功
     */
    saveSettings(settings) {
        try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('保存游戏设置失败:', error);
            return false;
        }
    },

    /**
     * 加载游戏设置
     * @returns {Object} 设置对象
     */
    loadSettings() {
        try {
            const serializedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            if (!serializedSettings) {
                return this.getDefaultSettings();
            }
            return {
                ...this.getDefaultSettings(),
                ...JSON.parse(serializedSettings)
            };
        } catch (error) {
            console.error('加载游戏设置失败:', error);
            return this.getDefaultSettings();
        }
    },

    /**
     * 获取默认设置
     * @returns {Object} 默认设置对象
     */
    getDefaultSettings() {
        return {
            soundEnabled: true,
            musicEnabled: true,
            animationSpeed: 1.0,
            gridSize: 40
        };
    },

    /**
     * 检查是否有保存的游戏状态
     * @returns {boolean} 是否有保存的游戏状态
     */
    hasSavedGame() {
        const gameState = localStorage.getItem(STORAGE_KEYS.GAME_STATE);
        return gameState !== null;
    },

    /**
     * 检查是否有保存的关卡进度
     * @returns {boolean} 是否有保存的关卡进度
     */
    hasSavedProgress() {
        const levelProgress = localStorage.getItem(STORAGE_KEYS.LEVEL_PROGRESS);
        return levelProgress !== null;
    },

    /**
     * 清除所有游戏数据
     * @returns {boolean} 是否清除成功
     */
    clearAll() {
        try {
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('清除所有游戏数据失败:', error);
            return false;
        }
    },

    /**
     * 导出游戏数据
     * @returns {Object} 导出的数据对象
     */
    exportData() {
        return {
            gameState: this.loadGameState(),
            levelProgress: this.loadLevelProgress(),
            settings: this.loadSettings()
        };
    },

    /**
     * 导入游戏数据
     * @param {Object} data - 导入的数据对象
     * @returns {boolean} 是否导入成功
     */
    importData(data) {
        try {
            if (data.gameState) {
                this.saveGameState(data.gameState);
            }
            if (data.levelProgress) {
                this.saveLevelProgress(data.levelProgress.currentLevel, data.levelProgress.levelData);
            }
            if (data.settings) {
                this.saveSettings(data.settings);
            }
            return true;
        } catch (error) {
            console.error('导入游戏数据失败:', error);
            return false;
        }
    }
};

export default Storage;
