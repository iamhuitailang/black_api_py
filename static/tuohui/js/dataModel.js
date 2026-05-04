/**
 * 数据模型模块
 * 负责管理各种模式下的数据结构和操作
 */

const DataModel = {
    // 当前模式
    currentMode: 'list',
    
    // 数据缓存
    listData: [],
    boardData: [],
    treeData: [],
    
    // 数据变更回调
    onDataChange: null,

    /**
     * 初始化数据模型
     */
    init() {
        this.loadAllData();
        this.currentMode = Storage.loadCurrentMode();
    },

    /**
     * 加载所有数据
     */
    loadAllData() {
        this.listData = Storage.loadListData();
        this.boardData = Storage.loadBoardData();
        this.treeData = Storage.loadTreeData();
    },

    /**
     * 保存当前模式的数据
     */
    saveCurrentData() {
        switch (this.currentMode) {
            case 'list':
                Storage.saveListData(this.listData);
                break;
            case 'board':
                Storage.saveBoardData(this.boardData);
                break;
            case 'tree':
                Storage.saveTreeData(this.treeData);
                break;
        }
        Storage.saveCurrentMode(this.currentMode);
        this.notifyDataChange();
    },

    /**
     * 设置数据变更通知
     */
    notifyDataChange() {
        if (typeof this.onDataChange === 'function') {
            this.onDataChange();
        }
    },

    // ==================== 列表模式数据操作 ====================

    /**
     * 添加列表项
     * @param {string} title 标题
     * @returns {Object} 新创建的项
     */
    addListItem(title) {
        const newItem = {
            id: Utils.generateId(),
            title: title || '新任务',
            order: this.listData.length
        };
        this.listData.push(newItem);
        this.saveCurrentData();
        return newItem;
    },

    /**
     * 删除列表项
     * @param {string} id 项ID
     * @returns {boolean} 是否成功删除
     */
    removeListItem(id) {
        const index = this.listData.findIndex(item => item.id === id);
        if (index !== -1) {
            this.listData.splice(index, 1);
            this.saveCurrentData();
            return true;
        }
        return false;
    },

    /**
     * 更新列表项
     * @param {string} id 项ID
     * @param {Object} updates 更新的数据
     * @returns {boolean} 是否成功更新
     */
    updateListItem(id, updates) {
        const item = this.listData.find(i => i.id === id);
        if (item) {
            Object.assign(item, updates);
            this.saveCurrentData();
            return true;
        }
        return false;
    },

    /**
     * 移动列表项
     * @param {number} fromIndex 源索引
     * @param {number} toIndex 目标索引
     */
    moveListItem(fromIndex, toIndex) {
        Utils.moveArrayItem(this.listData, fromIndex, toIndex);
        this.listData.forEach((item, index) => {
            item.order = index;
        });
        this.saveCurrentData();
    },

    // ==================== 看板模式数据操作 ====================

    /**
     * 添加看板列
     * @param {string} title 列标题
     * @param {string} color 列颜色
     * @returns {Object} 新创建的列
     */
    addBoardColumn(title, color) {
        const newColumn = {
            id: Utils.generateId(),
            title: title || '新列表',
            color: color || this.getRandomColor(),
            items: []
        };
        this.boardData.push(newColumn);
        this.saveCurrentData();
        return newColumn;
    },

    /**
     * 删除看板列
     * @param {string} columnId 列ID
     * @returns {boolean} 是否成功删除
     */
    removeBoardColumn(columnId) {
        const index = this.boardData.findIndex(col => col.id === columnId);
        if (index !== -1) {
            this.boardData.splice(index, 1);
            this.saveCurrentData();
            return true;
        }
        return false;
    },

    /**
     * 添加看板项
     * @param {string} columnId 列ID
     * @param {string} title 标题
     * @param {string} description 描述
     * @returns {Object} 新创建的项
     */
    addBoardItem(columnId, title, description) {
        const column = this.boardData.find(col => col.id === columnId);
        if (column) {
            const newItem = {
                id: Utils.generateId(),
                title: title || '新任务',
                description: description || ''
            };
            column.items.push(newItem);
            this.saveCurrentData();
            return newItem;
        }
        return null;
    },

    /**
     * 删除看板项
     * @param {string} columnId 列ID
     * @param {string} itemId 项ID
     * @returns {boolean} 是否成功删除
     */
    removeBoardItem(columnId, itemId) {
        const column = this.boardData.find(col => col.id === columnId);
        if (column) {
            const index = column.items.findIndex(item => item.id === itemId);
            if (index !== -1) {
                column.items.splice(index, 1);
                this.saveCurrentData();
                return true;
            }
        }
        return false;
    },

    /**
     * 更新看板项
     * @param {string} columnId 列ID
     * @param {string} itemId 项ID
     * @param {Object} updates 更新的数据
     * @returns {boolean} 是否成功更新
     */
    updateBoardItem(columnId, itemId, updates) {
        const column = this.boardData.find(col => col.id === columnId);
        if (column) {
            const item = column.items.find(i => i.id === itemId);
            if (item) {
                Object.assign(item, updates);
                this.saveCurrentData();
                return true;
            }
        }
        return false;
    },

    /**
     * 移动看板项（列内排序
     * @param {string} columnId 列ID
     * @param {number} fromIndex 源索引
     * @param {number} toIndex 目标索引
     */
    moveBoardItemInColumn(columnId, fromIndex, toIndex) {
        const column = this.boardData.find(col => col.id === columnId);
        if (column) {
            Utils.moveArrayItem(column.items, fromIndex, toIndex);
            this.saveCurrentData();
        }
    },

    /**
     * 移动看板项跨列
     * @param {string} fromColumnId 源列ID
     * @param {number} fromIndex 源索引
     * @param {string} toColumnId 目标列ID
     * @param {number} toIndex 目标索引
     */
    moveBoardItemBetweenColumns(fromColumnId, fromIndex, toColumnId, toIndex) {
        const fromColumn = this.boardData.find(col => col.id === fromColumnId);
        const toColumn = this.boardData.find(col => col.id === toColumnId);
        
        if (fromColumn && toColumn) {
            const item = fromColumn.items.splice(fromIndex, 1)[0];
            toColumn.items.splice(toIndex, 0, item);
            this.saveCurrentData();
        }
    },

    /**
     * 获取随机颜色
     * @returns {string} 颜色值
     */
    getRandomColor() {
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
            '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    // ==================== 树形模式数据操作 ====================

    /**
     * 添加树节点
     * @param {string|null} parentId 父节点ID（null表示根级别）
     * @param {string} title 标题
     * @returns {Object} 新创建的节点
     */
    addTreeNode(parentId, title) {
        const newNode = {
            id: Utils.generateId(),
            title: title || '新节点',
            expanded: true,
            children: []
        };

        if (parentId === null) {
            this.treeData.push(newNode);
        } else {
            const parent = this.findTreeNode(this.treeData, parentId);
            if (parent) {
                parent.children.push(newNode);
            }
        }
        
        this.saveCurrentData();
        return newNode;
    },

    /**
     * 删除树节点
     * @param {string} nodeId 节点ID
     * @returns {boolean} 是否成功删除
     */
    removeTreeNode(nodeId) {
        const result = this.removeTreeNodeRecursive(this.treeData, nodeId);
        if (result) {
            this.saveCurrentData();
        }
        return result;
    },

    /**
     * 递归查找并删除节点
     * @param {Array} nodes 节点数组
     * @param {string} nodeId 节点ID
     * @returns {boolean} 是否成功删除
     */
    removeTreeNodeRecursive(nodes, nodeId) {
        const index = nodes.findIndex(node => node.id === nodeId);
        if (index !== -1) {
            nodes.splice(index, 1);
            return true;
        }
        
        for (const node of nodes) {
            if (this.removeTreeNodeRecursive(node.children, nodeId)) {
                return true;
            }
        }
        
        return false;
    },

    /**
     * 更新树节点
     * @param {string} nodeId 节点ID
     * @param {Object} updates 更新的数据
     * @returns {boolean} 是否成功更新
     */
    updateTreeNode(nodeId, updates) {
        const node = this.findTreeNode(this.treeData, nodeId);
        if (node) {
            Object.assign(node, updates);
            this.saveCurrentData();
            return true;
        }
        return false;
    },

    /**
     * 查找树节点
     * @param {Array} nodes 节点数组
     * @param {string} nodeId 节点ID
     * @returns {Object|null} 找到的节点
     */
    findTreeNode(nodes, nodeId) {
        for (const node of nodes) {
            if (node.id === nodeId) {
                return node;
            }
            const found = this.findTreeNode(node.children, nodeId);
            if (found) {
                return found;
            }
        }
        return null;
    },

    /**
     * 查找树节点及其父节点和索引
     * @param {Array} nodes 节点数组
     * @param {string} nodeId 节点ID
     * @param {Object|null} parentNode 父节点
     * @returns {Object|null} 包含节点、父节点和索引的对象
     */
    findTreeNodeWithParent(nodes, nodeId, parentNode = null) {
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].id === nodeId) {
                return {
                    node: nodes[i],
                    parent: parentNode,
                    index: i,
                    siblings: nodes
                };
            }
            const found = this.findTreeNodeWithParent(nodes[i].children, nodeId, nodes[i]);
            if (found) {
                return found;
            }
        }
        return null;
    },

    /**
     * 移动树节点
     * @param {string} nodeId 要移动的节点ID
     * @param {string|null} targetParentId 目标父节点ID（null表示根级别）
     * @param {number} targetIndex 目标索引
     * @param {boolean} asChild 是否作为子节点
     */
    moveTreeNode(nodeId, targetParentId, targetIndex, asChild = false) {
        const sourceInfo = this.findTreeNodeWithParent(this.treeData, nodeId);
        if (!sourceInfo || sourceInfo.node.id === targetParentId) {
            return;
        }

        const movingNode = sourceInfo.node;
        
        sourceInfo.siblings.splice(sourceInfo.index, 1);

        if (asChild && targetParentId !== null) {
            const targetParent = this.findTreeNode(this.treeData, targetParentId);
            if (targetParent) {
                targetParent.children.push(movingNode);
                targetParent.expanded = true;
            }
        } else {
            if (targetParentId === null) {
                this.treeData.splice(targetIndex, 0, movingNode);
            } else {
                const targetParent = this.findTreeNode(this.treeData, targetParentId);
                if (targetParent) {
                    targetParent.children.splice(targetIndex, 0, movingNode);
                }
            }
        }

        this.saveCurrentData();
    },

    /**
     * 切换树节点展开状态
     * @param {string} nodeId 节点ID
     * @returns {boolean|null} 新的展开状态
     */
    toggleTreeNode(nodeId) {
        const node = this.findTreeNode(this.treeData, nodeId);
        if (node) {
            node.expanded = !node.expanded;
            this.saveCurrentData();
            return node.expanded;
        }
        return null;
    },

    /**
     * 获取当前模式的数据
     * @returns {*} 当前模式的数据
     */
    getCurrentData() {
        switch (this.currentMode) {
            case 'list':
                return this.listData;
            case 'board':
                return this.boardData;
            case 'tree':
                return this.treeData;
            default:
                return [];
        }
    },

    /**
     * 切换模式
     * @param {string} mode 新模式
     */
    setMode(mode) {
        this.currentMode = mode;
        Storage.saveCurrentMode(mode);
        this.notifyDataChange();
    }
};

// 将数据模型暴露到全局
window.DataModel = DataModel;
