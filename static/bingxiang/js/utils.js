/**
 * 工具函数模块
 */

const Utils = {
    /**
     * 分类列表
     */
    CATEGORIES: ['蔬菜', '水果', '肉类', '海鲜', '乳制品', '饮料', '调味品', '其他'],
    
    /**
     * 颜色配置（清新卡通风格）
     */
    COLORS: {
        background: '#FDF6E3',
        cardBackground: '#FFFFFF',
        primary: '#6BBF59',
        primaryLight: '#A8D5BA',
        accent: '#FF9A8B',
        accentLight: '#FFD3B6',
        warning: '#FFD93D',
        warningLight: '#FFF3CD',
        danger: '#FF6B6B',
        dangerLight: '#FFE5E5',
        text: '#4A4A4A',
        textLight: '#9B9B9B',
        border: '#E8E8E8',
        shadow: 'rgba(0, 0, 0, 0.1)'
    },
    
    /**
     * 分类对应的颜色
     */
    CATEGORY_COLORS: {
        '蔬菜': '#4CAF50',
        '水果': '#FF9800',
        '肉类': '#F44336',
        '海鲜': '#2196F3',
        '乳制品': '#9C27B0',
        '饮料': '#00BCD4',
        '调味品': '#795548',
        '其他': '#607D8B'
    },
    
    /**
     * 分类对应的emoji图标
     */
    CATEGORY_ICONS: {
        '蔬菜': '🥬',
        '水果': '🍎',
        '肉类': '🥩',
        '海鲜': '🦐',
        '乳制品': '🥛',
        '饮料': '🍹',
        '调味品': '🧂',
        '其他': '📦'
    },
    
    /**
     * 计算距离过期的天数
     * @param {string} expiryDate - 过期日期字符串
     * @returns {number} 天数（负数表示已过期）
     */
    getDaysUntilExpiry(expiryDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    },
    
    /**
     * 获取过期状态
     * @param {string} expiryDate - 过期日期
     * @returns {string} 'normal' | 'warning' | 'expired'
     */
    getExpiryStatus(expiryDate) {
        const days = this.getDaysUntilExpiry(expiryDate);
        if (days < 0) {
            return 'expired';
        } else if (days <= 3) {
            return 'warning';
        }
        return 'normal';
    },
    
    /**
     * 获取状态对应的颜色
     * @param {string} status - 过期状态
     * @returns {Object} 颜色对象
     */
    getStatusColors(status) {
        switch (status) {
            case 'expired':
                return {
                    bg: this.COLORS.dangerLight,
                    border: this.COLORS.danger,
                    text: this.COLORS.danger
                };
            case 'warning':
                return {
                    bg: this.COLORS.warningLight,
                    border: this.COLORS.warning,
                    text: '#856404'
                };
            default:
                return {
                    bg: '#E8F5E9',
                    border: this.COLORS.primary,
                    text: this.COLORS.primary
                };
        }
    },
    
    /**
     * 格式化日期显示
     * @param {string} dateStr - 日期字符串
     * @returns {string} 格式化后的日期
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    /**
     * 获取今天的日期字符串
     * @returns {string} YYYY-MM-DD格式的今天日期
     */
    getTodayString() {
        return this.formatDate(new Date());
    },
    
    /**
     * 按过期日期排序食材
     * @param {Array} items - 食材列表
     * @returns {Array} 排序后的列表
     */
    sortByExpiry(items) {
        return [...items].sort((a, b) => {
            return new Date(a.expiryDate) - new Date(b.expiryDate);
        });
    },
    
    /**
     * 绘制圆角矩形
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @param {number} radius - 圆角半径
     */
    drawRoundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    },
    
    /**
     * 绘制椭圆形按钮
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @param {string} color - 填充颜色
     * @param {string} text - 文字
     */
    drawButton(ctx, x, y, width, height, color, text) {
        ctx.fillStyle = color;
        this.drawRoundRect(ctx, x, y, width, height, height / 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + width / 2, y + height / 2);
    },
    
    /**
     * 生成唯一ID
     * @returns {string} 唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    /**
     * 防抖函数
     * @param {Function} func - 要执行的函数
     * @param {number} wait - 等待时间（毫秒）
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
    }
};

// 导出模块
window.Utils = Utils;
