/**
 * 咯咯农场 - 主应用入口
 * 整合所有模块并启动游戏
 */

(function() {
    'use strict';
    
    console.log('🐔 咯咯农场正在启动...');
    
    function initGame() {
        try {
            const gameState = Game.init();
            
            UI.init();
            
            const canvas = document.getElementById('game-canvas');
            Renderer.init(canvas);
            
            Game.addGameListener(UI.handleGameEvent);
            
            UI.updateUI(gameState);
            UI.renderChickenShop();
            UI.renderCoopUpgrade();
            
            Renderer.startRendering(gameState);
            
            Game.startGameLoop();
            
            console.log('✅ 咯咯农场启动成功！');
            
            if (StorageManager.hasSaveGame()) {
                UI.showToast('欢迎回来！你的农场已恢复。');
            } else {
                UI.showToast('欢迎来到咯咯农场！开始你的养鸡之旅吧！');
            }
            
            window.addEventListener('beforeunload', () => {
                Game.saveGame();
                console.log('💾 游戏已保存');
            });
            
            setInterval(() => {
                Game.saveGame();
            }, 30000);
            
        } catch (error) {
            console.error('❌ 游戏启动失败:', error);
            alert('游戏启动失败，请刷新页面重试。\n错误信息: ' + error.message);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGame);
    } else {
        initGame();
    }
    
    window.GagaFarm = {
        Game,
        UI,
        Renderer,
        StorageManager,
        ChickenManager,
        EventSystem,
        
        getState: () => Game.getGameState(),
        save: () => Game.saveGame(),
        reset: () => {
            if (confirm('确定要重置游戏吗？')) {
                Game.resetGame();
                location.reload();
            }
        }
    };
    
})();
