var Scenes = (function() {
    'use strict';

    function getAllScenes() {
        var scenes = [];
        for (var sceneId in Config.SCENES) {
            scenes.push(Config.SCENES[sceneId]);
        }
        return scenes;
    }

    function getScene(sceneId) {
        return Config.SCENES[sceneId] || null;
    }

    function getCurrentScene() {
        return GameState.getCurrentScene();
    }

    function getAreas(sceneId) {
        var scene = getScene(sceneId);
        if (!scene) return [];
        return scene.areas.filter(function(area) {
            if (area.hidden) {
                return GameState.isAreaRevealed(area.id);
            }
            return true;
        });
    }

    function getCurrentAreas() {
        var currentScene = getCurrentScene();
        if (!currentScene) return [];
        return getAreas(currentScene.id);
    }

    function getAreaAtPosition(sceneId, x, y, canvasWidth, canvasHeight) {
        var areas = getAreas(sceneId);
        
        for (var i = 0; i < areas.length; i++) {
            var area = areas[i];
            var areaX = area.x * canvasWidth;
            var areaY = area.y * canvasHeight;
            var areaWidth = area.width * canvasWidth;
            var areaHeight = area.height * canvasHeight;
            
            if (x >= areaX && x <= areaX + areaWidth &&
                y >= areaY && y <= areaY + areaHeight) {
                return area;
            }
        }
        
        return null;
    }

    function getAreaPuzzle(area) {
        if (!area || !area.puzzleId) return null;
        return Puzzles.getPuzzle(area.puzzleId);
    }

    function isAreaInteractable(area) {
        if (!area) return false;
        
        if (area.puzzleId) {
            return !Puzzles.isPuzzleCompleted(area.puzzleId);
        }
        
        return true;
    }

    function handleAreaClick(area) {
        if (!area) {
            return { success: false, message: '这里似乎没什么特别的...' };
        }
        
        if (area.requiresItem && !GameState.hasItem(area.requiresItem)) {
            var requiredItem = Items.getItem(area.requiresItem);
            return {
                success: false,
                message: '这里需要使用：' + (requiredItem ? requiredItem.name : '某个物品')
            };
        }
        
        if (area.puzzleId) {
            var selectedItem = GameState.getSelectedItem();
            var selectedItemId = selectedItem ? selectedItem.id : null;
            
            return Puzzles.executeStep(area.puzzleId, selectedItemId);
        }
        
        var availableItems = Items.getAvailableItemsInArea(
            getCurrentScene().id, 
            area.id
        );
        
        if (availableItems.length > 0) {
            var item = availableItems[0];
            return Items.pickupItem(item.id);
        }
        
        return { success: false, message: '这里似乎没什么特别的...' };
    }

    return {
        getAllScenes: getAllScenes,
        getScene: getScene,
        getCurrentScene: getCurrentScene,
        getAreas: getAreas,
        getCurrentAreas: getCurrentAreas,
        getAreaAtPosition: getAreaAtPosition,
        getAreaPuzzle: getAreaPuzzle,
        isAreaInteractable: isAreaInteractable,
        handleAreaClick: handleAreaClick
    };
})();
