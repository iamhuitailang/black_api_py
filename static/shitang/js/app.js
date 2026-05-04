/**
 * 游戏主入口文件
 * 负责游戏的初始化和主循环
 */

const Game = {
    // 游戏是否运行中
    isRunning: false,
    
    // 上次更新时间
    lastUpdateTime: 0,
    
    // 游戏循环定时器
    gameLoopInterval: null,

    /**
     * 初始化游戏
     */
    init() {
        console.log('========================================');
        console.log('🍜 美味食堂 - 饭店经营小游戏');
        console.log('========================================');
        
        // 初始化游戏状态
        GameState.init();
        
        // 初始化餐厅系统
        RestaurantSystem.init();
        
        // 初始化渲染器
        if (!Renderer.init('game-canvas')) {
            console.error('渲染器初始化失败！');
            return;
        }
        
        // 初始化 UI
        UI.init();
        
        // 启动游戏
        this.start();
        
        console.log('游戏初始化完成！');
    },

    /**
     * 开始游戏
     */
    start() {
        if (this.isRunning) {
            console.log('游戏已经在运行中');
            return;
        }
        
        this.isRunning = true;
        this.lastUpdateTime = performance.now();
        
        // 启动渲染循环
        Renderer.start();
        
        // 启动游戏逻辑循环（每 16ms 约 60 FPS）
        this.gameLoopInterval = setInterval(() => {
            this.update();
        }, 16);
        
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // 页面隐藏时保存游戏
                GameState.save();
            }
        });
        
        // 页面卸载前保存
        window.addEventListener('beforeunload', () => {
            GameState.save();
        });
        
        console.log('游戏已启动');
    },

    /**
     * 暂停游戏
     */
    pause() {
        if (!this.isRunning) {
            return;
        }
        
        this.isRunning = false;
        
        // 停止游戏循环
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
        }
        
        // 停止渲染
        Renderer.stop();
        
        // 保存游戏
        GameState.save();
        
        console.log('游戏已暂停');
    },

    /**
     * 游戏更新逻辑
     */
    update() {
        if (!this.isRunning) {
            return;
        }
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastUpdateTime;
        
        // 限制最大增量时间（防止跳帧过大）
        const maxDeltaTime = 100; // 最大 100ms
        const actualDeltaTime = Math.min(deltaTime, maxDeltaTime);
        
        // 更新餐厅系统
        RestaurantSystem.update(actualDeltaTime);
        
        // 更新状态栏
        UI.updateStatusBar();
        
        this.lastUpdateTime = currentTime;
    },

    /**
     * 重置游戏
     */
    reset() {
        // 确认是否重置
        if (!confirm('确定要重置游戏吗？所有进度将丢失！')) {
            return;
        }
        
        // 暂停游戏
        this.pause();
        
        // 清除存档
        Storage.clear();
        
        // 重新初始化
        GameState.createNewGame();
        RestaurantSystem.init();
        
        // 更新位置
        Renderer.updatePositions();
        
        // 更新 UI
        UI.updateStatusBar();
        
        // 重新启动
        this.start();
        
        console.log('游戏已重置');
    },

    /**
     * 手动保存游戏
     */
    save() {
        GameState.save();
        UI.showToast('游戏已保存！');
    },

    /**
     * 获取游戏信息
     * @returns {Object} 游戏信息
     */
    getGameInfo() {
        const restaurantInfo = RestaurantSystem.getRestaurantInfo();
        const playTimeSeconds = Math.floor(GameState.stats.playTime / 1000);
        const hours = Math.floor(playTimeSeconds / 3600);
        const minutes = Math.floor((playTimeSeconds % 3600) / 60);
        const seconds = playTimeSeconds % 60;
        
        return {
            gold: GameState.gold,
            reputation: GameState.reputation,
            satisfaction: GameState.satisfaction,
            restaurantLevel: GameState.restaurantLevel,
            restaurantName: restaurantInfo.name,
            totalCustomersServed: GameState.stats.totalCustomersServed,
            totalGoldEarned: GameState.stats.totalGoldEarned,
            totalRecipesCooked: GameState.stats.totalRecipesCooked,
            playTime: `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
            employees: GameState.employees.length,
            ownedRecipes: GameState.recipes.filter(r => r.owned).length,
            ownedKitchenwares: GameState.kitchenwares.filter(kw => kw.owned).length
        };
    }
};

// 页面加载完成后初始化游戏
window.addEventListener('load', () => {
    Game.init();
});

// 导出 Game 对象
window.Game = Game;