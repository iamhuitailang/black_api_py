var GameApp = (function() {
    var lastTime = 0;
    var animationId = null;
    var isRunning = false;
    
    function init() {
        var canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }
        
        Renderer.init(canvas);
        
        var hasSavedGame = GameEngine.init();
        
        GameEngine.setStateChangeCallback(GameUI.handleStateChange);
        GameEngine.setScoreChangeCallback(GameUI.handleScoreChange);
        
        GameUI.init(hasSavedGame);
        
        startGameLoop();
    }
    
    function startGameLoop() {
        if (isRunning) return;
        isRunning = true;
        lastTime = Date.now();
        gameLoop();
    }
    
    function stopGameLoop() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        isRunning = false;
    }
    
    function gameLoop() {
        var now = Date.now();
        var deltaTime = now - lastTime;
        lastTime = now;
        
        if (deltaTime > 100) {
            deltaTime = 16;
        }
        
        var gameState = GameEngine.getGameState();
        
        if (gameState.state === GameConfig.GAME_STATE.PLAYING) {
            GameEngine.update(deltaTime);
        }
        
        if (gameState.state === GameConfig.GAME_STATE.PLAYING ||
            gameState.state === GameConfig.GAME_STATE.PAUSED) {
            Renderer.render(GameEngine.getDucks(), now);
        } else {
            Renderer.render([], now);
        }
        
        animationId = requestAnimationFrame(gameLoop);
    }
    
    return {
        init: init,
        startGameLoop: startGameLoop,
        stopGameLoop: stopGameLoop
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    GameApp.init();
});
