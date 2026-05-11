var UI = (function() {
    'use strict';

    var elements = {};
    var messageTimeout = null;

    function init() {
        cacheElements();
        bindEvents();
        updateInventory();
        checkSavedGame();
    }

    function cacheElements() {
        elements = {
            messageBox: Utils.$('#message-box'),
            inventoryItems: Utils.$('#inventory-items'),
            hintBtn: Utils.$('#hint-btn'),
            pauseBtn: Utils.$('#pause-btn'),
            startScreen: Utils.$('#start-screen'),
            pauseScreen: Utils.$('#pause-screen'),
            victoryScreen: Utils.$('#victory-screen'),
            startBtn: Utils.$('#start-btn'),
            continueBtn: Utils.$('#continue-btn'),
            resumeBtn: Utils.$('#resume-btn'),
            restartBtn: Utils.$('#restart-btn'),
            quitBtn: Utils.$('#quit-btn'),
            playAgainBtn: Utils.$('#play-again-btn'),
            itemsCollected: Utils.$('#items-collected'),
            puzzlesSolved: Utils.$('#puzzles-solved'),
            hintsUsed: Utils.$('#hints-used')
        };
    }

    function bindEvents() {
        elements.startBtn.addEventListener('click', function() {
            App.startNewGame();
        });
        
        elements.continueBtn.addEventListener('click', function() {
            App.continueGame();
        });
        
        elements.hintBtn.addEventListener('click', function() {
            showHint();
        });
        
        elements.pauseBtn.addEventListener('click', function() {
            App.pauseGame();
        });
        
        elements.resumeBtn.addEventListener('click', function() {
            App.resumeGame();
        });
        
        elements.restartBtn.addEventListener('click', function() {
            if (confirm('确定要重新开始吗？所有进度将被清除！')) {
                App.restartGame();
            }
        });
        
        elements.quitBtn.addEventListener('click', function() {
            App.quitGame();
        });
        
        elements.playAgainBtn.addEventListener('click', function() {
            App.restartGame();
        });
    }

    function checkSavedGame() {
        if (Storage.hasSavedGame()) {
            Utils.removeClass(elements.continueBtn, 'hidden');
        }
    }

    function showStartScreen() {
        Utils.removeClass(elements.startScreen, 'hidden');
        Utils.addClass(elements.pauseScreen, 'hidden');
        Utils.addClass(elements.victoryScreen, 'hidden');
        checkSavedGame();
    }

    function hideStartScreen() {
        Utils.addClass(elements.startScreen, 'hidden');
    }

    function showPauseScreen() {
        Utils.removeClass(elements.pauseScreen, 'hidden');
    }

    function hidePauseScreen() {
        Utils.addClass(elements.pauseScreen, 'hidden');
    }

    function showVictoryScreen() {
        elements.itemsCollected.textContent = GameState.getInventory().length;
        elements.puzzlesSolved.textContent = Puzzles.getCompletedCount();
        elements.hintsUsed.textContent = GameState.getHintsUsed();
        
        Utils.removeClass(elements.victoryScreen, 'hidden');
        Utils.addClass(elements.pauseScreen, 'hidden');
    }

    function hideVictoryScreen() {
        Utils.addClass(elements.victoryScreen, 'hidden');
    }

    function showMessage(message) {
        if (messageTimeout) {
            clearTimeout(messageTimeout);
        }
        
        elements.messageBox.innerHTML = '<p>' + message + '</p>';
        Utils.removeClass(elements.messageBox, 'hidden');
        
        GameState.addMessageToHistory(message);
        
        messageTimeout = setTimeout(function() {
            Utils.addClass(elements.messageBox, 'hidden');
        }, 4000);
    }

    function hideMessage() {
        if (messageTimeout) {
            clearTimeout(messageTimeout);
        }
        Utils.addClass(elements.messageBox, 'hidden');
    }

    function updateInventory() {
        elements.inventoryItems.innerHTML = '';
        
        var inventory = GameState.getInventory();
        var selectedItem = GameState.getSelectedItem();
        
        if (inventory.length === 0) {
            var emptySlot = Utils.createElement('div', 'inventory-slot empty', '');
            emptySlot.innerHTML = '<span style="color: #5a4030; font-size: 12px;">空</span>';
            elements.inventoryItems.appendChild(emptySlot);
            return;
        }
        
        inventory.forEach(function(item) {
            var itemEl = Utils.createElement('div', 'inventory-item', item.icon);
            
            if (selectedItem && selectedItem.id === item.id) {
                Utils.addClass(itemEl, 'selected');
            }
            
            itemEl.dataset.itemId = item.id;
            
            var tooltip = Utils.createElement('div', 'tooltip', item.name);
            itemEl.appendChild(tooltip);
            
            itemEl.addEventListener('click', function() {
                handleInventoryClick(item.id);
            });
            
            elements.inventoryItems.appendChild(itemEl);
        });
    }

    function handleInventoryClick(itemId) {
        var selectedItem = GameState.getSelectedItem();
        
        if (selectedItem && selectedItem.id === itemId) {
            GameState.setSelectedItem(null);
            showMessage('已取消选择物品');
        } else {
            GameState.setSelectedItem(itemId);
            var item = Items.getItem(itemId);
            showMessage('已选择：' + item.name + ' - ' + item.description);
        }
        
        updateInventory();
    }

    function showHint() {
        var nextPuzzle = Puzzles.getNextUnsolvedPuzzle();
        
        if (!nextPuzzle) {
            showMessage('所有谜题都已解开！寻找出口吧！');
            return;
        }
        
        var hint = Puzzles.useHint(nextPuzzle);
        
        if (hint) {
            showMessage('💡 提示：' + hint);
        } else {
            showMessage('暂时没有可用的提示');
        }
    }

    function onStateChange(state) {
        updateInventory();
        
        if (state.gameWon) {
            showVictoryScreen();
        }
    }

    return {
        init: init,
        showStartScreen: showStartScreen,
        hideStartScreen: hideStartScreen,
        showPauseScreen: showPauseScreen,
        hidePauseScreen: hidePauseScreen,
        showVictoryScreen: showVictoryScreen,
        hideVictoryScreen: hideVictoryScreen,
        showMessage: showMessage,
        hideMessage: hideMessage,
        updateInventory: updateInventory,
        showHint: showHint,
        onStateChange: onStateChange
    };
})();
