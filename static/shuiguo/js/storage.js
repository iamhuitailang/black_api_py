/**
 * 本地存储模块
 * 负责游戏数据的本地存储和状态保持
 */

const Storage = {
    // 存储键名
    KEYS: {
        HIGH_SCORE: 'fruit_ninja_high_score',
        GAME_STATE: 'fruit_ninja_game_state',
        SETTINGS: 'fruit_ninja_settings'
    },
    
    // 默认设置
    DEFAULT_SETTINGS: {
        soundEnabled: true,
        musicEnabled: true,
        difficulty: 'normal'
    },
    
    /**
     * 检查localStorage是否可用
     * @returns {boolean} 是否可用
     */
    isAvailable: function() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    },
    
    /**
     * 获取最高分
     * @returns {number} 最高分
     */
    getHighScore: function() {
        if (!this.isAvailable()) {
            return 0;
        }
        
        const score = localStorage.getItem(this.KEYS.HIGH_SCORE);
        return score ? parseInt(score, 10) : 0;
    },
    
    /**
     * 设置最高分
     * @param {number} score - 分数
     * @returns {boolean} 是否为新纪录
     */
    setHighScore: function(score) {
        if (!this.isAvailable()) {
            return false;
        }
        
        const currentHigh = this.getHighScore();
        if (score > currentHigh) {
            localStorage.setItem(this.KEYS.HIGH_SCORE, score.toString());
            return true;
        }
        return false;
    },
    
    /**
     * 保存游戏状态
     * @param {Object} state - 游戏状态对象
     */
    saveGameState: function(state) {
        if (!this.isAvailable()) {
            return;
        }
        
        try {
            const stateStr = JSON.stringify(state);
            localStorage.setItem(this.KEYS.GAME_STATE, stateStr);
        } catch (e) {
            console.error('保存游戏状态失败:', e);
        }
    },
    
    /**
     * 获取游戏状态
     * @returns {Object|null} 游戏状态对象,如果不存在则返回null
     */
    getGameState: function() {
        if (!this.isAvailable()) {
            return null;
        }
        
        try {
            const stateStr = localStorage.getItem(this.KEYS.GAME_STATE);
            if (stateStr) {
                return JSON.parse(stateStr);
            }
        } catch (e) {
            console.error('获取游戏状态失败:', e);
        }
        
        return null;
    },
    
    /**
     * 清除游戏状态
     */
    clearGameState: function() {
        if (!this.isAvailable()) {
            return;
        }
        
        localStorage.removeItem(this.KEYS.GAME_STATE);
    },
    
    /**
     * 获取设置
     * @returns {Object} 设置对象
     */
    getSettings: function() {
        if (!this.isAvailable()) {
            return this.DEFAULT_SETTINGS;
        }
        
        try {
            const settingsStr = localStorage.getItem(this.KEYS.SETTINGS);
            if (settingsStr) {
                const savedSettings = JSON.parse(settingsStr);
                return { ...this.DEFAULT_SETTINGS, ...savedSettings };
            }
        } catch (e) {
            console.error('获取设置失败:', e);
        }
        
        return this.DEFAULT_SETTINGS;
    },
    
    /**
     * 保存设置
     * @param {Object} settings - 设置对象
     */
    saveSettings: function(settings) {
        if (!this.isAvailable()) {
            return;
        }
        
        try {
            const currentSettings = this.getSettings();
            const mergedSettings = { ...currentSettings, ...settings };
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(mergedSettings));
        } catch (e) {
            console.error('保存设置失败:', e);
        }
    },
    
    /**
     * 清除所有存储数据
     */
    clearAll: function() {
        if (!this.isAvailable()) {
            return;
        }
        
        localStorage.removeItem(this.KEYS.HIGH_SCORE);
        localStorage.removeItem(this.KEYS.GAME_STATE);
        localStorage.removeItem(this.KEYS.SETTINGS);
    },
    
    /**
     * 创建可保存的游戏状态对象
     * @param {Object} game - 游戏实例
     * @returns {Object} 可保存的状态对象
     */
    createSaveState: function(game) {
        return {
            score: game.score,
            combo: game.combo,
            maxCombo: game.maxCombo,
            lives: game.lives,
            timeRemaining: game.timeRemaining,
            isPlaying: game.isPlaying,
            isPaused: game.isPaused,
            isGameOver: game.isGameOver,
            difficulty: game.difficulty,
            timestamp: Date.now()
        };
    },
    
    /**
     * 检查状态是否过期(超过5分钟)
     * @param {Object} state - 游戏状态
     * @returns {boolean} 是否过期
     */
    isStateExpired: function(state) {
        if (!state || !state.timestamp) {
            return true;
        }
        
        const EXPIRY_TIME = 5 * 60 * 1000; // 5分钟
        return Date.now() - state.timestamp > EXPIRY_TIME;
    }
};

// 导出到全局对象
window.Storage = Storage;
