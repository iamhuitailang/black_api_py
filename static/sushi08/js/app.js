
(function() {
    'use strict';

    function initGame() {
        const canvas = document.getElementById('game-canvas');
        
        CanvasManager.init(canvas);
        EffectsManager.init(canvas);
        EffectsManager.start();

        GameManager.init();

        UIManager.init({
            onIngredientClick: function(ingredientId, event) {
                GameManager.selectIngredient(ingredientId, event);
            },
            onRemoveIngredient: function(ingredientId) {
                GameManager.removeIngredient(ingredientId);
            },
            onConfirm: function() {
                GameManager.confirmOrder();
            },
            onClear: function() {
                GameManager.clearIngredients();
            },
            onReset: function() {
                GameManager.reset();
            },
            onRestart: function() {
                GameManager.restart();
                GameManager.start();
            },
            onUnlockClose: function() {
                GameManager.handleUnlockClose();
            }
        });

        window.addEventListener('resize', function() {
            CanvasManager.resize();
        });

        GameManager.start();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGame);
    } else {
        initGame();
    }

    window.addEventListener('beforeunload', function(e) {
        const state = GameState.getState();
        if (state.gameActive) {
            StorageManager.saveGame(state);
        }
    });
})();
