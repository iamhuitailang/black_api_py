var Items = (function() {
    'use strict';

    function getAllItems() {
        var items = [];
        for (var itemId in Config.ITEMS) {
            items.push(Config.ITEMS[itemId]);
        }
        return items;
    }

    function getItem(itemId) {
        return Config.ITEMS[itemId] || null;
    }

    function canPickupItem(itemId) {
        var item = getItem(itemId);
        if (!item) return false;
        
        if (item.requiresPuzzle) {
            return GameState.isPuzzleCompleted(item.requiresPuzzle);
        }
        
        return true;
    }

    function pickupItem(itemId) {
        if (!GameState.hasItem(itemId) && canPickupItem(itemId)) {
            var item = getItem(itemId);
            GameState.addItem(itemId);
            return {
                success: true,
                item: item,
                message: '你获得了：' + item.name + '！'
            };
        }
        return {
            success: false,
            message: '无法获取该物品'
        };
    }

    function getItemsInArea(sceneId, areaId) {
        var items = [];
        for (var itemId in Config.ITEMS) {
            var item = Config.ITEMS[itemId];
            if (item.scene === sceneId && item.area === areaId) {
                items.push(item);
            }
        }
        return items;
    }

    function getAvailableItemsInArea(sceneId, areaId) {
        return getItemsInArea(sceneId, areaId).filter(function(item) {
            return !GameState.hasItem(item.id) && canPickupItem(item.id);
        });
    }

    return {
        getAllItems: getAllItems,
        getItem: getItem,
        canPickupItem: canPickupItem,
        pickupItem: pickupItem,
        getItemsInArea: getItemsInArea,
        getAvailableItemsInArea: getAvailableItemsInArea
    };
})();
