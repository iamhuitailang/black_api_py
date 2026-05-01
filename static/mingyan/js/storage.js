const STORAGE_KEYS = {
    HISTORY: 'mingyan_history',
    FAVORITES: 'mingyan_favorites',
    SETTINGS: 'mingyan_settings',
    CURRENT_RESULTS: 'mingyan_current_results',
    KEYWORDS: 'mingyan_keywords'
};

const MAX_HISTORY_COUNT = 20;

class StorageManager {
    constructor() {
        this.init();
    }
    
    init() {
        if (!localStorage.getItem(STORAGE_KEYS.HISTORY)) {
            localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.FAVORITES)) {
            localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
                style: 'simple',
                industry: null,
                length: 'medium'
            }));
        }
    }
    
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Storage get error:', e);
            return null;
        }
    }
    
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    }
    
    addHistory(historyItem) {
        const history = this.getHistory();
        history.unshift({
            id: Date.now(),
            ...historyItem,
            createdAt: new Date().toISOString()
        });
        
        if (history.length > MAX_HISTORY_COUNT) {
            history.splice(MAX_HISTORY_COUNT);
        }
        
        return this.set(STORAGE_KEYS.HISTORY, history);
    }
    
    getHistory() {
        return this.get(STORAGE_KEYS.HISTORY) || [];
    }
    
    clearHistory() {
        return this.set(STORAGE_KEYS.HISTORY, []);
    }
    
    addFavorite(favoriteItem) {
        const favorites = this.getFavorites();
        const exists = favorites.some(item => 
            item.text === favoriteItem.text && item.keywords === favoriteItem.keywords
        );
        
        if (exists) {
            return false;
        }
        
        favorites.unshift({
            id: Date.now(),
            ...favoriteItem,
            createdAt: new Date().toISOString()
        });
        
        return this.set(STORAGE_KEYS.FAVORITES, favorites);
    }
    
    removeFavorite(id) {
        const favorites = this.getFavorites();
        const index = favorites.findIndex(item => item.id === id);
        
        if (index > -1) {
            favorites.splice(index, 1);
            return this.set(STORAGE_KEYS.FAVORITES, favorites);
        }
        
        return false;
    }
    
    getFavorites() {
        return this.get(STORAGE_KEYS.FAVORITES) || [];
    }
    
    isFavorite(text, keywords) {
        const favorites = this.getFavorites();
        return favorites.some(item => item.text === text && item.keywords === keywords);
    }
    
    clearFavorites() {
        return this.set(STORAGE_KEYS.FAVORITES, []);
    }
    
    saveSettings(settings) {
        return this.set(STORAGE_KEYS.SETTINGS, settings);
    }
    
    getSettings() {
        return this.get(STORAGE_KEYS.SETTINGS) || {
            style: 'simple',
            industry: null,
            length: 'medium'
        };
    }
    
    addRating(sloganId, rating) {
        const history = this.getHistory();
        for (let item of history) {
            for (let slogan of item.slogans) {
                if (slogan.id === sloganId) {
                    slogan.rating = rating;
                    this.set(STORAGE_KEYS.HISTORY, history);
                    return true;
                }
            }
        }
        
        const favorites = this.getFavorites();
        for (let item of favorites) {
            if (item.id === sloganId) {
                item.rating = rating;
                this.set(STORAGE_KEYS.FAVORITES, favorites);
                return true;
            }
        }
        
        return false;
    }
    
    exportFavorites() {
        const favorites = this.getFavorites();
        if (favorites.length === 0) {
            return null;
        }
        
        let content = '=== 我的收藏 ===\n\n';
        favorites.forEach((item, index) => {
            content += `${index + 1}. ${item.text}\n`;
            content += `   关键词: ${item.keywords}\n`;
            content += `   风格: ${item.style}\n`;
            if (item.rating) {
                content += `   评分: ${item.rating}\n`;
            }
            content += `   时间: ${new Date(item.createdAt).toLocaleString()}\n`;
            content += '\n';
        });
        
        return content;
    }
    
    exportHistory() {
        const history = this.getHistory();
        if (history.length === 0) {
            return null;
        }
        
        let content = '=== 生成历史 ===\n\n';
        history.forEach((item, index) => {
            content += `--- 第 ${index + 1} 次生成 ---\n`;
            content += `关键词: ${item.keywords}\n`;
            content += `风格: ${item.style}\n`;
            content += `时间: ${new Date(item.createdAt).toLocaleString()}\n\n`;
            
            item.slogans.forEach((slogan, sIndex) => {
                content += `  ${sIndex + 1}. ${slogan.text}`;
                if (slogan.rating) {
                    content += ` (${slogan.rating})`;
                }
                content += '\n';
            });
            content += '\n';
        });
        
        return content;
    }
    
    saveCurrentResults(data) {
        return this.set(STORAGE_KEYS.CURRENT_RESULTS, {
            slogans: data.slogans || [],
            keywords: data.keywords || '',
            options: data.options || {},
            createdAt: new Date().toISOString()
        });
    }
    
    getCurrentResults() {
        const data = this.get(STORAGE_KEYS.CURRENT_RESULTS);
        return data || {
            slogans: [],
            keywords: '',
            options: {},
            createdAt: null
        };
    }
    
    clearCurrentResults() {
        return this.set(STORAGE_KEYS.CURRENT_RESULTS, {
            slogans: [],
            keywords: '',
            options: {},
            createdAt: null
        });
    }
    
    saveKeywords(keywords) {
        return this.set(STORAGE_KEYS.KEYWORDS, keywords);
    }
    
    getKeywords() {
        return this.get(STORAGE_KEYS.KEYWORDS) || '';
    }
    
    clearKeywords() {
        return this.set(STORAGE_KEYS.KEYWORDS, '');
    }
}

export const storageManager = new StorageManager();
