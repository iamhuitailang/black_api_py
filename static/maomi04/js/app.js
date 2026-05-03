/**
 * 主应用程序模块
 * 游戏的入口点，负责初始化和协调所有模块
 */

const App = {
    /**
     * 游戏状态
     */
    gameState: null,

    /**
     * 游戏主循环定时器
     */
    gameLoopId: null,

    /**
     * 自动保存定时器
     */
    autoSaveId: null,

    /**
     * 下次猫咪来访时间（秒）
     */
    nextCatVisitTime: 0,

    /**
     * 初始化应用程序
     */
    init() {
        console.log('=== 猫咪后院 · 萌猫收集 ===');
        console.log('游戏初始化中...');

        // 检查localStorage是否可用
        if (!Storage.isAvailable()) {
            console.error('localStorage不可用，游戏数据将无法保存');
            alert('警告：本地存储不可用，游戏进度将无法保存！');
        }

        // 加载游戏状态
        this.loadGameState();

        // 初始化各个系统
        this.initSystems();

        // 启动游戏循环
        this.startGameLoop();

        // 启动自动保存
        this.startAutoSave();

        // 绑定页面事件
        this.bindPageEvents();

        // 计算下次猫咪来访时间
        this.scheduleNextCatVisit();

        console.log('游戏初始化完成！');
        console.log('当前鱼干数量:', this.gameState.fishCount);
        console.log('已收集猫咪:', this.gameState.collectedCats ? this.gameState.collectedCats.length : 0);

        // 显示欢迎信息
        this.showWelcomeMessage();
    },

    /**
     * 加载游戏状态
     */
    loadGameState() {
        console.log('加载游戏状态...');
        this.gameState = Storage.loadGameData();
        console.log('游戏状态加载完成:', this.gameState);
    },

    /**
     * 初始化各个系统
     */
    initSystems() {
        // 初始化道具系统
        ItemSystem.init(this.gameState);

        // 初始化猫咪系统
        CatSystem.init(this.gameState);

        // 初始化UI系统
        UI.init(this.gameState);

        // 初始化Canvas渲染器
        CanvasRenderer.init('game-canvas', this.gameState);
    },

    /**
     * 启动游戏主循环
     */
    startGameLoop() {
        console.log('启动游戏主循环...');
        
        const tickInterval = GameData.GAME_CONFIG.GAME_TICK_INTERVAL;
        
        this.gameLoopId = setInterval(() => {
            this.gameTick();
        }, tickInterval);
    },

    /**
     * 停止游戏主循环
     */
    stopGameLoop() {
        if (this.gameLoopId) {
            clearInterval(this.gameLoopId);
            this.gameLoopId = null;
            console.log('游戏主循环已停止');
        }
    },

    /**
     * 启动自动保存
     */
    startAutoSave() {
        console.log('启动自动保存...');
        
        const saveInterval = GameData.GAME_CONFIG.AUTO_SAVE_INTERVAL;
        
        this.autoSaveId = setInterval(() => {
            this.saveGame();
        }, saveInterval);
    },

    /**
     * 停止自动保存
     */
    stopAutoSave() {
        if (this.autoSaveId) {
            clearInterval(this.autoSaveId);
            this.autoSaveId = null;
            console.log('自动保存已停止');
        }
    },

    /**
     * 游戏主循环 tick
     */
    gameTick() {
        // 更新猫咪状态
        CatSystem.update(this.gameState, 1);

        // 检查是否应该有新猫咪来访
        this.checkCatVisit();

        // 更新UI状态
        UI.updateStatusBar();

        // 保存猫咪系统状态到gameState
        CatSystem.saveToGameState(this.gameState);
    },

    /**
     * 检查猫咪来访
     */
    checkCatVisit() {
        this.nextCatVisitTime--;

        if (this.nextCatVisitTime <= 0) {
            // 检查是否有放置道具
            if (this.gameState.placedItems.length === 0) {
                // 没有道具，设置较短的检查时间，等待用户放置道具
                this.nextCatVisitTime = 60; // 60秒后再检查
                console.log('庭院中没有放置道具，猫咪不会来。下次检查时间：60秒后');
                return;
            }

            // 尝试生成猫咪
            const success = CatSystem.trySpawnCat(this.gameState);
            
            if (success) {
                console.log('新猫咪来访！');
            }

            // 重新安排下次来访
            this.scheduleNextCatVisit();
        }
    },

    /**
     * 安排下次猫咪来访时间
     */
    scheduleNextCatVisit() {
        // 如果没有放置任何道具，设置较短的检查时间
        if (this.gameState.placedItems.length === 0) {
            this.nextCatVisitTime = 10; // 10秒后再检查，等待用户放置道具
            console.log('庭院中没有放置道具，猫咪不会来。下次检查时间：10秒后');
            return;
        }

        // 计算下次来访时间
        this.nextCatVisitTime = GameData.calculateNextVisitTime(this.gameState.placedItems);
        
        console.log(`下次猫咪来访预计在 ${Utils.formatTime(this.nextCatVisitTime)} 后`);
    },

    /**
     * 重置猫咪来访计时器（当放置/收回道具时调用）
     */
    resetCatVisitTimer() {
        console.log('道具发生变化，重置猫咪来访计时器');
        this.scheduleNextCatVisit();
    },

    /**
     * 保存游戏
     */
    saveGame() {
        // 保存当前猫咪状态
        CatSystem.saveToGameState(this.gameState);

        // 保存到localStorage
        const success = Storage.saveGameData(this.gameState);
        
        if (success) {
            console.log('游戏已自动保存');
        } else {
            console.error('游戏保存失败');
        }
    },

    /**
     * 绑定页面事件
     */
    bindPageEvents() {
        // 页面隐藏/可见时的处理
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('页面隐藏，保存游戏状态');
                this.saveGame();
            }
        });

        // 页面即将卸载时保存
        window.addEventListener('beforeunload', () => {
            console.log('页面即将卸载，保存游戏状态');
            this.saveGame();
        });

        // 页面加载完成时的处理
        window.addEventListener('load', () => {
            console.log('页面加载完成');
        });
    },

    /**
     * 显示欢迎信息
     */
    showWelcomeMessage() {
        // 检查是否是首次游戏
        const isFirstTime = this.gameState.collectedCats && this.gameState.collectedCats.length === 0 && 
                           this.gameState.fishCount === 0;

        if (isFirstTime) {
            setTimeout(() => {
                UI.showNotification('🐱 欢迎来到猫咪后院！', 'info');
                setTimeout(() => {
                    UI.showNotification('💡 提示：在"布置"标签页放置食盆和玩具来吸引猫咪', 'info');
                }, 1500);
            }, 500);
        } else {
            const currentCats = CatSystem.getCurrentCats();
            if (currentCats.length > 0) {
                setTimeout(() => {
                    UI.showNotification(`庭院中有 ${currentCats.length} 只猫咪正在玩耍！`, 'info');
                }, 500);
            }
        }
    },

    /**
     * 重置游戏（调试用）
     */
    resetGame() {
        if (confirm('确定要重置游戏吗？所有进度将丢失！')) {
            // 清除存储
            Storage.clearAll();

            // 停止循环
            this.stopGameLoop();
            this.stopAutoSave();

            // 重新加载
            this.loadGameState();
            this.initSystems();
            this.startGameLoop();
            this.startAutoSave();
            this.scheduleNextCatVisit();

            UI.showNotification('游戏已重置', 'success');
            console.log('游戏已重置');
        }
    },

    /**
     * 导出游戏数据
     */
    exportGameData() {
        const data = Storage.exportData();
        console.log('导出的游戏数据:', data);
        
        // 创建下载链接
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cat_yard_save_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        UI.showNotification('游戏数据已导出', 'success');
    },

    /**
     * 导入游戏数据
     */
    importGameData() {
        // 创建文件输入
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target.result;
                
                // 确认导入
                if (confirm('确定要导入游戏数据吗？当前进度将被覆盖！')) {
                    const success = Storage.importData(content);
                    
                    if (success) {
                        // 重新加载游戏
                        this.stopGameLoop();
                        this.stopAutoSave();
                        
                        this.loadGameState();
                        this.initSystems();
                        this.startGameLoop();
                        this.startAutoSave();
                        this.scheduleNextCatVisit();
                        
                        UI.showNotification('游戏数据导入成功！', 'success');
                        UI.refreshAll();
                    } else {
                        UI.showNotification('数据格式不正确，导入失败', 'error');
                    }
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    },

    /**
     * 获取游戏状态信息（调试用）
     */
    getGameInfo() {
        const info = {
            fishCount: this.gameState.fishCount,
            collectedCats: this.gameState.collectedCats ? this.gameState.collectedCats.length : 0,
            ownedItems: this.gameState.ownedItems ? this.gameState.ownedItems.length : 0,
            placedItems: this.gameState.placedItems ? this.gameState.placedItems.length : 0,
            currentCats: CatSystem.getCurrentCats().length,
            nextVisitIn: Utils.formatTime(this.nextCatVisitTime),
            storageInfo: Storage.getStorageInfo()
        };
        
        console.log('游戏状态信息:', info);
        return info;
    }
};

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// 导出到全局（供调试使用）
window.App = App;
