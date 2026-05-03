/**
 * 历史记录模块 - 负责撤销/重做功能
 * 支持最多 20 步历史记录
 * 使用栈结构管理历史状态
 */

const History = {
    /**
     * 历史记录栈
     * @type {Array}
     */
    stack: [],

    /**
     * 当前历史索引
     * @type {number}
     */
    currentIndex: -1,

    /**
     * 最大历史记录数
     * @type {number}
     */
    maxHistory: 20,

    /**
     * 初始化历史记录模块
     */
    init() {
        this.stack = [];
        this.currentIndex = -1;
        console.log('[History] 历史记录模块初始化完成');
    },

    /**
     * 保存状态到历史记录
     * @param {Object} state - 要保存的状态对象
     * @param {string} label - 操作标签（用于显示）
     */
    saveState(state, label = '操作') {
        if (this.currentIndex < this.stack.length - 1) {
            this.stack = this.stack.slice(0, this.currentIndex + 1);
        }

        const historyItem = {
            state: JSON.parse(JSON.stringify(state)),
            label: label,
            timestamp: Date.now()
        };

        this.stack.push(historyItem);

        if (this.stack.length > this.maxHistory) {
            this.stack.shift();
        } else {
            this.currentIndex++;
        }

        console.log(`[History] 保存状态: ${label}, 当前索引: ${this.currentIndex}, 历史总数: ${this.stack.length}`);
        
        this.updateUI();
        this.saveToStorage();
    },

    /**
     * 撤销操作
     * @returns {Object|null} 上一个状态，如果无法撤销则返回 null
     */
    undo() {
        if (!this.canUndo()) {
            console.log('[History] 无法撤销：没有更多历史记录');
            return null;
        }

        this.currentIndex--;
        const item = this.stack[this.currentIndex];

        console.log(`[History] 撤销: ${item?.label}, 当前索引: ${this.currentIndex}`);
        
        this.updateUI();
        return item ? item.state : null;
    },

    /**
     * 重做操作
     * @returns {Object|null} 下一个状态，如果无法重做则返回 null
     */
    redo() {
        if (!this.canRedo()) {
            console.log('[History] 无法重做：没有更多历史记录');
            return null;
        }

        this.currentIndex++;
        const item = this.stack[this.currentIndex];

        console.log(`[History] 重做: ${item?.label}, 当前索引: ${this.currentIndex}`);
        
        this.updateUI();
        return item ? item.state : null;
    },

    /**
     * 检查是否可以撤销
     * @returns {boolean}
     */
    canUndo() {
        return this.currentIndex > 0;
    },

    /**
     * 检查是否可以重做
     * @returns {boolean}
     */
    canRedo() {
        return this.currentIndex < this.stack.length - 1;
    },

    /**
     * 清空所有历史记录
     */
    clear() {
        this.stack = [];
        this.currentIndex = -1;
        this.updateUI();
        this.saveToStorage();
        console.log('[History] 历史记录已清空');
    },

    /**
     * 获取当前状态
     * @returns {Object|null}
     */
    getCurrentState() {
        if (this.currentIndex < 0 || this.currentIndex >= this.stack.length) {
            return null;
        }
        return this.stack[this.currentIndex]?.state || null;
    },

    /**
     * 更新UI状态（按钮可用性）
     */
    updateUI() {
        const btnUndo = document.getElementById('btnUndo');
        const btnRedo = document.getElementById('btnRedo');

        if (btnUndo) {
            btnUndo.disabled = !this.canUndo();
            btnUndo.title = this.canUndo() 
                ? `撤销: ${this.stack[this.currentIndex]?.label || '上一步'} (Ctrl+Z)`
                : '无法撤销';
        }

        if (btnRedo) {
            btnRedo.disabled = !this.canRedo();
            btnRedo.title = this.canRedo()
                ? `重做: ${this.stack[this.currentIndex + 1]?.label || '下一步'} (Ctrl+Y)`
                : '无法重做';
        }
    },

    /**
     * 保存历史记录到本地存储
     */
    saveToStorage() {
        try {
            const data = {
                stack: this.stack.slice(Math.max(0, this.stack.length - 10)),
                currentIndex: Math.min(this.currentIndex, 9)
            };
            Storage.saveHistory(data.stack, data.currentIndex);
        } catch (error) {
            console.error('[History] 保存历史到存储失败:', error);
        }
    },

    /**
     * 从本地存储恢复历史记录
     */
    loadFromStorage() {
        try {
            const data = Storage.loadHistory();
            if (data && data.stack) {
                this.stack = data.stack;
                this.currentIndex = data.currentIndex;
                this.updateUI();
                console.log('[History] 从存储恢复历史记录:', this.stack.length, '条');
            }
        } catch (error) {
            console.error('[History] 从存储恢复历史失败:', error);
        }
    },

    /**
     * 获取历史记录列表（用于调试或显示）
     * @returns {Array}
     */
    getHistoryList() {
        return this.stack.map((item, index) => ({
            ...item,
            isCurrent: index === this.currentIndex,
            index: index
        }));
    }
};

History.init();
