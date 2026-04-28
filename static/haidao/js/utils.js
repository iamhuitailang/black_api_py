// 工具函数

const Utils = {
    // 生成随机数
    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // 从数组中随机选择一个元素
    randomFromArray(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },

    // 根据权重随机选择
    weightedRandom(weights) {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return i;
            }
        }
        
        return weights.length - 1;
    },

    // 存储到 localStorage
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存到 localStorage 失败:', e);
            return false;
        }
    },

    // 从 localStorage 读取
    loadFromStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('从 localStorage 读取失败:', e);
            return defaultValue;
        }
    },

    // 从 localStorage 删除
    removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('从 localStorage 删除失败:', e);
            return false;
        }
    },

    // 延迟函数
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // 限制数值范围
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    // 格式化数字
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    // 获取 DOM 元素
    $(selector) {
        return document.querySelector(selector);
    },

    // 获取多个 DOM 元素
    $$(selector) {
        return document.querySelectorAll(selector);
    },

    // 添加事件监听器
    on(element, event, handler) {
        element.addEventListener(event, handler);
    },

    // 移除事件监听器
    off(element, event, handler) {
        element.removeEventListener(event, handler);
    },

    // 显示元素
    show(element) {
        element.classList.remove('hidden');
    },

    // 隐藏元素
    hide(element) {
        element.classList.add('hidden');
    },

    // 切换元素显示状态
    toggle(element) {
        element.classList.toggle('hidden');
    },

    // 添加类名
    addClass(element, className) {
        element.classList.add(className);
    },

    // 移除类名
    removeClass(element, className) {
        element.classList.remove(className);
    },

    // 添加动画类
    addAnimation(element, animationClass, duration = 1000) {
        this.addClass(element, animationClass);
        setTimeout(() => {
            this.removeClass(element, animationClass);
        }, duration);
    },

    // 计算两个点之间的距离
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    // 角度转弧度
    degreesToRadians(degrees) {
        return degrees * Math.PI / 180;
    },

    // 弧度转角度
    radiansToDegrees(radians) {
        return radians * 180 / Math.PI;
    },

    // 生成唯一 ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // 深拷贝对象
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    // 数组去重
    uniqueArray(arr) {
        return [...new Set(arr)];
    },

    // 数组打乱
    shuffleArray(arr) {
        const array = [...arr];
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
};
