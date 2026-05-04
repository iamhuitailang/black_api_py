/**
 * 信号灯模块
 * 管理信号灯的状态和切换
 */

// 信号灯状态
const SignalState = {
    RED: 'red',      // 红灯 - 停止
    GREEN: 'green'   // 绿灯 - 通行
};

/**
 * Signal类 - 信号灯
 */
class Signal {
    /**
     * 构造函数
     * @param {Object} options - 信号灯配置
     */
    constructor(options = {}) {
        this.id = options.id || `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.x = options.x || 0;
        this.y = options.y || 0;
        
        // 信号灯状态：true 表示红灯，false 表示绿灯
        this.isRed = options.isRed !== undefined ? options.isRed : false;
        
        // 默认状态（用于重置）
        this.defaultIsRed = this.isRed;
        
        // 动画状态
        this.isAnimating = false;
        this.animationProgress = 0;
        this.blinkPhase = 0;
        
        // 点击区域
        this.clickRadius = 20;
    }

    /**
     * 切换信号灯状态
     * @returns {boolean} 新的状态（true=红灯，false=绿灯）
     */
    toggle() {
        this.isRed = !this.isRed;
        this.isAnimating = true;
        this.animationProgress = 0;
        this.blinkPhase = 0;
        return this.isRed;
    }

    /**
     * 设置为红灯
     */
    setRed() {
        if (!this.isRed) {
            this.isRed = true;
            this.isAnimating = true;
            this.animationProgress = 0;
        }
    }

    /**
     * 设置为绿灯
     */
    setGreen() {
        if (this.isRed) {
            this.isRed = false;
            this.isAnimating = true;
            this.animationProgress = 0;
        }
    }

    /**
     * 重置到默认状态
     */
    reset() {
        this.isRed = this.defaultIsRed;
        this.isAnimating = false;
        this.animationProgress = 0;
    }

    /**
     * 检查点是否在信号灯的点击区域内
     * @param {number} px - 点击X坐标（像素）
     * @param {number} py - 点击Y坐标（像素）
     * @param {number} gridSize - 网格大小
     * @param {number} offsetX - 偏移X
     * @param {number} offsetY - 偏移Y
     * @returns {boolean}
     */
    isPointInSignal(px, py, gridSize, offsetX = 0, offsetY = 0) {
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
        // 闪烁动画
        this.blinkPhase += deltaTime * 4;
        
        if (this.isAnimating) {
            this.animationProgress += deltaTime * 3;
            
            if (this.animationProgress >= 1) {
                this.animationProgress = 1;
                this.isAnimating = false;
            }
        }
    }

    /**
     * 获取当前状态字符串
     * @returns {string}
     */
    getStateString() {
        return this.isRed ? SignalState.RED : SignalState.GREEN;
    }

    /**
     * 序列化信号灯状态
     * @returns {Object}
     */
    serialize() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            isRed: this.isRed,
            defaultIsRed: this.defaultIsRed
        };
    }

    /**
     * 从序列化数据恢复信号灯
     * @param {Object} data - 序列化数据
     * @returns {Signal}
     */
    static deserialize(data) {
        const signal = new Signal({
            id: data.id,
            x: data.x,
            y: data.y,
            isRed: data.isRed
        });
        signal.defaultIsRed = data.defaultIsRed;
        return signal;
    }
}

export { Signal, SignalState };
