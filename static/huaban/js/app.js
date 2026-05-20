const App = (function() {
    function init() {
        document.addEventListener('DOMContentLoaded', () => {
            UI.init();
            Game.init();
            
            UI.bindButtonEvents({
                onStartGame: (mode) => {
                    Game.startGame(mode);
                },
                onPause: () => {
                    Game.pause();
                },
                onResume: () => {
                    Game.resume();
                },
                onRestart: () => {
                    Game.restart();
                },
                onQuit: () => {
                    Game.quit();
                }
            });
            
            UI.showScreen('mainMenu');
            
            setTimeout(() => {
                const savedState = Storage.getGameState();
                if (savedState && savedState.gameState === 'playing') {
                    if (confirm('检测到未完成的游戏，是否继续？')) {
                        Game.resumeFromSave(savedState);
                    } else {
                        Storage.clearGameState();
                    }
                }
            }, 100);
            
            console.log('🛹 滑板特技大师 已加载完成!');
            console.log('操作说明:');
            console.log('  Space/↑ - 跳跃 (按住增加高度)');
            console.log('  ←/→ - 空中旋转 / 地面移动');
            console.log('  ↓ - 下蹲蓄力');
            console.log('  J/K - 特技1 (抓板)');
            console.log('  L/U - 特技2 (踢板)');
            console.log('  Shift - 磨板');
            console.log('  ESC/P - 暂停');
        });
        
        window.addEventListener('beforeunload', (e) => {
            const state = Game.getState();
            if (state.gameState === 'playing') {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }
    
    return {
        init
    };
})();

App.init();
