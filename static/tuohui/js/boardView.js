/**
 * 看板视图模块
 * 实现多列分组、跨列拖拽功能
 */

const BoardView = {
    // 列数据
    columns: [],
    
    // 布局配置
    padding: 20,
    columnGap: 20,
    columnWidth: 320,
    columnHeaderHeight: 56,
    itemHeight: 80,
    itemGap: 12,
    handleWidth: 40,
    
    // 悬停状态
    hoverColumnId: null,
    hoverItemId: null,
    deleteHoverItemId: null,
    
    // 拖拽开始时的原始位置
    dragOriginalIndex: -1,
    dragOriginalColumnId: null,

    /**
     * 初始化看板视图
     */
    init() {
        this.columns = [];
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
        const data = DataModel.boardData;
        const totalColumns = data.length;
        const totalWidth = totalColumns * this.columnWidth + (totalColumns - 1) * this.columnGap;
        const startX = Math.max(this.padding, (Renderer.width - totalWidth) / 2);
        
        this.columns = data.map((column, colIndex) => {
            const columnX = startX + colIndex * (this.columnWidth + this.columnGap);
            
            const items = column.items.map((item, itemIndex) => ({
                id: item.id,
                title: item.title,
                description: item.description || '',
                index: itemIndex,
                columnId: column.id,
                x: columnX + 16,
                y: this.padding + this.columnHeaderHeight + itemIndex * (this.itemHeight + this.itemGap),
                width: this.columnWidth - 32,
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
            
            return {
                id: column.id,
                title: column.title,
                color: column.color,
                index: colIndex,
                x: columnX,
                y: this.padding,
                width: this.columnWidth,
                height: this.columnHeaderHeight + items.length * (this.itemHeight + this.itemGap) + this.itemGap,
                items: items
            };
        });
        
        this.updateDragTargets();
    },

    /**
     * 更新拖拽目标
     */
    updateDragTargets() {
        DragManager.clearTargetElements();
        this.columns.forEach(column => {
            column.items.forEach(item => {
                DragManager.addTargetElement(item);
            });
        });
    },

    /**
     * 拖拽开始处理
     */
    onDragStart(item, x, y) {
        this.dragOriginalIndex = item.index;
        this.dragOriginalColumnId = item.columnId;
        
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
        
        const column = this.columns.find(c => c.id === item.columnId);
        if (column) {
            const targetY = this.padding + this.columnHeaderHeight + item.index * (this.itemHeight + this.itemGap);
            
            Animation.dragEnd(
                item,
                { x: column.x + 16, y: targetY },
                () => Renderer.requestRender(),
                () => {
                    this.updateFromData();
                    Renderer.requestRender();
                }
            );
        }
    },

    /**
     * 放置处理
     */
    onDrop(item, target, index, position) {
        if (!item || this.dragOriginalColumnId === null) return;
        
        const fromColumnId = this.dragOriginalColumnId;
        const fromIndex = this.dragOriginalIndex;
        
        const dataFromColumn = DataModel.boardData.find(c => c.id === fromColumnId);
        if (!dataFromColumn) return;
        
        let toColumnId = null;
        let toIndex = 0;
        
        if (target) {
            toColumnId = target.columnId;
            
            const dataToColumn = DataModel.boardData.find(c => c.id === toColumnId);
            if (!dataToColumn) return;
            
            const targetIndexInData = dataToColumn.items.findIndex(i => i.id === target.id);
            
            if (targetIndexInData === -1) return;
            
            toIndex = targetIndexInData;
            if (position === 'after') {
                if (fromColumnId === toColumnId && fromIndex < targetIndexInData) {
                    toIndex = targetIndexInData;
                } else {
                    toIndex = targetIndexInData + 1;
                }
            }
        } else {
            const toColumn = this.findColumnAtPosition(item.x);
            if (!toColumn) return;
            
            toColumnId = toColumn.id;
            const dataToColumn = DataModel.boardData.find(c => c.id === toColumnId);
            if (!dataToColumn) return;
            
            toIndex = dataToColumn.items.length;
        }
        
        if (fromColumnId === toColumnId) {
            if (fromIndex !== toIndex) {
                let actualToIndex = toIndex;
                if (fromIndex < toIndex) {
                    actualToIndex = toIndex - 1;
                }
                
                if (actualToIndex !== fromIndex) {
                    DataModel.moveBoardItemInColumn(fromColumnId, fromIndex, actualToIndex);
                    this.updateFromData();
                }
            }
        } else {
            DataModel.moveBoardItemBetweenColumns(fromColumnId, fromIndex, toColumnId, toIndex);
            this.updateFromData();
        }
        
        this.dragOriginalIndex = -1;
        this.dragOriginalColumnId = null;
    },

    /**
     * 根据X坐标找到列
     */
    findColumnAtPosition(x) {
        for (const column of this.columns) {
            if (x >= column.x && x <= column.x + column.width) {
                return column;
            }
        }
        return null;
    },

    /**
     * 重新排列项目（视觉上）
     */
    reorderItems(draggingItem) {
        const dropInfo = DragManager.getDropTarget();
        const target = dropInfo.target;
        
        const targetColumn = this.findColumnAtPosition(draggingItem.x + draggingItem.width / 2);
        
        if (!targetColumn) return;
        
        const fromColumn = this.columns.find(c => c.id === draggingItem.columnId);
        if (!fromColumn) return;
        
        if (fromColumn.id !== targetColumn.id) {
            this.moveItemBetweenColumns(draggingItem, fromColumn, targetColumn, dropInfo);
        } else {
            this.moveItemWithinColumn(draggingItem, fromColumn, dropInfo);
        }
    },

    /**
     * 在列内移动项目
     */
    moveItemWithinColumn(draggingItem, column, dropInfo) {
        const target = dropInfo.target;
        
        if (!target || target.id === draggingItem.id) return;
        
        let toIndex = target.index;
        if (dropInfo.position === 'after') {
            toIndex = target.index + (draggingItem.index < target.index ? 0 : 1);
        }
        
        const actualToIndex = draggingItem.index < toIndex ? toIndex - 1 : toIndex;
        
        if (actualToIndex !== draggingItem.index) {
            const tempIndex = draggingItem.index;
            column.items.splice(tempIndex, 1);
            column.items.splice(actualToIndex, 0, draggingItem);
            
            this.animateItems(column);
            this.updateDragTargets();
        }
    },

    /**
     * 在列之间移动项目
     */
    moveItemBetweenColumns(draggingItem, fromColumn, toColumn, dropInfo) {
        const target = dropInfo.target;
        
        if (fromColumn.id === toColumn.id) return;
        
        fromColumn.items.splice(draggingItem.index, 1);
        draggingItem.columnId = toColumn.id;
        
        let toIndex = 0;
        if (target) {
            toIndex = target.index;
            if (dropInfo.position === 'after') {
                toIndex = target.index + 1;
            }
        } else {
            toIndex = toColumn.items.length;
        }
        
        toColumn.items.splice(toIndex, 0, draggingItem);
        
        this.animateItems(fromColumn);
        this.animateItems(toColumn);
        
        this.updateColumnHeights();
        this.updateDragTargets();
    },

    /**
     * 动画化列内项目位置
     */
    animateItems(column) {
        column.items.forEach((item, i) => {
            if (item.isDragging) {
                item.index = i;
            } else {
                const targetY = this.padding + this.columnHeaderHeight + i * (this.itemHeight + this.itemGap);
                Animation.smoothMove(item, { x: column.x + 16, y: targetY }, () => {
                    Renderer.requestRender();
                });
                item.index = i;
            }
        });
    },

    /**
     * 更新列高度
     */
    updateColumnHeights() {
        this.columns.forEach(column => {
            column.height = this.columnHeaderHeight + column.items.length * (this.itemHeight + this.itemGap) + this.itemGap;
        });
    },

    /**
     * 渲染看板视图
     */
    render() {
        const ctx = Renderer.ctx;
        const theme = Renderer.theme;
        
        if (this.columns.length === 0) {
            this.renderEmptyState();
            return;
        }
        
        const dropInfo = DragManager.getDropTarget();
        let draggedItem = null;
        
        for (const column of this.columns) {
            this.renderColumn(column, dropInfo);
            
            for (const item of column.items) {
                if (item.isDragging) {
                    draggedItem = item;
                    continue;
                }
                this.renderItem(item, column, dropInfo);
            }
        }
        
        if (draggedItem) {
            const column = this.columns.find(c => c.id === draggedItem.columnId);
            this.renderItem(draggedItem, column, dropInfo, true);
        }
    },

    /**
     * 渲染列
     */
    renderColumn(column, dropInfo) {
        const ctx = Renderer.ctx;
        const theme = Renderer.theme;
        
        ctx.save();
        
        Renderer.drawColumnHeader(
            column.x, column.y,
            column.width, this.columnHeaderHeight,
            column.color
        );
        
        const textX = column.x + 16;
        const textY = column.y + (this.columnHeaderHeight - 18) / 2;
        
        Renderer.drawText(
            column.title,
            textX, textY, column.width - 32,
            {
                fontSize: 16,
                fontWeight: '600',
                color: '#ffffff'
            }
        );
        
        const countX = column.x + column.width - 40;
        const countY = column.y + (this.columnHeaderHeight - 24) / 2;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(countX + 12, countY + 12, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 13px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(column.items.length.toString(), countX + 12, countY + 12);
        
        ctx.restore();
    },

    /**
     * 渲染项目
     */
    renderItem(item, column, dropInfo, isOnTop = false) {
        const ctx = Renderer.ctx;
        const theme = Renderer.theme;
        
        ctx.save();
        
        const centerX = item.x + item.width / 2;
        const centerY = item.y + item.height / 2;
        
        ctx.translate(centerX, centerY);
        ctx.scale(item.scale, item.scale);
        ctx.globalAlpha = item.opacity;
        ctx.translate(-centerX, -centerY);
        
        let bgColor = '#ffffff';
        let borderColor = theme.itemBorder;
        
        if (this.hoverItemId === item.id && !item.isDragging) {
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
        
        const textX = item.x + this.handleWidth + 4;
        const textY = item.y + 12;
        const textWidth = item.width - this.handleWidth - 24;
        
        Renderer.drawText(
            item.title,
            textX, textY, textWidth,
            {
                fontSize: 14,
                fontWeight: item.isDragging ? '600' : '500',
                color: theme.text
            }
        );
        
        if (item.description) {
            Renderer.drawText(
                item.description,
                textX, textY + 22, textWidth,
                {
                    fontSize: 12,
                    color: theme.textSecondary,
                    maxLines: 2
                }
            );
        }
        
        const deleteX = item.x + item.width - 24;
        const deleteY = item.y + 8;
        const isDeleteHover = this.deleteHoverItemId === item.id;
        Renderer.drawCloseButton(deleteX, deleteY, 16, null, isDeleteHover);
        
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
        
        ctx.fillText('暂无看板列，请添加新的列', centerX, centerY);
        ctx.restore();
    },

    /**
     * 处理鼠标移动
     */
    handleMouseMove(x, y) {
        let newHoverItemId = null;
        let newDeleteHoverItemId = null;
        
        for (const column of this.columns) {
            for (const item of column.items) {
                const rect = {
                    x: item.x,
                    y: item.y,
                    width: item.width,
                    height: item.height
                };
                
                if (Utils.pointInRect(x, y, rect)) {
                    newHoverItemId = item.id;
                    
                    const deleteX = item.x + item.width - 24;
                    const deleteY = item.y + 8;
                    const deleteRect = { x: deleteX, y: deleteY, width: 16, height: 16 };
                    
                    if (Utils.pointInRect(x, y, deleteRect)) {
                        newDeleteHoverItemId = item.id;
                        Renderer.canvas.style.cursor = 'pointer';
                    } else {
                        Renderer.canvas.style.cursor = 'grab';
                    }
                    break;
                }
            }
            
            if (newHoverItemId) break;
        }
        
        if (!newHoverItemId) {
            Renderer.canvas.style.cursor = 'default';
        }
        
        if (newHoverItemId !== this.hoverItemId || newDeleteHoverItemId !== this.deleteHoverItemId) {
            this.hoverItemId = newHoverItemId;
            this.deleteHoverItemId = newDeleteHoverItemId;
            Renderer.requestRender();
        }
    },

    /**
     * 处理点击事件
     */
    handleClick(x, y) {
        for (const column of this.columns) {
            for (const item of column.items) {
                const rect = {
                    x: item.x,
                    y: item.y,
                    width: item.width,
                    height: item.height
                };
                
                if (Utils.pointInRect(x, y, rect)) {
                    const deleteX = item.x + item.width - 24;
                    const deleteY = item.y + 8;
                    const deleteRect = { x: deleteX, y: deleteY, width: 16, height: 16 };
                    
                    if (Utils.pointInRect(x, y, deleteRect)) {
                        this.deleteItem(column.id, item.id);
                        return true;
                    }
                    
                    return true;
                }
            }
        }
        return false;
    },

    /**
     * 处理双击事件
     */
    handleDoubleClick(x, y) {
        for (const column of this.columns) {
            for (const item of column.items) {
                const rect = {
                    x: item.x,
                    y: item.y,
                    width: item.width,
                    height: item.height
                };
                
                if (Utils.pointInRect(x, y, rect)) {
                    ItemEditor.edit(item.id, item.title, 'board', column.id);
                    return true;
                }
            }
        }
        return false;
    },

    /**
     * 添加新项目
     */
    addItem() {
        if (this.columns.length === 0) {
            Utils.showToast('请先添加看板列', 'error');
            return;
        }
        
        const firstColumn = this.columns[0];
        const newItem = DataModel.addBoardItem(firstColumn.id, '新任务', '');
        this.updateFromData();
        
        Utils.showToast('任务已添加', 'success');
        Renderer.requestRender();
    },

    /**
     * 删除项目
     */
    deleteItem(columnId, itemId) {
        DataModel.removeBoardItem(columnId, itemId);
        this.updateFromData();
        Utils.showToast('任务已删除', 'info');
        Renderer.requestRender();
    },

    /**
     * 更新项目
     */
    updateItem(id, newTitle, columnId) {
        for (const column of this.columns) {
            for (const item of column.items) {
                if (item.id === id) {
                    item.title = newTitle;
                    DataModel.updateBoardItem(column.id, id, { title: newTitle });
                    
                    Animation.highlight(item, Renderer.theme.highlight, () => {
                        Renderer.requestRender();
                    });
                    
                    Renderer.requestRender();
                    Utils.showToast('任务已更新', 'success');
                    return;
                }
            }
        }
    }
};

// 将看板视图暴露到全局
window.BoardView = BoardView;
