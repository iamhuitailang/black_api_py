/**
 * 主应用模块
 * 整合所有模块并初始化应用
 */

const App = {
    // 当前模式
    currentMode: 'list',
    
    // 双击检测
    lastClickTime: 0,
    lastClickX: 0,
    lastClickY: 0,
    clickThreshold: 250,

    /**
     * 初始化应用
     */
    init() {
        DataModel.init();
        this.currentMode = DataModel.currentMode;
        
        if (!Renderer.init('sortCanvas')) {
            console.error('渲染器初始化失败');
            return;
        }
        
        DragManager.init();
        Animation.init();
        
        ListView.init();
        BoardView.init();
        TreeView.init();
        ItemEditor.init();
        
        this.switchMode(this.currentMode, false);
        this.updateModeButtons();
        
        this.setupEventListeners();
        
        Renderer.onRender = (ctx) => this.render(ctx);
        Renderer.start();
        
        DataModel.onDataChange = () => {
            this.getCurrentView().updateFromData();
            Renderer.requestRender();
        };
        
        console.log('拖拽排序工具已初始化');
    },

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.switchMode(mode);
            });
        });
        
        const addBtn = document.getElementById('addItem');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addCurrentItem());
        }
        
        const clearBtn = document.getElementById('clearData');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearData());
        }
        
        const exportBtn = document.getElementById('exportData');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
        
        const canvas = Renderer.canvas;
        
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const now = Date.now();
            const timeDiff = now - this.lastClickTime;
            const xDiff = Math.abs(x - this.lastClickX);
            const yDiff = Math.abs(y - this.lastClickY);
            
            if (timeDiff < this.clickThreshold && xDiff < 10 && yDiff < 10) {
                this.getCurrentView().handleDoubleClick(x, y);
            } else {
                if (!DragManager.isCurrentlyDragging()) {
                    this.getCurrentView().handleClick(x, y);
                }
            }
            
            this.lastClickTime = now;
            this.lastClickX = x;
            this.lastClickY = y;
        });
        
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (!DragManager.isCurrentlyDragging()) {
                this.getCurrentView().handleMouseMove(x, y);
            }
        });
        
        canvas.addEventListener('mouseleave', (e) => {
            this.getCurrentView().handleMouseMove(-100, -100);
        });
    },

    /**
     * 切换模式
     */
    switchMode(mode, updateUI = true) {
        if (this.currentMode === mode) return;
        
        this.currentMode = mode;
        DataModel.setMode(mode);
        
        const view = this.getCurrentView();
        view.init();
        view.updateFromData();
        
        if (updateUI) {
            this.updateModeButtons();
            Utils.showToast(`已切换到${this.getModeName(mode)}`, 'info');
        }
        
        Renderer.requestRender();
    },

    /**
     * 更新模式按钮状态
     */
    updateModeButtons() {
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(btn => {
            if (btn.dataset.mode === this.currentMode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    },

    /**
     * 获取模式名称
     */
    getModeName(mode) {
        const names = {
            'list': '列表模式',
            'board': '看板模式',
            'tree': '树形模式'
        };
        return names[mode] || mode;
    },

    /**
     * 获取当前视图
     */
    getCurrentView() {
        switch (this.currentMode) {
            case 'list':
                return ListView;
            case 'board':
                return BoardView;
            case 'tree':
                return TreeView;
            default:
                return ListView;
        }
    },

    /**
     * 渲染当前视图
     */
    render(ctx) {
        const view = this.getCurrentView();
        view.render();
    },

    /**
     * 添加当前模式的项目
     */
    addCurrentItem() {
        const view = this.getCurrentView();
        view.addItem();
    },

    /**
     * 清空数据
     */
    clearData() {
        if (confirm('确定要清空所有数据吗？此操作不可撤销。')) {
            Storage.clearAll();
            DataModel.loadAllData();
            
            ListView.updateFromData();
            BoardView.updateFromData();
            TreeView.updateFromData();
            
            Renderer.requestRender();
        }
    },

    /**
     * 导出数据
     */
    exportData() {
        const data = Storage.exportAll();
        Utils.downloadJSON(data, 'drag_sort_data');
        Utils.showToast('数据已导出', 'success');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// 将应用暴露到全局
window.App = App;
