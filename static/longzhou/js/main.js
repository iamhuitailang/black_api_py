window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    Renderer.init(canvas);

    const game = new Game();
    window.game = game;

    UI.init(game);
    InputManager.init(game);

    try {
        const savedState = Storage.loadGameState();
        if (savedState && savedState.state === GameState.PLAYING) {
            const resumeGame = confirm('检测到未完成的游戏，是否继续?');
            if (resumeGame) {
                if (game.startFromSavedState()) {
                    return;
                }
            }
            Storage.clearGameState();
        }
    } catch (e) {
        console.error('读取存档失败，已清除:', e);
        Storage.clearGameState();
    }

    UI.showMainMenu();
});
