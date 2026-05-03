/**
 * 工具模块 - 提供标注工具功能
 * 包括：文字标注、矩形、圆形、箭头、马赛克
 */

const Tools = {
    /**
     * 当前激活的工具
     * @type {string}
     */
    currentTool: 'none',

    /**
     * 标注列表
     * @type {Array}
     */
    annotations: [],

    /**
     * 当前选中的标注索引
     * @type {number}
     */
    selectedIndex: -1,

    /**
     * 工具设置
     */
    settings: {
        text: {
            content: '示例文字',
            fontSize: 32,
            color: '#ff0000',
            bgColor: 'none'
        },
        shape: {
            borderColor: '#ff0000',
            borderWidth: 3,
            fillColor: 'none'
        },
        mosaic: {
            size: 30,
            blockSize: 15
        }
    },

    /**
     * 绘图状态
     */
    drawingState: {
        isDrawing: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0
    },

    /**
     * 初始化工具模块
     */
    init() {
        this.annotations = [];
        this.selectedIndex = -1;
        this.currentTool = 'none';
        console.log('[Tools] 工具模块初始化完成');
    },

    /**
     * 设置当前工具
     * @param {string} toolName - 工具名称
     */
    setTool(toolName) {
        this.currentTool = toolName;
        this.selectedIndex = -1;
        this.updateUI();
        console.log('[Tools] 设置当前工具:', toolName);
    },

    /**
     * 获取当前工具
     * @returns {string}
     */
    getTool() {
        return this.currentTool;
    },

    /**
     * 开始绘制
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    startDrawing(x, y) {
        this.drawingState.isDrawing = true;
        this.drawingState.startX = x;
        this.drawingState.startY = y;
        this.drawingState.currentX = x;
        this.drawingState.currentY = y;
    },

    /**
     * 更新绘制
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    updateDrawing(x, y) {
        if (!this.drawingState.isDrawing) return;
        this.drawingState.currentX = x;
        this.drawingState.currentY = y;
    },

    /**
     * 结束绘制
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    endDrawing(x, y) {
        if (!this.drawingState.isDrawing) return;
        
        this.drawingState.currentX = x;
        this.drawingState.currentY = y;
        
        this.createAnnotation();
        
        this.drawingState.isDrawing = false;
    },

    /**
     * 创建标注
     */
    createAnnotation() {
        const { startX, startY, currentX, currentY } = this.drawingState;
        
        if (this.currentTool === 'text') {
            const annotation = {
                type: 'text',
                id: Date.now(),
                x: Math.min(startX, currentX),
                y: Math.min(startY, currentY),
                content: this.settings.text.content,
                fontSize: this.settings.text.fontSize,
                color: this.settings.text.color,
                bgColor: this.settings.text.bgColor,
                width: Math.abs(currentX - startX) || 150,
                height: Math.abs(currentY - startY) || this.settings.text.fontSize + 10
            };
            this.annotations.push(annotation);
            console.log('[Tools] 添加文字标注:', annotation);
        } else if (this.currentTool === 'rect' || this.currentTool === 'circle' || this.currentTool === 'arrow') {
            const annotation = {
                type: this.currentTool,
                id: Date.now(),
                x: Math.min(startX, currentX),
                y: Math.min(startY, currentY),
                width: Math.abs(currentX - startX),
                height: Math.abs(currentY - startY),
                startX: startX,
                startY: startY,
                endX: currentX,
                endY: currentY,
                borderColor: this.settings.shape.borderColor,
                borderWidth: this.settings.shape.borderWidth,
                fillColor: this.settings.shape.fillColor
            };
            this.annotations.push(annotation);
            console.log(`[Tools] 添加${this.currentTool}标注:`, annotation);
        }
    },

    /**
     * 应用马赛克
     * @param {HTMLCanvasElement} sourceCanvas - 源画布
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    applyMosaic(sourceCanvas, x, y) {
        if (this.currentTool !== 'mosaic') return;
        
        const ctx = sourceCanvas.getContext('2d');
        const { size, blockSize } = this.settings.mosaic;
        
        const startX = Math.max(0, Math.floor((x - size / 2) / blockSize) * blockSize);
        const startY = Math.max(0, Math.floor((y - size / 2) / blockSize) * blockSize);
        
        const width = Math.min(size, sourceCanvas.width - startX);
        const height = Math.min(size, sourceCanvas.height - startY);
        
        for (let bx = 0; bx < width; bx += blockSize) {
            for (let by = 0; by < height; by += blockSize) {
                const blockX = startX + bx;
                const blockY = startY + by;
                
                const blockWidth = Math.min(blockSize, width - bx);
                const blockHeight = Math.min(blockSize, height - by);
                
                if (blockWidth <= 0 || blockHeight <= 0) continue;
                
                try {
                    const imageData = ctx.getImageData(blockX, blockY, blockWidth, blockHeight);
                    const data = imageData.data;
                    
                    let r = 0, g = 0, b = 0, count = 0;
                    for (let i = 0; i < data.length; i += 4) {
                        r += data[i];
                        g += data[i + 1];
                        b += data[i + 2];
                        count++;
                    }
                    
                    r = Math.round(r / count);
                    g = Math.round(g / count);
                    b = Math.round(b / count);
                    
                    ctx.fillStyle = `rgb(${r},${g},${b})`;
                    ctx.fillRect(blockX, blockY, blockWidth, blockHeight);
                } catch (e) {
                    console.error('[Tools] 马赛克应用失败:', e);
                }
            }
        }
    },

    /**
     * 绘制所有标注到画布
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    drawAnnotations(ctx) {
        this.annotations.forEach((annotation, index) => {
            const isSelected = index === this.selectedIndex;
            
            switch (annotation.type) {
                case 'text':
                    this.drawText(ctx, annotation, isSelected);
                    break;
                case 'rect':
                    this.drawRect(ctx, annotation, isSelected);
                    break;
                case 'circle':
                    this.drawCircle(ctx, annotation, isSelected);
                    break;
                case 'arrow':
                    this.drawArrow(ctx, annotation, isSelected);
                    break;
            }
        });
    },

    /**
     * 绘制文字标注
     */
    drawText(ctx, annotation, isSelected) {
        const { x, y, width, height, content, fontSize, color, bgColor } = annotation;
        
        ctx.save();
        
        if (bgColor !== 'none') {
            ctx.fillStyle = bgColor;
            ctx.fillRect(x, y, width, height);
        }
        
        ctx.font = `${fontSize}px Arial, sans-serif`;
        ctx.fillStyle = color;
        ctx.textBaseline = 'top';
        ctx.fillText(content, x + 5, y + 5);
        
        if (isSelected) {
            ctx.strokeStyle = '#1a73e8';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(x, y, width, height);
            ctx.setLineDash([]);
        }
        
        ctx.restore();
    },

    /**
     * 绘制矩形标注
     */
    drawRect(ctx, annotation, isSelected) {
        const { x, y, width, height, borderColor, borderWidth, fillColor } = annotation;
        
        ctx.save();
        
        if (fillColor !== 'none') {
            ctx.fillStyle = this.getFillColor(fillColor);
            ctx.fillRect(x, y, width, height);
        }
        
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(x, y, width, height);
        
        if (isSelected) {
            ctx.strokeStyle = '#1a73e8';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(x - 5, y - 5, width + 10, height + 10);
            ctx.setLineDash([]);
        }
        
        ctx.restore();
    },

    /**
     * 绘制圆形标注
     */
    drawCircle(ctx, annotation, isSelected) {
        const { x, y, width, height, borderColor, borderWidth, fillColor } = annotation;
        
        ctx.save();
        
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const radiusX = width / 2;
        const radiusY = height / 2;
        
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        
        if (fillColor !== 'none') {
            ctx.fillStyle = this.getFillColor(fillColor);
            ctx.fill();
        }
        
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        ctx.stroke();
        
        if (isSelected) {
            ctx.strokeStyle = '#1a73e8';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(x - 5, y - 5, width + 10, height + 10);
            ctx.setLineDash([]);
        }
        
        ctx.restore();
    },

    /**
     * 绘制箭头标注
     */
    drawArrow(ctx, annotation, isSelected) {
        const { startX, startY, endX, endY, borderColor, borderWidth } = annotation;
        
        ctx.save();
        
        const angle = Math.atan2(endY - startY, endX - startX);
        const headLength = 15 + borderWidth * 2;
        
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - headLength * Math.cos(angle - Math.PI / 6),
            endY - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            endX - headLength * Math.cos(angle + Math.PI / 6),
            endY - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = borderColor;
        ctx.fill();
        
        if (isSelected) {
            ctx.strokeStyle = '#1a73e8';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            const minX = Math.min(startX, endX) - 10;
            const minY = Math.min(startY, endY) - 10;
            const maxX = Math.max(startX, endX) + 10;
            const maxY = Math.max(startY, endY) + 10;
            ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
            ctx.setLineDash([]);
        }
        
        ctx.restore();
    },

    /**
     * 获取填充颜色
     */
    getFillColor(color) {
        const colorMap = {
            'red': 'rgba(255, 0, 0, 0.25)',
            'blue': 'rgba(0, 0, 255, 0.25)',
            'green': 'rgba(0, 255, 0, 0.25)',
            'none': 'transparent'
        };
        return colorMap[color] || 'transparent';
    },

    /**
     * 检查坐标是否在标注内
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {number} 标注索引，-1表示未选中
     */
    hitTest(x, y) {
        for (let i = this.annotations.length - 1; i >= 0; i--) {
            const annotation = this.annotations[i];
            
            if (annotation.type === 'arrow') {
                const { startX, startY, endX, endY } = annotation;
                const dist = this.pointToLineDistance(x, y, startX, startY, endX, endY);
                if (dist < 15) return i;
            } else {
                if (x >= annotation.x &&
                    x <= annotation.x + annotation.width &&
                    y >= annotation.y &&
                    y <= annotation.y + annotation.height) {
                    return i;
                }
            }
        }
        return -1;
    },

    /**
     * 计算点到线段的距离
     */
    pointToLineDistance(px, py, x1, y1, x2, y2) {
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
        
        const dx = px - xx;
        const dy = py - yy;
        
        return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * 移动选中的标注
     * @param {number} dx - X偏移量
     * @param {number} dy - Y偏移量
     */
    moveSelected(dx, dy) {
        if (this.selectedIndex < 0) return;
        
        const annotation = this.annotations[this.selectedIndex];
        annotation.x += dx;
        annotation.y += dy;
        
        if (annotation.type === 'arrow') {
            annotation.startX += dx;
            annotation.startY += dy;
            annotation.endX += dx;
            annotation.endY += dy;
        }
    },

    /**
     * 删除选中的标注
     */
    deleteSelected() {
        if (this.selectedIndex < 0) return;
        
        this.annotations.splice(this.selectedIndex, 1);
        this.selectedIndex = -1;
        console.log('[Tools] 删除选中的标注');
    },

    /**
     * 清除所有标注
     */
    clearAnnotations() {
        this.annotations = [];
        this.selectedIndex = -1;
        console.log('[Tools] 清除所有标注');
    },

    /**
     * 更新工具设置
     * @param {string} toolType - 工具类型
     * @param {Object} settings - 设置对象
     */
    updateSettings(toolType, settings) {
        if (this.settings[toolType]) {
            this.settings[toolType] = { ...this.settings[toolType], ...settings };
            console.log(`[Tools] 更新${toolType}设置:`, this.settings[toolType]);
        }
    },

    /**
     * 获取所有标注
     * @returns {Array}
     */
    getAnnotations() {
        return [...this.annotations];
    },

    /**
     * 恢复标注
     * @param {Array} annotations
     */
    restoreAnnotations(annotations) {
        if (annotations && Array.isArray(annotations)) {
            this.annotations = [...annotations];
            console.log('[Tools] 恢复标注:', this.annotations.length, '个');
        }
    },

    /**
     * 更新UI
     */
    updateUI() {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            const tool = btn.dataset.tool;
            btn.classList.toggle('active', tool === this.currentTool);
        });

        const textSettings = document.getElementById('textSettings');
        const shapeSettings = document.getElementById('shapeSettings');
        const mosaicSettings = document.getElementById('mosaicSettings');

        if (textSettings) textSettings.classList.toggle('hidden', this.currentTool !== 'text');
        if (shapeSettings) shapeSettings.classList.toggle('hidden', !['rect', 'circle', 'arrow'].includes(this.currentTool));
        if (mosaicSettings) mosaicSettings.classList.toggle('hidden', this.currentTool !== 'mosaic');
    }
};

Tools.init();
