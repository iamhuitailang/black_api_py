/**
 * 节点类型定义模块
 * 定义所有支持的节点类型及其属性
 */

const NodeTypes = {
    // 节点类型定义
    types: {
        // 椭圆 - 开始/结束
        ellipse: {
            name: '开始/结束',
            description: '流程的开始或结束节点',
            defaultWidth: 140,
            defaultHeight: 70,
            defaultColor: '#4CAF50',
            defaultText: '开始',
            textColor: '#ffffff',
            fontSize: 14,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },

        // 矩形 - 处理步骤
        rectangle: {
            name: '处理步骤',
            description: '普通操作步骤',
            defaultWidth: 140,
            defaultHeight: 80,
            defaultColor: '#2196F3',
            defaultText: '处理',
            textColor: '#ffffff',
            fontSize: 14,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },

        // 菱形 - 判断分支
        diamond: {
            name: '判断分支',
            description: '条件决策节点',
            defaultWidth: 120,
            defaultHeight: 80,
            defaultColor: '#FF9800',
            defaultText: '判断',
            textColor: '#ffffff',
            fontSize: 14,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },

        // 圆角矩形 - 子流程
        'rounded-rect': {
            name: '子流程',
            description: '子程序或子流程',
            defaultWidth: 140,
            defaultHeight: 80,
            defaultColor: '#9C27B0',
            defaultText: '子流程',
            textColor: '#ffffff',
            fontSize: 14,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },

        // 文档形 - 文档/数据
        document: {
            name: '文档/数据',
            description: '输入输出或文档',
            defaultWidth: 120,
            defaultHeight: 80,
            defaultColor: '#607D8B',
            defaultText: '文档',
            textColor: '#ffffff',
            fontSize: 14,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },

        // 圆形 - 连接点
        circle: {
            name: '连接点',
            description: '跨页连接或汇合点',
            defaultWidth: 60,
            defaultHeight: 60,
            defaultColor: '#03A9F4',
            defaultText: 'A',
            textColor: '#ffffff',
            fontSize: 16,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }
    },

    /**
     * 获取节点类型配置
     * @param {string} type 节点类型
     * @returns {object|null} 节点类型配置
     */
    getType: function(type) {
        return this.types[type] || null;
    },

    /**
     * 获取所有节点类型
     * @returns {object} 所有节点类型
     */
    getAllTypes: function() {
        return this.types;
    },

    /**
     * 检查节点类型是否存在
     * @param {string} type 节点类型
     * @returns {boolean} 是否存在
     */
    hasType: function(type) {
        return this.types.hasOwnProperty(type);
    },

    /**
     * 创建新节点
     * @param {string} type 节点类型
     * @param {number} x x坐标
     * @param {number} y y坐标
     * @returns {object} 新节点对象
     */
    createNode: function(type, x, y) {
        const typeConfig = this.getType(type);
        if (!typeConfig) {
            console.error('未知的节点类型:', type);
            return null;
        }

        return {
            id: Utils.generateId(),
            type: type,
            x: x,
            y: y,
            width: typeConfig.defaultWidth,
            height: typeConfig.defaultHeight,
            color: typeConfig.defaultColor,
            text: typeConfig.defaultText,
            textColor: typeConfig.textColor,
            fontSize: typeConfig.fontSize,
            fontFamily: typeConfig.fontFamily,
            zIndex: Date.now()
        };
    },

    /**
     * 获取节点连接点位置
     * 每个节点有8个连接点：上、下、左、右、以及四个角
     * @param {object} node 节点对象
     * @returns {Array} 连接点数组
     */
    getConnectionPoints: function(node) {
        const points = [];
        const x = node.x;
        const y = node.y;
        const w = node.width;
        const h = node.height;

        // 4个基本方向的连接点
        points.push({ name: 'top', x: x + w / 2, y: y });
        points.push({ name: 'bottom', x: x + w / 2, y: y + h });
        points.push({ name: 'left', x: x, y: y + h / 2 });
        points.push({ name: 'right', x: x + w, y: y + h / 2 });

        // 4个角的连接点
        points.push({ name: 'top-left', x: x, y: y });
        points.push({ name: 'top-right', x: x + w, y: y });
        points.push({ name: 'bottom-left', x: x, y: y + h });
        points.push({ name: 'bottom-right', x: x + w, y: y + h });

        return points;
    },

    /**
     * 检查点是否在节点内
     * @param {number} px 点 x坐标
     * @param {number} py 点 y坐标
     * @param {object} node 节点对象
     * @returns {boolean} 是否在节点内
     */
    isPointInNode: function(px, py, node) {
        const type = node.type;
        const x = node.x;
        const y = node.y;
        const w = node.width;
        const h = node.height;
        const cx = x + w / 2;
        const cy = y + h / 2;

        switch (type) {
            case 'ellipse':
                // 椭圆
                const rx = w / 2;
                const ry = h / 2;
                const normX = (px - cx) / rx;
                const normY = (py - cy) / ry;
                return normX * normX + normY * normY <= 1;

            case 'circle':
                // 圆形
                const radius = Math.min(w, h) / 2;
                return Utils.pointInCircle(px, py, cx, cy, radius);

            case 'diamond':
                // 菱形
                return Utils.pointInDiamond(px, py, cx, cy, w / 2, h / 2);

            case 'rectangle':
            case 'rounded-rect':
            case 'document':
            default:
                // 矩形
                return Utils.pointInRect(px, py, x, y, w, h);
        }
    },

    /**
     * 查找最近的连接点
     * @param {number} px 点 x坐标
     * @param {number} py 点 y坐标
     * @param {object} node 节点对象
     * @returns {object|null} 最近的连接点
     */
    findNearestConnectionPoint: function(px, py, node) {
        const points = this.getConnectionPoints(node);
        let nearest = null;
        let minDist = Infinity;

        for (const point of points) {
            const dist = Utils.distance(px, py, point.x, point.y);
            if (dist < minDist && dist < 30) {
                minDist = dist;
                nearest = { ...point, nodeId: node.id };
            }
        }

        return nearest;
    }
};

// 暴露到全局
window.NodeTypes = NodeTypes;