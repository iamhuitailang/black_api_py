document.addEventListener('DOMContentLoaded', function() {
    console.log('✨ 魔法工坊 · 药水大师 加载中...');
    
    Game.init();
    Renderer.init();
    UI.init();
    
    if (Storage.hasSave()) {
        const savedState = Storage.load();
        if (savedState && savedState.character) {
            Game.continueGame();
            UI.enterGame();
            console.log('📂 自动恢复游戏进度');
        }
    }
    
    window.addEventListener('beforeunload', function() {
        if (Game.getState() && Game.getState().character) {
            Game.saveGame();
        }
    });
    
    console.log('🎮 游戏加载完成！');
});
