const ShopPage = {
    items: [],

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <header class="header">
                    <h1 class="header-title">商店</h1>
                    <div class="header-action" id="userGoldDisplay">
                        💰 0
                    </div>
                </header>

                <div class="user-bar" style="background: var(--card-bg); margin: 0; border-bottom: 1px solid var(--border-color);">
                    <div style="width: 100%; text-align: center;">
                        <span style="color: var(--gold-color); font-weight: 600;">💰 我的金币: </span>
                        <span id="shopGoldValue" style="color: var(--gold-color); font-size: 18px; font-weight: 600;">0</span>
                    </div>
                </div>

                <div class="section-title">装备列表</div>

                <div class="shop-grid" id="shopGrid">
                    <div class="empty-state" style="grid-column: span 2; width: 100%;">
                        <div class="empty-state-icon">🛒</div>
                        <div class="empty-state-text">加载中...</div>
                    </div>
                </div>

                ${Tabbar.render('shop')}
            </div>
        `;

        await this.loadShopData();
    },

    async loadShopData() {
        try {
            const userResult = await DotaApi.getUserInfo();
            if (userResult.code === 0) {
                const gold = userResult.data.user?.gold || 0;
                this.updateGoldDisplay(gold);
            }

            const result = await DotaApi.getShopItems();
            if (result.code === 0) {
                this.items = result.data || [];
                this.renderShopGrid();
            }
        } catch (e) {
            console.error('Load shop error:', e);
            Toast.error('加载商店失败');
        }
    },

    updateGoldDisplay(gold) {
        const goldDisplay = document.getElementById('userGoldDisplay');
        const goldValue = document.getElementById('shopGoldValue');

        if (goldDisplay) goldDisplay.textContent = `💰 ${Utils.formatNumber(gold)}`;
        if (goldValue) goldValue.textContent = Utils.formatNumber(gold);
    },

    renderShopGrid() {
        const grid = document.getElementById('shopGrid');
        if (!grid) return;

        const user = AuthService.getUser();
        const userGold = user?.gold || 0;

        if (this.items.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: span 2; width: 100%;">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">暂无商品</div>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.items.map(item => {
            const canBuy = userGold >= item.price;
            const isOwned = item.owned_quantity > 0;

            const stats = [];
            if (item.attack_bonus > 0) stats.push(`攻击+${item.attack_bonus}`);
            if (item.hp_bonus > 0) stats.push(`生命+${item.hp_bonus}`);
            if (item.defense_bonus > 0) stats.push(`防御+${item.defense_bonus}`);
            if (item.attack_speed_bonus > 0) stats.push(`攻速+${item.attack_speed_bonus}`);

            return `
                <div class="shop-item">
                    <div class="shop-item-icon">${item.icon}</div>
                    <div class="shop-item-name">${item.name}</div>
                    <div class="shop-item-desc">${item.description}</div>
                    ${stats.length > 0 ? `
                        <div class="shop-item-stats">
                            ${stats.map(s => `<span class="shop-stat positive">${s}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div class="shop-item-price">
                        💰 ${item.price}
                    </div>
                    <div style="display: flex; gap: 8px; margin-top: 12px;">
                        <button class="btn ${canBuy ? 'btn-primary' : 'btn-outline'} btn-sm" 
                            style="flex: 1; font-size: 12px; padding: 8px;"
                            ${!canBuy ? 'disabled' : ''}
                            onclick="ShopPage.handleBuyItem(${item.id}, ${item.price})">
                            ${canBuy ? '购买' : '金币不足'}
                        </button>
                        ${isOwned ? `
                            <button class="btn btn-outline btn-sm" 
                                style="flex: 1; font-size: 12px; padding: 8px;"
                                onclick="ShopPage.handleGoInventory()">
                                背包
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    async handleBuyItem(itemId, price) {
        Utils.showLoading();

        try {
            const result = await DotaApi.buyEquipment(itemId, 1);
            if (result.code === 0) {
                Toast.success('购买成功！');

                const user = AuthService.getUser();
                if (user) {
                    user.gold = result.data.gold;
                    AuthService.updateUser(user);
                    this.updateGoldDisplay(result.data.gold);
                }

                await this.loadShopData();
            } else {
                Toast.error(result.msg || '购买失败');
            }
        } catch (e) {
            Toast.error('购买失败：' + e.message);
        } finally {
            Utils.hideLoading();
        }
    },

    handleGoInventory() {
        Router.navigate('inventory');
    }
};
