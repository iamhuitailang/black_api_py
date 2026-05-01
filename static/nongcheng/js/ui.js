const UI = (function() {
    let currentTool = 'hand';
    let onToolChange = null;
    let onPlotClick = null;

    function init(toolChangeCallback, plotClickCallback) {
        onToolChange = toolChangeCallback;
        onPlotClick = plotClickCallback;
        
        setupEventListeners();
    }

    function setupEventListeners() {
        document.querySelectorAll('.tool-item').forEach(item => {
            item.addEventListener('click', () => {
                const tool = item.dataset.tool;
                selectTool(tool);
            });
        });

        document.getElementById('shopBtn').addEventListener('click', () => {
            showShopModal();
        });
        document.getElementById('closeShop').addEventListener('click', () => {
            hideShopModal();
        });

        document.getElementById('inventoryBtn').addEventListener('click', () => {
            showInventoryModal();
        });
        document.getElementById('closeInventory').addEventListener('click', () => {
            hideInventoryModal();
        });

        document.getElementById('warehouseBtn').addEventListener('click', () => {
            showWarehouseModal();
        });
        document.getElementById('closeWarehouse').addEventListener('click', () => {
            hideWarehouseModal();
        });

        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                }
            });
        });
    }

    function selectTool(tool) {
        currentTool = tool;
        
        document.querySelectorAll('.tool-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.tool === tool) {
                item.classList.add('active');
            }
        });

        if (onToolChange) {
            onToolChange(tool);
        }
    }

    function getCurrentTool() {
        return currentTool;
    }

    function showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    function updatePlayerUI(player) {
        document.getElementById('playerLevel').textContent = player.level;
        document.getElementById('goldAmount').textContent = player.gold;
        
        const expForNextLevel = DataManager.getExpForLevel(player.level);
        const expPercent = (player.exp / expForNextLevel) * 100;
        
        document.getElementById('expFill').style.width = `${expPercent}%`;
        document.getElementById('expText').textContent = `${player.exp}/${expForNextLevel}`;
    }

    function updateSeedCount(count) {
        document.getElementById('seedCount').textContent = count;
    }

    function showShopModal() {
        const modal = document.getElementById('shopModal');
        renderShopContent();
        modal.classList.add('active');
    }

    function hideShopModal() {
        document.getElementById('shopModal').classList.remove('active');
    }

    function renderShopContent() {
        const container = document.getElementById('shopContent');
        const crops = DataManager.getAllCrops();
        const player = Game.getPlayerInfo();

        let html = '<div class="shop-grid">';
        
        crops.forEach(crop => {
            const canBuy = player.level >= crop.levelRequired && player.gold >= crop.seedPrice;
            const levelLocked = player.level < crop.levelRequired;
            
            html += `
                <div class="shop-item ${!canBuy ? 'disabled' : ''}" data-crop="${crop.id}">
                    <div class="item-icon">${crop.emoji}</div>
                    <div class="item-name">${crop.name}</div>
                    <div class="item-info">
                        成长时间: ${Math.floor(crop.growTime / 60000)}分钟<br>
                        卖出价格: ${crop.sellPrice}金币<br>
                        获得经验: ${crop.exp}
                    </div>
                    <div class="item-price">💰 ${crop.seedPrice}</div>
                    ${levelLocked ? `<div class="level-required">需要 ${crop.levelRequired} 级</div>` : ''}
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;

        container.querySelectorAll('.shop-item:not(.disabled)').forEach(item => {
            item.addEventListener('click', () => {
                const cropId = item.dataset.crop;
                const result = Game.buySeed(cropId);
                showToast(result.message, result.success ? 'success' : 'error');
                if (result.success) {
                    renderShopContent();
                }
            });
        });
    }

    function showInventoryModal() {
        const modal = document.getElementById('inventoryModal');
        renderInventoryContent();
        modal.classList.add('active');
    }

    function hideInventoryModal() {
        document.getElementById('inventoryModal').classList.remove('active');
    }

    function renderInventoryContent() {
        const container = document.getElementById('inventoryContent');
        const inventory = Game.getInventory();
        
        const inventoryItems = [];
        for (const cropId in inventory) {
            if (inventory[cropId] > 0) {
                const crop = DataManager.getCropById(cropId);
                if (crop) {
                    inventoryItems.push({
                        crop,
                        count: inventory[cropId]
                    });
                }
            }
        }

        if (inventoryItems.length === 0) {
            container.innerHTML = '<div class="empty-message">背包空空如也，去商店购买种子吧！</div>';
            return;
        }

        let html = '<div class="inventory-grid">';
        
        inventoryItems.forEach(item => {
            html += `
                <div class="inventory-item" data-crop="${item.crop.id}">
                    <div class="item-icon">${item.crop.emoji}</div>
                    <div class="item-name">${item.crop.name} 种子</div>
                    <div class="item-info">
                        成长时间: ${Math.floor(item.crop.growTime / 60000)}分钟<br>
                        卖出价格: ${item.crop.sellPrice}金币
                    </div>
                    <div class="item-count">🌱 x ${item.count}</div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;

        container.querySelectorAll('.inventory-item').forEach(item => {
            item.addEventListener('click', () => {
                const cropId = item.dataset.crop;
                Game.setSelectedSeed(cropId);
                selectTool('seed');
                hideInventoryModal();
                showToast(`已选择 ${DataManager.getCropById(cropId).emoji} ${DataManager.getCropById(cropId).name} 种子，点击土地播种`, 'success');
            });
        });
    }

    function showWarehouseModal() {
        const modal = document.getElementById('warehouseModal');
        renderWarehouseContent();
        modal.classList.add('active');
    }

    function hideWarehouseModal() {
        document.getElementById('warehouseModal').classList.remove('active');
    }

    function renderWarehouseContent() {
        const container = document.getElementById('warehouseContent');
        const warehouse = Game.getWarehouse();
        
        const warehouseItems = [];
        let totalValue = 0;
        
        for (const cropId in warehouse) {
            if (warehouse[cropId] > 0) {
                const crop = DataManager.getCropById(cropId);
                if (crop) {
                    warehouseItems.push({
                        crop,
                        count: warehouse[cropId]
                    });
                    totalValue += crop.sellPrice * warehouse[cropId];
                }
            }
        }

        if (warehouseItems.length === 0) {
            container.innerHTML = '<div class="empty-message">仓库空空如也，收获作物后再来吧！</div>';
            return;
        }

        let html = `
            <div class="fertilizer-info">
                <h3>💰 仓库总价值: ${totalValue} 金币</h3>
                <button class="sell-btn" id="sellAllBtn" style="margin-top: 10px; padding: 8px 20px; font-size: 14px;">
                    全部卖出
                </button>
            </div>
            <div class="warehouse-grid">
        `;
        
        warehouseItems.forEach(item => {
            html += `
                <div class="warehouse-item" data-crop="${item.crop.id}">
                    <div class="item-icon">${item.crop.emoji}</div>
                    <div class="item-name">${item.crop.name}</div>
                    <div class="item-info">
                        单颗售价: ${item.crop.sellPrice}金币<br>
                        总价值: ${item.crop.sellPrice * item.count}金币
                    </div>
                    <div class="item-count">📦 x ${item.count}</div>
                    <button class="sell-btn" data-crop="${item.crop.id}">
                        卖出 (💰${item.crop.sellPrice})
                    </button>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;

        container.querySelectorAll('.sell-btn[data-crop]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const cropId = btn.dataset.crop;
                const result = Game.sellCrop(cropId);
                showToast(result.message, result.success ? 'success' : 'error');
                if (result.success) {
                    renderWarehouseContent();
                }
            });
        });

        const sellAllBtn = document.getElementById('sellAllBtn');
        if (sellAllBtn) {
            sellAllBtn.addEventListener('click', () => {
                const result = Game.sellAllCrops();
                showToast(result.message, result.success ? 'success' : 'error');
                if (result.success) {
                    renderWarehouseContent();
                }
            });
        }
    }

    return {
        init,
        selectTool,
        getCurrentTool,
        showToast,
        updatePlayerUI,
        updateSeedCount,
        showShopModal,
        hideShopModal,
        renderShopContent,
        showInventoryModal,
        hideInventoryModal,
        renderInventoryContent,
        showWarehouseModal,
        hideWarehouseModal,
        renderWarehouseContent
    };
})();
