/**
 * 项目编辑器模块
 * 处理编辑弹窗逻辑
 */

const ItemEditor = {
    // 当前编辑的项目信息
    currentEdit: {
        id: null,
        mode: null,
        extraData: null
    },
    
    // DOM元素
    modal: null,
    input: null,
    cancelBtn: null,
    saveBtn: null,

    /**
     * 初始化编辑器
     */
    init() {
        this.modal = document.getElementById('editModal');
        this.input = document.getElementById('editInput');
        this.cancelBtn = document.getElementById('cancelEdit');
        this.saveBtn = document.getElementById('saveEdit');
        
        this.setupEventListeners();
    },

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => this.hide());
        }
        
        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', () => this.save());
        }
        
        if (this.input) {
            this.input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.save();
                } else if (e.key === 'Escape') {
                    this.hide();
                }
            });
        }
        
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.hide();
                }
            });
        }
    },

    /**
     * 开始编辑项目
     * @param {string} id 项目ID
     * @param {string} currentValue 当前值
     * @param {string} mode 模式 (list, board, tree)
     * @param {*} extraData 额外数据（如列ID）
     */
    edit(id, currentValue, mode, extraData = null) {
        this.currentEdit = {
            id: id,
            mode: mode,
            extraData: extraData
        };
        
        if (this.input) {
            this.input.value = currentValue || '';
        }
        
        this.show();
    },

    /**
     * 显示编辑弹窗
     */
    show() {
        if (this.modal) {
            this.modal.classList.add('active');
        }
        
        if (this.input) {
            setTimeout(() => {
                this.input.focus();
                this.input.select();
            }, 100);
        }
    },

    /**
     * 隐藏编辑弹窗
     */
    hide() {
        if (this.modal) {
            this.modal.classList.remove('active');
        }
        
        this.currentEdit = {
            id: null,
            mode: null,
            extraData: null
        };
    },

    /**
     * 保存编辑
     */
    save() {
        if (!this.currentEdit.id || !this.input) {
            this.hide();
            return;
        }
        
        const newValue = this.input.value.trim();
        
        if (!newValue) {
            Utils.showToast('内容不能为空', 'error');
            this.input.focus();
            return;
        }
        
        switch (this.currentEdit.mode) {
            case 'list':
                ListView.updateItem(this.currentEdit.id, newValue);
                break;
            case 'board':
                BoardView.updateItem(
                    this.currentEdit.id, 
                    newValue, 
                    this.currentEdit.extraData
                );
                break;
            case 'tree':
                TreeView.updateNode(this.currentEdit.id, newValue);
                break;
        }
        
        this.hide();
    }
};

// 将项目编辑器暴露到全局
window.ItemEditor = ItemEditor;
