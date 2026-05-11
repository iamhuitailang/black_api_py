var Input = (function() {
    'use strict';

    var canvas = null;
    var isListening = false;

    function init() {
        canvas = Utils.$('#game-canvas');
        if (!canvas) return;
        
        bindEvents();
        startListening();
    }

    function bindEvents() {
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('click', handleClick);
        canvas.addEventListener('mouseleave', handleMouseLeave);
        
        document.addEventListener('keydown', handleKeyDown);
    }

    function startListening() {
        isListening = true;
    }

    function stopListening() {
        isListening = false;
    }

    function handleMouseMove(e) {
        if (!isListening) return;
        
        var pos = getMousePosition(e);
        var canvasSize = Renderer.getCanvasSize();
        var scene = Scenes.getCurrentScene();
        
        if (!scene) return;
        
        var area = Scenes.getAreaAtPosition(
            scene.id, 
            pos.x, 
            pos.y, 
            canvasSize.width, 
            canvasSize.height
        );
        
        Renderer.setHoverArea(area);
        
        if (area) {
            canvas.style.cursor = 'pointer';
        } else {
            canvas.style.cursor = 'default';
        }
    }

    function handleClick(e) {
        if (!isListening) return;
        
        var pos = getMousePosition(e);
        var canvasSize = Renderer.getCanvasSize();
        var scene = Scenes.getCurrentScene();
        
        if (!scene) return;
        
        var area = Scenes.getAreaAtPosition(
            scene.id, 
            pos.x, 
            pos.y, 
            canvasSize.width, 
            canvasSize.height
        );
        
        if (area) {
            handleAreaClick(area);
        }
    }

    function handleMouseLeave(e) {
        Renderer.setHoverArea(null);
        canvas.style.cursor = 'default';
    }

    function handleAreaClick(area) {
        var selectedItem = GameState.getSelectedItem();
        
        if (area.puzzleId) {
            var puzzleStep = Puzzles.getCurrentStep(area.puzzleId);
            
            if (puzzleStep && puzzleStep.requiresItem) {
                if (selectedItem && selectedItem.id === puzzleStep.requiresItem) {
                    var result = Scenes.handleAreaClick(area);
                    processResult(result);
                } else if (selectedItem && selectedItem.id !== puzzleStep.requiresItem) {
                    var requiredItem = Items.getItem(puzzleStep.requiresItem);
                    UI.showMessage('这里需要使用：' + (requiredItem ? requiredItem.name : '正确的物品'));
                } else {
                    UI.showMessage('这里需要使用某个物品，先从背包中选择一个物品再点击这里。');
                }
            } else {
                if (selectedItem && !area.requiresItem) {
                    var testResult = Puzzles.canExecuteStep(area.puzzleId, selectedItem.id);
                    if (testResult) {
                        var result2 = Scenes.handleAreaClick(area);
                        processResult(result2);
                    } else {
                        UI.showMessage(selectedItem.name + '在这里似乎没有用...');
                        GameState.setSelectedItem(null);
                        UI.updateInventory();
                    }
                } else {
                    var result3 = Scenes.handleAreaClick(area);
                    processResult(result3);
                }
            }
        } else {
            var result4 = Scenes.handleAreaClick(area);
            processResult(result4);
        }
    }

    function processResult(result) {
        if (!result) return;
        
        UI.showMessage(result.message);
        
        if (result.victory) {
            App.showVictory();
        }
        
        if (result.reward) {
            console.log('获得物品：', result.reward.name);
        }
        
        if (result.consumedItem) {
            console.log('消耗物品：', result.consumedItem);
        }
        
        GameState.save();
        UI.updateInventory();
    }

    function handleKeyDown(e) {
        var state = GameState.getState();
        
        if (e.key === 'Escape') {
            if (state.gamePaused) {
                App.resumeGame();
            } else if (state.gameStarted && !state.gameWon) {
                App.pauseGame();
            }
        }
        
        if (e.key === 'h' || e.key === 'H') {
            if (state.gameStarted && !state.gamePaused && !state.gameWon) {
                UI.showHint();
            }
        }
    }

    function getMousePosition(e) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    return {
        init: init,
        startListening: startListening,
        stopListening: stopListening
    };
})();
