/**
 * UI模块
 * 负责管理用户界面的渲染和交互
 */

const UI = {
    /**
     * 游戏状态引用
     */
    gameState: null,

    /**
     * 当前筛选状态
     */
    currentFilter: 'all',

    /**
     * 初始化UI
     * @param {Object} gameState - 游戏状态
     */
    init(gameState) {
        console.log('UI模块初始化...');
        this.gameState = gameState;
        
        // 绑定事件
        this.bindEvents();
        
        // 初始渲染
        this.updateStatusBar();
        this.renderPlacedItems();
        this.renderInventoryItems();
        this.renderShopItems();
        this.renderAlbumCats();
        
        console.log('UI模块初始化完成');
    },

    /**
     * 绑定UI事件
     */
    bindEvents() {
        // 标签页切换
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // 模态框关闭
        const closeBtn = document.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideCatModal();
            });
        }

        // 点击模态框外部关闭
        const modal = document.getElementById('cat-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideCatModal();
                }
            });
        }

        // 筛选按钮
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // 使用事件委托处理动态生成的元素
        document.addEventListener('click', (e) => {
            // 放置道具
            const inventoryCard = e.target.closest('.inventory-card');
            if (inventoryCard && inventoryCard.dataset.itemId) {
                this.handlePlaceItem(inventoryCard.dataset.itemId);
                return;
            }

            // 收回道具
            const placedCard = e.target.closest('.placed-card');
            if (placedCard && placedCard.dataset.itemId) {
                this.handleRetrieveItem(placedCard.dataset.itemId);
                return;
            }

            // 购买道具
            const shopCard = e.target.closest('.shop-card');
            if (shopCard && shopCard.dataset.itemId) {
                this.handlePurchaseItem(shopCard.dataset.itemId);
                return;
            }

            // 点击猫咪图鉴
            const albumCard = e.target.closest('.album-card');
            if (albumCard && albumCard.dataset.catId) {
                this.showCatDetail(albumCard.dataset.catId);
                return;
            }
        });
    },

    /**
     * 切换标签页
     * @param {string} tabId - 标签页ID
     */
    switchTab(tabId) {
        // 更新按钮状态
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // 更新内容显示
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            if (content.id === `tab-${tabId}`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });

        // 重新渲染对应标签页
        switch (tabId) {
            case 'yard':
                this.renderPlacedItems();
                this.renderInventoryItems();
                break;
            case 'shop':
                this.renderShopItems();
                break;
            case 'album':
                this.renderAlbumCats();
                break;
        }
    },

    /**
     * 设置筛选条件
     * @param {string} filter - 筛选条件
     */
    setFilter(filter) {
        this.currentFilter = filter;
        
        // 更新按钮状态
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // 重新渲染
        this.renderAlbumCats();
    },

    /**
     * 更新状态栏
     */
    updateStatusBar() {
        // 鱼干数量
        const fishCountEl = document.getElementById('fish-count');
        if (fishCountEl) {
            fishCountEl.textContent = this.gameState.fishCount.toLocaleString();
        }

        // 收集猫咪数量
        const catCollectedEl = document.getElementById('cat-collected');
        const catTotalEl = document.getElementById('cat-total');
        
        if (catCollectedEl && this.gameState.collectedCats) {
            catCollectedEl.textContent = this.gameState.collectedCats.length;
        }
        
        if (catTotalEl) {
            catTotalEl.textContent = GameData.CATS.length;
        }
    },

    /**
     * 渲染已放置的道具
     */
    renderPlacedItems() {
        const container = document.getElementById('placed-items');
        if (!container) return;

        const placedItems = ItemSystem.getPlacedItems(this.gameState);
        
        if (placedItems.length === 0) {
            container.innerHTML = '<p class="empty-text">庭院中还没有放置道具，点击下方道具放入庭院</p>';
            return;
        }

        container.innerHTML = placedItems.map(item => `
            <div class="item-card placed-card" data-item-id="${item.id}">
                <div class="item-icon">${item.emoji}</div>
                <div class="item-name">${item.name}</div>
                <div class="shop-status unlocked">点击收回</div>
            </div>
        `).join('');
    },

    /**
     * 渲染可放置的道具（库存）
     */
    renderInventoryItems() {
        const container = document.getElementById('inventory-items');
        if (!container) return;

        const placeableItems = ItemSystem.getPlaceableItems(this.gameState);
        
        if (placeableItems.length === 0) {
            container.innerHTML = '<p class="empty-text">没有可放置的道具了，去商店看看吧</p>';
            return;
        }

        container.innerHTML = placeableItems.map(item => `
            <div class="item-card inventory-card" data-item-id="${item.id}">
                <div class="item-icon">${item.emoji}</div>
                <div class="item-name">${item.name}</div>
                <div class="shop-status unlocked">点击放置</div>
            </div>
        `).join('');
    },

    /**
     * 渲染商店商品
     */
    renderShopItems() {
        const container = document.getElementById('shop-items');
        if (!container) return;

        const shopItems = ItemSystem.getShopItems(this.gameState);
        
        container.innerHTML = shopItems.map(item => {
            let cardClasses = 'shop-card';
            let statusText = '';
            let statusClass = '';
            
            if (item.isOwned) {
                cardClasses += ' owned';
                statusText = '已拥有';
                statusClass = 'unlocked';
            } else if (!item.isUnlocked) {
                cardClasses += ' disabled';
                statusText = item.unlockInfo.text;
                statusClass = 'locked';
            } else if (!item.canAfford) {
                cardClasses += ' disabled';
                statusText = `需要 ${item.price} 鱼干`;
                statusClass = 'locked';
            } else {
                cardClasses += ' can-buy';
                statusText = `价格: ${item.price}`;
                statusClass = 'unlocked';
            }
            
            return `
                <div class="${cardClasses}" data-item-id="${item.id}">
                    <div class="shop-icon">${item.emoji}</div>
                    <div class="shop-name">${item.name}</div>
                    <div class="shop-price">
                        <span class="fish-icon">🐟</span>
                        ${item.price}
                    </div>
                    <div class="shop-status ${statusClass}">${statusText}</div>
                </div>
            `;
        }).join('');
    },

    /**
     * 渲染猫咪图鉴
     */
    renderAlbumCats() {
        const container = document.getElementById('album-cats');
        if (!container) return;

        const collectedCats = this.gameState.collectedCats || [];
        const catsToRender = GameData.getCatsByRarity(this.currentFilter);
        
        container.innerHTML = catsToRender.map(cat => {
            const isCollected = collectedCats.includes(cat.id);
            const visitCount = this.gameState.catVisitCounts 
                ? (this.gameState.catVisitCounts[cat.id] || 0) 
                : 0;
            const rarityConfig = GameData.RARITY_CONFIG[cat.rarity];
            
            let cardClasses = 'album-card';
            if (!isCollected) {
                cardClasses += ' uncollected';
            }
            
            return `
                <div class="${cardClasses}" data-cat-id="${cat.id}">
                    <div class="album-icon">${cat.emoji}</div>
                    <div class="album-name">${isCollected ? cat.name : '???'}</div>
                    <div class="album-rarity ${cat.rarity}" 
                         style="background-color: ${rarityConfig.bgColor}; color: ${rarityConfig.color};">
                        ${rarityConfig.name}
                    </div>
                    ${isCollected ? `<div style="font-size: 12px; color: #666; margin-top: 4px;">来访: ${visitCount}次</div>` : ''}
                </div>
            `;
        }).join('');
    },

    /**
     * 显示猫咪详情
     * @param {string} catId - 猫咪ID
     */
    showCatDetail(catId) {
        const cat = GameData.getCatById(catId);
        if (!cat) return;

        const collectedCats = this.gameState.collectedCats || [];
        const isCollected = collectedCats.includes(catId);
        const visitCount = this.gameState.catVisitCounts 
            ? (this.gameState.catVisitCounts[catId] || 0) 
            : 0;
        const rarityConfig = GameData.RARITY_CONFIG[cat.rarity];

        // 获取来访条件描述
        let requirementText = '';
        if (cat.requirements && cat.requirements.items) {
            requirementText = cat.requirements.items.map(itemId => {
                const item = GameData.getItemById(itemId);
                return item ? `${item.emoji} ${item.name}` : itemId;
            }).join(', ');
        }

        // 更新模态框内容
        const modalCatImage = document.getElementById('modal-cat-image');
        const modalCatName = document.getElementById('modal-cat-name');
        const modalCatRarity = document.getElementById('modal-cat-rarity');
        const modalCatRequirement = document.getElementById('modal-cat-requirement');
        const modalCatReward = document.getElementById('modal-cat-reward');
        const modalCatStay = document.getElementById('modal-cat-stay');
        const modalCatVisits = document.getElementById('modal-cat-visits');

        if (modalCatImage) modalCatImage.textContent = cat.emoji;
        if (modalCatName) modalCatName.textContent = isCollected ? cat.name : '???';
        if (modalCatRarity) {
            modalCatRarity.textContent = rarityConfig.name;
            modalCatRarity.style.backgroundColor = rarityConfig.bgColor;
            modalCatRarity.style.color = rarityConfig.color;
        }
        if (modalCatRequirement) modalCatRequirement.textContent = requirementText || '-';
        if (modalCatReward) modalCatReward.textContent = isCollected ? `${cat.reward} 小鱼干` : '???';
        if (modalCatStay) modalCatStay.textContent = isCollected ? Utils.formatTimeMinutes(cat.stayDuration) : '???';
        if (modalCatVisits) modalCatVisits.textContent = visitCount;

        // 显示模态框
        const modal = document.getElementById('cat-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    },

    /**
     * 隐藏猫咪详情模态框
     */
    hideCatModal() {
        const modal = document.getElementById('cat-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    },

    /**
     * 处理放置道具
     * @param {string} itemId - 道具ID
     */
    handlePlaceItem(itemId) {
        const result = ItemSystem.placeItem(this.gameState, itemId);
        
        if (result.success) {
            this.showNotification(result.message, 'success');
            this.renderPlacedItems();
            this.renderInventoryItems();
            
            // 重置猫咪来访计时器，因为道具发生了变化
            if (window.App && typeof window.App.resetCatVisitTimer === 'function') {
                window.App.resetCatVisitTimer();
            }
        } else {
            this.showNotification(result.message, 'error');
        }
    },

    /**
     * 处理收回道具
     * @param {string} itemId - 道具ID
     */
    handleRetrieveItem(itemId) {
        const result = ItemSystem.retrieveItem(this.gameState, itemId);
        
        if (result.success) {
            this.showNotification(result.message, 'info');
            this.renderPlacedItems();
            this.renderInventoryItems();
            
            // 重置猫咪来访计时器，因为道具发生了变化
            if (window.App && typeof window.App.resetCatVisitTimer === 'function') {
                window.App.resetCatVisitTimer();
            }
        } else {
            this.showNotification(result.message, 'error');
        }
    },

    /**
     * 处理购买道具
     * @param {string} itemId - 道具ID
     */
    handlePurchaseItem(itemId) {
        const result = ItemSystem.purchaseItem(this.gameState, itemId);
        
        if (result.success) {
            this.showNotification(result.message, 'success');
            this.updateStatusBar();
            this.renderShopItems();
            this.renderInventoryItems();
        } else {
            this.showNotification(result.message, 'warning');
        }
    },

    /**
     * 显示通知
     * @param {string} message - 消息内容
     * @param {string} type - 类型: success, warning, error, info
     */
    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = this.getNotificationIcon(type) + ' ' + message;
        
        container.appendChild(notification);

        // 3秒后移除
        setTimeout(() => {
            if (notification.parentNode === container) {
                container.removeChild(notification);
            }
        }, 3000);
    },

    /**
     * 获取通知图标
     * @param {string} type - 通知类型
     * @returns {string} 图标
     */
    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            warning: '⚠️',
            error: '❌',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    },

    /**
     * 刷新所有UI
     */
    refreshAll() {
        this.updateStatusBar();
        this.renderPlacedItems();
        this.renderInventoryItems();
        this.renderShopItems();
        this.renderAlbumCats();
    },

    /**
     * 提示玩家放置食物
     */
    showFoodHint() {
        if (ItemSystem.hasFoodItem(this.gameState)) {
            return;
        }
        
        this.showNotification('提示：放入食盆才能吸引猫咪哦！', 'warning');
    }
};

// 导出到全局
window.UI = UI;
