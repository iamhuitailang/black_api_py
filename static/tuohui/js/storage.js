/**
 * 存储模块
 * 负责数据的本地存储和读取
 */

const Storage = {
    // 存储键名
    STORAGE_KEYS: {
        LIST_DATA: 'tuohui_list_data',
        BOARD_DATA: 'tuohui_board_data',
        TREE_DATA: 'tuohui_tree_data',
        CURRENT_MODE: 'tuohui_current_mode'
    },

    /**
     * 初始化默认列表数据
     * @returns {Array} 默认列表数据
     */
    getDefaultListData() {
        return [
            { id: Utils.generateId(), title: '设计新的用户界面', order: 0 },
            { id: Utils.generateId(), title: '编写API文档', order: 1 },
            { id: Utils.generateId(), title: '优化数据库查询', order: 2 },
            { id: Utils.generateId(), title: '修复登录页面bug', order: 3 },
            { id: Utils.generateId(), title: '添加测试用例', order: 4 },
            { id: Utils.generateId(), title: '代码审查', order: 5 }
        ];
    },

    /**
     * 初始化默认看板数据
     * @returns {Array} 默认看板数据
     */
    getDefaultBoardData() {
        return [
            {
                id: Utils.generateId(),
                title: '待办事项',
                color: '#ff6b6b',
                items: [
                    { id: Utils.generateId(), title: '设计新的用户界面', description: '创建新的UI原型' },
                    { id: Utils.generateId(), title: '编写API文档', description: '更新接口文档' }
                ]
            },
            {
                id: Utils.generateId(),
                title: '进行中',
                color: '#4ecdc4',
                items: [
                    { id: Utils.generateId(), title: '优化数据库查询', description: '提升查询性能' },
                    { id: Utils.generateId(), title: '修复登录页面bug', description: '解决登录验证问题' }
                ]
            },
            {
                id: Utils.generateId(),
                title: '已完成',
                color: '#95e1d3',
                items: [
                    { id: Utils.generateId(), title: '添加测试用例', description: '编写单元测试' },
                    { id: Utils.generateId(), title: '代码审查', description: '完成代码review' }
                ]
            }
        ];
    },

    /**
     * 初始化默认树形数据
     * @returns {Array} 默认树形数据
     */
    getDefaultTreeData() {
        return [
            {
                id: Utils.generateId(),
                title: '项目根目录',
                expanded: true,
                children: [
                    {
                        id: Utils.generateId(),
                        title: 'src',
                        expanded: true,
                        children: [
                            { id: Utils.generateId(), title: 'components', expanded: true, children: [] },
                            { id: Utils.generateId(), title: 'pages', expanded: true, children: [] },
                            { id: Utils.generateId(), title: 'utils', expanded: true, children: [] }
                        ]
                    },
                    {
                        id: Utils.generateId(),
                        title: 'public',
                        expanded: true,
                        children: [
                            { id: Utils.generateId(), title: 'images', expanded: true, children: [] },
                            { id: Utils.generateId(), title: 'styles', expanded: true, children: [] }
                        ]
                    },
                    {
                        id: Utils.generateId(),
                        title: 'tests',
                        expanded: true,
                        children: []
                    }
                ]
            }
        ];
    },

    /**
     * 保存数据到localStorage
     * @param {string} key 存储键名
     * @param {*} data 要存储的数据
     */
    save(key, data) {
        try {
            const serialized = JSON.stringify(data);
            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            console.error('保存数据失败:', error);
            Utils.showToast('保存数据失败', 'error');
            return false;
        }
    },

    /**
     * 从localStorage读取数据
     * @param {string} key 存储键名
     * @param {*} defaultValue 默认值（如果存储中没有数据）
     * @returns {*} 读取到的数据
     */
    load(key, defaultValue = null) {
        try {
            const serialized = localStorage.getItem(key);
            if (serialized === null) {
                return defaultValue;
            }
            return JSON.parse(serialized);
        } catch (error) {
            console.error('读取数据失败:', error);
            return defaultValue;
        }
    },

    /**
     * 保存列表数据
     * @param {Array} data 列表数据
     */
    saveListData(data) {
        return this.save(this.STORAGE_KEYS.LIST_DATA, data);
    },

    /**
     * 加载列表数据
     * @returns {Array} 列表数据
     */
    loadListData() {
        return this.load(this.STORAGE_KEYS.LIST_DATA, this.getDefaultListData());
    },

    /**
     * 保存看板数据
     * @param {Array} data 看板数据
     */
    saveBoardData(data) {
        return this.save(this.STORAGE_KEYS.BOARD_DATA, data);
    },

    /**
     * 加载看板数据
     * @returns {Array} 看板数据
     */
    loadBoardData() {
        return this.load(this.STORAGE_KEYS.BOARD_DATA, this.getDefaultBoardData());
    },

    /**
     * 保存树形数据
     * @param {Array} data 树形数据
     */
    saveTreeData(data) {
        return this.save(this.STORAGE_KEYS.TREE_DATA, data);
    },

    /**
     * 加载树形数据
     * @returns {Array} 树形数据
     */
    loadTreeData() {
        return this.load(this.STORAGE_KEYS.TREE_DATA, this.getDefaultTreeData());
    },

    /**
     * 保存当前模式
     * @param {string} mode 模式名称 (list, board, tree)
     */
    saveCurrentMode(mode) {
        return this.save(this.STORAGE_KEYS.CURRENT_MODE, mode);
    },

    /**
     * 加载当前模式
     * @returns {string} 模式名称
     */
    loadCurrentMode() {
        return this.load(this.STORAGE_KEYS.CURRENT_MODE, 'list');
    },

    /**
     * 清除所有数据
     */
    clearAll() {
        try {
            Object.values(this.STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            Utils.showToast('数据已清空', 'success');
            return true;
        } catch (error) {
            console.error('清空数据失败:', error);
            Utils.showToast('清空数据失败', 'error');
            return false;
        }
    },

    /**
     * 导出所有数据
     * @returns {Object} 所有数据
     */
    exportAll() {
        return {
            listData: this.loadListData(),
            boardData: this.loadBoardData(),
            treeData: this.loadTreeData(),
            currentMode: this.loadCurrentMode(),
            exportedAt: new Date().toISOString()
        };
    }
};

// 将存储模块暴露到全局
window.Storage = Storage;
