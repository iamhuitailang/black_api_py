const App = {
    isInitialized: false,
    loadingOverlay: null,

    async init() {
        if (this.isInitialized) return;

        this.loadingOverlay = document.getElementById('loading-overlay');

        console.log('🎁 礼物推荐器启动中...');

        try {
            await this.initializeModules();
            await this.checkSavedRecommendations();
            
            this.isInitialized = true;
            console.log('✅ 礼物推荐器初始化完成');

            setTimeout(() => {
                this.hideLoading();
            }, 800);

        } catch (error) {
            console.error('❌ 初始化失败:', error);
            this.showToast('初始化失败，请刷新页面重试', 'error');
            this.hideLoading();
        }
    },

    async initializeModules() {
        Storage.migrate();
        GiftData.init();
        CanvasBackground.init();
        UI.init();
        Share.init();
    },

    async checkSavedRecommendations() {
        const saved = Recommendation.getRecommendationsFromStorage();
        if (saved && saved.giftIds && saved.giftIds.length > 0) {
            console.log('📦 找到上次推荐结果');
        }
    },

    showLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.remove('hidden');
        }
    },

    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('hidden');
        }
    },

    showToast(message, type = 'info') {
        UI.showToast(message, type);
    },

    getStats() {
        return GiftData.getStats();
    },

    exportData() {
        const data = {
            customGifts: Storage.getCustomGifts(),
            favorites: Storage.getFavorites(),
            selections: UI.selections,
            exportedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `luwu-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    importData(jsonData) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            
            if (data.customGifts && Array.isArray(data.customGifts)) {
                const existing = Storage.getCustomGifts();
                const merged = [...existing];
                
                data.customGifts.forEach(gift => {
                    const exists = merged.find(g => g.name === gift.name && g.price === gift.price);
                    if (!exists) {
                        gift.id = Utils.uniqueId();
                        merged.push(gift);
                    }
                });
                
                Storage.setCustomGifts(merged);
            }
            
            if (data.favorites && Array.isArray(data.favorites)) {
                Storage.setFavorites(data.favorites);
            }

            this.showToast('导入成功', 'success');
            return true;
        } catch (e) {
            console.error('Import error:', e);
            this.showToast('导入失败：数据格式错误', 'error');
            return false;
        }
    },

    resetAll() {
        if (confirm('确定要重置所有数据吗？这将删除所有自定义礼物和收藏记录。')) {
            Storage.clearAll();
            window.location.reload();
        }
    },

    getVersion() {
        return '1.0.0';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

window.App = App;
