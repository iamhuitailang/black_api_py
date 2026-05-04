/**
 * 连线管理模块
 * 负责连线的创建、编辑、删除等操作
 */

const ConnectionManager = {
    // 连线数据
    connections: [],
    
    // 当前选中的连线ID数组（支持多选）
    selectedConnectionIds: [],
    
    // 正在编辑的连线ID
    selectedConnectionLabelId: null,

    /**
     * 初始化
     */
    init: function() {
        this.connections = [];
        this.selectedConnectionIds = [];
        this.selectedConnectionLabelId = null;
    },

    /**
     * 创建连线
     * @param {string} fromNodeId 起始节点ID
     * @param {string} fromPoint 起始连接点名称
     * @param {string} toNodeId 目标节点ID
     * @param {string} toPoint 目标连接点名称
     * @returns {object} 新的连线对象
     */
    createConnection: function(fromNodeId, fromPoint, toNodeId, toPoint) {
        const connection = {
            id: Utils.generateId(),
            fromNodeId: fromNodeId,
            fromPoint: fromPoint,
            toNodeId: toNodeId,
            toPoint: toPoint,
            color: '#555555',
            width: 2,
            lineStyle: 'straight', // straight, polyline, curve
            label: '',
            labelColor: '#333333',
            labelFontSize: 12,
            zIndex: Date.now()
        };
        return connection;
    },

    /**
     * 添加连线
     * @param {object} connection 连线对象
     * @returns {object} 添加的连线
     */
    addConnection: function(connection) {
        this.connections.push(connection);
        return connection;
    },

    /**
     * 根据ID获取连线
     * @param {string} id 连线ID
     * @returns {object|null} 连线对象
     */
    getConnectionById: function(id) {
        return this.connections.find(conn => conn.id === id) || null;
    },

    /**
     * 删除连线
     * @param {string} id 连线ID
     * @returns {boolean} 是否删除成功
     */
    removeConnection: function(id) {
        const index = this.connections.findIndex(conn => conn.id === id);
        if (index !== -1) {
            this.connections.splice(index, 1);
            this.removeFromSelection(id);
            return true;
        }
        return false;
    },

    /**
     * 删除所有选中的连线
     * @returns {number} 删除的连线数量
     */
    removeSelectedConnections: function() {
        const count = this.selectedConnectionIds.length;
        for (const id of [...this.selectedConnectionIds]) {
            this.removeConnection(id);
        }
        return count;
    },

    /**
     * 删除与指定节点相关的所有连线
     * @param {string} nodeId 节点ID
     */
    removeConnectionsByNode: function(nodeId) {
        this.connections = this.connections.filter(conn => {
            const related = conn.fromNodeId === nodeId || conn.toNodeId === nodeId;
            if (related) {
                this.removeFromSelection(conn.id);
            }
            return !related;
        });
    },

    /**
     * 删除所有连线
     */
    clearAll: function() {
        this.connections = [];
        this.selectedConnectionIds = [];
    },

    /**
     * 选择单个连线（会取消其他选择）
     * @param {string} id 连线ID
     */
    selectConnection: function(id) {
        this.selectedConnectionIds = id ? [id] : [];
        if (id) {
            const conn = this.getConnectionById(id);
            if (conn) {
                conn.zIndex = Date.now();
            }
        }
    },

    /**
     * 添加连线到选择（保持现有选择）
     * @param {string} id 连线ID
     */
    addToSelection: function(id) {
        if (id && !this.isConnectionSelected(id)) {
            this.selectedConnectionIds.push(id);
            const conn = this.getConnectionById(id);
            if (conn) {
                conn.zIndex = Date.now();
            }
        }
    },

    /**
     * 从选择中移除连线
     * @param {string} id 连线ID
     */
    removeFromSelection: function(id) {
        const index = this.selectedConnectionIds.indexOf(id);
        if (index !== -1) {
            this.selectedConnectionIds.splice(index, 1);
        }
    },

    /**
     * 切换连线选择状态
     * @param {string} id 连线ID
     */
    toggleConnectionSelection: function(id) {
        if (this.isConnectionSelected(id)) {
            this.removeFromSelection(id);
        } else {
            this.addToSelection(id);
        }
    },

    /**
     * 取消选择所有
     */
    deselectAll: function() {
        this.selectedConnectionIds = [];
    },

    /**
     * 检查连线是否被选中
     * @param {string} id 连线ID
     * @returns {boolean} 是否选中
     */
    isConnectionSelected: function(id) {
        return this.selectedConnectionIds.indexOf(id) !== -1;
    },

    /**
     * 获取选中的连线数量
     * @returns {number} 数量
     */
    getSelectedCount: function() {
        return this.selectedConnectionIds.length;
    },

    /**
     * 获取第一个选中的连线（保持向后兼容）
     * @returns {object|null} 选中的连线
     */
    getSelectedConnection: function() {
        if (this.selectedConnectionIds.length > 0) {
            return this.getConnectionById(this.selectedConnectionIds[0]);
        }
        return null;
    },

    /**
     * 获取所有选中的连线
     * @returns {Array} 选中的连线数组
     */
    getSelectedConnections: function() {
        return this.selectedConnectionIds.map(id => this.getConnectionById(id)).filter(c => c !== null);
    },

    /**
     * 更新连线属性
     * @param {string} id 连线ID
     * @param {object} properties 要更新的属性
     */
    updateConnectionProperties: function(id, properties) {
        const conn = this.getConnectionById(id);
        if (conn) {
            for (const key in properties) {
                if (properties.hasOwnProperty(key) && conn.hasOwnProperty(key)) {
                    conn[key] = properties[key];
                }
            }
        }
    },

    /**
     * 更新所有选中连线的属性
     * @param {object} properties 要更新的属性
     */
    updateSelectedConnectionsProperties: function(properties) {
        for (const id of this.selectedConnectionIds) {
            this.updateConnectionProperties(id, properties);
        }
    },

    /**
     * 获取连线的实际起点和终点坐标
     * @param {object} connection 连线对象
     * @returns {object} 包含起点和终点坐标的对象
     */
    getConnectionPoints: function(connection) {
        const fromNode = NodeManager.getNodeById(connection.fromNodeId);
        const toNode = NodeManager.getNodeById(connection.toNodeId);

        if (!fromNode || !toNode) {
            return null;
        }

        const fromPoints = NodeTypes.getConnectionPoints(fromNode);
        const toPoints = NodeTypes.getConnectionPoints(toNode);

        const fromPoint = fromPoints.find(p => p.name === connection.fromPoint);
        const toPoint = toPoints.find(p => p.name === connection.toPoint);

        if (!fromPoint || !toPoint) {
            return null;
        }

        return {
            from: { x: fromPoint.x, y: fromPoint.y },
            to: { x: toPoint.x, y: toPoint.y }
        };
    },

    /**
     * 检查点是否在连线上
     * @param {number} px 点 x坐标（画布坐标）
     * @param {number} py 点 y坐标（画布坐标）
     * @param {object} connection 连线对象
     * @returns {boolean} 是否在连线上
     */
    isPointOnConnection: function(px, py, connection) {
        const points = this.getConnectionPoints(connection);
        if (!points) {
            return false;
        }

        const tolerance = 10; // 点击容差

        switch (connection.lineStyle) {
            case 'curve':
                // 曲线 - 分段检查
                const controlPoint1 = {
                    x: points.from.x + (points.to.x - points.from.x) * 0.33,
                    y: points.from.y
                };
                const controlPoint2 = {
                    x: points.from.x + (points.to.x - points.from.x) * 0.67,
                    y: points.to.y
                };

                for (let t = 0; t <= 1; t += 0.05) {
                    const x = Utils.cubicBezier(points.from.x, controlPoint1.x, controlPoint2.x, points.to.x, t);
                    const y = Utils.cubicBezier(points.from.y, controlPoint1.y, controlPoint2.y, points.to.y, t);
                    if (Utils.distance(px, py, x, y) < tolerance) {
                        return true;
                    }
                }
                return false;

            case 'polyline':
                // 折线 - 检查两段
                const midX = (points.from.x + points.to.x) / 2;
                const dist1 = Utils.pointToLineDistance(px, py, points.from.x, points.from.y, midX, points.from.y);
                const dist2 = Utils.pointToLineDistance(px, py, midX, points.from.y, midX, points.to.y);
                const dist3 = Utils.pointToLineDistance(px, py, midX, points.to.y, points.to.x, points.to.y);
                return Math.min(dist1, dist2, dist3) < tolerance;

            case 'straight':
            default:
                // 直线
                const dist = Utils.pointToLineDistance(px, py, points.from.x, points.from.y, points.to.x, points.to.y);
                return dist < tolerance;
        }
    },

    /**
     * 查找指定位置的连线
     * @param {number} x 屏幕x坐标
     * @param {number} y 屏幕y坐标
     * @param {object} canvasState 画布状态
     * @returns {object|null} 找到的连线
     */
    findConnectionAtPoint: function(x, y, canvasState) {
        const canvasX = (x - canvasState.panX) / canvasState.scale;
        const canvasY = (y - canvasState.panY) / canvasState.scale;

        const sortedConns = [...this.connections].sort((a, b) => b.zIndex - a.zIndex);

        for (const conn of sortedConns) {
            if (this.isPointOnConnection(canvasX, canvasY, conn)) {
                return conn;
            }
        }
        return null;
    },

    /**
     * 获取连线标签位置
     * @param {object} connection 连线对象
     * @returns {object|null} 标签位置 {x, y}
     */
    getLabelPosition: function(connection) {
        const points = this.getConnectionPoints(connection);
        if (!points) {
            return null;
        }

        return {
            x: (points.from.x + points.to.x) / 2,
            y: (points.from.y + points.to.y) / 2
        };
    },

    /**
     * 检查点是否在连线标签附近
     * @param {number} px 点 x坐标
     * @param {number} py 点 y坐标
     * @param {object} connection 连线对象
     * @returns {boolean} 是否在标签附近
     */
    isPointOnLabel: function(px, py, connection) {
        if (!connection.label) {
            return false;
        }

        const labelPos = this.getLabelPosition(connection);
        if (!labelPos) {
            return false;
        }

        const tolerance = 30;
        return Utils.distance(px, py, labelPos.x, labelPos.y) < tolerance;
    },

    /**
     * 获取所有连线
     * @returns {Array} 连线数组
     */
    getAllConnections: function() {
        return this.connections;
    },

    /**
     * 设置连线数据（用于加载）
     * @param {Array} connections 连线数组
     */
    setConnections: function(connections) {
        this.connections = connections || [];
    },

    /**
     * 获取可序列化的数据
     * @returns {Array} 连线数据
     */
    getSerializableData: function() {
        return this.connections.map(conn => ({
            id: conn.id,
            fromNodeId: conn.fromNodeId,
            fromPoint: conn.fromPoint,
            toNodeId: conn.toNodeId,
            toPoint: conn.toPoint,
            color: conn.color,
            width: conn.width,
            lineStyle: conn.lineStyle,
            label: conn.label,
            labelColor: conn.labelColor,
            labelFontSize: conn.labelFontSize,
            zIndex: conn.zIndex
        }));
    }
};

// 暴露到全局
window.ConnectionManager = ConnectionManager;
