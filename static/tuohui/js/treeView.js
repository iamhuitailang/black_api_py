/**
 * 树形视图模块
 * 实现嵌套排序、折叠展开功能
 */

const TreeView = {
    // 节点列表（扁平化后的）
    nodes: [],
    
    // 布局配置
    padding: 20,
    nodeHeight: 48,
    nodeGap: 8,
    indentStep: 28,
    handleWidth: 44,
    arrowSize: 20,
    
    // 悬停状态
    hoverNodeId: null,
    deleteHoverNodeId: null,
    arrowHoverNodeId: null,

    /**
     * 初始化树形视图
     */
    init() {
        this.nodes = [];
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
        this.nodes = [];
        this.flattenTree(DataModel.treeData, null, 0);
        this.calculatePositions();
        this.updateDragTargets();
    },

    /**
     * 扁平化树形结构
     */
    flattenTree(nodes, parentId, level) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const hasChildren = node.children && node.children.length > 0;
            
            this.nodes.push({
                id: node.id,
                title: node.title,
                level: level,
                parentId: parentId,
                index: i,
                expanded: node.expanded !== false,
                hasChildren: hasChildren,
                x: this.padding + level * this.indentStep,
                y: 0,
                width: 0,
                height: this.nodeHeight,
                scale: 1,
                opacity: 1,
                shadowBlur: 0,
                shadowOffsetY: 0,
                isDragging: false,
                draggable: true,
                supportsNesting: true,
                originalX: 0,
                originalY: 0
            });
            
            if (node.expanded !== false && hasChildren) {
                this.flattenTree(node.children, node.id, level + 1);
            }
        }
    },

    /**
     * 计算位置
     */
    calculatePositions() {
        const maxWidth = Renderer.width - this.padding * 2;
        
        this.nodes.forEach((node, index) => {
            node.x = this.padding + node.level * this.indentStep;
            node.y = this.padding + index * (this.nodeHeight + this.nodeGap);
            node.width = maxWidth - node.level * this.indentStep;
        });
    },

    /**
     * 更新拖拽目标
     */
    updateDragTargets() {
        DragManager.clearTargetElements();
        this.nodes.forEach(node => {
            DragManager.addTargetElement(node);
        });
    },

    /**
     * 拖拽开始处理
     */
    onDragStart(item, x, y) {
        Animation.dragStart(item, () => {
            Renderer.requestRender();
        });
    },

    /**
     * 拖拽移动处理
     */
    onDragMove(item, x, y) {
        this.reorderNodes(item);
        Renderer.requestRender();
    },

    /**
     * 拖拽结束处理
     */
    onDragEnd(item, target) {
        if (!item) return;
        
        const targetY = this.padding + this.nodes.findIndex(n => n.id === item.id) * (this.nodeHeight + this.nodeGap);
        const targetX = this.padding + item.level * this.indentStep;
        
        Animation.dragEnd(
            item,
            { x: targetX, y: targetY },
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
        if (!target || !item || target.id === item.id) return;
        
        const targetNodeInfo = DataModel.findTreeNodeWithParent(DataModel.treeData, target.id);
        if (!targetNodeInfo) return;
        
        let targetParentId = targetNodeInfo.parent ? targetNodeInfo.parent.id : null;
        let targetIndex = targetNodeInfo.index;
        let asChild = false;
        
        if (position === 'inside') {
            targetParentId = target.id;
            targetIndex = target.hasChildren ? 
                DataModel.findTreeNode(DataModel.treeData, target.id)?.children.length || 0 : 0;
            asChild = true;
        } else if (position === 'after') {
            const itemNodeInfo = DataModel.findTreeNodeWithParent(DataModel.treeData, item.id);
            const itemParentId = itemNodeInfo.parent ? itemNodeInfo.parent.id : null;
            
            if (itemParentId === targetParentId && itemNodeInfo.index < targetNodeInfo.index) {
                targetIndex = targetNodeInfo.index;
            } else {
                targetIndex = targetNodeInfo.index + 1;
            }
        }
        
        DataModel.moveTreeNode(item.id, targetParentId, targetIndex, asChild);
        this.updateFromData();
    },

    /**
     * 重新排列节点（视觉上）
     */
    reorderNodes(draggingNode) {
        const dropInfo = DragManager.getDropTarget();
        const target = dropInfo.target;
        
        if (!target || target.id === draggingNode.id) return;
        
        const visualIndex = this.getVisualIndex(draggingNode.y);
        
        this.nodes.forEach((node, i) => {
            if (node.isDragging) return;
            
            let targetIndex = i;
            
            if (i >= draggingNode.index) {
                targetIndex = i + 1;
            }
            
            if (i >= visualIndex && i < draggingNode.index) {
                targetIndex = i - 1;
            }
            
            const targetY = this.padding + targetIndex * (this.nodeHeight + this.nodeGap);
            
            if (Math.abs(node.y - targetY) > 1) {
                Animation.smoothMove(node, { x: node.x, y: targetY }, () => {
                    Renderer.requestRender();
                });
            }
        });
    },

    /**
     * 根据Y坐标获取视觉索引
     */
    getVisualIndex(y) {
        const relativeY = y - this.padding;
        const index = Math.floor(relativeY / (this.nodeHeight + this.nodeGap));
        return Utils.clamp(index, 0, this.nodes.length - 1);
    },

    /**
     * 渲染树形视图
     */
    render() {
        const ctx = Renderer.ctx;
        const theme = Renderer.theme;
        
        if (this.nodes.length === 0) {
            this.renderEmptyState();
            return;
        }
        
        const dropInfo = DragManager.getDropTarget();
        let draggedNode = null;
        
        for (const node of this.nodes) {
            if (node.isDragging) {
                draggedNode = node;
                continue;
            }
            this.renderNode(node, dropInfo);
        }
        
        if (draggedNode) {
            this.renderNode(draggedNode, dropInfo, true);
        }
    },

    /**
     * 渲染单个节点
     */
    renderNode(node, dropInfo, isOnTop = false) {
        const ctx = Renderer.ctx;
        const theme = Renderer.theme;
        
        ctx.save();
        
        const centerX = node.x + node.width / 2;
        const centerY = node.y + node.height / 2;
        
        ctx.translate(centerX, centerY);
        ctx.scale(node.scale, node.scale);
        ctx.globalAlpha = node.opacity;
        ctx.translate(-centerX, -centerY);
        
        Renderer.drawIndentLine(
            this.padding, node.y,
            node.width, node.height,
            node.level
        );
        
        let bgColor = theme.itemBackground;
        let borderColor = null;
        
        if (this.hoverNodeId === node.id && !node.isDragging) {
            bgColor = theme.itemHover;
            borderColor = theme.primaryLight;
        }
        
        if (node.highlightIntensity > 0) {
            const r = parseInt(theme.highlight.slice(1, 3), 16);
            const g = parseInt(theme.highlight.slice(3, 5), 16);
            const b = parseInt(theme.highlight.slice(5, 7), 16);
            bgColor = `rgba(${r}, ${g}, ${b}, ${node.highlightIntensity * 0.5})`;
        }
        
        Renderer.drawCard(
            node.x, node.y, node.width, node.height, 10,
            bgColor, borderColor,
            node.shadowBlur, node.shadowOffsetY
        );
        
        const arrowX = node.x + 8;
        const arrowY = node.y + (node.height - this.arrowSize) / 2;
        
        if (node.hasChildren) {
            Renderer.drawArrow(arrowX, arrowY, this.arrowSize, node.expanded, 
                this.arrowHoverNodeId === node.id ? theme.primaryLight : theme.primary);
        }
        
        const handleX = node.x + (node.hasChildren ? 32 : 8);
        const handleY = node.y + (node.height - 20) / 2;
        const handleColor = this.hoverNodeId === node.id ? theme.handleHover : theme.handle;
        Renderer.drawHandle(handleX, handleY, 20, handleColor);
        
        const textX = node.x + this.handleWidth + (node.hasChildren ? 12 : 0);
        const textY = node.y + (node.height - 16) / 2;
        const textWidth = node.width - this.handleWidth - (node.hasChildren ? 40 : 30);
        
        Renderer.drawText(
            node.title,
            textX, textY, textWidth,
            {
                fontSize: 14,
                fontWeight: node.isDragging ? '600' : (node.hasChildren ? '600' : 'normal'),
                color: theme.text
            }
        );
        
        const deleteX = node.x + node.width - 26;
        const deleteY = node.y + (node.height - 18) / 2;
        const isDeleteHover = this.deleteHoverNodeId === node.id;
        Renderer.drawCloseButton(deleteX, deleteY, 18, null, isDeleteHover);
        
        if (dropInfo && dropInfo.target && dropInfo.target.id === node.id && !node.isDragging) {
            if (dropInfo.position === 'inside') {
                Renderer.dropIndicator(node.x, node.y, node.width, 'inside');
            } else {
                const indicatorY = dropInfo.position === 'before' ? node.y : node.y + node.height;
                ctx.fillStyle = theme.primary;
                ctx.shadowColor = theme.primary;
                ctx.shadowBlur = 4;
                ctx.fillRect(node.x - 4, indicatorY - 2, node.width + 8, 4);
            }
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
        
        ctx.fillText('暂无节点，点击"添加项目"按钮创建', centerX, centerY);
        ctx.restore();
    },

    /**
     * 处理鼠标移动
     */
    handleMouseMove(x, y) {
        let newHoverId = null;
        let newDeleteHoverId = null;
        let newArrowHoverId = null;
        
        for (const node of this.nodes) {
            const rect = {
                x: node.x,
                y: node.y,
                width: node.width,
                height: node.height
            };
            
            if (Utils.pointInRect(x, y, rect)) {
                newHoverId = node.id;
                
                if (node.hasChildren) {
                    const arrowX = node.x + 8;
                    const arrowY = node.y + (node.height - this.arrowSize) / 2;
                    const arrowRect = { x: arrowX, y: arrowY, width: this.arrowSize, height: this.arrowSize };
                    
                    if (Utils.pointInRect(x, y, arrowRect)) {
                        newArrowHoverId = node.id;
                        Renderer.canvas.style.cursor = 'pointer';
                    }
                }
                
                const deleteX = node.x + node.width - 26;
                const deleteY = node.y + (node.height - 18) / 2;
                const deleteRect = { x: deleteX, y: deleteY, width: 18, height: 18 };
                
                if (Utils.pointInRect(x, y, deleteRect)) {
                    newDeleteHoverId = node.id;
                    Renderer.canvas.style.cursor = 'pointer';
                } else if (!newArrowHoverId) {
                    Renderer.canvas.style.cursor = 'grab';
                }
                break;
            }
        }
        
        if (!newHoverId) {
            Renderer.canvas.style.cursor = 'default';
        }
        
        if (newHoverId !== this.hoverNodeId || 
            newDeleteHoverId !== this.deleteHoverNodeId ||
            newArrowHoverId !== this.arrowHoverNodeId) {
            this.hoverNodeId = newHoverId;
            this.deleteHoverNodeId = newDeleteHoverId;
            this.arrowHoverNodeId = newArrowHoverId;
            Renderer.requestRender();
        }
    },

    /**
     * 处理点击事件
     */
    handleClick(x, y) {
        for (const node of this.nodes) {
            const rect = {
                x: node.x,
                y: node.y,
                width: node.width,
                height: node.height
            };
            
            if (Utils.pointInRect(x, y, rect)) {
                if (node.hasChildren) {
                    const arrowX = node.x + 8;
                    const arrowY = node.y + (node.height - this.arrowSize) / 2;
                    const arrowRect = { x: arrowX, y: arrowY, width: this.arrowSize, height: this.arrowSize };
                    
                    if (Utils.pointInRect(x, y, arrowRect)) {
                        this.toggleNode(node.id);
                        return true;
                    }
                }
                
                const deleteX = node.x + node.width - 26;
                const deleteY = node.y + (node.height - 18) / 2;
                const deleteRect = { x: deleteX, y: deleteY, width: 18, height: 18 };
                
                if (Utils.pointInRect(x, y, deleteRect)) {
                    this.deleteNode(node.id);
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
        for (const node of this.nodes) {
            const rect = {
                x: node.x,
                y: node.y,
                width: node.width,
                height: node.height
            };
            
            if (Utils.pointInRect(x, y, rect)) {
                ItemEditor.edit(node.id, node.title, 'tree');
                return true;
            }
        }
        return false;
    },

    /**
     * 切换节点展开/折叠
     */
    toggleNode(nodeId) {
        const result = DataModel.toggleTreeNode(nodeId);
        if (result !== null) {
            this.updateFromData();
            Renderer.requestRender();
            Utils.showToast(result ? '已展开' : '已折叠', 'info');
        }
    },

    /**
     * 添加新节点
     */
    addItem() {
        const newNode = DataModel.addTreeNode(null, '新节点');
        this.updateFromData();
        
        const node = this.nodes.find(n => n.id === newNode.id);
        if (node) {
            node.scale = 0.5;
            node.opacity = 0;
            Animation.addItem(node, () => Renderer.requestRender());
        }
        
        Renderer.requestRender();
        Utils.showToast('节点已添加', 'success');
    },

    /**
     * 删除节点
     */
    deleteNode(id) {
        const node = this.nodes.find(n => n.id === id);
        if (node) {
            Animation.removeItem(
                node,
                () => Renderer.requestRender(),
                () => {
                    DataModel.removeTreeNode(id);
                    this.updateFromData();
                    Renderer.requestRender();
                    Utils.showToast('节点已删除', 'info');
                }
            );
        }
    },

    /**
     * 更新节点
     */
    updateNode(id, newTitle) {
        const node = this.nodes.find(n => n.id === id);
        if (node) {
            node.title = newTitle;
            DataModel.updateTreeNode(id, { title: newTitle });
            
            Animation.highlight(node, Renderer.theme.highlight, () => {
                Renderer.requestRender();
            });
            
            Renderer.requestRender();
            Utils.showToast('节点已更新', 'success');
        }
    }
};

// 将树形视图暴露到全局
window.TreeView = TreeView;
