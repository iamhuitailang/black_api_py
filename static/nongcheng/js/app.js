(function() {
    let canvas = null;
    let animationId = null;

    function init() {
        canvas = document.getElementById('gameCanvas');
        
        Renderer.init(canvas);
        
        Game.init(onGameDataChange);
        
        UI.init(onToolChange);
        
        setupCanvasEvents();
        
        updateUI();
        
        startGameLoop();
        
        console.log('🌱 开心农场游戏已启动！');
    }

    function onGameDataChange(gameData) {
        updateUI();
    }

    function onToolChange(tool) {
        console.log('切换工具:', tool);
    }

    function updateUI() {
        const player = Game.getPlayerInfo();
        UI.updatePlayerUI(player);
        
        const seedCount = Game.getInventoryCount();
        UI.updateSeedCount(seedCount);
    }

    function setupCanvasEvents() {
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('click', handleCanvasClick);
        canvas.addEventListener('mouseleave', handleMouseLeave);
    }

    function handleMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const plotIndex = Renderer.getPlotAtPosition(x, y);
        Renderer.setHoveredPlot(plotIndex);
    }

    function handleMouseLeave() {
        Renderer.setHoveredPlot(-1);
    }

    function handleCanvasClick(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const plotIndex = Renderer.getPlotAtPosition(x, y);
        
        if (plotIndex === -1) {
            return;
        }
        
        const currentTool = UI.getCurrentTool();
        const plots = Game.getPlots();
        const plot = plots[plotIndex];
        
        let result = null;
        
        switch (currentTool) {
            case 'hand':
                result = handleHandTool(plotIndex, plot);
                break;
                
            case 'seed':
                result = handleSeedTool(plotIndex, plot);
                break;
                
            case 'water':
                result = handleWaterTool(plotIndex, plot);
                break;
                
            case 'fertilizer':
                result = handleFertilizerTool(plotIndex, plot);
                break;
        }
        
        if (result) {
            UI.showToast(result.message, result.success ? 'success' : 'error');
        }
    }

    function handleHandTool(plotIndex, plot) {
        if (!plot.cropId) {
            return { success: false, message: '这块土地还没有种植作物' };
        }
        
        const crop = DataManager.getCropById(plot.cropId);
        const growth = DataManager.getGrowthStage(
            crop,
            plot.plantedAt,
            plot.wateredAt,
            plot.fertilizedAt
        );
        
        if (growth.isMature) {
            return Game.harvestPlot(plotIndex);
        } else {
            const stageNames = {
                'seed': '种子',
                'seedling': '幼苗',
                'mature': '成熟'
            };
            const remainingTime = Math.ceil(growth.remainingTime / 1000);
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            
            return {
                success: false,
                message: `${crop.emoji} ${crop.name} 还在${stageNames[growth.stage]}阶段，还需要 ${minutes}分${seconds}秒 成熟`
            };
        }
    }

    function handleSeedTool(plotIndex, plot) {
        if (plot.cropId) {
            return { success: false, message: '这块土地已经种植了作物' };
        }
        
        const selectedSeed = Game.getSelectedSeed();
        
        if (!selectedSeed) {
            const inventory = Game.getInventory();
            const seedList = [];
            for (const cropId in inventory) {
                if (inventory[cropId] > 0) {
                    seedList.push(cropId);
                }
            }
            
            if (seedList.length === 0) {
                return { success: false, message: '背包中没有种子，先去商店购买吧！' };
            }
            
            Game.setSelectedSeed(seedList[0]);
            const crop = DataManager.getCropById(seedList[0]);
            return { success: false, message: `已自动选择 ${crop.emoji} ${crop.name}，再次点击土地播种` };
        }
        
        return Game.plantSeed(plotIndex, selectedSeed);
    }

    function handleWaterTool(plotIndex, plot) {
        return Game.waterPlot(plotIndex);
    }

    function handleFertilizerTool(plotIndex, plot) {
        return Game.fertilizePlot(plotIndex);
    }

    function startGameLoop() {
        function gameLoop() {
            const plots = Game.getPlots();
            Renderer.render(plots);
            animationId = requestAnimationFrame(gameLoop);
        }
        gameLoop();
    }

    function stopGameLoop() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    document.addEventListener('DOMContentLoaded', init);

    window.addEventListener('beforeunload', () => {
        stopGameLoop();
    });

})();
