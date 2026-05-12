const Storage = {
    STORAGE_KEY: 'receipt_printer_data',
    HISTORY_KEY: 'receipt_printer_history',
    
    defaultData: {
        shopName: '怀旧小卖部',
        shopPhone: '138-8888-8888',
        shopAddress: '北京市朝阳区复古街道88号',
        cashier: '收银员',
        items: [],
        taxRate: 0,
        cashReceived: 0,
        theme: 'thermal'
    },
    
    save(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存数据失败:', e);
            return false;
        }
    },
    
    load() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                return { ...this.defaultData, ...JSON.parse(data) };
            }
            return { ...this.defaultData };
        } catch (e) {
            console.error('加载数据失败:', e);
            return { ...this.defaultData };
        }
    },
    
    saveToHistory(receiptData) {
        try {
            let history = this.getHistory();
            const historyItem = {
                id: Date.now(),
                date: new Date().toLocaleString('zh-CN'),
                ...receiptData
            };
            
            history.unshift(historyItem);
            
            if (history.length > 10) {
                history = history.slice(0, 10);
            }
            
            localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
            return true;
        } catch (e) {
            console.error('保存历史记录失败:', e);
            return false;
        }
    },
    
    getHistory() {
        try {
            const history = localStorage.getItem(this.HISTORY_KEY);
            return history ? JSON.parse(history) : [];
        } catch (e) {
            console.error('加载历史记录失败:', e);
            return [];
        }
    },
    
    clearHistory() {
        localStorage.removeItem(this.HISTORY_KEY);
    },
    
    clearAll() {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.HISTORY_KEY);
    }
};