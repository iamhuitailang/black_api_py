var Puzzles = (function() {
    'use strict';

    function getAllPuzzles() {
        var puzzles = [];
        for (var puzzleId in Config.PUZZLES) {
            puzzles.push(Config.PUZZLES[puzzleId]);
        }
        return puzzles;
    }

    function getPuzzle(puzzleId) {
        return Config.PUZZLES[puzzleId] || null;
    }

    function getPuzzleState(puzzleId) {
        return GameState.getPuzzle(puzzleId);
    }

    function getCurrentStep(puzzleId) {
        var puzzleConfig = getPuzzle(puzzleId);
        var puzzleState = getPuzzleState(puzzleId);
        
        if (!puzzleConfig || !puzzleState) return null;
        
        return puzzleConfig.steps[puzzleState.currentStep];
    }

    function isPuzzleCompleted(puzzleId) {
        return GameState.isPuzzleCompleted(puzzleId);
    }

    function canExecuteStep(puzzleId, selectedItemId) {
        var step = getCurrentStep(puzzleId);
        if (!step) return false;
        
        if (step.requiresItem) {
            return selectedItemId === step.requiresItem;
        }
        
        return true;
    }

    function executeStep(puzzleId, selectedItemId) {
        var step = getCurrentStep(puzzleId);
        if (!step) {
            return { success: false, message: '这个谜题已经完成了' };
        }
        
        if (step.requiresItem && selectedItemId !== step.requiresItem) {
            var requiredItem = Items.getItem(step.requiresItem);
            return { 
                success: false, 
                message: '这里需要使用：' + requiredItem.name 
            };
        }
        
        var result = {
            success: true,
            message: step.message,
            action: step.action
        };
        
        if (step.reward) {
            var pickupResult = Items.pickupItem(step.reward);
            if (pickupResult.success) {
                result.reward = pickupResult.item;
            }
        }
        
        if (step.consumeItem && selectedItemId) {
            GameState.removeItem(selectedItemId);
            result.consumedItem = selectedItemId;
        }
        
        if (step.revealArea) {
            GameState.revealArea(step.revealArea);
            result.revealedArea = step.revealArea;
        }
        
        if (step.action === 'victory') {
            GameState.winGame();
            result.victory = true;
        }
        
        GameState.advancePuzzle(puzzleId);
        GameState.addMessageToHistory(step.message);
        GameState.setSelectedItem(null);
        
        return result;
    }

    function getCompletedCount() {
        var count = 0;
        for (var puzzleId in Config.PUZZLES) {
            if (GameState.isPuzzleCompleted(puzzleId)) {
                count++;
            }
        }
        return count;
    }

    function getTotalCount() {
        return Object.keys(Config.PUZZLES).length;
    }

    function getHint(puzzleId) {
        var hints = Config.HINTS[puzzleId];
        if (!hints || hints.length === 0) {
            return null;
        }
        
        var currentIndex = GameState.getCurrentHintIndex(puzzleId);
        var hintIndex = Math.min(currentIndex, hints.length - 1);
        
        return hints[hintIndex];
    }

    function useHint(puzzleId) {
        var hints = Config.HINTS[puzzleId];
        if (!hints || hints.length === 0) {
            return null;
        }
        
        var hint = getHint(puzzleId);
        GameState.incrementHintIndex(puzzleId);
        
        return hint;
    }

    function getNextUnsolvedPuzzle() {
        if (!GameState.hasItem('poker') && !GameState.isPuzzleCompleted('desk_drawer')) {
            return 'desk_drawer';
        }
        
        if (GameState.hasItem('poker') && !GameState.hasItem('rusty_key') && !GameState.isPuzzleCompleted('fireplace_key')) {
            return 'fireplace_key';
        }
        
        if (GameState.hasItem('rusty_key') && !GameState.hasItem('diary') && !GameState.isPuzzleCompleted('cabinet_diary')) {
            return 'cabinet_diary';
        }
        
        if (GameState.hasItem('diary') && !GameState.isPuzzleCompleted('bookshelf_secret')) {
            return 'bookshelf_secret';
        }
        
        if (GameState.isAreaRevealed('secret_door') && !GameState.isPuzzleCompleted('final_escape')) {
            return 'final_escape';
        }
        
        for (var puzzleId in Config.PUZZLES) {
            if (!GameState.isPuzzleCompleted(puzzleId)) {
                return puzzleId;
            }
        }
        
        return null;
    }

    return {
        getAllPuzzles: getAllPuzzles,
        getPuzzle: getPuzzle,
        getPuzzleState: getPuzzleState,
        getCurrentStep: getCurrentStep,
        isPuzzleCompleted: isPuzzleCompleted,
        canExecuteStep: canExecuteStep,
        executeStep: executeStep,
        getCompletedCount: getCompletedCount,
        getTotalCount: getTotalCount,
        getHint: getHint,
        useHint: useHint,
        getNextUnsolvedPuzzle: getNextUnsolvedPuzzle
    };
})();
