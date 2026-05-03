/**
 * 工具函数模块
 * 提供游戏中常用的工具方法
 */

const Utils = {
    /**
     * 生成随机数
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {number} 随机数
     */
    random(min, max) {
        return Math.random() * (max - min) + min;
    },

    /**
     * 生成随机整数
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {number} 随机整数
     */
    randomInt(min, max) {
        return Math.floor(this.random(min, max + 1));
    },

    /**
     * 从数组中随机选择一个元素
     * @param {Array} arr - 数组
     * @returns {*} 随机选中的元素
     */
    randomChoice(arr) {
        if (arr.length === 0) return null;
        return arr[Math.floor(Math.random() * arr.length)];
    },

    /**
     * 从数组中随机选择n个元素（不重复）
     * @param {Array} arr - 数组
     * @param {number} n - 选择数量
     * @returns {Array} 随机选中的元素数组
     */
    randomChoices(arr, n) {
        if (n >= arr.length) return [...arr];
        const result = [];
        const used = new Set();
        while (result.length < n) {
            const index = Math.floor(Math.random() * arr.length);
            if (!used.has(index)) {
                used.add(index);
                result.push(arr[index]);
            }
        }
        return result;
    },

    /**
     * 概率事件是否发生
     * @param {number} probability - 概率 (0-1)
     * @returns {boolean} 是否发生
     */
    chance(probability) {
        return Math.random() < probability;
    },

    /**
     * 格式化时间显示
     * @param {number} seconds - 秒数
     * @returns {string} 格式化后的时间字符串
     */
    formatTime(seconds) {
        if (seconds < 60) {
            return `${Math.floor(seconds)}秒`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${minutes}分${secs}秒`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}小时${minutes}分`;
        }
    },

    /**
     * 格式化时间（简化版）
     * @param {number} seconds - 秒数
     * @returns {string} 分钟格式
     */
    formatTimeMinutes(seconds) {
        const minutes = Math.ceil(seconds / 60);
        return `${minutes}分钟`;
    },

    /**
     * 深拷贝对象
     * @param {Object} obj - 要拷贝的对象
     * @returns {Object} 拷贝后的对象
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }
        const cloned = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    },

    /**
     * 限制数值范围
     * @param {number} value - 数值
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {number} 限制后的值
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    /**
     * 线性插值
     * @param {number} start - 起始值
     * @param {number} end - 结束值
     * @param {number} t - 插值参数 (0-1)
     * @returns {number} 插值结果
     */
    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    /**
     * 计算两点之间的距离
     * @param {Object} p1 - 点1 {x, y}
     * @param {Object} p2 - 点2 {x, y}
     * @returns {number} 距离
     */
    distance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * 计算角度
     * @param {Object} from - 起始点
     * @param {Object} to - 目标点
     * @returns {number} 弧度
     */
    angle(from, to) {
        return Math.atan2(to.y - from.y, to.x - from.x);
    },

    /**
     * 休眠（异步）
     * @param {number} ms - 毫秒
     * @returns {Promise} Promise
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * 防抖函数
     * @param {Function} fn - 函数
     * @param {number} delay - 延迟毫秒
     * @returns {Function} 防抖后的函数
     */
    debounce(fn, delay) {
        let timer = null;
        return function(...args) {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                fn.apply(this, args);
            }, delay);
        };
    },

    /**
     * 节流函数
     * @param {Function} fn - 函数
     * @param {number} delay - 间隔毫秒
     * @returns {Function} 节流后的函数
     */
    throttle(fn, delay) {
        let lastTime = 0;
        return function(...args) {
            const now = Date.now();
            if (now - lastTime >= delay) {
                lastTime = now;
                fn.apply(this, args);
            }
        };
    },

    /**
     * 获取当前时间戳
     * @returns {number} 时间戳（毫秒）
     */
    now() {
        return Date.now();
    },

    /**
     * 获取当前时间戳（秒）
     * @returns {number} 时间戳（秒）
     */
    nowSeconds() {
        return Math.floor(Date.now() / 1000);
    },

    /**
     * 转换分钟为秒
     * @param {number} minutes - 分钟
     * @returns {number} 秒
     */
    minutesToSeconds(minutes) {
        return minutes * 60;
    },

    /**
     * 转换秒为分钟
     * @param {number} seconds - 秒
     * @returns {number} 分钟
     */
    secondsToMinutes(seconds) {
        return seconds / 60;
    },

    /**
     * 检查是否为有效数字
     * @param {*} value - 要检查的值
     * @returns {boolean} 是否为有效数字
     */
    isNumber(value) {
        return typeof value === 'number' && !isNaN(value) && isFinite(value);
    },

    /**
     * 检查是否为空对象
     * @param {Object} obj - 对象
     * @returns {boolean} 是否为空
     */
    isEmptyObject(obj) {
        return Object.keys(obj).length === 0;
    },

    /**
     * 合并对象
     * @param {Object} target - 目标对象
     * @param {Object} source - 源对象
     * @returns {Object} 合并后的对象
     */
    mergeObjects(target, source) {
        return { ...target, ...source };
    },

    /**
     * 数组去重
     * @param {Array} arr - 数组
     * @returns {Array} 去重后的数组
     */
    unique(arr) {
        return [...new Set(arr)];
    },

    /**
     * 数组差集
     * @param {Array} arr1 - 数组1
     * @param {Array} arr2 - 数组2
     * @returns {Array} 差集
     */
    difference(arr1, arr2) {
        const set2 = new Set(arr2);
        return arr1.filter(item => !set2.has(item));
    },

    /**
     * 数组交集
     * @param {Array} arr1 - 数组1
     * @param {Array} arr2 - 数组2
     * @returns {Array} 交集
     */
    intersection(arr1, arr2) {
        const set2 = new Set(arr2);
        return arr1.filter(item => set2.has(item));
    },

    /**
     * 生成唯一ID
     * @returns {string} 唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * 简单的对象存储
     * 用于临时数据
     */
    cache: {},

    /**
     * 设置缓存
     * @param {string} key - 键
     * @param {*} value - 值
     */
    setCache(key, value) {
        this.cache[key] = value;
    },

    /**
     * 获取缓存
     * @param {string} key - 键
     * @returns {*} 值
     */
    getCache(key) {
        return this.cache[key];
    },

    /**
     * 清除缓存
     * @param {string} key - 键（可选，不提供则清除全部）
     */
    clearCache(key) {
        if (key) {
            delete this.cache[key];
        } else {
            this.cache = {};
        }
    }
};

// 导出到全局
window.Utils = Utils;
