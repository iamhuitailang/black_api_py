/**
 * 轨道系统模块
 * 定义轨道类型、轨道连接关系和轨道属性
 */

// 轨道类型枚举
const TrackType = {
    // 直轨
    STRAIGHT_HORIZONTAL: '─',
    STRAIGHT_VERTICAL: '│',
    
    // 弯轨
    CURVE_TOP_LEFT: '┌',
    CURVE_TOP_RIGHT: '┐',
    CURVE_BOTTOM_LEFT: '└',
    CURVE_BOTTOM_RIGHT: '┘',
    
    // 道岔（可切换方向）
    SWITCH_TOP: '┬',
    SWITCH_BOTTOM: '┴',
    SWITCH_LEFT: '├',
    SWITCH_RIGHT: '┤',
    
    // 信号灯
    SIGNAL: '⚪',
    
    // 站台
    PLATFORM: '🚉',
    
    // 入口
    ENTRANCE: '🟢',
    
    // 空格（无轨道）
    EMPTY: ' '
};

// 轨道方向定义
const TrackDirection = {
    UP: 'up',
    DOWN: 'down',
    LEFT: 'left',
    RIGHT: 'right'
};

// 轨道连接映射 - 定义每种轨道可以连接的方向
const TrackConnections = {
    [TrackType.STRAIGHT_HORIZONTAL]: {
        [TrackDirection.LEFT]: TrackDirection.RIGHT,
        [TrackDirection.RIGHT]: TrackDirection.LEFT
    },
    [TrackType.STRAIGHT_VERTICAL]: {
        [TrackDirection.UP]: TrackDirection.DOWN,
        [TrackDirection.DOWN]: TrackDirection.UP
    },
    [TrackType.CURVE_TOP_LEFT]: {
        [TrackDirection.UP]: TrackDirection.LEFT,
        [TrackDirection.LEFT]: TrackDirection.UP
    },
    [TrackType.CURVE_TOP_RIGHT]: {
        [TrackDirection.UP]: TrackDirection.RIGHT,
        [TrackDirection.RIGHT]: TrackDirection.UP
    },
    [TrackType.CURVE_BOTTOM_LEFT]: {
        [TrackDirection.DOWN]: TrackDirection.LEFT,
        [TrackDirection.LEFT]: TrackDirection.DOWN
    },
    [TrackType.CURVE_BOTTOM_RIGHT]: {
        [TrackDirection.DOWN]: TrackDirection.RIGHT,
        [TrackDirection.RIGHT]: TrackDirection.DOWN
    },
    [TrackType.SWITCH_TOP]: {
        [TrackDirection.DOWN]: [TrackDirection.LEFT, TrackDirection.RIGHT],
        [TrackDirection.LEFT]: TrackDirection.DOWN,
        [TrackDirection.RIGHT]: TrackDirection.DOWN
    },
    [TrackType.SWITCH_BOTTOM]: {
        [TrackDirection.UP]: [TrackDirection.LEFT, TrackDirection.RIGHT],
        [TrackDirection.LEFT]: TrackDirection.UP,
        [TrackDirection.RIGHT]: TrackDirection.UP
    },
    [TrackType.SWITCH_LEFT]: {
        [TrackDirection.RIGHT]: [TrackDirection.UP, TrackDirection.DOWN],
        [TrackDirection.UP]: TrackDirection.RIGHT,
        [TrackDirection.DOWN]: TrackDirection.RIGHT
    },
    [TrackType.SWITCH_RIGHT]: {
        [TrackDirection.LEFT]: [TrackDirection.UP, TrackDirection.DOWN],
        [TrackDirection.UP]: TrackDirection.LEFT,
        [TrackDirection.DOWN]: TrackDirection.LEFT
    },
    [TrackType.SIGNAL]: {
        [TrackDirection.LEFT]: TrackDirection.RIGHT,
        [TrackDirection.RIGHT]: TrackDirection.LEFT,
        [TrackDirection.UP]: TrackDirection.DOWN,
        [TrackDirection.DOWN]: TrackDirection.UP
    },
    [TrackType.PLATFORM]: {
        [TrackDirection.LEFT]: TrackDirection.RIGHT,
        [TrackDirection.RIGHT]: TrackDirection.LEFT,
        [TrackDirection.UP]: TrackDirection.DOWN,
        [TrackDirection.DOWN]: TrackDirection.UP
    },
    [TrackType.ENTRANCE]: {
        [TrackDirection.LEFT]: TrackDirection.RIGHT,
        [TrackDirection.RIGHT]: TrackDirection.LEFT,
        [TrackDirection.UP]: TrackDirection.DOWN,
        [TrackDirection.DOWN]: TrackDirection.UP
    }
};

// 方向偏移量
const DirectionOffset = {
    [TrackDirection.UP]: { x: 0, y: -1 },
    [TrackDirection.DOWN]: { x: 0, y: 1 },
    [TrackDirection.LEFT]: { x: -1, y: 0 },
    [TrackDirection.RIGHT]: { x: 1, y: 0 }
};

