/**
 * 工具函数模块
 * 提供通用的辅助函数
 */

const Utils = {
    /**
     * 生成唯一ID
     * @returns {string} 唯一标识符
     */
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * 深拷贝对象
     * @param {*} obj 要拷贝的对象
     * @returns {*} 拷贝后的对象
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }
        return obj;
    },

    /**
     * 防抖函数
     * @param {Function} func 要防抖的函数
     * @param {number} wait 等待时间（毫秒）
     * @returns {Function} 防抖后的函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * 节流函数
     * @param {Function} func 要节流的函数
     * @param {number} limit 时间限制（毫秒）
     * @returns {Function} 节流后的函数
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * 线性插值
     * @param {number} start 起始值
     * @param {number} end 结束值
     * @param {number} t 插值因子 (0-1)
     * @returns {number} 插值结果
     */
    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    /**
     * 弹簧动画的缓动函数
     * @param {number} t 时间因子 (0-1)
     * @returns {number} 缓动值
     */
    easeOutElastic(t) {
        if (t === 0) return 0;
        if (t === 1) return 1;
        return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
    },

    /**
     * 平滑缓动函数
     * @param {number} t 时间因子 (0-1)
     * @returns {number} 缓动值
     */
    easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    },

    /**
     * 检查点是否在矩形内
     * @param {number} px 点X坐标
     * @param {number} py 点Y坐标
     * @param {Object} rect 矩形对象 {x, y, width, height}
     * @returns {boolean} 是否在矩形内
     */
    pointInRect(px, py, rect) {
        return px >= rect.x && px <= rect.x + rect.width &&
               py >= rect.y && py <= rect.y + rect.height;
    },

    /**
     * 显示提示消息
     * @param {string} message 消息内容
     * @param {string} type 消息类型 (success, error, info)
     */
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast active ${type}`;
        
        setTimeout(() => {
            toast.classList.remove('active');
        }, 3000);
    },

    /**
     * 下载JSON文件
     * @param {Object} data 要导出的数据
     * @param {string} filename 文件名
     */
    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename + '_' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * 数组中移动元素
     * @param {Array} arr 数组
     * @param {number} fromIndex 源索引
     * @param {number} toIndex 目标索引
     * @returns {Array} 修改后的数组
     */
    moveArrayItem(arr, fromIndex, toIndex) {
        const item = arr.splice(fromIndex, 1)[0];
        arr.splice(toIndex, 0, item);
        return arr;
    },

    /**
     * 限制数值范围
     * @param {number} value 数值
     * @param {number} min 最小值
     * @param {number} max 最大值
     * @returns {number} 限制后的值
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
};

// 将工具函数暴露到全局
window.Utils = Utils;
