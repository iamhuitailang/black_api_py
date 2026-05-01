const Game = (function() {
    let gameData = null;
    let onDataChange = null;
    let selectedSeed = null;

    function init(callback) {
        onDataChange = callback;
        gameData = DataManager.loadGameData();
        notifyChange();
    }

    function notifyChange() {
        if (onDataChange) {
            onDataChange(gameData);
        }
        DataManager.saveGameData(gameData);
    }

    function getGameData() {
        return gameData;
    }

    function getPlayerInfo() {
        return { ...gameData.player };
    }

    function getPlots() {
        return gameData.plots.map(plot => ({ ...plot }));
    }

    function getInventory() {
        return { ...gameData.inventory };
    }

    function getWarehouse() {
        return { ...gameData.warehouse };
    }

    function getSelectedSeed() {
        return selectedSeed;
    }

    function setSelectedSeed(seedId) {
        selectedSeed = seedId;
    }

    function buySeed(cropId) {
        const crop = DataManager.getCropById(cropId);
        if (!crop) {
            return { success: false, message: '作物不存在' };
        }

        if (gameData.player.level < crop.levelRequired) {
            return { success: false, message: `需要达到 ${crop.levelRequired} 级才能购买` };
        }

        if (gameData.player.gold < crop.seedPrice) {
            return { success: false, message: '金币不足' };
        }

        gameData.player.gold -= crop.seedPrice;
        
        if (!gameData.inventory[cropId]) {
            gameData.inventory[cropId] = 0;
        }
        gameData.inventory[cropId]++;

        notifyChange();
        return { success: true, message: `购买了 ${crop.emoji} ${crop.name} 种子` };
    }

    function plantSeed(plotIndex, cropId) {
        if (plotIndex < 0 || plotIndex >= gameData.plots.length) {
            return { success: false, message: '土地索引无效' };
        }

        const plot = gameData.plots[plotIndex];
        if (plot.cropId) {
            return { success: false, message: '这块土地已经种植了作物' };
        }

        if (!gameData.inventory[cropId] || gameData.inventory[cropId] <= 0) {
            return { success: false, message: '背包中没有该种子' };
        }

        const crop = DataManager.getCropById(cropId);
        if (!crop) {
            return { success: false, message: '作物不存在' };
        }

        gameData.inventory[cropId]--;
        if (gameData.inventory[cropId] <= 0) {
            delete gameData.inventory[cropId];
        }

        plot.cropId = cropId;
        plot.plantedAt = Date.now();
        plot.wateredAt = null;
        plot.fertilizedAt = null;

        notifyChange();
        return { success: true, message: `播种了 ${crop.emoji} ${crop.name}` };
    }

    function waterPlot(plotIndex) {
        if (plotIndex < 0 || plotIndex >= gameData.plots.length) {
            return { success: false, message: '土地索引无效' };
        }

        const plot = gameData.plots[plotIndex];
        if (!plot.cropId) {
            return { success: false, message: '这块土地没有种植作物' };
        }

        const crop = DataManager.getCropById(plot.cropId);
        const growth = DataManager.getGrowthStage(
            crop,
            plot.plantedAt,
            plot.wateredAt,
            plot.fertilizedAt
        );

        if (growth.isMature) {
            return { success: false, message: '作物已经成熟，不需要浇水' };
        }

        if (growth.waterBoostActive) {
            return { success: false, message: '该土地已经在浇水加速中' };
        }

        plot.wateredAt = Date.now();
        notifyChange();
        return { success: true, message: '浇水成功！生长速度提升1.5倍，持续10分钟' };
    }

    function fertilizePlot(plotIndex) {
        if (plotIndex < 0 || plotIndex >= gameData.plots.length) {
            return { success: false, message: '土地索引无效' };
        }

        const plot = gameData.plots[plotIndex];
        if (!plot.cropId) {
            return { success: false, message: '这块土地没有种植作物' };
        }

        const crop = DataManager.getCropById(plot.cropId);
        const growth = DataManager.getGrowthStage(
            crop,
            plot.plantedAt,
            plot.wateredAt,
            plot.fertilizedAt
        );

        if (growth.isMature) {
            return { success: false, message: '作物已经成熟，不需要施肥' };
        }

        if (growth.fertilizerActive) {
            return { success: false, message: '该土地已经施过肥了' };
        }

        if (gameData.player.gold < DataManager.FERTILIZER_COST) {
            return { success: false, message: `金币不足，施肥需要 ${DataManager.FERTILIZER_COST} 金币` };
        }

        gameData.player.gold -= DataManager.FERTILIZER_COST;
        plot.fertilizedAt = Date.now();
        notifyChange();
        return { success: true, message: '施肥成功！生长速度提升2倍' };
    }

    function harvestPlot(plotIndex) {
        if (plotIndex < 0 || plotIndex >= gameData.plots.length) {
            return { success: false, message: '土地索引无效' };
        }

        const plot = gameData.plots[plotIndex];
        if (!plot.cropId) {
            return { success: false, message: '这块土地没有种植作物' };
        }

        const crop = DataManager.getCropById(plot.cropId);
        const growth = DataManager.getGrowthStage(
            crop,
            plot.plantedAt,
            plot.wateredAt,
            plot.fertilizedAt
        );

        if (!growth.isMature) {
            return { success: false, message: '作物还未成熟' };
        }

        if (!gameData.warehouse[plot.cropId]) {
            gameData.warehouse[plot.cropId] = 0;
        }
        gameData.warehouse[plot.cropId]++;

        addExp(crop.exp);

        plot.cropId = null;
        plot.plantedAt = null;
        plot.wateredAt = null;
        plot.fertilizedAt = null;

        notifyChange();
        return { success: true, message: `收获了 ${crop.emoji} ${crop.name}，获得 ${crop.exp} 经验` };
    }

    function sellCrop(cropId) {
        if (!gameData.warehouse[cropId] || gameData.warehouse[cropId] <= 0) {
            return { success: false, message: '仓库中没有该作物' };
        }

        const crop = DataManager.getCropById(cropId);
        if (!crop) {
            return { success: false, message: '作物不存在' };
        }

        gameData.player.gold += crop.sellPrice;
        gameData.warehouse[cropId]--;
        if (gameData.warehouse[cropId] <= 0) {
            delete gameData.warehouse[cropId];
        }

        notifyChange();
        return { success: true, message: `卖出 ${crop.emoji} ${crop.name}，获得 ${crop.sellPrice} 金币` };
    }

    function sellAllCrops() {
        let totalGold = 0;
        let count = 0;

        for (const cropId in gameData.warehouse) {
            const crop = DataManager.getCropById(cropId);
            if (crop && gameData.warehouse[cropId] > 0) {
                totalGold += crop.sellPrice * gameData.warehouse[cropId];
                count += gameData.warehouse[cropId];
                delete gameData.warehouse[cropId];
            }
        }

        if (count === 0) {
            return { success: false, message: '仓库中没有作物' };
        }

        gameData.player.gold += totalGold;
        notifyChange();
        return { success: true, message: `卖出 ${count} 个作物，获得 ${totalGold} 金币` };
    }

    function addExp(amount) {
        gameData.player.exp += amount;
        
        let leveledUp = false;
        while (true) {
            const expForNextLevel = DataManager.getExpForLevel(gameData.player.level);
            if (gameData.player.exp >= expForNextLevel) {
                gameData.player.exp -= expForNextLevel;
                gameData.player.level++;
                leveledUp = true;
            } else {
                break;
            }
        }

        if (leveledUp) {
            notifyChange();
        }
    }

    function getInventoryCount() {
        let count = 0;
        for (const cropId in gameData.inventory) {
            count += gameData.inventory[cropId];
        }
        return count;
    }

    function getWarehouseCount() {
        let count = 0;
        for (const cropId in gameData.warehouse) {
            count += gameData.warehouse[cropId];
        }
        return count;
    }

    return {
        init,
        getGameData,
        getPlayerInfo,
        getPlots,
        getInventory,
        getWarehouse,
        getSelectedSeed,
        setSelectedSeed,
        buySeed,
        plantSeed,
        waterPlot,
        fertilizePlot,
        harvestPlot,
        sellCrop,
        sellAllCrops,
        addExp,
        getInventoryCount,
        getWarehouseCount
    };
})();
