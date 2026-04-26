/**
 * 工具函数模块
 * 包含各种实用工具函数
 */

// 随机数生成
const Utils = {
    /**
     * 生成指定范围内的随机整数
     * @param {number} min - 最小值(包含)
     * @param {number} max - 最大值(包含)
     * @returns {number} 随机整数
     */
    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    /**
     * 生成指定范围内的随机浮点数
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {number} 随机浮点数
     */
    randomFloat: function(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    /**
     * 从数组中随机选择一个元素
     * @param {Array} arr - 输入数组
     * @returns {*} 随机选择的元素
     */
    randomChoice: function(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },
    
    /**
     * 线性插值
     * @param {number} start - 起始值
     * @param {number} end - 结束值
     * @param {number} t - 插值因子(0-1)
     * @returns {number} 插值结果
     */
    lerp: function(start, end, t) {
        return start + (end - start) * t;
    },
    
    /**
     * 计算两点之间的距离
     * @param {number} x1 - 点1的x坐标
     * @param {number} y1 - 点1的y坐标
     * @param {number} x2 - 点2的x坐标
     * @param {number} y2 - 点2的y坐标
     * @returns {number} 两点之间的距离
     */
    distance: function(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },
    
    /**
     * 检查点是否在圆形区域内
     * @param {number} cx - 圆心x坐标
     * @param {number} cy - 圆心y坐标
     * @param {number} radius - 圆半径
     * @param {number} px - 点的x坐标
     * @param {number} py - 点的y坐标
     * @returns {boolean} 是否在圆内
     */
    pointInCircle: function(cx, cy, radius, px, py) {
        return this.distance(cx, cy, px, py) <= radius;
    },
    
    /**
     * 检查线段是否与圆形相交
     * @param {number} x1 - 线段起点x坐标
     * @param {number} y1 - 线段起点y坐标
     * @param {number} x2 - 线段终点x坐标
     * @param {number} y2 - 线段终点y坐标
     * @param {number} cx - 圆心x坐标
     * @param {number} cy - 圆心y坐标
     * @param {number} r - 圆半径
     * @returns {boolean} 是否相交
     */
    lineCircleIntersect: function(x1, y1, x2, y2, cx, cy, r) {
        // 向量计算
        const dx = x2 - x1;
        const dy = y2 - y1;
        const fx = x1 - cx;
        const fy = y1 - cy;
        
        const a = dx * dx + dy * dy;
        const b = 2 * (fx * dx + fy * dy);
        const c = fx * fx + fy * fy - r * r;
        
        let discriminant = b * b - 4 * a * c;
        if (discriminant < 0) {
            return false;
        }
        
        discriminant = Math.sqrt(discriminant);
        const t1 = (-b - discriminant) / (2 * a);
        const t2 = (-b + discriminant) / (2 * a);
        
        return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
    },
    
    /**
     * 计算角度
     * @param {number} x1 - 点1的x坐标
     * @param {number} y1 - 点1的y坐标
     * @param {number} x2 - 点2的x坐标
     * @param {number} y2 - 点2的y坐标
     * @returns {number} 角度(弧度)
     */
    angle: function(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },
    
    /**
     * 限制数值在指定范围内
     * @param {number} value - 输入值
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {number} 限制后的值
     */
    clamp: function(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },
    
    /**
     * 格式化时间
     * @param {number} seconds - 秒数
     * @returns {string} 格式化后的时间字符串(MM:SS)
     */
    formatTime: function(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
    
    /**
     * 深拷贝对象
     * @param {Object} obj - 要拷贝的对象
     * @returns {Object} 拷贝后的对象
     */
    deepClone: function(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    
    /**
     * 颜色混合
     * @param {string} color1 - 颜色1(hex格式)
     * @param {string} color2 - 颜色2(hex格式)
     * @param {number} ratio - 混合比例(0-1)
     * @returns {string} 混合后的颜色
     */
    blendColors: function(color1, color2, ratio) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        
        const r = Math.round(c1.r * (1 - ratio) + c2.r * ratio);
        const g = Math.round(c1.g * (1 - ratio) + c2.g * ratio);
        const b = Math.round(c1.b * (1 - ratio) + c2.b * ratio);
        
        return this.rgbToHex(r, g, b);
    },
    
    /**
     * HEX颜色转RGB
     * @param {string} hex - HEX颜色字符串
     * @returns {Object} RGB对象
     */
    hexToRgb: function(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },
    
    /**
     * RGB颜色转HEX
     * @param {number} r - 红色分量(0-255)
     * @param {number} g - 绿色分量(0-255)
     * @param {number} b - 蓝色分量(0-255)
     * @returns {string} HEX颜色字符串
     */
    rgbToHex: function(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    },
    
    /**
     * 获取设备像素比
     * @returns {number} 设备像素比
     */
    getDevicePixelRatio: function() {
        return window.devicePixelRatio || 1;
    },
    
    /**
     * 检测是否为移动设备
     * @returns {boolean} 是否为移动设备
     */
    isMobile: function() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    
    /**
     * 检测是否支持触摸
     * @returns {boolean} 是否支持触摸
     */
    isTouchSupported: function() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
};

// 导出到全局对象
window.Utils = Utils;
