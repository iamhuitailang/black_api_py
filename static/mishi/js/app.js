var App = (function() {
    'use strict';

    var isInitialized = false;

    function init() {
        console.log('🏰 密室逃脱 · 文字迷境 初始化中...');
        
        GameState.init();
        Renderer.init();
        UI.init();
        Input.init();
        
        GameState.subscribe(UI.onStateChange);
        
        isInitialized = true;
        
        var state = GameState.getState();
        if (state.gameStarted && !state.gameWon) {
            UI.hideStartScreen();
            Input.startListening();
            UI.showMessage('欢迎回来！游戏进度已恢复。');
        } else if (state.gameWon) {
            UI.showVictoryScreen();
        }
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        console.log('✅ 游戏初始化完成！');
    }

    function startNewGame() {
        GameState.reset();
        GameState.startGame();
        UI.hideStartScreen();
        Input.startListening();
        UI.showMessage('你醒来发现自己身处一间古老的古堡书房...');
    }

    function continueGame() {
        var state = GameState.getState();
        if (state.gameStarted) {
            GameState.resumeGame();
            UI.hideStartScreen();
            Input.startListening();
            UI.showMessage('游戏继续！');
        }
    }

    function pauseGame() {
        GameState.pauseGame();
        Input.stopListening();
        UI.showPauseScreen();
    }

    function resumeGame() {
        GameState.resumeGame();
        UI.hidePauseScreen();
        Input.startListening();
    }

    function restartGame() {
        if (confirm('确定要重新开始吗？所有进度将被清除，此操作无法撤销！')) {
            GameState.reset();
            GameState.startGame();
            UI.hidePauseScreen();
            UI.hideVictoryScreen();
            UI.hideStartScreen();
            Input.startListening();
            UI.showMessage('游戏已重置！你再次醒来，身处古堡书房...');
        }
    }

    function quitGame() {
        GameState.pauseGame();
        GameState.save();
        Input.stopListening();
        UI.hidePauseScreen();
        UI.showStartScreen();
    }

    function showVictory() {
        GameState.winGame();
        Input.stopListening();
        UI.showVictoryScreen();
    }

    function handleBeforeUnload(e) {
        var state = GameState.getState();
        if (state.gameStarted && !state.gameWon) {
            GameState.save();
            e.preventDefault();
            e.returnValue = '';
        }
    }

    return {
        init: init,
        startNewGame: startNewGame,
        continueGame: continueGame,
        pauseGame: pauseGame,
        resumeGame: resumeGame,
        restartGame: restartGame,
        quitGame: quitGame,
        showVictory: showVictory
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    App.init();
});
