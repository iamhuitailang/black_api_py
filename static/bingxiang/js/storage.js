/**
 * 数据存储模块
 * 负责 localStorage 的读写操作
 */

const Storage = {
    STORAGE_KEY: 'fridge_items',
    
    /**
     * 初始化数据
     */
    init() {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
        }
    },
    
    /**
     * 获取所有食材
     * @returns {Array} 食材列表
     */
    getAll() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },
    
    /**
     * 保存所有食材
     * @param {Array} items - 食材列表
     */
    saveAll(items) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    },
    
    /**
     * 添加食材
     * @param {Object} item - 食材对象
     * @returns {Object} 添加的食材对象（带ID）
     */
    add(item) {
        const items = this.getAll();
        const newItem = {
            id: Date.now().toString(),
            ...item,
            createdAt: new Date().toISOString()
        };
        items.push(newItem);
        this.saveAll(items);
        return newItem;
    },
    
    /**
     * 更新食材
     * @param {string} id - 食材ID
     * @param {Object} updates - 更新的字段
     * @returns {Object|null} 更新后的食材对象
     */
    update(id, updates) {
        const items = this.getAll();
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
            this.saveAll(items);
            return items[index];
        }
        return null;
    },
    
    /**
     * 删除食材
     * @param {string} id - 食材ID
     * @returns {boolean} 是否删除成功
     */
    remove(id) {
        const items = this.getAll();
        const filtered = items.filter(item => item.id !== id);
        if (filtered.length < items.length) {
            this.saveAll(filtered);
            return true;
        }
        return false;
    },
    
    /**
     * 根据ID获取食材
     * @param {string} id - 食材ID
     * @returns {Object|null} 食材对象
     */
    getById(id) {
        const items = this.getAll();
        return items.find(item => item.id === id) || null;
    },
    
    /**
     * 获取分类统计
     * @returns {Object} 分类统计对象
     */
    getCategoryStats() {
        const items = this.getAll();
        const stats = {};
        
        items.forEach(item => {
            const category = item.category || '其他';
            if (!stats[category]) {
                stats[category] = 0;
            }
            stats[category] += item.quantity;
        });
        
        return stats;
    },
    
    /**
     * 获取过期状态统计
     * @returns {Object} 过期状态统计
     */
    getExpiryStats() {
        const items = this.getAll();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const threeDaysLater = new Date(today);
        threeDaysLater.setDate(today.getDate() + 3);
        
        const stats = {
            normal: 0,
            warning: 0,
            expired: 0,
            expiringToday: []
        };
        
        items.forEach(item => {
            const expiryDate = new Date(item.expiryDate);
            expiryDate.setHours(0, 0, 0, 0);
            
            if (expiryDate < today) {
                stats.expired++;
            } else if (expiryDate <= threeDaysLater) {
                stats.warning++;
                if (expiryDate.getTime() === today.getTime()) {
                    stats.expiringToday.push(item);
                }
            } else {
                stats.normal++;
            }
        });
        
        return stats;
    },
    
    /**
     * 按分类筛选
     * @param {string} category - 分类名称
     * @returns {Array} 筛选后的食材列表
     */
    filterByCategory(category) {
        const items = this.getAll();
        if (!category || category === '全部') {
            return items;
        }
        return items.filter(item => item.category === category);
    },
    
    /**
     * 按名称搜索
     * @param {string} keyword - 搜索关键词
     * @returns {Array} 搜索结果
     */
    searchByName(keyword) {
        const items = this.getAll();
        if (!keyword.trim()) {
            return items;
        }
        const lowerKeyword = keyword.toLowerCase().trim();
        return items.filter(item => 
            item.name.toLowerCase().includes(lowerKeyword)
        );
    }
};

// 初始化
Storage.init();

// 导出模块
window.Storage = Storage;
