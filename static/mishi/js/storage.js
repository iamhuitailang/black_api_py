var Storage = (function() {
    'use strict';

    function saveGame(gameState) {
        try {
            var saveData = {
                version: 1,
                savedAt: Utils.now(),
                currentScene: gameState.currentScene,
                inventory: gameState.inventory,
                selectedItem: gameState.selectedItem,
                puzzles: gameState.puzzles,
                revealedAreas: gameState.revealedAreas,
                hintsUsed: gameState.hintsUsed,
                currentHintIndex: gameState.currentHintIndex,
                gameStarted: gameState.gameStarted,
                gamePaused: gameState.gamePaused,
                gameWon: gameState.gameWon,
                messageHistory: gameState.messageHistory
            };
            var jsonString = JSON.stringify(saveData);
            localStorage.setItem(Config.GAME_CONFIG.storageKey, jsonString);
            console.log('💾 游戏已保存');
            return true;
        } catch (error) {
            console.error('❌ 保存失败：', error);
            return false;
        }
    }

    function loadGame() {
        try {
            var savedData = localStorage.getItem(Config.GAME_CONFIG.storageKey);
            if (!savedData) {
                return null;
            }
            var parsedData = JSON.parse(savedData);
            console.log('✅ 存档加载成功！');
            return parsedData;
        } catch (error) {
            console.error('❌ 存档解析失败：', error);
            return null;
        }
    }

    function hasSavedGame() {
        return localStorage.getItem(Config.GAME_CONFIG.storageKey) !== null;
    }

    function clearSaveData() {
        localStorage.removeItem(Config.GAME_CONFIG.storageKey);
        console.log('🔄 存档已清除');
    }

    function getDefaultSaveData() {
        var puzzles = {};
        for (var puzzleId in Config.PUZZLES) {
            puzzles[puzzleId] = {
                currentStep: 0,
                completed: false
            };
        }
        
        return {
            version: 1,
            savedAt: Utils.now(),
            currentScene: 'study',
            inventory: [],
            selectedItem: null,
            puzzles: puzzles,
            revealedAreas: [],
            hintsUsed: 0,
            currentHintIndex: {},
            gameStarted: false,
            gamePaused: false,
            gameWon: false,
            messageHistory: []
        };
    }

    return {
        saveGame: saveGame,
        loadGame: loadGame,
        hasSavedGame: hasSavedGame,
        clearSaveData: clearSaveData,
        getDefaultSaveData: getDefaultSaveData
    };
})();
