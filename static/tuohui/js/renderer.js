/**
 * Canvas渲染引擎模块
 * 负责Canvas初始化、渲染循环和基础绘制功能
 */

const Renderer = {
    // Canvas元素和上下文
    canvas: null,
    ctx: null,
    
    // Canvas尺寸
    width: 0,
    height: 0,
    
    // 设备像素比
    dpr: 1,
    
    // 渲染回调
    onRender: null,
    
    // 是否正在运行
    isRunning: false,
    
    // 动画ID
    animationId: null,
    
    // 颜色主题
    theme: {
        primary: '#667eea',
        primaryLight: '#818cf8',
        secondary: '#764ba2',
        background: '#ffffff',
        itemBackground: '#f8f9ff',
        itemHover: '#f0f3ff',
        itemBorder: '#e0e7ff',
        text: '#333333',
        textSecondary: '#666666',
        shadow: 'rgba(0, 0, 0, 0.1)',
        handle: '#c7d2fe',
        handleHover: '#818cf8',
        remove: '#ff6b6b',
        removeHover: '#ee5a5a',
        placeholder: '#e0e7ff',
        indentLine: '#c7d2fe',
        highlight: '#fef3c7'
    },

    /**
     * 初始化渲染器
     * @param {string} canvasId Canvas元素ID
     */
    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas元素不存在');
            return false;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.dpr = window.devicePixelRatio || 1;
        
        this.resize();
        this.setupEventListeners();
        
        return true;
    },

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        window.addEventListener('resize', Utils.debounce(() => {
            this.resize();
            this.requestRender();
        }, 200));
    },

    /**
     * 调整Canvas尺寸
     */
    resize() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        const minHeight = 500;
        const contentHeight = Math.max(minHeight, window.innerHeight - 300);
        
        this.width = rect.width;
        this.height = contentHeight;
        
        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        
        this.ctx.scale(this.dpr, this.dpr);
    },

    /**
     * 开始渲染循环
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.render();
    },

    /**
     * 停止渲染循环
     */
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    },

    /**
     * 请求单次渲染
     */
    requestRender() {
        if (!this.isRunning) {
            this.render();
        }
    },

    /**
     * 渲染函数
     */
    render() {
        this.clear();
        
        if (typeof this.onRender === 'function') {
            this.onRender(this.ctx);
        }
        
        if (this.isRunning) {
            this.animationId = requestAnimationFrame(() => this.render());
        }
    },

    /**
     * 清除画布
     */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    },

    // ==================== 基础绘制方法 ====================

    /**
     * 绘制圆角矩形
     * @param {number} x X坐标
     * @param {number} y Y坐标
     * @param {number} width 宽度
     * @param {number} height 高度
     * @param {number} radius 圆角半径
     */
    drawRoundRect(x, y, width, height, radius = 8) {
        const ctx = this.ctx;
        const r = Math.min(radius, width / 2, height / 2);
        
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.arcTo(x + width, y, x + width, y + r, r);
        ctx.lineTo(x + width, y + height - r);
        ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
        ctx.lineTo(x + r, y + height);
        ctx.arcTo(x, y + height, x, y + height - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    },

    /**
     * 绘制带阴影的圆角矩形
     * @param {number} x X坐标
     * @param {number} y Y坐标
     * @param {number} width 宽度
     * @param {number} height 高度
     * @param {number} radius 圆角半径
     * @param {string} fillColor 填充颜色
     * @param {string} strokeColor 描边颜色
     * @param {number} shadowBlur 阴影模糊
     * @param {number} shadowOffsetY 阴影Y偏移
     */
    drawCard(x, y, width, height, radius = 8, fillColor = '#ffffff', 
             strokeColor = null, shadowBlur = 0, shadowOffsetY = 0) {
        const ctx = this.ctx;
        
        ctx.save();
        
        if (shadowBlur > 0) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
            ctx.shadowBlur = shadowBlur;
            ctx.shadowOffsetY = shadowOffsetY;
        }
        
        ctx.fillStyle = fillColor;
        this.drawRoundRect(x, y, width, height, radius);
        ctx.fill();
        
        if (strokeColor) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        ctx.restore();
    },

    /**
     * 绘制拖拽手柄（⋮⋮图标）
     * @param {number} x X坐标
     * @param {number} y Y坐标
     * @param {number} size 大小
     * @param {string} color 颜色
     */
    drawHandle(x, y, size = 20, color = null) {
        const ctx = this.ctx;
        const dotRadius = 2;
        const spacing = 5;
        const startX = x + size / 2;
        const startY = y + size / 2 - (dotRadius * 2 + spacing / 2);
        
        ctx.fillStyle = color || this.theme.handle;
        
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 2; col++) {
                const dotX = startX + (col - 0.5) * spacing;
                const dotY = startY + row * (dotRadius * 2 + spacing / 2);
                
                ctx.beginPath();
                ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    },

    /**
     * 绘制折叠/展开箭头
     * @param {number} x X坐标
     * @param {number} y Y坐标
     * @param {number} size 大小
     * @param {boolean} expanded 是否展开
     * @param {string} color 颜色
     */
    drawArrow(x, y, size = 16, expanded = false, color = null) {
        const ctx = this.ctx;
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const arrowSize = size * 0.4;
        
        ctx.save();
        ctx.strokeStyle = color || this.theme.primary;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (expanded) {
            ctx.beginPath();
            ctx.moveTo(centerX - arrowSize, centerY - arrowSize / 2);
            ctx.lineTo(centerX, centerY + arrowSize / 2);
            ctx.lineTo(centerX + arrowSize, centerY - arrowSize / 2);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.moveTo(centerX - arrowSize / 2, centerY - arrowSize);
            ctx.lineTo(centerX + arrowSize / 2, centerY);
            ctx.lineTo(centerX - arrowSize / 2, centerY + arrowSize);
            ctx.stroke();
        }
        
        ctx.restore();
    },

    /**
     * 绘制关闭按钮（×）
     * @param {number} x X坐标
     * @param {number} y Y坐标
     * @param {number} size 大小
     * @param {string} color 颜色
     * @param {boolean} hover 是否悬停
     */
    drawCloseButton(x, y, size = 18, color = null, hover = false) {
        const ctx = this.ctx;
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const crossSize = size * 0.35;
        
        ctx.save();
        
        const btnRadius = size / 2;
        ctx.fillStyle = hover ? (color || this.theme.remove) : 'transparent';
        ctx.beginPath();
        ctx.arc(centerX, centerY, btnRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = hover ? '#ffffff' : (color || this.theme.textSecondary);
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(centerX - crossSize, centerY - crossSize);
        ctx.lineTo(centerX + crossSize, centerY + crossSize);
        ctx.moveTo(centerX + crossSize, centerY - crossSize);
        ctx.lineTo(centerX - crossSize, centerY + crossSize);
        ctx.stroke();
        
        ctx.restore();
    },

    /**
     * 绘制文本（支持多行）
     * @param {string} text 文本内容
     * @param {number} x X坐标
     * @param {number} y Y坐标
     * @param {number} maxWidth 最大宽度
     * @param {Object} options 选项
     */
    drawText(text, x, y, maxWidth, options = {}) {
        const ctx = this.ctx;
        const {
            fontSize = 14,
            fontWeight = 'normal',
            color = this.theme.text,
            lineHeight = 1.5,
            textAlign = 'left',
            textBaseline = 'top',
            maxLines = 1
        } = options;
        
        ctx.save();
        ctx.font = `${fontWeight} ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = textAlign;
        ctx.textBaseline = textBaseline;
        
        const actualX = textAlign === 'center' ? x + maxWidth / 2 : x;
        
        if (maxLines === 1) {
            let displayText = text;
            if (ctx.measureText(text).width > maxWidth) {
                const ellipsis = '...';
                const ellipsisWidth = ctx.measureText(ellipsis).width;
                let chars = text.split('');
                while (chars.length > 0 && 
                       ctx.measureText(chars.join('')).width + ellipsisWidth > maxWidth) {
                    chars.pop();
                }
                displayText = chars.join('') + ellipsis;
            }
            ctx.fillText(displayText, actualX, y);
        } else {
            const words = text.split('');
            let lines = [];
            let currentLine = '';
            
            for (const char of words) {
                const testLine = currentLine + char;
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && currentLine !== '') {
                    lines.push(currentLine);
                    currentLine = char;
                } else {
                    currentLine = testLine;
                }
            }
            lines.push(currentLine);
            
            lines = lines.slice(0, maxLines);
            if (lines.length === maxLines && text.length > currentLine.length) {
                const lastLine = lines[lines.length - 1];
                const ellipsis = '...';
                let chars = lastLine.split('');
                while (chars.length > 0 && 
                       ctx.measureText(chars.join('') + ellipsis).width > maxWidth) {
                    chars.pop();
                }
                lines[lines.length - 1] = chars.join('') + ellipsis;
            }
            
            lines.forEach((line, index) => {
                ctx.fillText(line, actualX, y + index * fontSize * lineHeight);
            });
        }
        
        ctx.restore();
    },

    /**
     * 绘制占位符
     * @param {number} x X坐标
     * @param {number} y Y坐标
     * @param {number} width 宽度
     * @param {number} height 高度
     * @param {string} color 颜色
     */
    drawPlaceholder(x, y, width, height, color = null) {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.setLineDash([8, 4]);
        ctx.strokeStyle = color || this.theme.placeholder;
        ctx.lineWidth = 2;
        
        this.drawRoundRect(x, y, width, height, 8);
        ctx.stroke();
        
        ctx.restore();
    },

    /**
     * 绘制缩进指示线（树形模式用）
     * @param {number} x X坐标
     * @param {number} y Y坐标
     * @param {number} width 宽度
     * @param {number} height 高度
     * @param {number} level 层级
     */
    drawIndentLine(x, y, width, height, level) {
        if (level === 0) return;
        
        const ctx = this.ctx;
        const indentStep = 24;
        
        ctx.save();
        ctx.strokeStyle = this.theme.indentLine;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        
        for (let i = 1; i <= level; i++) {
            const lineX = x + i * indentStep;
            ctx.beginPath();
            ctx.moveTo(lineX, y);
            ctx.lineTo(lineX, y + height);
            ctx.stroke();
        }
        
        ctx.restore();
    },

    /**
     * 绘制拖拽提示线（树形嵌套提示）
     * @param {number} x X坐标
     * @param {number} y Y坐标
     * @param {number} width 宽度
     * @param {string} position 位置 ('before', 'after', 'inside')
     */
    dropIndicator(x, y, width, position = 'before') {
        const ctx = this.ctx;
        const indicatorHeight = position === 'inside' ? 2 : 3;
        const indicatorColor = this.theme.primary;
        
        ctx.save();
        ctx.fillStyle = indicatorColor;
        ctx.shadowColor = indicatorColor;
        ctx.shadowBlur = 4;
        
        if (position === 'inside') {
            ctx.fillRect(x, y, width, indicatorHeight);
            ctx.fillRect(x, y + 40 - indicatorHeight, width, indicatorHeight);
            ctx.fillRect(x, y, indicatorHeight, 40);
            ctx.fillRect(x + width - indicatorHeight, y, indicatorHeight, 40);
        } else {
            const indicatorY = position === 'before' ? y : y + 40;
            ctx.fillRect(x - 4, indicatorY - indicatorHeight / 2, width + 8, indicatorHeight);
        }
        
        ctx.restore();
    },

    /**
     * 绘制列标题背景
     * @param {number} x X坐标
     * @param {number} y Y坐标
     * @param {number} width 宽度
     * @param {number} height 高度
     * @param {string} color 颜色
     */
    drawColumnHeader(x, y, width, height, color) {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.fillStyle = color;
        
        ctx.beginPath();
        ctx.moveTo(x, y + 12);
        ctx.lineTo(x, y);
        ctx.arcTo(x, y, x + 12, y, 12);
        ctx.lineTo(x + width - 12, y);
        ctx.arcTo(x + width, y, x + width, y + 12, 12);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x, y + height);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
};

// 将渲染器暴露到全局
window.Renderer = Renderer;
