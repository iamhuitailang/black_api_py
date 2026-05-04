/**
 * 列表视图模块
 * 实现简单的列表拖拽排序功能
 */

const ListView = {
    // 视图元素
    items: [],
    
    // 布局配置
    padding: 20,
    itemHeight: 56,
    itemGap: 12,
    handleWidth: 44,
    
    // 当前编辑的项目
    editingItemId: null,
    
    // 悬停的项目
    hoverItemId: null,
    
    // 点击删除按钮的项目
    deleteHoverItemId: null,
    
    // 拖拽开始时的原始位置
    dragOriginalIndex: -1,

    /**
     * 初始化列表视图
     */
    init() {
        this.items = [];
        this.setupCallbacks();
    },

    /**
     * 设置拖拽回调
     */
    setupCallbacks() {
        DragManager.onDragStart = (item, x, y) => this.onDragStart(item, x, y);
        DragManager.onDragMove = (item, x, y) => this.onDragMove(item, x, y);
        DragManager.onDragEnd = (item, target) => this.onDragEnd(item, target);
        DragManager.onDrop = (item, target, index, position) => this.onDrop(item, target, index, position);
    },

    /**
     * 从数据模型更新视图
     */
    updateFromData() {
        const data = DataModel.listData;
        this.items = data.map((item, index) => ({
            id: item.id,
            title: item.title,
            index: index,
            x: this.padding,
            y: this.padding + index * (this.itemHeight + this.itemGap),
            width: Renderer.width - this.padding * 2,
            height: this.itemHeight,
            scale: 1,
            opacity: 1,
            shadowBlur: 0,
            shadowOffsetY: 0,
            isDragging: false,
            draggable: true,
            originalX: 0,
            originalY: 0
        }));
        
        this.updateDragTargets();
    },

    /**
     * 更新拖拽目标
     */
    updateDragTargets() {
        DragManager.clearTargetElements();
        this.items.forEach(item => {
            DragManager.addTargetElement(item);
        });
    },

    /**
     * 拖拽开始处理
     */
    onDragStart(item, x, y) {
        this.dragOriginalIndex = item.index;
        
        Animation.dragStart(item, () => {
            Renderer.requestRender();
        });
    },

    /**
     * 拖拽移动处理
     */
    onDragMove(item, x, y) {
        this.reorderItems(item);
        Renderer.requestRender();
    },

    /**
     * 拖拽结束处理
     */
    onDragEnd(item, target) {
        if (!item) return;
        
        const targetY = this.padding + item.index * (this.itemHeight + this.itemGap);
        
        Animation.dragEnd(
            item,
            { x: this.padding, y: targetY },
            () => Renderer.requestRender(),
            () => {
                this.updateFromData();
                Renderer.requestRender();
            }
        );
    },

    /**
     * 放置处理
     */
    onDrop(item, target, index, position) {
        if (!target || !item || this.dragOriginalIndex === -1) return;
        
        const fromIndex = this.dragOriginalIndex;
        
        const targetIndexInData = DataModel.listData.findIndex(i => i.id === target.id);
        if (targetIndexInData === -1) return;
        
        let toIndex = targetIndexInData;
        
        if (position === 'after') {
            if (fromIndex < targetIndexInData) {
                toIndex = targetIndexInData;
            } else {
                toIndex = targetIndexInData + 1;
            }
        }
        
        if (fromIndex !== toIndex && toIndex >= 0) {
            let actualToIndex = toIndex;
            if (fromIndex < toIndex) {
                actualToIndex = toIndex - 1;
            }
            
            if (actualToIndex !== fromIndex) {
                DataModel.moveListItem(fromIndex, actualToIndex);
                this.updateFromData();
            }
        }
        
        this.dragOriginalIndex = -1;
    },

    /**
     * 重新排列项目（视觉上）
     */
    reorderItems(draggingItem) {
        const dropInfo = DragManager.getDropTarget();
        const target = dropInfo.target;
        
        if (!target || target.id === draggingItem.id) return;
        
        const currentVisualIndex = this.getVisualIndex(draggingItem.y);
        const fromIndex = draggingItem.index;
        
        let toIndex = target.index;
        if (dropInfo.position === 'after') {
            toIndex = target.index + (fromIndex < target.index ? 0 : 1);
        }
        
        if (currentVisualIndex !== toIndex && toIndex >= 0 && toIndex < this.items.length) {
            const actualToIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
            
            if (actualToIndex !== fromIndex) {
                const tempIndex = draggingItem.index;
                this.items.splice(tempIndex, 1);
                this.items.splice(actualToIndex, 0, draggingItem);
                
                this.items.forEach((item, i) => {
                    if (item.isDragging) {
                        item.index = i;
                    } else {
                        const targetY = this.padding + i * (this.itemHeight + this.itemGap);
                        Animation.smoothMove(item, { x: this.padding, y: targetY }, () => {
                            Renderer.requestRender();
                        });
                        item.index = i;
                    }
                });
                
                this.updateDragTargets();
            }
        }
    },

    /**
     * 根据Y坐标获取视觉索引
     */
    getVisualIndex(y) {
        const relativeY = y - this.padding;
        const index = Math.floor(relativeY / (this.itemHeight + this.itemGap));
        return Utils.clamp(index, 0, this.items.length - 1);
    },

    /**
     * 渲染列表视图
     */
    render() {
        const ctx = Renderer.ctx;
        const theme = Renderer.theme;
        
        if (this.items.length === 0) {
            this.renderEmptyState();
            return;
        }
        
        const dropInfo = DragManager.getDropTarget();
        let draggedItem = null;
        
        for (const item of this.items) {
            if (item.isDragging) {
                draggedItem = item;
                continue;
            }
            this.renderItem(item, dropInfo);
        }
        
        if (draggedItem) {
            this.renderItem(draggedItem, dropInfo, true);
        }
    },

    /**
     * 渲染单个项目
     */
    renderItem(item, dropInfo, isOnTop = false) {
        const ctx = Renderer.ctx;
        const theme = Renderer.theme;
        
        ctx.save();
        
        const centerX = item.x + item.width / 2;
        const centerY = item.y + item.height / 2;
        
        ctx.translate(centerX, centerY);
        ctx.scale(item.scale, item.scale);
        ctx.globalAlpha = item.opacity;
        ctx.translate(-centerX, -centerY);
        
        let bgColor = theme.itemBackground;
        let borderColor = null;
        
        if (this.hoverItemId === item.id && !item.isDragging) {
            bgColor = theme.itemHover;
            borderColor = theme.primaryLight;
        }
        
        if (item.highlightIntensity > 0) {
            const r = parseInt(theme.highlight.slice(1, 3), 16);
            const g = parseInt(theme.highlight.slice(3, 5), 16);
            const b = parseInt(theme.highlight.slice(5, 7), 16);
            bgColor = `rgba(${r}, ${g}, ${b}, ${item.highlightIntensity * 0.5})`;
        }
        
        Renderer.drawCard(
            item.x, item.y, item.width, item.height, 12,
            bgColor, borderColor,
            item.shadowBlur, item.shadowOffsetY
        );
        
        const handleX = item.x + 8;
        const handleY = item.y + (item.height - 20) / 2;
        const handleColor = this.hoverItemId === item.id ? theme.handleHover : theme.handle;
        Renderer.drawHandle(handleX, handleY, 20, handleColor);
        
        const textX = item.x + this.handleWidth + 8;
        const textY = item.y + (item.height - 16) / 2;
        const textWidth = item.width - this.handleWidth - 44;
        
        Renderer.drawText(
            item.title,
            textX, textY, textWidth,
            {
                fontSize: 15,
                fontWeight: item.isDragging ? '600' : '500',
                color: theme.text
            }
        );
        
        const deleteX = item.x + item.width - 26;
        const deleteY = item.y + (item.height - 18) / 2;
        const isDeleteHover = this.deleteHoverItemId === item.id;
        Renderer.drawCloseButton(deleteX, deleteY, 18, null, isDeleteHover);
        
        if (dropInfo && dropInfo.target && dropInfo.target.id === item.id && !item.isDragging) {
            const indicatorY = dropInfo.position === 'before' ? item.y : item.y + item.height;
            ctx.fillStyle = theme.primary;
            ctx.shadowColor = theme.primary;
            ctx.shadowBlur = 4;
            ctx.fillRect(item.x - 4, indicatorY - 2, item.width + 8, 4);
        }
        
        ctx.restore();
    },

    /**
     * 渲染空状态
     */
    renderEmptyState() {
        const ctx = Renderer.ctx;
        const theme = Renderer.theme;
        
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = theme.textSecondary;
        ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const centerX = Renderer.width / 2;
        const centerY = Renderer.height / 2;
        
        ctx.fillText('暂无项目，点击"添加项目"按钮创建', centerX, centerY);
        ctx.restore();
    },

    /**
     * 处理点击事件
     */
    handleClick(x, y) {
        for (const item of this.items) {
            const rect = {
                x: item.x,
                y: item.y,
                width: item.width,
                height: item.height
            };
            
            if (Utils.pointInRect(x, y, rect)) {
                const deleteX = item.x + item.width - 26;
                const deleteY = item.y + (item.height - 18) / 2;
                const deleteRect = { x: deleteX, y: deleteY, width: 18, height: 18 };
                
                if (Utils.pointInRect(x, y, deleteRect)) {
                    this.deleteItem(item.id);
                    return true;
                }
                
                return true;
            }
        }
        return false;
    },

    /**
     * 处理双击事件
     */
    handleDoubleClick(x, y) {
        for (const item of this.items) {
            const rect = {
                x: item.x,
                y: item.y,
                width: item.width,
                height: item.height
            };
            
            if (Utils.pointInRect(x, y, rect)) {
                ItemEditor.edit(item.id, item.title, 'list');
                return true;
            }
        }
        return false;
    },

    /**
     * 处理鼠标移动
     */
    handleMouseMove(x, y) {
        let newHoverId = null;
        let newDeleteHoverId = null;
        
        for (const item of this.items) {
            const rect = {
                x: item.x,
                y: item.y,
                width: item.width,
                height: item.height
            };
            
            if (Utils.pointInRect(x, y, rect)) {
                newHoverId = item.id;
                
                const deleteX = item.x + item.width - 26;
                const deleteY = item.y + (item.height - 18) / 2;
                const deleteRect = { x: deleteX, y: deleteY, width: 18, height: 18 };
                
                if (Utils.pointInRect(x, y, deleteRect)) {
                    newDeleteHoverId = item.id;
                    Renderer.canvas.style.cursor = 'pointer';
                } else {
                    Renderer.canvas.style.cursor = 'grab';
                }
                break;
            }
        }
        
        if (!newHoverId) {
            Renderer.canvas.style.cursor = 'default';
        }
        
        if (newHoverId !== this.hoverItemId || newDeleteHoverId !== this.deleteHoverItemId) {
            this.hoverItemId = newHoverId;
            this.deleteHoverItemId = newDeleteHoverId;
            Renderer.requestRender();
        }
    },

    /**
     * 添加新项目
     */
    addItem() {
        const newItem = DataModel.addListItem('新项目');
        this.updateFromData();
        
        const item = this.items.find(i => i.id === newItem.id);
        if (item) {
            item.scale = 0.5;
            item.opacity = 0;
            Animation.addItem(item, () => Renderer.requestRender());
        }
        
        Renderer.requestRender();
        Utils.showToast('项目已添加', 'success');
    },

    /**
     * 删除项目
     */
    deleteItem(id) {
        const item = this.items.find(i => i.id === id);
        if (item) {
            Animation.removeItem(
                item,
                () => Renderer.requestRender(),
                () => {
                    DataModel.removeListItem(id);
                    this.updateFromData();
                    Renderer.requestRender();
                    Utils.showToast('项目已删除', 'info');
                }
            );
        }
    },

    /**
     * 更新项目
     */
    updateItem(id, newTitle) {
        const item = this.items.find(i => i.id === id);
        if (item) {
            item.title = newTitle;
            DataModel.updateListItem(id, { title: newTitle });
            
            Animation.highlight(item, Renderer.theme.highlight, () => {
                Renderer.requestRender();
            });
            
            Renderer.requestRender();
            Utils.showToast('项目已更新', 'success');
        }
    }
};

// 将列表视图暴露到全局
window.ListView = ListView;
