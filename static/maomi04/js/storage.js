/**
 * 本地存储模块
 * 负责游戏数据的持久化存储和读取
 * 使用 localStorage 存储所有游戏数据
 */

const Storage = {
    /**
     * 存储键名前缀
     */
    STORAGE_KEY: 'cat_yard_game_',

    /**
     * 数据版本号
     * 用于数据迁移
     */
    DATA_VERSION: 1,

    /**
     * 默认游戏数据结构
     */
    DEFAULT_DATA: {
        version: 1,
        fishCount: 0,
        collectedCats: [],
        catVisitCounts: {},
        ownedItems: ['food_bowl', 'yarn_ball'],
        placedItems: [],
        currentCats: [],
        lastUpdateTime: 0
    },

    /**
     * 生成完整的存储键名
     * @param {string} key - 键名
     * @returns {string} 完整键名
     */
    getStorageKey(key) {
        return this.STORAGE_KEY + key;
    },

    /**
     * 保存数据到 localStorage
     * @param {string} key - 键名
     * @param {*} value - 要保存的值
     * @returns {boolean} 是否成功
     */
    save(key, value) {
        try {
            const fullKey = this.getStorageKey(key);
            const serialized = JSON.stringify(value);
            localStorage.setItem(fullKey, serialized);
            return true;
        } catch (error) {
            console.error('保存数据失败:', error);
            return false;
        }
    },

    /**
     * 从 localStorage 读取数据
     * @param {string} key - 键名
     * @param {*} defaultValue - 默认值（如果不存在）
     * @returns {*} 读取到的值或默认值
     */
    load(key, defaultValue = null) {
        try {
            const fullKey = this.getStorageKey(key);
            const serialized = localStorage.getItem(fullKey);
            if (serialized === null) {
                return defaultValue;
            }
            return JSON.parse(serialized);
        } catch (error) {
            console.error('读取数据失败:', error);
            return defaultValue;
        }
    },

    /**
     * 移除存储的数据
     * @param {string} key - 键名
     */
    remove(key) {
        try {
            const fullKey = this.getStorageKey(key);
            localStorage.removeItem(fullKey);
        } catch (error) {
            console.error('移除数据失败:', error);
        }
    },

    /**
     * 检查 localStorage 是否可用
     * @returns {boolean} 是否可用
     */
    isAvailable() {
        try {
            const testKey = 'test_storage_availability';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    },

    /**
     * 获取所有存储的键
     * @returns {Array} 键名数组
     */
    getAllKeys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.STORAGE_KEY)) {
                keys.push(key.replace(this.STORAGE_KEY, ''));
            }
        }
        return keys;
    },

    /**
     * 清除所有游戏数据
     * 谨慎使用！
     */
    clearAll() {
        const keys = this.getAllKeys();
        keys.forEach(key => this.remove(key));
    },

    /**
     * 保存完整的游戏状态
     * @param {Object} gameData - 游戏数据
     * @returns {boolean} 是否成功
     */
    saveGameData(gameData) {
        const dataToSave = {
            ...gameData,
            lastUpdateTime: Date.now()
        };
        return this.save('game_data', dataToSave);
    },

    /**
     * 加载完整的游戏状态
     * @returns {Object} 游戏数据
     */
    loadGameData() {
        const savedData = this.load('game_data', null);
        
        if (!savedData) {
            console.log('没有找到保存的游戏数据，使用默认数据');
            return this.getDefaultData();
        }

        // 检查数据版本并进行迁移
        if (savedData.version !== this.DATA_VERSION) {
            console.log(`检测到旧版本数据 (v${savedData.version})，需要迁移到 v${this.DATA_VERSION}`);
            return this.migrateData(savedData);
        }

        return this.validateAndRepairData(savedData);
    },

    /**
     * 获取默认游戏数据
     * @returns {Object} 默认数据
     */
    getDefaultData() {
        return Utils.deepClone(this.DEFAULT_DATA);
    },

    /**
     * 数据迁移
     * 将旧版本数据迁移到最新版本
     * @param {Object} oldData - 旧版本数据
     * @returns {Object} 迁移后的数据
     */
    migrateData(oldData) {
        let migrated = Utils.deepClone(oldData);
        
        // 从 v0 迁移到 v1
        if (!migrated.version || migrated.version < 1) {
            console.log('执行数据迁移: v0 -> v1');
            migrated = {
                ...this.DEFAULT_DATA,
                ...migrated,
                version: 1
            };
        }

        return migrated;
    },

    /**
     * 验证并修复数据
     * 确保所有必要字段都存在
     * @param {Object} data - 要验证的数据
     * @returns {Object} 修复后的数据
     */
    validateAndRepairData(data) {
        const defaultData = this.getDefaultData();
        const validated = { ...defaultData };

        // 逐个字段验证，缺失的用默认值填充
        for (const key in defaultData) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                validated[key] = data[key];
            } else {
                console.warn(`数据字段缺失: ${key}，使用默认值`);
            }
        }

        // 特殊验证
        // 确保 fishCount 是数字
        if (!Utils.isNumber(validated.fishCount)) {
            validated.fishCount = defaultData.fishCount;
        }

        // 确保 collectedCats 是数组
        if (!Array.isArray(validated.collectedCats)) {
            validated.collectedCats = defaultData.collectedCats;
        }

        // 确保 catVisitCounts 是对象
        if (typeof validated.catVisitCounts !== 'object' || validated.catVisitCounts === null) {
            validated.catVisitCounts = defaultData.catVisitCounts;
        }

        // 确保 ownedItems 是数组
        if (!Array.isArray(validated.ownedItems)) {
            validated.ownedItems = defaultData.ownedItems;
        }

        // 确保 placedItems 是数组
        if (!Array.isArray(validated.placedItems)) {
            validated.placedItems = defaultData.placedItems;
        }

        // 确保 currentCats 是数组
        if (!Array.isArray(validated.currentCats)) {
            validated.currentCats = defaultData.currentCats;
        }

        return validated;
    },

    /**
     * 保存设置
     * @param {Object} settings - 设置对象
     */
    saveSettings(settings) {
        return this.save('settings', settings);
    },

    /**
     * 加载设置
     * @param {Object} defaultSettings - 默认设置
     * @returns {Object} 设置
     */
    loadSettings(defaultSettings = {}) {
        return this.load('settings', defaultSettings);
    },

    /**
     * 计算离线时间（秒）
     * @returns {number} 离线秒数
     */
    getOfflineTime() {
        const savedData = this.load('game_data', null);
        if (!savedData || !savedData.lastUpdateTime) {
            return 0;
        }
        
        const currentTime = Date.now();
        const offlineMs = currentTime - savedData.lastUpdateTime;
        
        // 限制最大离线时间为7天
        const maxOfflineMs = 7 * 24 * 60 * 60 * 1000;
        return Math.min(offlineMs, maxOfflineMs) / 1000;
    },

    /**
     * 导出游戏数据
     * @returns {string} JSON字符串
     */
    exportData() {
        const gameData = this.loadGameData();
        return JSON.stringify(gameData, null, 2);
    },

    /**
     * 导入游戏数据
     * @param {string} jsonString - JSON字符串
     * @returns {boolean} 是否成功
     */
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            // 验证数据结构
            if (data.version && data.fishCount !== undefined) {
                return this.saveGameData(data);
            }
            return false;
        } catch (error) {
            console.error('导入数据失败:', error);
            return false;
        }
    },

    /**
     * 获取存储使用情况
     * @returns {Object} 存储信息
     */
    getStorageInfo() {
        let totalSize = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                const value = localStorage.getItem(key) || '';
                totalSize += (key.length + value.length) * 2; // UTF-16
            }
        }

        return {
            usedBytes: totalSize,
            usedKB: (totalSize / 1024).toFixed(2),
            keysCount: localStorage.length,
            gameKeysCount: this.getAllKeys().length
        };
    }
};

// 导出到全局
window.Storage = Storage;
