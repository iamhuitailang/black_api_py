/**
 * 节点管理模块
 * 负责节点的添加、删除、移动、编辑等操作
 */

const NodeManager = {
    // 节点数据
    nodes: [],
    
    // 当前选中的节点ID数组（支持多选）
    selectedNodeIds: [],
    
    // 正在编辑的节点ID
    editingNodeId: null,

    /**
     * 初始化
     */
    init: function() {
        this.nodes = [];
        this.selectedNodeIds = [];
        this.editingNodeId = null;
    },

    /**
     * 添加节点
     * @param {object} node 节点对象
     * @returns {object} 添加的节点
     */
    addNode: function(node) {
        this.nodes.push(node);
        return node;
    },

    /**
     * 根据ID获取节点
     * @param {string} id 节点ID
     * @returns {object|null} 节点对象
     */
    getNodeById: function(id) {
        return this.nodes.find(node => node.id === id) || null;
    },

    /**
     * 删除节点
     * @param {string} id 节点ID
     * @returns {boolean} 是否删除成功
     */
    removeNode: function(id) {
        const index = this.nodes.findIndex(node => node.id === id);
        if (index !== -1) {
            this.nodes.splice(index, 1);
            this.removeFromSelection(id);
            if (this.editingNodeId === id) {
                this.editingNodeId = null;
            }
            return true;
        }
        return false;
    },

    /**
     * 删除所有选中的节点
     * @returns {number} 删除的节点数量
     */
    removeSelectedNodes: function() {
        const count = this.selectedNodeIds.length;
        for (const id of [...this.selectedNodeIds]) {
            this.removeNode(id);
        }
        return count;
    },

    /**
     * 删除所有节点
     */
    clearAll: function() {
        this.nodes = [];
        this.selectedNodeIds = [];
        this.editingNodeId = null;
    },

    /**
     * 选择单个节点（会取消其他选择）
     * @param {string} id 节点ID
     */
    selectNode: function(id) {
        this.selectedNodeIds = id ? [id] : [];
        if (id) {
            const node = this.getNodeById(id);
            if (node) {
                node.zIndex = Date.now();
            }
        }
    },

    /**
     * 添加节点到选择（保持现有选择）
     * @param {string} id 节点ID
     */
    addToSelection: function(id) {
        if (id && !this.isNodeSelected(id)) {
            this.selectedNodeIds.push(id);
            const node = this.getNodeById(id);
            if (node) {
                node.zIndex = Date.now();
            }
        }
    },

    /**
     * 从选择中移除节点
     * @param {string} id 节点ID
     */
    removeFromSelection: function(id) {
        const index = this.selectedNodeIds.indexOf(id);
        if (index !== -1) {
            this.selectedNodeIds.splice(index, 1);
        }
    },

    /**
     * 切换节点选择状态
     * @param {string} id 节点ID
     */
    toggleNodeSelection: function(id) {
        if (this.isNodeSelected(id)) {
            this.removeFromSelection(id);
        } else {
            this.addToSelection(id);
        }
    },

    /**
     * 取消选择所有
     */
    deselectAll: function() {
        this.selectedNodeIds = [];
    },

    /**
     * 全选所有节点
     */
    selectAll: function() {
        this.selectedNodeIds = this.nodes.map(node => node.id);
        // 更新 zIndex 让选中的节点在最上层
        const now = Date.now();
        for (const id of this.selectedNodeIds) {
            const node = this.getNodeById(id);
            if (node) {
                node.zIndex = now;
            }
        }
    },

    /**
     * 选择指定矩形区域内的节点
     * @param {number} x1 矩形左上角 x
     * @param {number} y1 矩形左上角 y
     * @param {number} x2 矩形右下角 x
     * @param {number} y2 矩形右下角 y
     * @param {boolean} addToExisting 是否添加到现有选择
     */
    selectNodesInRect: function(x1, y1, x2, y2, addToExisting = false) {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);

        const nodesInRect = [];

        for (const node of this.nodes) {
            // 检查节点是否与矩形相交
            const nodeRight = node.x + node.width;
            const nodeBottom = node.y + node.height;

            // 简单的矩形相交检测
            if (node.x <= maxX && nodeRight >= minX &&
                node.y <= maxY && nodeBottom >= minY) {
                nodesInRect.push(node.id);
            }
        }

        if (addToExisting) {
            for (const id of nodesInRect) {
                if (!this.isNodeSelected(id)) {
                    this.addToSelection(id);
                }
            }
        } else {
            this.selectedNodeIds = nodesInRect;
        }
    },

    /**
     * 检查节点是否被选中
     * @param {string} id 节点ID
     * @returns {boolean} 是否选中
     */
    isNodeSelected: function(id) {
        return this.selectedNodeIds.indexOf(id) !== -1;
    },

    /**
     * 获取选中的节点数量
     * @returns {number} 数量
     */
    getSelectedCount: function() {
        return this.selectedNodeIds.length;
    },

    /**
     * 获取第一个选中的节点（保持向后兼容）
     * @returns {object|null} 选中的节点
     */
    getSelectedNode: function() {
        if (this.selectedNodeIds.length > 0) {
            return this.getNodeById(this.selectedNodeIds[0]);
        }
        return null;
    },

    /**
     * 获取所有选中的节点
     * @returns {Array} 选中的节点数组
     */
    getSelectedNodes: function() {
        return this.selectedNodeIds.map(id => this.getNodeById(id)).filter(n => n !== null);
    },

    /**
     * 更新节点位置
     * @param {string} id 节点ID
     * @param {number} x 新的x坐标
     * @param {number} y 新的y坐标
     */
    updateNodePosition: function(id, x, y) {
        const node = this.getNodeById(id);
        if (node) {
            node.x = x;
            node.y = y;
        }
    },

    /**
     * 更新所有选中节点的位置（相对移动）
     * @param {number} dx x方向偏移
     * @param {number} dy y方向偏移
     */
    moveSelectedNodes: function(dx, dy) {
        for (const node of this.getSelectedNodes()) {
            node.x += dx;
            node.y += dy;
        }
    },

    /**
     * 更新节点属性
     * @param {string} id 节点ID
     * @param {object} properties 要更新的属性
     */
    updateNodeProperties: function(id, properties) {
        const node = this.getNodeById(id);
        if (node) {
            for (const key in properties) {
                if (properties.hasOwnProperty(key) && node.hasOwnProperty(key)) {
                    node[key] = properties[key];
                }
            }
        }
    },

    /**
     * 更新所有选中节点的属性
     * @param {object} properties 要更新的属性
     */
    updateSelectedNodesProperties: function(properties) {
        for (const id of this.selectedNodeIds) {
            this.updateNodeProperties(id, properties);
        }
    },

    /**
     * 查找指定位置的节点
     * @param {number} x x坐标
     * @param {number} y y坐标
     * @param {object} canvasState 画布状态（缩放、平移）
     * @returns {object|null} 找到的节点
     */
    findNodeAtPoint: function(x, y, canvasState) {
        // 转换屏幕坐标到画布坐标
        const canvasX = (x - canvasState.panX) / canvasState.scale;
        const canvasY = (y - canvasState.panY) / canvasState.scale;

        // 按 z-index 从高到低排序
        const sortedNodes = [...this.nodes].sort((a, b) => b.zIndex - a.zIndex);

        for (const node of sortedNodes) {
            if (NodeTypes.isPointInNode(canvasX, canvasY, node)) {
                return node;
            }
        }
        return null;
    },

    /**
     * 查找最近的连接点
     * @param {number} x 屏幕x坐标
     * @param {number} y 屏幕y坐标
     * @param {object} canvasState 画布状态
     * @param {string} excludeNodeId 要排除的节点ID
     * @returns {object|null} 最近的连接点信息
     */
    findNearestConnectionPoint: function(x, y, canvasState, excludeNodeId = null) {
        const canvasX = (x - canvasState.panX) / canvasState.scale;
        const canvasY = (y - canvasState.panY) / canvasState.scale;

        let nearestPoint = null;
        let minDist = Infinity;

        for (const node of this.nodes) {
            if (excludeNodeId && node.id === excludeNodeId) {
                continue;
            }

            const point = NodeTypes.findNearestConnectionPoint(canvasX, canvasY, node);
            if (point) {
                const dist = Utils.distance(canvasX, canvasY, point.x, point.y);
                if (dist < minDist) {
                    minDist = dist;
                    nearestPoint = point;
                }
            }
        }

        return nearestPoint;
    },

    /**
     * 开始编辑节点文字
     * @param {string} nodeId 节点ID
     */
    startEditing: function(nodeId) {
        this.editingNodeId = nodeId;
    },

    /**
     * 结束编辑
     */
    stopEditing: function() {
        this.editingNodeId = null;
    },

    /**
     * 获取所有节点
     * @returns {Array} 节点数组
     */
    getAllNodes: function() {
        return this.nodes;
    },

    /**
     * 设置节点数据（用于加载）
     * @param {Array} nodes 节点数组
     */
    setNodes: function(nodes) {
        this.nodes = nodes || [];
    },

    /**
     * 获取可序列化的数据
     * @returns {Array} 节点数据
     */
    getSerializableData: function() {
        return this.nodes.map(node => ({
            id: node.id,
            type: node.type,
            x: node.x,
            y: node.y,
            width: node.width,
            height: node.height,
            color: node.color,
            text: node.text,
            textColor: node.textColor,
            fontSize: node.fontSize,
            fontFamily: node.fontFamily,
            zIndex: node.zIndex
        }));
    }
};

// 暴露到全局
window.NodeManager = NodeManager;
