/**
 * 工具函数模块
 * 提供通用的辅助函数
 */

const Utils = {
    /**
     * 生成唯一ID
     * @returns {string} 唯一标识符
     */
    generateId: function() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * 两点之间的距离
     * @param {number} x1 点1 x坐标
     * @param {number} y1 点1 y坐标
     * @param {number} x2 点2 x坐标
     * @param {number} y2 点2 y坐标
     * @returns {number} 距离
     */
    distance: function(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    },

    /**
     * 点到线段的距离
     * @param {number} px 点 x坐标
     * @param {number} py 点 y坐标
     * @param {number} x1 线段起点 x
     * @param {number} y1 线段起点 y
     * @param {number} x2 线段终点 x
     * @param {number} y2 线段终点 y
     * @returns {number} 距离
     */
    pointToLineDistance: function(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        return this.distance(px, py, xx, yy);
    },

    /**
     * 限制数值在范围内
     * @param {number} value 数值
     * @param {number} min 最小值
     * @param {number} max 最大值
     * @returns {number} 限制后的数值
     */
    clamp: function(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    /**
     * 深拷贝对象
     * @param {object} obj 源对象
     * @returns {object} 拷贝后的对象
     */
    deepClone: function(obj) {
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
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }

        return cloned;
    },

    /**
     * 检查点是否在矩形内
     * @param {number} px 点 x
     * @param {number} py 点 y
     * @param {number} rx 矩形 x
     * @param {number} ry 矩形 y
     * @param {number} rw 矩形宽
     * @param {number} rh 矩形高
     * @returns {boolean} 是否在矩形内
     */
    pointInRect: function(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    },

    /**
     * 检查点是否在圆内
     * @param {number} px 点 x
     * @param {number} py 点 y
     * @param {number} cx 圆心 x
     * @param {number} cy 圆心 y
     * @param {number} radius 半径
     * @returns {boolean} 是否在圆内
     */
    pointInCircle: function(px, py, cx, cy, radius) {
        return this.distance(px, py, cx, cy) <= radius;
    },

    /**
     * 检查点是否在菱形内
     * @param {number} px 点 x
     * @param {number} py 点 y
     * @param {number} cx 中心 x
     * @param {number} cy 中心 y
     * @param {number} halfWidth 半宽
     * @param {number} halfHeight 半高
     * @returns {boolean} 是否在菱形内
     */
    pointInDiamond: function(px, py, cx, cy, halfWidth, halfHeight) {
        const dx = Math.abs(px - cx) / halfWidth;
        const dy = Math.abs(py - cy) / halfHeight;
        return dx + dy <= 1;
    },

    /**
     * 对齐到网格
     * @param {number} value 数值
     * @param {number} gridSize 网格大小
     * @returns {number} 对齐后的值
     */
    snapToGrid: function(value, gridSize) {
        return Math.round(value / gridSize) * gridSize;
    },

    /**
     * 下载文件
     * @param {string} content 文件内容
     * @param {string} fileName 文件名
     * @param {string} contentType 内容类型
     */
    downloadFile: function(content, fileName, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * 读取文件内容
     * @param {File} file 文件对象
     * @returns {Promise<string>} 文件内容
     */
    readFile: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    },

    /**
     * 防抖函数
     * @param {Function} func 函数
     * @param {number} wait 等待时间(ms)
     * @returns {Function} 防抖后的函数
     */
    debounce: function(func, wait) {
        let timeout;
        return function(...args) {
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
     * @param {Function} func 函数
     * @param {number} limit 时间限制(ms)
     * @returns {Function} 节流后的函数
     */
    throttle: function(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * 计算贝塞尔曲线上的点
     * @param {number} p0 起点
     * @param {number} p1 控制点1
     * @param {number} p2 控制点2
     * @param {number} p3 终点
     * @param {number} t 时间参数(0-1)
     * @returns {number} 计算结果
     */
    cubicBezier: function(p0, p1, p2, p3, t) {
        const u = 1 - t;
        return u * u * u * p0 +
               3 * u * u * t * p1 +
               3 * u * t * t * p2 +
               t * t * t * p3;
    }
};

// 暴露到全局
window.Utils = Utils;