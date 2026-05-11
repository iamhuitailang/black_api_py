const Shop = (function() {
    let playerData = null;
    
    function init(playerDataState) {
        playerData = playerDataState;
    }
    
    function getPlayerData() {
        return playerData;
    }
    
    function purchaseAxe(axeId) {
        const axe = Object.values(CONSTANTS.AXES).find(a => a.id === axeId);
        if (!axe) return { success: false, message: '斧头不存在' };
        
        if (playerData.ownedAxes.includes(axeId)) {
            playerData.equippedAxe = axeId;
            Storage.savePlayerData(playerData);
            return { success: true, equipped: true, message: '已装备' };
        }
        
        if (playerData.gold < axe.price) {
            return { success: false, message: '金币不足' };
        }
        
        playerData.gold -= axe.price;
        playerData.ownedAxes.push(axeId);
        playerData.equippedAxe = axeId;
        Storage.savePlayerData(playerData);
        
        return { success: true, purchased: true, message: '购买成功并已装备' };
    }
    
    function purchaseTreeSkin(treeId) {
        const tree = Object.values(CONSTANTS.TREE_SKINS).find(t => t.id === treeId);
        if (!tree) return { success: false, message: '树木皮肤不存在' };
        
        if (playerData.ownedTrees.includes(treeId)) {
            playerData.equippedTree = treeId;
            Storage.savePlayerData(playerData);
            return { success: true, equipped: true, message: '已装备' };
        }
        
        if (playerData.gold < tree.price) {
            return { success: false, message: '金币不足' };
        }
        
        playerData.gold -= tree.price;
        playerData.ownedTrees.push(treeId);
        playerData.equippedTree = treeId;
        Storage.savePlayerData(playerData);
        
        return { success: true, purchased: true, message: '购买成功并已装备' };
    }
    
    function purchasePowerup(powerupId) {
        const powerup = Object.values(CONSTANTS.POWERUPS).find(p => p.id === powerupId);
        if (!powerup) return { success: false, message: '道具不存在' };
        
        if (playerData.gold < powerup.price) {
            return { success: false, message: '金币不足' };
        }
        
        playerData.gold -= powerup.price;
        playerData.powerups[powerupId] = (playerData.powerups[powerupId] || 0) + 1;
        Storage.savePlayerData(playerData);
        
        return { success: true, purchased: true, message: '购买成功' };
    }
    
    function convertWoodToGold(woodAmount) {
        if (playerData.wood < woodAmount) {
            return { success: false, message: '木材不足' };
        }
        
        const goldGained = woodAmount * 2;
        playerData.wood -= woodAmount;
        playerData.gold += goldGained;
        Storage.savePlayerData(playerData);
        
        return { success: true, goldGained: goldGained, message: `转换成功，获得 ${goldGained} 金币` };
    }
    
    function renderShop() {
        renderAxeShop();
        renderTreeShop();
        renderPowerupShop();
        updateGoldDisplay();
        updateWoodDisplay();
        bindConvertButton();
    }
    
    function updateWoodDisplay() {
        const woodElement = document.getElementById('wood-balance');
        if (woodElement) {
            woodElement.textContent = playerData.wood;
        }
    }
    
    function bindConvertButton() {
        const convertBtn = document.getElementById('convert-btn');
        const convertAmount = document.getElementById('convert-amount');
        
        if (convertBtn && convertAmount) {
            convertBtn.onclick = () => {
                const amount = parseInt(convertAmount.value);
                const result = convertWoodToGold(amount);
                showMessage(result.message);
                updateGoldDisplay();
                updateWoodDisplay();
            };
        }
    }
    
    function renderAxeShop() {
        const container = document.getElementById('axe-shop');
        if (!container) return;
        
        container.innerHTML = '';
        
        Object.values(CONSTANTS.AXES).forEach(axe => {
            const item = createShopItem(
                axe.icon,
                axe.name,
                axe.price,
                playerData.ownedAxes.includes(axe.id),
                playerData.equippedAxe === axe.id,
                () => handleAxeClick(axe.id)
            );
            container.appendChild(item);
        });
    }
    
    function renderTreeShop() {
        const container = document.getElementById('tree-shop');
        if (!container) return;
        
        container.innerHTML = '';
        
        Object.values(CONSTANTS.TREE_SKINS).forEach(tree => {
            const item = createShopItem(
                tree.icon,
                tree.name,
                tree.price,
                playerData.ownedTrees.includes(tree.id),
                playerData.equippedTree === tree.id,
                () => handleTreeClick(tree.id)
            );
            container.appendChild(item);
        });
    }
    
    function renderPowerupShop() {
        const container = document.getElementById('powerup-shop');
        if (!container) return;
        
        container.innerHTML = '';
        
        Object.values(CONSTANTS.POWERUPS).forEach(powerup => {
            const count = playerData.powerups[powerup.id] || 0;
            const item = createShopItem(
                powerup.icon,
                `${powerup.name} x${count}`,
                powerup.price,
                false,
                false,
                () => handlePowerupClick(powerup.id),
                powerup.description
            );
            container.appendChild(item);
        });
    }
    
    function createShopItem(icon, name, price, owned, equipped, onClick, description) {
        const item = document.createElement('div');
        item.className = 'shop-item';
        
        if (equipped) {
            item.classList.add('equipped');
        } else if (owned) {
            item.classList.add('owned');
        }
        
        item.innerHTML = `
            <div class="icon">${icon}</div>
            <div class="name">${name}</div>
            ${description ? `<div class="description" style="font-size:10px;color:#666;margin:5px 0;">${description}</div>` : ''}
            ${equipped ? 
                '<div class="status">已装备</div>' : 
                owned ? 
                    '<div class="status">点击装备</div>' : 
                    `<div class="price">${price} 💰</div>`
            }
        `;
        
        item.addEventListener('click', onClick);
        return item;
    }
    
    function handleAxeClick(axeId) {
        const result = purchaseAxe(axeId);
        showMessage(result.message);
        renderAxeShop();
        updateGoldDisplay();
    }
    
    function handleTreeClick(treeId) {
        const result = purchaseTreeSkin(treeId);
        showMessage(result.message);
        renderTreeShop();
        updateGoldDisplay();
    }
    
    function handlePowerupClick(powerupId) {
        const result = purchasePowerup(powerupId);
        showMessage(result.message);
        renderPowerupShop();
        updateGoldDisplay();
    }
    
    function updateGoldDisplay() {
        const goldElement = document.getElementById('gold-count');
        if (goldElement) {
            goldElement.textContent = playerData.gold;
        }
    }
    
    function showMessage(message) {
        const oldMessage = document.querySelector('.shop-message');
        if (oldMessage) oldMessage.remove();
        
        const msg = document.createElement('div');
        msg.className = 'shop-message';
        msg.textContent = message;
        msg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 16px;
            z-index: 1000;
            pointer-events: none;
        `;
        
        document.body.appendChild(msg);
        
        setTimeout(() => {
            if (msg.parentNode) {
                msg.parentNode.removeChild(msg);
            }
        }, 2000);
    }
    
    return {
        init,
        getPlayerData,
        purchaseAxe,
        purchaseTreeSkin,
        purchasePowerup,
        convertWoodToGold,
        renderShop
    };
})();