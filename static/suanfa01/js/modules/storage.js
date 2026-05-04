/**
 * 本地存储模块
 * 负责数据的持久化存储和加载
 */

const Storage = {
    // 存储键名
    STORAGE_KEY: 'flowchart_editor_data',
    
    /**
     * 保存数据到 localStorage
     * @param {object} data 要保存的数据
     * @returns {boolean} 是否保存成功
     */
    save: function(data) {
        try {
            const jsonString = JSON.stringify(data);
            localStorage.setItem(this.STORAGE_KEY, jsonString);
            return true;
        } catch (error) {
            console.error('保存数据失败:', error);
            return false;
        }
    },

    /**
     * 从 localStorage 加载数据
     * @returns {object|null} 加载的数据，如果没有则返回 null
     */
    load: function() {
        try {
            const jsonString = localStorage.getItem(this.STORAGE_KEY);
            if (jsonString) {
                return JSON.parse(jsonString);
            }
            return null;
        } catch (error) {
            console.error('加载数据失败:', error);
            return null;
        }
    },

    /**
     * 清除存储的数据
     * @returns {boolean} 是否清除成功
     */
    clear: function() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (error) {
            console.error('清除数据失败:', error);
            return false;
        }
    },

    /**
     * 导出数据为 JSON 字符串
     * @param {object} data 要导出的数据
     * @returns {string} JSON 字符串
     */
    exportToJson: function(data) {
        return JSON.stringify(data, null, 2);
    },

    /**
     * 从 JSON 字符串导入数据
     * @param {string} jsonString JSON 字符串
     * @returns {object|null} 解析后的数据，解析失败返回 null
     */
    importFromJson: function(jsonString) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('解析 JSON 失败:', error);
            return null;
        }
    },

    /**
     * 检查浏览器是否支持 localStorage
     * @returns {boolean} 是否支持
     */
    isSupported: function() {
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
     * 获取当前存储的数据大小
     * @returns {number} 字节数
     */
    getSize: function() {
        try {
            const jsonString = localStorage.getItem(this.STORAGE_KEY);
            return jsonString ? new Blob([jsonString]).size : 0;
        } catch (error) {
            return 0;
        }
    }
};

// 暴露到全局
window.Storage = Storage;