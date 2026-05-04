/**
 * 数据持久化模块
 * 负责 localStorage 的读写操作
 */

const Storage = {
    /**
     * 检查 localStorage 是否可用
     * @returns {boolean}
     */
    isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('localStorage 不可用:', e);
            return false;
        }
    },

    /**
     * 保存游戏数据
     * @param {Object} gameState - 游戏状态对象
     * @returns {boolean} 是否保存成功
     */
    save(gameState) {
        if (!this.isAvailable()) {
            console.error('无法保存游戏：localStorage 不可用');
            return false;
        }

        try {
            const saveData = {
                version: CONFIG.VERSION,
                timestamp: Date.now(),
                data: this.deepClone(gameState)
            };
            
            const jsonString = JSON.stringify(saveData);
            localStorage.setItem(CONFIG.STORAGE_KEY, jsonString);
            
            console.log('游戏已保存');
            return true;
        } catch (e) {
            console.error('保存游戏失败:', e);
            return false;
        }
    },

    /**
     * 加载游戏数据
     * @returns {Object|null} 游戏状态对象，如果没有存档则返回 null
     */
    load() {
        if (!this.isAvailable()) {
            console.warn('无法加载游戏：localStorage 不可用');
            return null;
        }

        try {
            const savedString = localStorage.getItem(CONFIG.STORAGE_KEY);
            
            if (!savedString) {
                console.log('没有找到存档');
                return null;
            }

            const saveData = JSON.parse(savedString);
            
            // 检查版本兼容性
            if (saveData.version !== CONFIG.VERSION) {
                console.warn(`存档版本 ${saveData.version} 与当前版本 ${CONFIG.VERSION} 不匹配，尝试迁移...`);
                // 这里可以添加版本迁移逻辑
            }

            console.log('游戏已加载，保存时间:', new Date(saveData.timestamp).toLocaleString());
            return saveData.data;
        } catch (e) {
            console.error('加载游戏失败:', e);
            return null;
        }
    },

    /**
     * 检查是否有存档
     * @returns {boolean}
     */
    hasSave() {
        if (!this.isAvailable()) {
            return false;
        }
        return localStorage.getItem(CONFIG.STORAGE_KEY) !== null;
    },

    /**
     * 清除存档
     * @returns {boolean} 是否清除成功
     */
    clear() {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            localStorage.removeItem(CONFIG.STORAGE_KEY);
            console.log('存档已清除');
            return true;
        } catch (e) {
            console.error('清除存档失败:', e);
            return false;
        }
    },

    /**
     * 获取存档信息
     * @returns {Object|null} 存档信息，包括版本和时间戳
     */
    getSaveInfo() {
        if (!this.isAvailable()) {
            return null;
        }

        try {
            const savedString = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (!savedString) {
                return null;
            }

            const saveData = JSON.parse(savedString);
            return {
                version: saveData.version,
                timestamp: saveData.timestamp,
                date: new Date(saveData.timestamp).toLocaleString()
            };
        } catch (e) {
            console.error('获取存档信息失败:', e);
            return null;
        }
    },

    /**
     * 深拷贝对象（用于保存前的数据处理）
     * @param {Object} obj - 要拷贝的对象
     * @returns {Object} 拷贝后的对象
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        // 处理特殊对象类型
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }

        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }

        // 处理普通对象
        const cloned = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                // 跳过函数
                if (typeof obj[key] === 'function') {
                    continue;
                }
                cloned[key] = this.deepClone(obj[key]);
            }
        }

        return cloned;
    },

    /**
     * 自动保存（定时调用）
     * @param {Object} gameState - 游戏状态
     * @param {number} interval - 保存间隔（毫秒），默认 30 秒
     * @returns {number} 定时器 ID
     */
    autoSave(gameState, interval = 30000) {
        return setInterval(() => {
            this.save(gameState);
        }, interval);
    }
};

// 导出 Storage 对象
window.Storage = Storage;