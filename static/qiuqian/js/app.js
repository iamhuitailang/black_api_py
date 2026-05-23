window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('找不到游戏画布元素');
        return;
    }
    
    canvas.width = GameConfig.canvasWidth;
    canvas.height = GameConfig.canvasHeight;
    
    const game = new Game(canvas);
    
    window.addEventListener('keydown', (e) => {
        if (e.code === 'KeyM' && (game.state === GameConfig.gameStates.GAMEOVER || 
                                   game.state === GameConfig.gameStates.VICTORY)) {
            game.returnToMenu();
        }
    });
    
    window.addEventListener('beforeunload', () => {
        game.saveGame();
    });
    
    window.game = game;
});
