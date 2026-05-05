const InventoryPage = {
    items: [],

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <header class="header">
                    <h1 class="header-title">背包</h1>
                </header>

                <div class="section-title">已装备</div>

                <div class="inventory-grid" id="equippedGrid">
                    ${this.renderEmptySlots(4)}
                </div>

                <div class="section-title">背包物品</div>

                <div class="inventory-grid" id="inventoryGrid">
                    <div class="empty-state" style="grid-column: span 4; width: 100%;">
                        <div class="empty-state-icon">📦</div>
                        <div class="empty-state-text">加载中...</div>
                    </div>
                </div>

                ${Tabbar.render('shop')}
            </div>
        `;

        await this.loadInventory();
    },

    renderEmptySlots(count) {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="inventory-slot empty">
                    <div style="font-size: 20px; opacity: 0.3;">+</div>
                </div>
            `;
        }
        return html;
    },

    async loadInventory() {
        try {
            const equippedResult = await DotaApi.getEquippedItems();
            if (equippedResult.code === 0) {
                this.renderEquipped(equippedResult.data || []);
            }

            const result = await DotaApi.getInventory();
            if (result.code === 0) {
                this.items = result.data || [];
                this.renderInventoryGrid();
            }
        } catch (e) {
            console.error('Load inventory error:', e);
            Toast.error('加载背包失败');
        }
    },

    renderEquipped(items) {
        const grid = document.getElementById('equippedGrid');
        if (!grid) return;

        if (items.length === 0) {
            grid.innerHTML = this.renderEmptySlots(4);
            return;
        }

        grid.innerHTML = items.map(item => `
            <div class="inventory-slot equipped" data-id="${item.equipment_id}">
                <div class="inventory-equipped-tag">已装备</div>
                <div class="inventory-item-icon">${item.icon}</div>
                <div class="inventory-item-quantity">x${item.user_equipment?.quantity || 1}</div>
            </div>
        `).join('') + (items.length < 4 ? this.renderEmptySlots(4 - items.length) : '');
    },

    renderInventoryGrid() {
        const grid = document.getElementById('inventoryGrid');
        if (!grid) return;

        if (this.items.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: span 4; width: 100%;">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">背包空空如也</div>
                    <div style="margin-top: 12px;">
                        <button class="btn btn-primary btn-sm" onclick="Router.navigate('shop')">
                            去商店看看
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.items.map(item => {
            const isEquipped = item.user_equipment?.is_equipped === 1;
            const quantity = item.user_equipment?.quantity || 1;

            return `
                <div class="inventory-slot ${isEquipped ? 'equipped' : ''}" 
                    data-id="${item.id}"
                    onclick="InventoryPage.handleItemClick(${item.id}, ${isEquipped})">
                    ${isEquipped ? '<div class="inventory-equipped-tag">已装备</div>' : ''}
                    <div class="inventory-item-icon">${item.icon}</div>
                    ${quantity > 1 ? `<div class="inventory-item-quantity">x${quantity}</div>` : ''}
                </div>
            `;
        }).join('');
    },

    async handleItemClick(itemId, isEquipped) {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return;

        const action = isEquipped ? '卸下' : '装备';
        const confirmed = confirm(`是否${action} ${item.name}？`);

        if (!confirmed) return;

        Utils.showLoading();

        try {
            let result;
            if (isEquipped) {
                result = await DotaApi.unequipItem(itemId);
            } else {
                result = await DotaApi.equipItem(itemId);
            }

            if (result.code === 0) {
                Toast.success(isEquipped ? '已卸下装备' : '装备成功');
                await this.loadInventory();
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (e) {
            Toast.error('操作失败：' + e.message);
        } finally {
            Utils.hideLoading();
        }
    }
};
