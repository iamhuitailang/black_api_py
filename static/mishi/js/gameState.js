var GameState = (function() {
    'use strict';

    var state = null;
    var listeners = [];

    function init() {
        var savedData = Storage.loadGame();
        if (savedData) {
            var defaultData = Storage.getDefaultSaveData();
            state = Utils.deepMerge(defaultData, savedData);
        } else {
            state = Storage.getDefaultSaveData();
        }
        notifyListeners();
    }

    function reset() {
        Storage.clearSaveData();
        state = Storage.getDefaultSaveData();
        notifyListeners();
    }

    function getState() {
        return state;
    }

    function getCurrentScene() {
        return Config.SCENES[state.currentScene];
    }

    function setCurrentScene(sceneId) {
        if (Config.SCENES[sceneId]) {
            state.currentScene = sceneId;
            save();
            notifyListeners();
        }
    }

    function getInventory() {
        return state.inventory.map(function(itemId) {
            return Config.ITEMS[itemId];
        }).filter(Boolean);
    }

    function hasItem(itemId) {
        return state.inventory.indexOf(itemId) !== -1;
    }

    function addItem(itemId) {
        if (!hasItem(itemId) && Config.ITEMS[itemId]) {
            state.inventory.push(itemId);
            save();
            notifyListeners();
            return true;
        }
        return false;
    }

    function removeItem(itemId) {
        var index = state.inventory.indexOf(itemId);
        if (index !== -1) {
            state.inventory.splice(index, 1);
            save();
            notifyListeners();
            return true;
        }
        return false;
    }

    function getSelectedItem() {
        return state.selectedItem ? Config.ITEMS[state.selectedItem] : null;
    }

    function setSelectedItem(itemId) {
        if (itemId === null || hasItem(itemId)) {
            state.selectedItem = itemId;
            save();
            notifyListeners();
        }
    }

    function getPuzzle(puzzleId) {
        return state.puzzles[puzzleId];
    }

    function advancePuzzle(puzzleId) {
        if (!state.puzzles[puzzleId]) return false;
        
        var puzzleConfig = Config.PUZZLES[puzzleId];
        if (!puzzleConfig) return false;
        
        var puzzleState = state.puzzles[puzzleId];
        if (puzzleState.completed) return false;
        
        if (puzzleState.currentStep < puzzleConfig.steps.length - 1) {
            puzzleState.currentStep++;
        } else {
            puzzleState.completed = true;
        }
        
        save();
        notifyListeners();
        return true;
    }

    function isPuzzleCompleted(puzzleId) {
        return state.puzzles[puzzleId] && state.puzzles[puzzleId].completed;
    }

    function isAreaRevealed(areaId) {
        return state.revealedAreas.indexOf(areaId) !== -1;
    }

    function revealArea(areaId) {
        if (!isAreaRevealed(areaId)) {
            state.revealedAreas.push(areaId);
            save();
            notifyListeners();
        }
    }

    function getHintsUsed() {
        return state.hintsUsed;
    }

    function incrementHintsUsed() {
        state.hintsUsed++;
        save();
        notifyListeners();
    }

    function getCurrentHintIndex(puzzleId) {
        return state.currentHintIndex[puzzleId] || 0;
    }

    function incrementHintIndex(puzzleId) {
        if (!state.currentHintIndex[puzzleId]) {
            state.currentHintIndex[puzzleId] = 0;
        }
        state.currentHintIndex[puzzleId]++;
        incrementHintsUsed();
        save();
        notifyListeners();
    }

    function startGame() {
        state.gameStarted = true;
        state.gamePaused = false;
        save();
        notifyListeners();
    }

    function pauseGame() {
        state.gamePaused = true;
        save();
        notifyListeners();
    }

    function resumeGame() {
        state.gamePaused = false;
        save();
        notifyListeners();
    }

    function winGame() {
        state.gameWon = true;
        save();
        notifyListeners();
    }

    function addMessageToHistory(message) {
        state.messageHistory.push({
            text: message,
            timestamp: Utils.now()
        });
        if (state.messageHistory.length > 50) {
            state.messageHistory = state.messageHistory.slice(-50);
        }
        save();
    }

    function save() {
        Storage.saveGame(state);
    }

    function subscribe(listener) {
        listeners.push(listener);
        return function() {
            var index = listeners.indexOf(listener);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        };
    }

    function notifyListeners() {
        listeners.forEach(function(listener) {
            try {
                listener(state);
            } catch (e) {
                console.error('Listener error:', e);
            }
        });
    }

    return {
        init: init,
        reset: reset,
        getState: getState,
        getCurrentScene: getCurrentScene,
        setCurrentScene: setCurrentScene,
        getInventory: getInventory,
        hasItem: hasItem,
        addItem: addItem,
        removeItem: removeItem,
        getSelectedItem: getSelectedItem,
        setSelectedItem: setSelectedItem,
        getPuzzle: getPuzzle,
        advancePuzzle: advancePuzzle,
        isPuzzleCompleted: isPuzzleCompleted,
        isAreaRevealed: isAreaRevealed,
        revealArea: revealArea,
        getHintsUsed: getHintsUsed,
        incrementHintsUsed: incrementHintsUsed,
        getCurrentHintIndex: getCurrentHintIndex,
        incrementHintIndex: incrementHintIndex,
        startGame: startGame,
        pauseGame: pauseGame,
        resumeGame: resumeGame,
        winGame: winGame,
        addMessageToHistory: addMessageToHistory,
        save: save,
        subscribe: subscribe
    };
})();