// 相反方向映射
const OppositeDirection = {
    [TrackDirection.UP]: TrackDirection.DOWN,
    [TrackDirection.DOWN]: TrackDirection.UP,
    [TrackDirection.LEFT]: TrackDirection.RIGHT,
    [TrackDirection.RIGHT]: TrackDirection.LEFT
};

/**
 * Track模块
 */
const Track = {
    TrackType,
    TrackDirection,
    TrackConnections,
    DirectionOffset,
    OppositeDirection,

    /**
     * 检查轨道类型是否是直轨
     * @param {string} type - 轨道类型
     * @returns {boolean}
     */
    isStraight(type) {
        return type === TrackType.STRAIGHT_HORIZONTAL || 
               type === TrackType.STRAIGHT_VERTICAL;
    },

    /**
     * 检查轨道类型是否是弯轨
     * @param {string} type - 轨道类型
     * @returns {boolean}
     */
    isCurve(type) {
        return type === TrackType.CURVE_TOP_LEFT ||
               type === TrackType.CURVE_TOP_RIGHT ||
               type === TrackType.CURVE_BOTTOM_LEFT ||
               type === TrackType.CURVE_BOTTOM_RIGHT;
    },

    /**
     * 检查轨道类型是否是道岔
     * @param {string} type - 轨道类型
     * @returns {boolean}
     */
    isSwitch(type) {
        return type === TrackType.SWITCH_TOP ||
               type === TrackType.SWITCH_BOTTOM ||
               type === TrackType.SWITCH_LEFT ||
               type === TrackType.SWITCH_RIGHT;
    },

    /**
     * 检查轨道类型是否是信号灯
     * @param {string} type - 轨道类型
     * @returns {boolean}
     */
    isSignal(type) {
        return type === TrackType.SIGNAL;
    },

    /**
     * 检查轨道类型是否是站台
     * @param {string} type - 轨道类型
     * @returns {boolean}
     */
    isPlatform(type) {
        return type === TrackType.PLATFORM;
    },

    /**
     * 检查轨道类型是否是入口
     * @param {string} type - 轨道类型
     * @returns {boolean}
     */
    isEntrance(type) {
        return type === TrackType.ENTRANCE;
    },

    /**
     * 检查轨道类型是否为空
     * @param {string} type - 轨道类型
     * @returns {boolean}
     */
    isEmpty(type) {
        return type === TrackType.EMPTY || !type;
    },

    /**
     * 获取轨道可以连接的方向
     * @param {string} type - 轨道类型
     * @returns {Array} 方向数组
     */
    getAvailableDirections(type) {
        if (this.isEmpty(type)) {
            return [];
        }
        const connections = TrackConnections[type];
        if (!connections) {
            return [];
        }
        return Object.keys(connections);
    },

    /**
     * 获取从一个方向进入轨道后的出口方向
     * @param {string} type - 轨道类型
     * @param {string} enterDirection - 进入方向
     * @param {Object} switchState - 道岔状态（如果是道岔）
     * @returns {string|null} 出口方向，如果无法通过则返回null
     */
    getExitDirection(type, enterDirection, switchState = null) {
        if (this.isEmpty(type)) {
            return null;
        }

        const connections = TrackConnections[type];
        if (!connections) {
            return null;
        }

        const possibleExits = connections[enterDirection];
        if (!possibleExits) {
            return null;
        }

        // 如果是数组（道岔有多个出口），根据道岔状态选择
        if (Array.isArray(possibleExits)) {
            if (switchState !== null && switchState >= 0 && switchState < possibleExits.length) {
                return possibleExits[switchState];
            }
            // 默认返回第一个选项
            return possibleExits[0];
        }

        return possibleExits;
    },

    /**
     * 获取方向的偏移量
     * @param {string} direction - 方向
     * @returns {Object} {x, y} 偏移量
     */
    getDirectionOffset(direction) {
        return DirectionOffset[direction] || { x: 0, y: 0 };
    },

    /**
     * 获取相反方向
     * @param {string} direction - 方向
     * @returns {string} 相反方向
     */
    getOppositeDirection(direction) {
        return OppositeDirection[direction];
    },

    /**
     * 根据坐标计算方向
     * @param {number} fromX - 起始X
     * @param {number} fromY - 起始Y
     * @param {number} toX - 目标X
     * @param {number} toY - 目标Y
     * @returns {string|null} 方向
     */
    getDirectionFromCoords(fromX, fromY, toX, toY) {
        const dx = toX - fromX;
        const dy = toY - fromY;

        if (dx === 0 && dy === -1) return TrackDirection.UP;
        if (dx === 0 && dy === 1) return TrackDirection.DOWN;
        if (dx === -1 && dy === 0) return TrackDirection.LEFT;
        if (dx === 1 && dy === 0) return TrackDirection.RIGHT;

        return null;
    }
};

export default Track;
