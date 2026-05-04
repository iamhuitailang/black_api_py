/**
 * 道岔模块
 * 管理道岔的状态和切换
 */

// 道岔类型
const SwitchType = {
    TOP: '┬',
    BOTTOM: '┴',
    LEFT: '├',
    RIGHT: '┤'
};

/**
 * Switch类 - 道岔
 */
class Switch {
    /**
     * 构造函数
     * @param {Object} options - 道岔配置
     */
    constructor(options = {}) {
        this.id = options.id || `switch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.type = options.type || SwitchType.TOP;
        
        // 道岔状态：0 或 1，表示当前选择的方向
        this.state = options.state || 0;
        
        // 可选的方向数量
        this.directionCount = this.getDirectionCount();
        
        // 动画状态
        this.isAnimating = false;
        this.animationProgress = 0;
        
        // 点击区域（用于检测鼠标点击）
        this.clickRadius = 20;
    }

    /**
     * 获取道岔的可选方向数量
     * @returns {number}
     */
    getDirectionCount() {
        // 所有道岔都有2个可选方向
        return 2;
    }

    /**
     * 切换道岔方向
     * @returns {number} 新的状态
     */
    toggle() {
        this.state = (this.state + 1) % this.directionCount;
        this.isAnimating = true;
        this.animationProgress = 0;
        return this.state;
    }

    /**
     * 设置道岔状态
     * @param {number} state - 状态值
     */
    setState(state) {
        if (state >= 0 && state < this.directionCount) {
            this.state = state;
        }
    }

    /**
     * 检查点是否在道岔的点击区域内
     * @param {number} px - 点击X坐标（像素）
     * @param {number} py - 点击Y坐标（像素）
     * @param {number} gridSize - 网格大小
     * @param {number} offsetX - 偏移X
     * @param {number} offsetY - 偏移Y
     * @returns {boolean}
     */
    isPointInSwitch(px, py, gridSize, offsetX = 0, offsetY = 0) {
        const centerX = this.x * gridSize + gridSize / 2 + offsetX;
        const centerY = this.y * gridSize + gridSize / 2 + offsetY;
        
        const distance = Math.sqrt(
            Math.pow(px - centerX, 2) + 
            Math.pow(py - centerY, 2)
        );
        
        return distance <= this.clickRadius;
    }

    /**
     * 更新动画
     * @param {number} deltaTime - 时间增量
     */
    updateAnimation(deltaTime) {
        if (this.isAnimating) {
            this.animationProgress += deltaTime * 5;
            
            if (this.animationProgress >= 1) {
                this.animationProgress = 1;
                this.isAnimating = false;
            }
        }
    }

    /**
     * 获取道岔的可用方向
     * @returns {Array}
     */
    getAvailableDirections() {
        const directionMap = {
            [SwitchType.TOP]: ['left', 'right'],
            [SwitchType.BOTTOM]: ['left', 'right'],
            [SwitchType.LEFT]: ['up', 'down'],
            [SwitchType.RIGHT]: ['up', 'down']
        };
        
        return directionMap[this.type] || [];
    }

    /**
     * 获取当前选择的方向
     * @returns {string}
     */
    getCurrentDirection() {
        const directions = this.getAvailableDirections();
        return directions[this.state] || directions[0];
    }

    /**
     * 序列化道岔状态
     * @returns {Object}
     */
    serialize() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            type: this.type,
            state: this.state,
            directionCount: this.directionCount
        };
    }

    /**
     * 从序列化数据恢复道岔
     * @param {Object} data - 序列化数据
     * @returns {Switch}
     */
    static deserialize(data) {
        return new Switch({
            id: data.id,
            x: data.x,
            y: data.y,
            type: data.type,
            state: data.state
        });
    }
}

export { Switch, SwitchType };
