const ShopUI = {
    buttons: [],
    itemButtons: [],
    selectedItem: null,

    shopItems: [
        { id: 'poke_ball', price: 50 },
        { id: 'great_ball', price: 150 },
        { id: 'ultra_ball', price: 500 },
        { id: 'master_ball', price: 2000 },
        { id: 'potion', price: 30 },
        { id: 'super_potion', price: 100 },
        { id: 'hyper_potion', price: 300 },
        { id: 'max_potion', price: 800 },
        { id: 'elixir', price: 1500 },
        { id: 'rare_candy', price: 1000 }
    ],

    init() {
        this.buttons = [];
        this.itemButtons = [];
        this.selectedItem = null;
    },

    render() {
        CanvasUtils.clear();
        this.drawBackground();

        CanvasUtils.drawText('🏪 道具商店', CanvasUtils.width / 2, 50, {
            fontSize: 28,
            align: 'center',
            bold: true
        });

        const player = GameState.state.player;
        CanvasUtils.drawText(`💰 金币: ${player.coins}`, CanvasUtils.width / 2, 90, {
            fontSize: 18,
            align: 'center'
        });

        this.drawShopItems();
        this.drawInventory();

        if (this.selectedItem) {
            this.drawItemDetail();
        }

        this.drawBackButton();
    },

    drawBackground() {
        const width = CanvasUtils.width;
        const height = CanvasUtils.height;

        CanvasUtils.drawGradientRect(0, 0, width, height, '#FFF8E1', '#FFECB3');
    },

    drawShopItems() {
        this.itemButtons = [];
        const cardWidth = 180;
        const cardHeight = 100;
        const startX = 50;
        const startY = 120;
        const gap = 20;
        const columns = 5;

        this.shopItems.forEach((shopItem, index) => {
            const col = index % columns;
            const row = Math.floor(index / columns);
            const x = startX + col * (cardWidth + gap);
            const y = startY + row * (cardHeight + gap);

            const item = LevelData.getItemById(shopItem.id);
            const canAfford = GameState.state.player.coins >= shopItem.price;

            CanvasUtils.drawRect(x, y, cardWidth, cardHeight, canAfford ? 'rgba(255, 255, 255, 0.9)' : 'rgba(200, 200, 200, 0.7)', 10);

            let itemIcon = '🎒';
            if (item.type === 'ball') itemIcon = '🔮';
            else if (item.type === 'heal') itemIcon = '🧪';
            else if (item.type === 'full_heal') itemIcon = '💊';
            else if (item.type === 'level_up') itemIcon = '🍬';

            CanvasUtils.drawText(itemIcon, x + 25, y + 40, {
                fontSize: 30,
                align: 'center'
            });

            CanvasUtils.drawText(item.name, x + 60, y + 20, {
                fontSize: 14,
                bold: true
            });

            CanvasUtils.drawText(item.description, x + 60, y + 45, {
                fontSize: 10,
                color: '#666',
                maxWidth: cardWidth - 70
            });

            CanvasUtils.drawText(`💰 ${shopItem.price}`, x + 60, y + 75, {
                fontSize: 14,
                color: canAfford ? '#FF9800' : '#999',
                bold: true
            });

            if (this.selectedItem && this.selectedItem.id === shopItem.id) {
                CanvasUtils.drawStrokeRect(x, y, cardWidth, cardHeight, '#FFD700', 3, 10);
            }

            this.itemButtons.push({
                x, y, width: cardWidth, height: cardHeight,
                item: shopItem,
                contains: (px, py) => px >= x && px <= x + cardWidth && py >= y && py <= y + cardHeight
            });
        });
    },

    drawInventory() {
        const x = 50;
        const y = 450;
        const width = 1100;
        const height = 250;

        CanvasUtils.drawRect(x, y, width, height, 'rgba(255, 255, 255, 0.8)', 10);

        CanvasUtils.drawText('🎒 我的背包', x + 15, y + 15, {
            fontSize: 18,
            bold: true
        });

        const items = GameState.state.player.items;
        let itemIndex = 0;

        Object.keys(items).forEach(itemId => {
            if (items[itemId] > 0) {
                const item = LevelData.getItemById(itemId);
                if (item) {
                    const col = itemIndex % 6;
                    const row = Math.floor(itemIndex / 6);
                    const itemX = x + 15 + col * 175;
                    const itemY = y + 50 + row * 80;

                    CanvasUtils.drawRect(itemX, itemY, 160, 70, '#f5f5f5', 8);

                    let itemIcon = '🎒';
                    if (item.type === 'ball') itemIcon = '🔮';
                    else if (item.type === 'heal') itemIcon = '🧪';
                    else if (item.type === 'full_heal') itemIcon = '💊';
                    else if (item.type === 'level_up') itemIcon = '🍬';

                    CanvasUtils.drawText(itemIcon, itemX + 20, itemY + 35, {
                        fontSize: 25,
                        align: 'center'
                    });

                    CanvasUtils.drawText(item.name, itemX + 45, itemY + 10, {
                        fontSize: 12,
                        bold: true
                    });

                    CanvasUtils.drawText(`x${items[itemId]}`, itemX + 45, itemY + 35, {
                        fontSize: 14,
                        color: '#666'
                    });

                    itemIndex++;
                }
            }
        });

        if (itemIndex === 0) {
            CanvasUtils.drawText('背包空空如也...', x + width / 2, y + height / 2, {
                fontSize: 16,
                color: '#999',
                align: 'center',
                baseline: 'middle'
            });
        }
    },

    drawItemDetail() {
        const x = 800;
        const y = 350;
        const width = 350;
        const height = 100;

        CanvasUtils.drawRect(x, y, width, height, 'rgba(255, 215, 0, 0.3)', 10);

        const item = LevelData.getItemById(this.selectedItem.id);
        CanvasUtils.drawText(`购买: ${item.name}`, x + 15, y + 15, {
            fontSize: 16,
            bold: true
        });

        CanvasUtils.drawText(`价格: ${this.selectedItem.price} 💰`, x + 15, y + 45, {
            fontSize: 14
        });

        this.buyButton = CanvasUtils.drawButton(x + 15, y + 65, 100, 30, '购买', {
            bgColor: '#4CAF50'
        });

        this.buy10Button = CanvasUtils.drawButton(x + 125, y + 65, 100, 30, '购买x10', {
            bgColor: '#2196F3'
        });
    },

    drawBackButton() {
        this.backButton = CanvasUtils.drawButton(50, 50, 100, 40, '← 返回', {
            bgColor: '#607D8B'
        });
    },

    handleClick(x, y) {
        if (this.backButton && this.backButton.contains(x, y)) {
            GameState.setCurrentScreen('menu');
            return true;
        }

        for (const button of this.itemButtons) {
            if (button.contains(x, y)) {
                this.selectedItem = button.item;
                return true;
            }
        }

        if (this.selectedItem) {
            if (this.buyButton && this.buyButton.contains(x, y)) {
                this.buyItem(this.selectedItem, 1);
                return true;
            }

            if (this.buy10Button && this.buy10Button.contains(x, y)) {
                this.buyItem(this.selectedItem, 10);
                return true;
            }
        }

        return false;
    },

    buyItem(shopItem, count) {
        const totalPrice = shopItem.price * count;
        
        if (GameState.spendCoins(totalPrice)) {
            GameState.addItem(shopItem.id, count);
            const item = LevelData.getItemById(shopItem.id);
            GameState.showNotification(`购买了 ${count} 个 ${item.name}!`);
            return true;
        }
        return false;
    },

    handleMouseMove(x, y) {
        const allButtons = [...this.itemButtons];
        if (this.backButton) allButtons.push(this.backButton);
        if (this.buyButton) allButtons.push(this.buyButton);
        if (this.buy10Button) allButtons.push(this.buy10Button);

        for (const button of allButtons) {
            if (button && button.contains && button.contains(x, y)) {
                CanvasUtils.canvas.style.cursor = 'pointer';
                return;
            }
        }
        CanvasUtils.canvas.style.cursor = 'default';
    }
};
