/**
 * 画布管理模块
 * 负责画布的渲染、缩放、平移、网格等功能
 */

const CanvasManager = {
    // 画布元素
    canvas: null,
    ctx: null,
    
    // 画布状态
    state: {
        scale: 1,
        panX: 0,
        panY: 0,
        gridSize: 20,
        showGrid: true,
        gridSnap: true
    },

    // 交互状态
    interaction: {
        isPanning: false,
        isDraggingNode: false,
        isCreatingConnection: false,
        isSelecting: false,          // 框选状态
        dragStartX: 0,
        dragStartY: 0,
        dragStartCanvasX: 0,
        dragStartCanvasY: 0,
        lastPanX: 0,
        lastPanY: 0,
        draggingNodeId: null,
        connectionStartNodeId: null,
        connectionStartPoint: null,
        tempConnectionX: 0,
        tempConnectionY: 0,
        selectionBox: {             // 框选矩形
            startX: 0,
            startY: 0,
            endX: 0,
            endY: 0
        },
        lastClickTime: 0,
        doubleClickThreshold: 300
    },

    // 鼠标位置
    mousePos: {
        x: 0,
        y: 0
    },

    // 悬停元素
    hover: {
        nodeId: null,
        connectionPoint: null,
        connectionId: null
    },

    /**
     * 初始化画布
     * @param {string} canvasId 画布元素ID
     */
    init: function(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('未找到画布元素');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        this.setupEventListeners();

        // 加载保存的画布状态
        this.loadCanvasState();
    },

    /**
     * 调整画布大小
     */
    resizeCanvas: function() {
        const container = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = container.clientWidth * dpr;
        this.canvas.height = container.clientHeight * dpr;

        this.canvas.style.width = container.clientWidth + 'px';
        this.canvas.style.height = container.clientHeight + 'px';

        this.ctx.scale(dpr, dpr);
    },

    /**
     * 设置事件监听器
     */
    setupEventListeners: function() {
        const canvas = this.canvas;

        // 窗口大小改变
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.render();
        });

        // 鼠标按下
        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));

        // 鼠标移动
        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));

        // 鼠标释放
        canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));

        // 鼠标离开
        canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));

        // 滚轮缩放
        canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

        // 右键菜单
        canvas.addEventListener('contextmenu', (e) => this.handleContextMenu(e));

        // 双击
        canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));

        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // 节点面板拖拽
        this.setupDragDrop();
    },

    /**
     * 设置拖拽功能
     */
    setupDragDrop: function() {
        const nodeItems = document.querySelectorAll('.node-item');
        
        nodeItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.dataset.nodeType);
                e.dataTransfer.effectAllowed = 'copy';
            });
        });

        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const nodeType = e.dataTransfer.getData('text/plain');
            if (NodeTypes.hasType(nodeType)) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // 转换为画布坐标并对齐网格
                const canvasX = (x - this.state.panX) / this.state.scale;
                const canvasY = (y - this.state.panY) / this.state.scale;
                
                let finalX = canvasX;
                let finalY = canvasY;
                
                if (this.state.gridSnap) {
                    finalX = Utils.snapToGrid(canvasX, this.state.gridSize);
                    finalY = Utils.snapToGrid(canvasY, this.state.gridSize);
                }

                const node = NodeTypes.createNode(nodeType, finalX - 70, finalY - 40);
                if (node) {
                    NodeManager.addNode(node);
                    NodeManager.selectNode(node.id);
                    ConnectionManager.deselectAll();
                    this.render();
                    this.saveState();
                }
            }
        });
    },

    /**
     * 处理鼠标按下
     */
    handleMouseDown: function(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.mousePos = { x, y };

        // 计算画布坐标
        const canvasX = (x - this.state.panX) / this.state.scale;
        const canvasY = (y - this.state.panY) / this.state.scale;

        this.interaction.dragStartX = x;
        this.interaction.dragStartY = y;
        this.interaction.dragStartCanvasX = canvasX;
        this.interaction.dragStartCanvasY = canvasY;

        // 左键
        if (e.button === 0) {
            // 检查是否点击了节点
            const node = NodeManager.findNodeAtPoint(x, y, this.state);
            if (node) {
                // 检查是否点击了连接点
                const connectionPoint = NodeTypes.findNearestConnectionPoint(canvasX, canvasY, node);
                
                if (connectionPoint) {
                    // 开始创建连线
                    this.interaction.isCreatingConnection = true;
                    this.interaction.connectionStartNodeId = node.id;
                    this.interaction.connectionStartPoint = connectionPoint.name;
                    this.interaction.tempConnectionX = canvasX;
                    this.interaction.tempConnectionY = canvasY;
                } else {
                    // 开始拖动节点
                    const isCtrlPressed = e.ctrlKey || e.metaKey;
                    const isShiftPressed = e.shiftKey;
                    
                    if (NodeManager.isNodeSelected(node.id)) {
                        // 如果节点已经被选中，保持多选状态开始拖动
                        this.interaction.isDraggingNode = true;
                        this.interaction.draggingNodeId = node.id;
                        
                        // 记录所有选中节点的初始位置（用于相对移动）
                        this.selectedNodesStartPos = {};
                        for (const selectedNode of NodeManager.getSelectedNodes()) {
                            this.selectedNodesStartPos[selectedNode.id] = {
                                x: selectedNode.x,
                                y: selectedNode.y
                            };
                        }
                    } else if (isShiftPressed || isCtrlPressed) {
                        // Shift 或 Ctrl/Cmd 点击，添加到选择
                        NodeManager.addToSelection(node.id);
                        this.interaction.isDraggingNode = true;
                        this.interaction.draggingNodeId = node.id;
                        
                        // 记录初始位置
                        this.selectedNodesStartPos = {};
                        for (const selectedNode of NodeManager.getSelectedNodes()) {
                            this.selectedNodesStartPos[selectedNode.id] = {
                                x: selectedNode.x,
                                y: selectedNode.y
                            };
                        }
                    } else {
                        // 普通点击，只选中当前节点
                        NodeManager.selectNode(node.id);
                        ConnectionManager.deselectAll();
                        this.interaction.isDraggingNode = true;
                        this.interaction.draggingNodeId = node.id;
                        
                        this.selectedNodesStartPos = {
                            [node.id]: { x: node.x, y: node.y }
                        };
                    }
                }

                this.render();
                return;
            }

            // 检查是否点击了连线
            const connection = ConnectionManager.findConnectionAtPoint(x, y, this.state);
            if (connection) {
                const isShiftPressed = e.shiftKey || e.ctrlKey || e.metaKey;
                
                if (isShiftPressed) {
                    // Shift 点击，切换选择状态
                    ConnectionManager.toggleConnectionSelection(connection.id);
                } else {
                    ConnectionManager.selectConnection(connection.id);
                }
                NodeManager.deselectAll();
                this.render();
                return;
            }

            // 点击空白区域
            const isShiftPressed = e.shiftKey || e.ctrlKey || e.metaKey;
            
            if (isShiftPressed) {
                // Shift + 点击空白：开始框选，不取消现有选择
                this.interaction.isSelecting = true;
                this.interaction.selectionBox = {
                    startX: canvasX,
                    startY: canvasY,
                    endX: canvasX,
                    endY: canvasY
                };
            } else {
                // 普通点击空白：开始框选，取消现有选择
                this.interaction.isSelecting = true;
                this.interaction.selectionBox = {
                    startX: canvasX,
                    startY: canvasY,
                    endX: canvasX,
                    endY: canvasY
                };
                NodeManager.deselectAll();
                ConnectionManager.deselectAll();
            }

            this.render();
        }
    },

    /**
     * 处理鼠标移动
     */
    handleMouseMove: function(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const canvasX = (x - this.state.panX) / this.state.scale;
        const canvasY = (y - this.state.panY) / this.state.scale;

        this.mousePos = { x, y };

        if (this.interaction.isPanning) {
            // 平移画布
            const dx = x - this.interaction.lastPanX;
            const dy = y - this.interaction.lastPanY;
            this.state.panX += dx;
            this.state.panY += dy;
            this.interaction.lastPanX = x;
            this.interaction.lastPanY = y;
            this.render();
            return;
        }

        if (this.interaction.isDraggingNode) {
            // 拖动节点（支持多选）
            const dx = canvasX - this.interaction.dragStartCanvasX;
            const dy = canvasY - this.interaction.dragStartCanvasY;

            // 网格对齐计算
            let finalDx = dx;
            let finalDy = dy;

            if (this.state.gridSnap && this.selectedNodesStartPos) {
                // 找到主拖动节点
                const mainNode = NodeManager.getNodeById(this.interaction.draggingNodeId);
                if (mainNode && this.selectedNodesStartPos[this.interaction.draggingNodeId]) {
                    const startPos = this.selectedNodesStartPos[this.interaction.draggingNodeId];
                    const targetX = startPos.x + dx;
                    const targetY = startPos.y + dy;
                    const snappedX = Utils.snapToGrid(targetX, this.state.gridSize);
                    const snappedY = Utils.snapToGrid(targetY, this.state.gridSize);
                    finalDx = snappedX - startPos.x;
                    finalDy = snappedY - startPos.y;
                }
            }

            // 更新所有选中节点的位置
            for (const id in this.selectedNodesStartPos) {
                if (this.selectedNodesStartPos.hasOwnProperty(id)) {
                    const startPos = this.selectedNodesStartPos[id];
                    NodeManager.updateNodePosition(id, startPos.x + finalDx, startPos.y + finalDy);
                }
            }

            this.render();
            return;
        }

        if (this.interaction.isCreatingConnection) {
            // 创建连线中
            this.interaction.tempConnectionX = canvasX;
            this.interaction.tempConnectionY = canvasY;

            // 检查是否悬停在连接点上
            const nearestPoint = NodeManager.findNearestConnectionPoint(
                x, y, this.state, this.interaction.connectionStartNodeId
            );
            this.hover.connectionPoint = nearestPoint;

            this.render();
            return;
        }

        if (this.interaction.isSelecting) {
            // 框选模式
            this.interaction.selectionBox.endX = canvasX;
            this.interaction.selectionBox.endY = canvasY;
            this.render();
            return;
        }

        // 普通移动，检测悬停
        this.updateHover(x, y, canvasX, canvasY);
        this.render();
    },

    /**
     * 处理鼠标释放
     */
    handleMouseUp: function(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.interaction.isCreatingConnection && this.hover.connectionPoint) {
            // 完成连线创建
            const fromNodeId = this.interaction.connectionStartNodeId;
            const fromPoint = this.interaction.connectionStartPoint;
            const toNodeId = this.hover.connectionPoint.nodeId;
            const toPoint = this.hover.connectionPoint.name;

            if (fromNodeId !== toNodeId) {
                // 检查是否已存在相同的连线
                const exists = ConnectionManager.getAllConnections().some(conn =>
                    (conn.fromNodeId === fromNodeId && conn.toNodeId === toNodeId) ||
                    (conn.fromNodeId === toNodeId && conn.toNodeId === fromNodeId)
                );

                if (!exists) {
                    const connection = ConnectionManager.createConnection(
                        fromNodeId, fromPoint, toNodeId, toPoint
                    );
                    ConnectionManager.addConnection(connection);
                }
            }

            this.render();
            this.saveState();
        }

        if (this.interaction.isSelecting) {
            // 完成框选
            const box = this.interaction.selectionBox;
            const isShiftPressed = e.shiftKey || e.ctrlKey || e.metaKey;

            // 检查是否有实际移动（区分点击和框选）
            const moved = Math.abs(box.endX - box.startX) > 5 || Math.abs(box.endY - box.startY) > 5;

            if (moved) {
                // 有移动，执行框选
                NodeManager.selectNodesInRect(
                    box.startX, box.startY,
                    box.endX, box.endY,
                    isShiftPressed
                );
            } else {
                // 没有移动，是点击空白区域
                if (!isShiftPressed) {
                    // 非 Shift 点击空白，取消选择
                    NodeManager.deselectAll();
                    ConnectionManager.deselectAll();
                }
                // 否则保持现有选择
            }

            this.render();
            this.saveState();
        }

        if (this.interaction.isDraggingNode) {
            // 完成节点拖动
            this.saveState();
        }

        // 重置交互状态
        this.interaction.isPanning = false;
        this.interaction.isDraggingNode = false;
        this.interaction.isCreatingConnection = false;
        this.interaction.isSelecting = false;
        this.interaction.draggingNodeId = null;
        this.interaction.connectionStartNodeId = null;
        this.interaction.connectionStartPoint = null;
        this.hover.connectionPoint = null;
        this.canvas.style.cursor = 'default';
        this.selectedNodesStartPos = null;

        this.render();
    },

    /**
     * 处理滚轮缩放
     */
    handleWheel: function(e) {
        e.preventDefault();

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Utils.clamp(this.state.scale * zoomFactor, 0.1, 3);

        // 以鼠标位置为中心缩放
        const mouseBeforeX = (x - this.state.panX) / this.state.scale;
        const mouseBeforeY = (y - this.state.panY) / this.state.scale;

        this.state.scale = newScale;

        const mouseAfterX = (x - this.state.panX) / this.state.scale;
        const mouseAfterY = (y - this.state.panY) / this.state.scale;

        this.state.panX += (mouseAfterX - mouseBeforeX) * this.state.scale;
        this.state.panY += (mouseAfterY - mouseBeforeY) * this.state.scale;

        this.updateZoomUI();
        this.render();
    },

    /**
     * 处理右键菜单
     */
    handleContextMenu: function(e) {
        e.preventDefault();

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 检查是否点击了节点
        const node = NodeManager.findNodeAtPoint(x, y, this.state);
        if (node) {
            // 如果节点没被选中，选中它
            if (!NodeManager.isNodeSelected(node.id)) {
                NodeManager.selectNode(node.id);
                ConnectionManager.deselectAll();
            }
            
            const selectedCount = NodeManager.getSelectedCount();
            if (selectedCount > 1) {
                this.showContextMenu(e.clientX, e.clientY, 'multi-node');
            } else {
                this.showContextMenu(e.clientX, e.clientY, 'node');
            }
            this.render();
            return;
        }

        // 检查是否点击了连线
        const connection = ConnectionManager.findConnectionAtPoint(x, y, this.state);
        if (connection) {
            if (!ConnectionManager.isConnectionSelected(connection.id)) {
                ConnectionManager.selectConnection(connection.id);
                NodeManager.deselectAll();
            }
            this.showContextMenu(e.clientX, e.clientY, 'connection');
            this.render();
            return;
        }

        this.showContextMenu(e.clientX, e.clientY, 'canvas');
    },

    /**
     * 显示右键菜单
     */
    showContextMenu: function(x, y, type) {
        // 移除现有菜单
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        if (type === 'node') {
            menu.innerHTML = `
                <div class="context-menu-item" data-action="edit-text">
                    <span>✏️</span> 编辑文字
                </div>
                <div class="context-menu-divider"></div>
                <div class="context-menu-item danger" data-action="delete-node">
                    <span>🗑️</span> 删除节点
                </div>
            `;
        } else if (type === 'multi-node') {
            const count = NodeManager.getSelectedCount();
            menu.innerHTML = `
                <div class="context-menu-item danger" data-action="delete-selected">
                    <span>🗑️</span> 删除选中的 ${count} 个节点
                </div>
            `;
        } else if (type === 'connection') {
            menu.innerHTML = `
                <div class="context-menu-item" data-action="edit-label">
                    <span>📝</span> 编辑标签
                </div>
                <div class="context-menu-divider"></div>
                <div class="context-menu-item danger" data-action="delete-connection">
                    <span>🗑️</span> 删除连线
                </div>
            `;
        } else {
            menu.innerHTML = `
                <div class="context-menu-item" data-action="select-all">
                    <span>📋</span> 全选 (Ctrl+A)
                </div>
                <div class="context-menu-item" data-action="deselect-all">
                    <span>❌</span> 取消全选
                </div>
                <div class="context-menu-divider"></div>
                <div class="context-menu-item" data-action="reset-view">
                    <span>🔄</span> 重置视图
                </div>
            `;
        }

        document.body.appendChild(menu);

        // 绑定菜单事件
        menu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                this.handleContextMenuAction(action);
                menu.remove();
            });
        });

        // 点击其他地方关闭菜单
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
    },

    /**
     * 处理右键菜单动作
     */
    handleContextMenuAction: function(action) {
        switch (action) {
            case 'edit-text':
                const selectedNode = NodeManager.getSelectedNode();
                if (selectedNode) {
                    this.startNodeTextEdit(selectedNode.id);
                }
                break;

            case 'delete-node':
                const nodeToDelete = NodeManager.getSelectedNode();
                if (nodeToDelete) {
                    ConnectionManager.removeConnectionsByNode(nodeToDelete.id);
                    NodeManager.removeNode(nodeToDelete.id);
                    this.render();
                    this.saveState();
                }
                break;

            case 'delete-selected':
                const selectedNodes = NodeManager.getSelectedNodes();
                for (const node of selectedNodes) {
                    ConnectionManager.removeConnectionsByNode(node.id);
                    NodeManager.removeNode(node.id);
                }
                this.render();
                this.saveState();
                break;

            case 'edit-label':
                const selectedConn = ConnectionManager.getSelectedConnection();
                if (selectedConn) {
                    this.startConnectionLabelEdit(selectedConn.id);
                }
                break;

            case 'delete-connection':
                const connToDelete = ConnectionManager.getSelectedConnection();
                if (connToDelete) {
                    ConnectionManager.removeConnection(connToDelete.id);
                    this.render();
                    this.saveState();
                }
                break;

            case 'select-all':
                NodeManager.selectAll();
                ConnectionManager.deselectAll();
                this.render();
                break;

            case 'deselect-all':
                NodeManager.deselectAll();
                ConnectionManager.deselectAll();
                this.render();
                break;

            case 'reset-view':
                this.state.scale = 1;
                this.state.panX = 0;
                this.state.panY = 0;
                this.updateZoomUI();
                this.render();
                break;
        }
    },

    /**
     * 处理双击
     */
    handleDoubleClick: function(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 检查是否双击了节点
        const node = NodeManager.findNodeAtPoint(x, y, this.state);
        if (node) {
            this.startNodeTextEdit(node.id);
            return;
        }

        // 检查是否双击了连线标签
        const connection = ConnectionManager.findConnectionAtPoint(x, y, this.state);
        if (connection) {
            this.startConnectionLabelEdit(connection.id);
        }
    },

    /**
     * 处理键盘事件
     */
    handleKeyDown: function(e) {
        // 全选 Ctrl+A / Cmd+A
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
            e.preventDefault();
            NodeManager.selectAll();
            ConnectionManager.deselectAll();
            this.render();
            return;
        }

        // Delete 键删除选中的元素
        if (e.key === 'Delete' || e.key === 'Backspace') {
            // 检查是否有选中的节点
            const selectedCount = NodeManager.getSelectedCount();
            if (selectedCount > 0) {
                const selectedNodes = NodeManager.getSelectedNodes();
                for (const node of selectedNodes) {
                    ConnectionManager.removeConnectionsByNode(node.id);
                    NodeManager.removeNode(node.id);
                }
                this.render();
                this.saveState();
                return;
            }

            // 检查是否有选中的连线
            const selectedConn = ConnectionManager.getSelectedConnection();
            if (selectedConn) {
                ConnectionManager.removeConnection(selectedConn.id);
                this.render();
                this.saveState();
            }
        }

        // Esc 键取消选择
        if (e.key === 'Escape') {
            NodeManager.deselectAll();
            ConnectionManager.deselectAll();
            this.render();
        }
    },

    /**
     * 开始编辑节点文字
     */
    startNodeTextEdit: function(nodeId) {
        const node = NodeManager.getNodeById(nodeId);
        if (!node) return;

        NodeManager.startEditing(nodeId);

        const editInput = document.getElementById('editInput');
        const container = this.canvas.parentElement;

        // 计算输入框位置
        const screenX = node.x * this.state.scale + this.state.panX;
        const screenY = node.y * this.state.scale + this.state.panY;
        const screenW = node.width * this.state.scale;
        const screenH = node.height * this.state.scale;

        editInput.style.display = 'block';
        editInput.style.left = (screenX + container.offsetLeft) + 'px';
        editInput.style.top = (screenY + container.offsetTop) + 'px';
        editInput.style.width = screenW + 'px';
        editInput.style.height = screenH + 'px';
        editInput.style.fontSize = (node.fontSize * this.state.scale) + 'px';
        editInput.value = node.text;
        editInput.focus();
        editInput.select();

        const finishEdit = () => {
            const newText = editInput.value.trim();
            if (newText) {
                NodeManager.updateNodeProperties(nodeId, { text: newText });
            }
            editInput.style.display = 'none';
            NodeManager.stopEditing();
            this.render();
            this.saveState();

            editInput.removeEventListener('blur', finishEdit);
            editInput.removeEventListener('keydown', handleKey);
        };

        const handleKey = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                editInput.blur();
            }
            if (e.key === 'Escape') {
                editInput.value = node.text;
                editInput.blur();
            }
        };

        editInput.addEventListener('blur', finishEdit);
        editInput.addEventListener('keydown', handleKey);
    },

    /**
     * 开始编辑连线标签
     */
    startConnectionLabelEdit: function(connectionId) {
        const connection = ConnectionManager.getConnectionById(connectionId);
        if (!connection) return;

        const labelPos = ConnectionManager.getLabelPosition(connection);
        if (!labelPos) return;

        const editInput = document.getElementById('editInput');
        const container = this.canvas.parentElement;

        // 计算输入框位置
        const screenX = (labelPos.x - 60) * this.state.scale + this.state.panX;
        const screenY = (labelPos.y - 20) * this.state.scale + this.state.panY;
        const screenW = 120 * this.state.scale;
        const screenH = 40 * this.state.scale;

        editInput.style.display = 'block';
        editInput.style.left = (screenX + container.offsetLeft) + 'px';
        editInput.style.top = (screenY + container.offsetTop) + 'px';
        editInput.style.width = screenW + 'px';
        editInput.style.height = screenH + 'px';
        editInput.style.fontSize = (connection.labelFontSize * this.state.scale) + 'px';
        editInput.value = connection.label;
        editInput.focus();
        editInput.select();

        const finishEdit = () => {
            const newLabel = editInput.value.trim();
            ConnectionManager.updateConnectionProperties(connectionId, { label: newLabel });
            editInput.style.display = 'none';
            this.render();
            this.saveState();

            editInput.removeEventListener('blur', finishEdit);
            editInput.removeEventListener('keydown', handleKey);
        };

        const handleKey = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                editInput.blur();
            }
            if (e.key === 'Escape') {
                editInput.value = connection.label;
                editInput.blur();
            }
        };

        editInput.addEventListener('blur', finishEdit);
        editInput.addEventListener('keydown', handleKey);
    },

    /**
     * 更新悬停状态
     */
    updateHover: function(screenX, screenY, canvasX, canvasY) {
        // 检查节点悬停
        const node = NodeManager.findNodeAtPoint(screenX, screenY, this.state);
        this.hover.nodeId = node ? node.id : null;

        // 检查连接点悬停
        if (node) {
            const connectionPoint = NodeTypes.findNearestConnectionPoint(canvasX, canvasY, node);
            this.hover.connectionPoint = connectionPoint ? { ...connectionPoint, nodeId: node.id } : null;
        } else {
            this.hover.connectionPoint = null;
        }

        // 检查连线悬停
        const connection = ConnectionManager.findConnectionAtPoint(screenX, screenY, this.state);
        this.hover.connectionId = connection ? connection.id : null;

        // 更新鼠标样式
        if (this.hover.connectionPoint) {
            this.canvas.style.cursor = 'crosshair';
        } else if (this.hover.nodeId) {
            this.canvas.style.cursor = 'move';
        } else if (this.hover.connectionId) {
            this.canvas.style.cursor = 'pointer';
        } else {
            this.canvas.style.cursor = 'default';
        }
    },

    /**
     * 更新缩放UI
     */
    updateZoomUI: function() {
        const zoomValue = document.getElementById('zoomValue');
        if (zoomValue) {
            zoomValue.textContent = Math.round(this.state.scale * 100) + '%';
        }
    },

    /**
     * 渲染画布
     */
    render: function() {
        const ctx = this.ctx;
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);

        // 清空画布
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.restore();

        // 应用画布变换
        ctx.save();
        ctx.translate(this.state.panX, this.state.panY);
        ctx.scale(this.state.scale, this.state.scale);

        // 绘制网格
        if (this.state.showGrid) {
            this.drawGrid(ctx, width, height);
        }

        // 绘制连线（在节点下面）
        this.drawConnections(ctx);

        // 绘制节点
        this.drawNodes(ctx);

        // 绘制临时连线
        if (this.interaction.isCreatingConnection) {
            this.drawTempConnection(ctx);
        }

        // 绘制框选矩形
        if (this.interaction.isSelecting) {
            this.drawSelectionBox(ctx);
        }

        ctx.restore();

        // 更新属性面板
        this.updatePropertyPanel();
    },

    /**
     * 绘制网格
     */
    drawGrid: function(ctx, width, height) {
        const gridSize = this.state.gridSize;
        const startX = Math.floor(-this.state.panX / this.state.scale / gridSize) * gridSize - gridSize;
        const startY = Math.floor(-this.state.panY / this.state.scale / gridSize) * gridSize - gridSize;
        const endX = startX + Math.ceil(width / this.state.scale) + gridSize * 2;
        const endY = startY + Math.ceil(height / this.state.scale) + gridSize * 2;

        ctx.strokeStyle = '#e8e8e8';
        ctx.lineWidth = 1 / this.state.scale;

        // 垂直线
        for (let x = startX; x <= endX; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
            ctx.stroke();
        }

        // 水平线
        for (let y = startY; y <= endY; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
            ctx.stroke();
        }
    },

    /**
     * 绘制框选矩形
     */
    drawSelectionBox: function(ctx) {
        const box = this.interaction.selectionBox;
        const minX = Math.min(box.startX, box.endX);
        const maxX = Math.max(box.startX, box.endX);
        const minY = Math.min(box.startY, box.endY);
        const maxY = Math.max(box.startY, box.endY);

        ctx.save();
        
        // 填充
        ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
        ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
        
        // 边框
        ctx.strokeStyle = 'rgba(52, 152, 219, 0.8)';
        ctx.lineWidth = 1 / this.state.scale;
        ctx.setLineDash([5 / this.state.scale, 5 / this.state.scale]);
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
        
        ctx.restore();
    },

    /**
     * 绘制节点
     */
    drawNodes: function(ctx) {
        const nodes = NodeManager.getAllNodes().sort((a, b) => a.zIndex - b.zIndex);

        for (const node of nodes) {
            const isSelected = NodeManager.isNodeSelected(node.id);
            const isHovered = node.id === this.hover.nodeId;
            const isEditing = node.id === NodeManager.editingNodeId;

            // 不绘制正在编辑的节点
            if (isEditing) continue;

            this.drawNodeShape(ctx, node, isSelected, isHovered);
            this.drawNodeText(ctx, node);

            // 绘制选中效果和连接点
            if (isSelected || isHovered) {
                this.drawConnectionPoints(ctx, node);
            }
        }
    },

    /**
     * 绘制节点形状
     */
    drawNodeShape: function(ctx, node, isSelected, isHovered) {
        const x = node.x;
        const y = node.y;
        const w = node.width;
        const h = node.height;

        ctx.save();

        // 绘制阴影
        if (isSelected) {
            ctx.shadowColor = 'rgba(52, 152, 219, 0.5)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        ctx.fillStyle = node.color;
        ctx.strokeStyle = isSelected ? '#3498db' : (isHovered ? '#555' : 'rgba(0,0,0,0.2)');
        ctx.lineWidth = isSelected ? 3 : 2;

        ctx.beginPath();

        switch (node.type) {
            case 'ellipse':
                // 椭圆
                ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
                break;

            case 'circle':
                // 圆形
                const radius = Math.min(w, h) / 2;
                ctx.arc(x + w / 2, y + h / 2, radius, 0, Math.PI * 2);
                break;

            case 'diamond':
                // 菱形
                ctx.moveTo(x + w / 2, y);
                ctx.lineTo(x + w, y + h / 2);
                ctx.lineTo(x + w / 2, y + h);
                ctx.lineTo(x, y + h / 2);
                ctx.closePath();
                break;

            case 'rounded-rect':
                // 圆角矩形
                const radiusRR = Math.min(15, w / 4, h / 4);
                ctx.moveTo(x + radiusRR, y);
                ctx.lineTo(x + w - radiusRR, y);
                ctx.quadraticCurveTo(x + w, y, x + w, y + radiusRR);
                ctx.lineTo(x + w, y + h - radiusRR);
                ctx.quadraticCurveTo(x + w, y + h, x + w - radiusRR, y + h);
                ctx.lineTo(x + radiusRR, y + h);
                ctx.quadraticCurveTo(x, y + h, x, y + h - radiusRR);
                ctx.lineTo(x, y + radiusRR);
                ctx.quadraticCurveTo(x, y, x + radiusRR, y);
                ctx.closePath();
                break;

            case 'document':
                // 文档形
                const docFold = 15;
                ctx.moveTo(x, y);
                ctx.lineTo(x + w - docFold, y);
                ctx.lineTo(x + w, y + docFold);
                ctx.lineTo(x + w, y + h);
                ctx.lineTo(x, y + h);
                ctx.closePath();
                break;

            case 'rectangle':
            default:
                // 矩形
                ctx.rect(x, y, w, h);
                break;
        }

        ctx.fill();
        ctx.stroke();

        // 文档形的折叠角
        if (node.type === 'document') {
            const docFold = 15;
            ctx.beginPath();
            ctx.moveTo(x + w - docFold, y);
            ctx.lineTo(x + w - docFold, y + docFold);
            ctx.lineTo(x + w, y + docFold);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.restore();
    },

    /**
     * 绘制节点文字
     */
    drawNodeText: function(ctx, node) {
        const x = node.x;
        const y = node.y;
        const w = node.width;
        const h = node.height;

        ctx.save();
        ctx.fillStyle = node.textColor;
        ctx.font = `${node.fontSize}px ${node.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 处理多行文本
        const lines = node.text.split('\n');
        const lineHeight = node.fontSize * 1.3;
        const totalHeight = lines.length * lineHeight;
        let startY = y + h / 2 - totalHeight / 2 + lineHeight / 2;

        for (const line of lines) {
            // 自动换行（如果文本太长）
            let textToDraw = line;
            const maxWidth = w - 20;
            let textWidth = ctx.measureText(line).width;
            
            if (textWidth > maxWidth && line.length > 3) {
                const chars = line.split('');
                let currentText = '';
                for (const char of chars) {
                    const testText = currentText + char;
                    if (ctx.measureText(testText).width > maxWidth - 10) {
                        currentText += '...';
                        break;
                    }
                    currentText = testText;
                }
                textToDraw = currentText;
            }

            ctx.fillText(textToDraw, x + w / 2, startY);
            startY += lineHeight;
        }

        ctx.restore();
    },

    /**
     * 绘制连接点
     */
    drawConnectionPoints: function(ctx, node) {
        const points = NodeTypes.getConnectionPoints(node);

        for (const point of points) {
            // 检查是否是悬停的连接点
            const isHoveredPoint = this.hover.connectionPoint &&
                this.hover.connectionPoint.nodeId === node.id &&
                this.hover.connectionPoint.name === point.name;

            ctx.save();
            ctx.beginPath();
            ctx.arc(point.x, point.y, isHoveredPoint ? 8 : 6, 0, Math.PI * 2);
            ctx.fillStyle = isHoveredPoint ? '#3498db' : '#ffffff';
            ctx.strokeStyle = isHoveredPoint ? '#2980b9' : '#555555';
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
    },

    /**
     * 绘制连线
     */
    drawConnections: function(ctx) {
        const connections = ConnectionManager.getAllConnections().sort((a, b) => a.zIndex - b.zIndex);

        for (const conn of connections) {
            const isSelected = ConnectionManager.isConnectionSelected(conn.id);
            const isHovered = conn.id === this.hover.connectionId;

            this.drawConnectionLine(ctx, conn, isSelected, isHovered);
            this.drawConnectionLabel(ctx, conn);
        }
    },

    /**
     * 绘制连线路径
     */
    drawConnectionLine: function(ctx, conn, isSelected, isHovered) {
        const points = ConnectionManager.getConnectionPoints(conn);
        if (!points) return;

        ctx.save();

        ctx.strokeStyle = isSelected ? '#3498db' : conn.color;
        ctx.lineWidth = isSelected ? conn.width + 1 : conn.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // 绘制箭头
        ctx.fillStyle = isSelected ? '#3498db' : conn.color;

        ctx.beginPath();

        switch (conn.lineStyle) {
            case 'curve': {
                // 贝塞尔曲线
                const controlPoint1 = {
                    x: points.from.x + (points.to.x - points.from.x) * 0.33,
                    y: points.from.y
                };
                const controlPoint2 = {
                    x: points.from.x + (points.to.x - points.from.x) * 0.67,
                    y: points.to.y
                };

                ctx.moveTo(points.from.x, points.from.y);
                ctx.bezierCurveTo(
                    controlPoint1.x, controlPoint1.y,
                    controlPoint2.x, controlPoint2.y,
                    points.to.x, points.to.y
                );
                break;
            }

            case 'polyline': {
                // 折线
                const midX = (points.from.x + points.to.x) / 2;
                ctx.moveTo(points.from.x, points.from.y);
                ctx.lineTo(midX, points.from.y);
                ctx.lineTo(midX, points.to.y);
                ctx.lineTo(points.to.x, points.to.y);
                break;
            }

            case 'straight':
            default:
                // 直线
                ctx.moveTo(points.from.x, points.from.y);
                ctx.lineTo(points.to.x, points.to.y);
                break;
        }

        ctx.stroke();

        // 绘制箭头
        this.drawArrow(ctx, points.from, points.to, conn.lineStyle);

        ctx.restore();
    },

    /**
     * 绘制箭头
     */
    drawArrow: function(ctx, from, to, lineStyle) {
        const arrowLength = 12;
        const arrowAngle = Math.PI / 6;

        // 计算箭头方向
        let angle;
        if (lineStyle === 'straight' || lineStyle === 'curve') {
            angle = Math.atan2(to.y - from.y, to.x - from.x);
        } else {
            // polyline - 箭头指向终点的水平方向
            angle = to.x > from.x ? 0 : Math.PI;
        }

        const point1 = {
            x: to.x - arrowLength * Math.cos(angle - arrowAngle),
            y: to.y - arrowLength * Math.sin(angle - arrowAngle)
        };
        const point2 = {
            x: to.x - arrowLength * Math.cos(angle + arrowAngle),
            y: to.y - arrowLength * Math.sin(angle + arrowAngle)
        };

        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(point1.x, point1.y);
        ctx.lineTo(point2.x, point2.y);
        ctx.closePath();
        ctx.fill();
    },

    /**
     * 绘制连线标签
     */
    drawConnectionLabel: function(ctx, conn) {
        if (!conn.label) return;

        const labelPos = ConnectionManager.getLabelPosition(conn);
        if (!labelPos) return;

        const isSelected = ConnectionManager.isConnectionSelected(conn.id);

        ctx.save();

        // 绘制标签背景
        ctx.font = `${conn.labelFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        const textWidth = ctx.measureText(conn.label).width;
        const padding = 6;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.strokeStyle = isSelected ? '#3498db' : '#ddd';
        ctx.lineWidth = 1;

        const bgX = labelPos.x - textWidth / 2 - padding;
        const bgY = labelPos.y - conn.labelFontSize / 2 - padding / 2;
        const bgW = textWidth + padding * 2;
        const bgH = conn.labelFontSize + padding;

        ctx.fillRect(bgX, bgY, bgW, bgH);
        ctx.strokeRect(bgX, bgY, bgW, bgH);

        // 绘制文字
        ctx.fillStyle = conn.labelColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(conn.label, labelPos.x, labelPos.y);

        ctx.restore();
    },

    /**
     * 绘制临时连线
     */
    drawTempConnection: function(ctx) {
        if (!this.interaction.connectionStartNodeId || !this.interaction.connectionStartPoint) return;

        const fromNode = NodeManager.getNodeById(this.interaction.connectionStartNodeId);
        if (!fromNode) return;

        const fromPoints = NodeTypes.getConnectionPoints(fromNode);
        const fromPoint = fromPoints.find(p => p.name === this.interaction.connectionStartPoint);
        if (!fromPoint) return;

        ctx.save();
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        ctx.beginPath();
        ctx.moveTo(fromPoint.x, fromPoint.y);
        ctx.lineTo(this.interaction.tempConnectionX, this.interaction.tempConnectionY);
        ctx.stroke();

        // 绘制终点连接点高亮
        if (this.hover.connectionPoint) {
            ctx.beginPath();
            ctx.arc(this.hover.connectionPoint.x, this.hover.connectionPoint.y, 10, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
            ctx.fill();
            ctx.strokeStyle = '#3498db';
            ctx.setLineDash([]);
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.restore();
    },

    /**
     * 更新属性面板
     */
    updatePropertyPanel: function() {
        const propertyContent = document.getElementById('propertyContent');
        if (!propertyContent) return;

        const selectedCount = NodeManager.getSelectedCount();
        const selectedNode = NodeManager.getSelectedNode();
        const selectedConn = ConnectionManager.getSelectedConnection();

        if (selectedCount > 1) {
            // 多选节点
            this.renderMultiNodeProperties(propertyContent);
        } else if (selectedNode) {
            // 单个节点
            this.renderNodeProperties(propertyContent, selectedNode);
        } else if (selectedConn) {
            // 连线
            this.renderConnectionProperties(propertyContent, selectedConn);
        } else {
            // 无选择
            propertyContent.innerHTML = `
                <div class="property-empty">
                    <p>选择一个节点或连线</p>
                    <p>查看并编辑属性</p>
                    <p style="margin-top: 10px; font-size: 11px; color: #999;">
                        💡 提示：<br>
                        • Ctrl+A 全选节点<br>
                        • Shift+点击 多选节点<br>
                        • 拖拽空白区域 框选节点
                    </p>
                </div>
            `;
        }
    },

    /**
     * 渲染多选节点属性
     */
    renderMultiNodeProperties: function(container) {
        const count = NodeManager.getSelectedCount();
        const selectedNodes = NodeManager.getSelectedNodes();

        // 检查是否有共同属性
        const colors = [...new Set(selectedNodes.map(n => n.color))];
        const sameColor = colors.length === 1;

        container.innerHTML = `
            <div class="property-group">
                <div class="property-group-title">已选中 ${count} 个节点</div>
            </div>
            
            <div class="property-group">
                <div class="property-group-title">批量设置</div>
                <div class="property-row">
                    <span class="property-label">颜色:</span>
                    <input type="color" class="property-color" id="prop-multi-color" 
                           value="${sameColor ? colors[0] : '#888888'}"
                           style="opacity: ${sameColor ? 1 : 0.6};">
                </div>
            </div>
        `;

        // 绑定事件
        const colorInput = document.getElementById('prop-multi-color');
        if (colorInput) {
            colorInput.addEventListener('input', (e) => {
                for (const node of selectedNodes) {
                    NodeManager.updateNodeProperties(node.id, { color: e.target.value });
                }
                this.render();
                this.saveState();
            });
        }
    },

    /**
     * 渲染节点属性
     */
    renderNodeProperties: function(container, node) {
        const typeConfig = NodeTypes.getType(node.type);
        const typeName = typeConfig ? typeConfig.name : node.type;

        container.innerHTML = `
            <div class="property-group">
                <div class="property-group-title">基本信息</div>
                <div class="property-row">
                    <span class="property-label">类型:</span>
                    <span style="font-size: 13px; color: #555;">${typeName}</span>
                </div>
                <div class="property-row">
                    <span class="property-label">文字:</span>
                    <input type="text" class="property-input" id="prop-text" value="${this.escapeHtml(node.text)}">
                </div>
            </div>
            
            <div class="property-group">
                <div class="property-group-title">样式设置</div>
                <div class="property-row">
                    <span class="property-label">颜色:</span>
                    <input type="color" class="property-color" id="prop-color" value="${node.color}">
                </div>
                <div class="property-row">
                    <span class="property-label">宽度:</span>
                    <input type="number" class="property-input" id="prop-width" value="${node.width}" min="30" max="500">
                </div>
                <div class="property-row">
                    <span class="property-label">高度:</span>
                    <input type="number" class="property-input" id="prop-height" value="${node.height}" min="30" max="500">
                </div>
                <div class="property-row">
                    <span class="property-label">字号:</span>
                    <input type="number" class="property-input" id="prop-fontsize" value="${node.fontSize}" min="8" max="48">
                </div>
            </div>
        `;

        // 绑定事件
        this.bindNodePropertyEvents(node.id);
    },

    /**
     * 渲染连线属性
     */
    renderConnectionProperties: function(container, conn) {
        const lineStyleLabels = {
            'straight': '直线',
            'polyline': '折线',
            'curve': '曲线'
        };

        container.innerHTML = `
            <div class="property-group">
                <div class="property-group-title">基本信息</div>
                <div class="property-row">
                    <span class="property-label">标签:</span>
                    <input type="text" class="property-input" id="prop-label" value="${this.escapeHtml(conn.label)}" placeholder="双击连线编辑">
                </div>
            </div>
            
            <div class="property-group">
                <div class="property-group-title">样式设置</div>
                <div class="property-row">
                    <span class="property-label">颜色:</span>
                    <input type="color" class="property-color" id="prop-conn-color" value="${conn.color}">
                </div>
                <div class="property-row">
                    <span class="property-label">样式:</span>
                    <select class="property-select" id="prop-linestyle">
                        <option value="straight" ${conn.lineStyle === 'straight' ? 'selected' : ''}>直线</option>
                        <option value="polyline" ${conn.lineStyle === 'polyline' ? 'selected' : ''}>折线</option>
                        <option value="curve" ${conn.lineStyle === 'curve' ? 'selected' : ''}>曲线</option>
                    </select>
                </div>
                <div class="property-row">
                    <span class="property-label">线宽:</span>
                    <input type="number" class="property-input" id="prop-linewidth" value="${conn.width}" min="1" max="10">
                </div>
            </div>
        `;

        // 绑定事件
        this.bindConnectionPropertyEvents(conn.id);
    },

    /**
     * 绑定节点属性事件
     */
    bindNodePropertyEvents: function(nodeId) {
        const inputs = {
            text: document.getElementById('prop-text'),
            color: document.getElementById('prop-color'),
            width: document.getElementById('prop-width'),
            height: document.getElementById('prop-height'),
            fontSize: document.getElementById('prop-fontsize')
        };

        const updateProperty = (key, value) => {
            NodeManager.updateNodeProperties(nodeId, { [key]: value });
            this.render();
            this.saveState();
        };

        if (inputs.text) {
            inputs.text.addEventListener('input', (e) => updateProperty('text', e.target.value));
        }
        if (inputs.color) {
            inputs.color.addEventListener('input', (e) => updateProperty('color', e.target.value));
        }
        if (inputs.width) {
            inputs.width.addEventListener('change', (e) => updateProperty('width', parseInt(e.target.value) || 100));
        }
        if (inputs.height) {
            inputs.height.addEventListener('change', (e) => updateProperty('height', parseInt(e.target.value) || 80));
        }
        if (inputs.fontSize) {
            inputs.fontSize.addEventListener('change', (e) => updateProperty('fontSize', parseInt(e.target.value) || 14));
        }
    },

    /**
     * 绑定连线属性事件
     */
    bindConnectionPropertyEvents: function(connectionId) {
        const inputs = {
            label: document.getElementById('prop-label'),
            color: document.getElementById('prop-conn-color'),
            lineStyle: document.getElementById('prop-linestyle'),
            lineWidth: document.getElementById('prop-linewidth')
        };

        const updateProperty = (key, value) => {
            ConnectionManager.updateConnectionProperties(connectionId, { [key]: value });
            this.render();
            this.saveState();
        };

        if (inputs.label) {
            inputs.label.addEventListener('input', (e) => updateProperty('label', e.target.value));
        }
        if (inputs.color) {
            inputs.color.addEventListener('input', (e) => updateProperty('color', e.target.value));
        }
        if (inputs.lineStyle) {
            inputs.lineStyle.addEventListener('change', (e) => updateProperty('lineStyle', e.target.value));
        }
        if (inputs.lineWidth) {
            inputs.lineWidth.addEventListener('change', (e) => updateProperty('width', parseInt(e.target.value) || 2));
        }
    },

    /**
     * HTML转义
     */
    escapeHtml: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * 保存状态
     */
    saveState: function() {
        const data = {
            nodes: NodeManager.getSerializableData(),
            connections: ConnectionManager.getSerializableData(),
            canvasState: {
                scale: this.state.scale,
                panX: this.state.panX,
                panY: this.state.panY,
                gridSize: this.state.gridSize,
                showGrid: this.state.showGrid,
                gridSnap: this.state.gridSnap
            },
            version: '1.0',
            savedAt: new Date().toISOString()
        };

        Storage.save(data);
    },

    /**
     * 加载画布状态
     */
    loadCanvasState: function() {
        const savedData = Storage.load();
        if (savedData && savedData.canvasState) {
            this.state.scale = savedData.canvasState.scale || 1;
            this.state.panX = savedData.canvasState.panX || 0;
            this.state.panY = savedData.canvasState.panY || 0;
            this.state.gridSize = savedData.canvasState.gridSize || 20;
            this.state.showGrid = savedData.canvasState.showGrid !== false;
            this.state.gridSnap = savedData.canvasState.gridSnap !== false;

            this.updateZoomUI();
        }

        // 更新设置复选框
        const gridSnapEl = document.getElementById('gridSnap');
        const showGridEl = document.getElementById('showGrid');
        if (gridSnapEl) gridSnapEl.checked = this.state.gridSnap;
        if (showGridEl) showGridEl.checked = this.state.showGrid;
    },

    /**
     * 清空画布
     */
    clearCanvas: function() {
        NodeManager.clearAll();
        ConnectionManager.clearAll();
        this.state.scale = 1;
        this.state.panX = 0;
        this.state.panY = 0;
        this.updateZoomUI();
        this.render();
        this.saveState();
    },

    /**
     * 导出数据
     */
    exportData: function() {
        const data = {
            nodes: NodeManager.getSerializableData(),
            connections: ConnectionManager.getSerializableData(),
            canvasState: {
                scale: this.state.scale,
                panX: this.state.panX,
                panY: this.state.panY,
                gridSize: this.state.gridSize,
                showGrid: this.state.showGrid,
                gridSnap: this.state.gridSnap
            },
            version: '1.0',
            exportedAt: new Date().toISOString()
        };
        return data;
    },

    /**
     * 导入数据
     */
    importData: function(data) {
        if (!data) return false;

        try {
            if (data.nodes) {
                NodeManager.setNodes(data.nodes);
            }
            if (data.connections) {
                ConnectionManager.setConnections(data.connections);
            }
            if (data.canvasState) {
                this.state.scale = data.canvasState.scale || 1;
                this.state.panX = data.canvasState.panX || 0;
                this.state.panY = data.canvasState.panY || 0;
                this.state.gridSize = data.canvasState.gridSize || 20;
                this.state.showGrid = data.canvasState.showGrid !== false;
                this.state.gridSnap = data.canvasState.gridSnap !== false;

                this.updateZoomUI();

                // 更新设置复选框
                const gridSnapEl = document.getElementById('gridSnap');
                const showGridEl = document.getElementById('showGrid');
                if (gridSnapEl) gridSnapEl.checked = this.state.gridSnap;
                if (showGridEl) showGridEl.checked = this.state.showGrid;
            }

            NodeManager.deselectAll();
            ConnectionManager.deselectAll();
            this.render();
            this.saveState();

            return true;
        } catch (e) {
            console.error('导入数据失败:', e);
            return false;
        }
    }
};

// 暴露到全局
window.CanvasManager = CanvasManager;
