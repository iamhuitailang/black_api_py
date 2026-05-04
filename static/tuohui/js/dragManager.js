/**
 * 拖拽管理模块
 * 负责处理拖拽交互逻辑
 */

const DragManager = {
    // 当前状态
    isDragging: false,
    dragItem: null,
    dragStartX: 0,
    dragStartY: 0,
    dragOffsetX: 0,
    dragOffsetY: 0,
    
    // 长按检测
    longPressTimer: null,
    isLongPress: false,
    longPressThreshold: 300,
    
    // 目标信息
    dropTarget: null,
    dropIndex: -1,
    dropPosition: null, // 'before', 'after', 'inside'
    
    // 拖拽开始时的原始位置
    originalIndex: -1,
    originalParentId: null,
    
    // 事件回调
    onDragStart: null,
    onDragMove: null,
    onDragEnd: null,
    onDrop: null,
    
    // 目标元素信息缓存
    targetElements: [],
    
    // 鼠标/触摸位置
    currentX: 0,
    currentY: 0,

    /**
     * 初始化拖拽管理器
     */
    init() {
        this.isDragging = false;
        this.dragItem = null;
        this.targetElements = [];
        this.setupEventListeners();
    },

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        const canvas = Renderer.canvas;
        
        canvas.addEventListener('mousedown', (e) => this.handlePointerDown(e));
        canvas.addEventListener('mousemove', (e) => this.handlePointerMove(e));
        canvas.addEventListener('mouseup', (e) => this.handlePointerUp(e));
        canvas.addEventListener('mouseleave', (e) => this.handlePointerLeave(e));
        
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handlePointerDown({ clientX: touch.clientX, clientY: touch.clientY, isTouch: true });
        }, { passive: false });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handlePointerMove({ clientX: touch.clientX, clientY: touch.clientY, isTouch: true });
        }, { passive: false });
        
        canvas.addEventListener('touchend', (e) => {
            const touch = e.changedTouches[0];
            this.handlePointerUp({ clientX: touch.clientX, clientY: touch.clientY, isTouch: true });
        });
        
        canvas.addEventListener('touchcancel', (e) => {
            this.handlePointerLeave(e);
        });
    },

    /**
     * 处理指针按下事件
     */
    handlePointerDown(e) {
        const rect = Renderer.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.currentX = x;
        this.currentY = y;
        
        const clickedElement = this.findElementAtPoint(x, y);
        
        if (clickedElement && this.isDragableElement(clickedElement)) {
            this.dragItem = clickedElement;
            this.dragStartX = x;
            this.dragStartY = y;
            this.dragOffsetX = x - clickedElement.x;
            this.dragOffsetY = y - clickedElement.y;
            
            this.originalIndex = clickedElement.index;
            this.originalParentId = clickedElement.parentId || null;
            
            this.longPressTimer = setTimeout(() => {
                this.isLongPress = true;
                this.startDrag(x, y);
            }, this.longPressThreshold);
        }
    },

    /**
     * 处理指针移动事件
     */
    handlePointerMove(e) {
        const rect = Renderer.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.currentX = x;
        this.currentY = y;
        
        if (this.longPressTimer && !this.isDragging) {
            const distance = Math.sqrt(
                Math.pow(x - this.dragStartX, 2) + 
                Math.pow(y - this.dragStartY, 2)
            );
            
            if (distance > 5) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
                this.startDrag(x, y);
            }
        }
        
        if (this.isDragging && this.dragItem) {
            this.dragItem.x = x - this.dragOffsetX;
            this.dragItem.y = y - this.dragOffsetY;
            
            this.updateDropTarget(x, y);
            
            if (typeof this.onDragMove === 'function') {
                this.onDragMove(this.dragItem, x, y);
            }
        }
    },

    /**
     * 处理指针抬起事件
     */
    handlePointerUp(e) {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        if (this.isDragging && this.dragItem) {
            this.endDrag();
        }
        
        this.isLongPress = false;
    },

    /**
     * 处理指针离开事件
     */
    handlePointerLeave(e) {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        if (this.isDragging && this.dragItem) {
            this.cancelDrag();
        }
        
        this.isLongPress = false;
    },

    /**
     * 开始拖拽
     */
    startDrag(x, y) {
        if (this.isDragging || !this.dragItem) return;
        
        this.isDragging = true;
        this.dragItem.isDragging = true;
        this.dragItem.originalX = this.dragItem.x;
        this.dragItem.originalY = this.dragItem.y;
        
        if (typeof this.onDragStart === 'function') {
            this.onDragStart(this.dragItem, x, y);
        }
        
        Renderer.canvas.style.cursor = 'grabbing';
    },

    /**
     * 结束拖拽
     */
    endDrag() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        if (this.dropTarget && this.dropIndex >= 0) {
            if (typeof this.onDrop === 'function') {
                this.onDrop(
                    this.dragItem, 
                    this.dropTarget, 
                    this.dropIndex, 
                    this.dropPosition
                );
            }
        }
        
        if (this.dragItem) {
            this.dragItem.isDragging = false;
        }
        
        if (typeof this.onDragEnd === 'function') {
            this.onDragEnd(this.dragItem, this.dropTarget);
        }
        
        this.dropTarget = null;
        this.dropIndex = -1;
        this.dropPosition = null;
        
        Renderer.canvas.style.cursor = 'default';
    },

    /**
     * 取消拖拽
     */
    cancelDrag() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        if (this.dragItem) {
            this.dragItem.isDragging = false;
            this.dragItem.x = this.dragItem.originalX;
            this.dragItem.y = this.dragItem.originalY;
        }
        
        this.dropTarget = null;
        this.dropIndex = -1;
        this.dropPosition = null;
        
        Renderer.canvas.style.cursor = 'default';
    },

    /**
     * 更新放置目标
     */
    updateDropTarget(x, y) {
        let nearestTarget = null;
        let nearestDistance = Infinity;
        let nearestIndex = -1;
        let nearestPosition = null;
        
        for (const element of this.targetElements) {
            if (element.isDragging) continue;
            
            const rect = element.getBounds ? element.getBounds() : {
                x: element.x,
                y: element.y,
                width: element.width,
                height: element.height
            };
            
            if (Utils.pointInRect(x, y, rect)) {
                const centerX = rect.x + rect.width / 2;
                const centerY = rect.y + rect.height / 2;
                const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                
                const position = this.determineDropPosition(x, y, rect, element);
                
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestTarget = element;
                    nearestIndex = element.index;
                    nearestPosition = position;
                }
            }
        }
        
        const hasChanged = (
            nearestTarget !== this.dropTarget ||
            nearestIndex !== this.dropIndex ||
            nearestPosition !== this.dropPosition
        );
        
        if (hasChanged) {
            this.dropTarget = nearestTarget;
            this.dropIndex = nearestIndex;
            this.dropPosition = nearestPosition;
            
            if (nearestTarget && typeof this.onDragMove === 'function') {
                this.onDragMove(this.dragItem, x, y);
            }
        }
    },

    /**
     * 确定放置位置
     */
    determineDropPosition(x, y, rect, element) {
        const relativeY = (y - rect.y) / rect.height;
        const relativeX = (x - rect.x) / rect.width;
        
        if (element.supportsNesting && relativeX > 0.7) {
            return 'inside';
        }
        
        if (relativeY < 0.4) {
            return 'before';
        } else if (relativeY > 0.6) {
            return 'after';
        }
        
        return 'after';
    },

    /**
     * 查找指定位置的元素
     */
    findElementAtPoint(x, y) {
        for (let i = this.targetElements.length - 1; i >= 0; i--) {
            const element = this.targetElements[i];
            const rect = element.getBounds ? element.getBounds() : {
                x: element.x,
                y: element.y,
                width: element.width,
                height: element.height
            };
            
            if (Utils.pointInRect(x, y, rect)) {
                return element;
            }
        }
        return null;
    },

    /**
     * 检查元素是否可拖拽
     */
    isDragableElement(element) {
        return element && (element.draggable !== false);
    },

    /**
     * 设置目标元素列表
     */
    setTargetElements(elements) {
        this.targetElements = elements;
    },

    /**
     * 添加目标元素
     */
    addTargetElement(element) {
        this.targetElements.push(element);
    },

    /**
     * 清除目标元素
     */
    clearTargetElements() {
        this.targetElements = [];
    },

    /**
     * 获取当前鼠标/触摸位置
     */
    getCurrentPosition() {
        return { x: this.currentX, y: this.currentY };
    },

    /**
     * 获取拖拽项
     */
    getDragItem() {
        return this.dragItem;
    },

    /**
     * 获取放置目标
     */
    getDropTarget() {
        return {
            target: this.dropTarget,
            index: this.dropIndex,
            position: this.dropPosition
        };
    },

    /**
     * 检查是否正在拖拽
     */
    isCurrentlyDragging() {
        return this.isDragging;
    }
};

// 将拖拽管理器暴露到全局
window.DragManager = DragManager;
