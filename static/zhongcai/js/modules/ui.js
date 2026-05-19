const UI = {
  elements: {},

  init() {
    this.elements = {
      topBar: document.getElementById('topBar'),
      coins: document.getElementById('coins'),
      level: document.getElementById('level'),
      backpack: document.getElementById('backpack'),
      expBar: document.getElementById('expBar'),
      toolBar: document.getElementById('toolBar'),
      seedBar: document.getElementById('seedBar'),
      shopPanel: document.getElementById('shopPanel'),
      message: document.getElementById('message'),
      pauseBtn: document.getElementById('pauseBtn'),
      shopBtn: document.getElementById('shopBtn'),
      closeShop: document.getElementById('closeShop')
    };

    this.bindEvents();
    this.update();
  },

  bindEvents() {
    this.elements.pauseBtn.addEventListener('click', () => {
      GameState.togglePause();
    });

    this.elements.shopBtn.addEventListener('click', () => {
      GameState.toggleShop();
    });

    this.elements.closeShop.addEventListener('click', () => {
      GameState.toggleShop();
    });

    GameState.subscribe(() => this.update());
  },

  update() {
    this.updateTopBar();
    this.updateToolBar();
    this.updateSeedBar();
    this.updateShop();
    this.updateMessage();
  },

  updateTopBar() {
    this.elements.coins.textContent = GameState.state.coins;
    this.elements.level.textContent = `Lv.${GameState.state.level}`;
    const backpackCount = Object.values(GameState.inventory.harvested).reduce((a, b) => a + b, 0);
    this.elements.backpack.textContent = backpackCount;
    const expPercent = (GameState.state.exp / GameState.state.expToNextLevel) * 100;
    this.elements.expBar.style.width = `${expPercent}%`;

    if (!GameState.state.isGameStarted || GameState.state.isPaused) {
      this.elements.topBar.style.display = 'none';
      this.elements.toolBar.style.display = 'none';
      this.elements.seedBar.style.display = 'none';
      this.elements.shopBtn.style.display = 'none';
    } else {
      this.elements.topBar.style.display = 'flex';
      this.elements.toolBar.style.display = 'flex';
      this.elements.seedBar.style.display = 'flex';
      this.elements.shopBtn.style.display = 'block';
    }
  },

  updateToolBar() {
    const tools = ['hand', 'water', 'fertilizer', 'ripening', 'shovel'];
    this.elements.toolBar.innerHTML = '';

    tools.forEach(toolId => {
      const tool = Config.TOOLS[toolId];
      const count = GameState.inventory.items[toolId] || 0;
      const isSelected = GameState.state.selectedTool === toolId;

      const btn = document.createElement('button');
      btn.className = `tool-btn ${isSelected ? 'selected' : ''} ${count === 0 ? 'disabled' : ''}`;
      btn.innerHTML = `
        <span class="tool-icon">${this.getToolIcon(toolId)}</span>
        <span class="tool-name">${tool.name}</span>
        ${toolId !== 'hand' && toolId !== 'shovel' ? `<span class="tool-count">${count}</span>` : ''}
      `;
      btn.title = tool.description;

      btn.addEventListener('click', () => {
        if (toolId !== 'hand' && toolId !== 'shovel' && count === 0) {
          GameState.showMessage('❌ 道具不足，请去商店购买');
          return;
        }
        GameState.setTool(toolId);
      });

      this.elements.toolBar.appendChild(btn);
    });
  },

  updateSeedBar() {
    this.elements.seedBar.innerHTML = '';

    const title = document.createElement('div');
    title.className = 'seed-title';
    title.textContent = '🌱 种子';
    this.elements.seedBar.appendChild(title);

    Object.values(GameState.crops).forEach(crop => {
      if (!crop.unlocked) return;

      const count = GameState.inventory.seeds[crop.id] || 0;
      const isSelected = GameState.state.selectedSeed === crop.id;

      const btn = document.createElement('button');
      btn.className = `seed-btn ${isSelected ? 'selected' : ''} ${count === 0 ? 'disabled' : ''}`;
      btn.innerHTML = `
        <span class="seed-emoji">${crop.emoji}</span>
        <span class="seed-name">${crop.name}</span>
        <span class="seed-count">${count}</span>
      `;

      btn.addEventListener('click', () => {
        if (count === 0) {
          GameState.showMessage('❌ 种子不足，请去商店购买');
          return;
        }
        GameState.setSeed(crop.id);
      });

      this.elements.seedBar.appendChild(btn);
    });
  },

  updateShop() {
    if (GameState.state.showShop) {
      this.elements.shopPanel.classList.add('active');
      this.renderShopContent();
    } else {
      this.elements.shopPanel.classList.remove('active');
    }
  },

  renderShopContent() {
    const shopContent = this.elements.shopPanel.querySelector('.shop-content');
    shopContent.innerHTML = '';

    const sellSection = document.createElement('div');
    sellSection.className = 'shop-section';
    
    const harvestedCount = Object.values(GameState.inventory.harvested).reduce((a, b) => a + b, 0);
    const totalValue = Object.keys(GameState.inventory.harvested).reduce((total, cropId) => {
      const crop = GameState.crops[cropId];
      return total + (crop ? crop.sellPrice * GameState.inventory.harvested[cropId] : 0);
    }, 0);

    sellSection.innerHTML = `
      <h3>💰 出售作物 ${harvestedCount > 0 ? `<span class="total-value">总价值: ${totalValue}金币</span>` : ''}</h3>
    `;

    if (harvestedCount === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.className = 'shop-item empty';
      emptyItem.innerHTML = `
        <div class="item-info">
          <span class="item-emoji">📦</span>
          <div>
            <div class="item-name">背包空空</div>
            <div class="item-desc">收获作物后可在此处出售</div>
          </div>
        </div>
      `;
      sellSection.appendChild(emptyItem);
    } else {
      Object.keys(GameState.inventory.harvested).forEach(cropId => {
        const crop = GameState.crops[cropId];
        const amount = GameState.inventory.harvested[cropId];
        if (!crop || amount <= 0) return;

        const item = document.createElement('div');
        item.className = 'shop-item';

        item.innerHTML = `
          <div class="item-info">
            <span class="item-emoji">${crop.emoji}</span>
            <div>
              <div class="item-name">${crop.name} x${amount}</div>
              <div class="item-desc">单价: ${crop.sellPrice}金币 · 总价: ${crop.sellPrice * amount}金币</div>
            </div>
          </div>
          <div style="display: flex; gap: 5px;">
            <button class="buy-btn sell-btn">
              卖1个
            </button>
            <button class="buy-btn sell-all-btn" style="background: #FF9800;">
              全卖
            </button>
          </div>
        `;

        const buttons = item.querySelectorAll('button');
        buttons[0].addEventListener('click', () => {
          const earnings = GameState.sellHarvested(cropId, 1);
          if (earnings > 0) {
            GameState.showMessage(`💰 卖出1个${crop.name}，获得 ${earnings} 金币`);
          }
        });
        buttons[1].addEventListener('click', () => {
          const earnings = GameState.sellHarvested(cropId, amount);
          if (earnings > 0) {
            GameState.showMessage(`💰 卖出${amount}个${crop.name}，获得 ${earnings} 金币`);
          }
        });

        sellSection.appendChild(item);
      });

      if (harvestedCount > 1) {
        const sellAllItem = document.createElement('div');
        sellAllItem.className = 'shop-item';
        sellAllItem.innerHTML = `
          <div class="item-info">
            <span class="item-emoji">💵</span>
            <div>
              <div class="item-name">一键全部出售</div>
              <div class="item-desc">卖出所有作物，共获得 ${totalValue} 金币</div>
            </div>
          </div>
          <button class="buy-btn" style="background: #E91E63;">
            全卖 💰${totalValue}
          </button>
        `;
        sellAllItem.querySelector('button').addEventListener('click', () => {
          const earnings = GameState.sellAllHarvested();
          if (earnings > 0) {
            GameState.showMessage(`💰 全部卖出！获得 ${earnings} 金币`);
          }
        });
        sellSection.appendChild(sellAllItem);
      }
    }

    const seedSection = document.createElement('div');
    seedSection.className = 'shop-section';
    seedSection.innerHTML = '<h3>🌱 种子商店</h3>';

    Object.values(GameState.crops).forEach(crop => {
      const item = document.createElement('div');
      item.className = 'shop-item';

      const seedPrice = Math.floor(crop.sellPrice * 0.3);
      const canAfford = GameState.state.coins >= seedPrice;

      if (!crop.unlocked) {
        const canUnlock = crop.unlockLevel <= GameState.state.level && 
                         GameState.state.coins >= crop.unlockCost;
        item.innerHTML = `
          <div class="item-info">
            <span class="item-emoji">${crop.emoji}</span>
            <div>
              <div class="item-name">${crop.name}</div>
              <div class="item-desc">生长: ${crop.growTime/1000}秒 · 售价: ${crop.sellPrice}金币</div>
            </div>
          </div>
          <button class="buy-btn ${canUnlock ? '' : 'disabled'}" ${canUnlock ? '' : 'disabled'}>
            🔒 ${crop.unlockCost}金币解锁
          </button>
        `;
        item.querySelector('.buy-btn').addEventListener('click', () => {
          GameState.unlockCrop(crop.id);
        });
      } else {
        item.innerHTML = `
          <div class="item-info">
            <span class="item-emoji">${crop.emoji}</span>
            <div>
              <div class="item-name">${crop.name}种子</div>
              <div class="item-desc">生长: ${crop.growTime/1000}秒 · 售价: ${crop.sellPrice}金币 · 库存: ${GameState.inventory.seeds[crop.id] || 0}</div>
            </div>
          </div>
          <button class="buy-btn ${canAfford ? '' : 'disabled'}" ${canAfford ? '' : 'disabled'}>
            💰 ${seedPrice}金币
          </button>
        `;
        item.querySelector('.buy-btn').addEventListener('click', () => {
          if (GameState.spendCoins(seedPrice)) {
            GameState.addSeed(crop.id, 1);
            GameState.showMessage(`✅ 购买了1颗${crop.name}种子！`);
          }
        });
      }

      seedSection.appendChild(item);
    });

    const itemSection = document.createElement('div');
    itemSection.className = 'shop-section';
    itemSection.innerHTML = '<h3>🧰 道具商店</h3>';

    const items = [
      { id: 'fertilizer', name: '肥料', emoji: '🌿', price: 5, desc: '加速生长25%' },
      { id: 'ripening', name: '催熟剂', emoji: '⚡', price: 20, desc: '减少30秒生长时间' }
    ];

    items.forEach(item => {
      const shopItem = document.createElement('div');
      shopItem.className = 'shop-item';
      const canAfford = GameState.state.coins >= item.price;

      shopItem.innerHTML = `
        <div class="item-info">
          <span class="item-emoji">${item.emoji}</span>
          <div>
            <div class="item-name">${item.name}</div>
            <div class="item-desc">${item.desc} · 库存: ${GameState.inventory.items[item.id] || 0}</div>
          </div>
        </div>
        <button class="buy-btn ${canAfford ? '' : 'disabled'}" ${canAfford ? '' : 'disabled'}>
          💰 ${item.price}金币
        </button>
      `;

      shopItem.querySelector('.buy-btn').addEventListener('click', () => {
        if (GameState.spendCoins(item.price)) {
          GameState.addItem(item.id, 1);
          GameState.showMessage(`✅ 购买了${item.name}！`);
        }
      });

      itemSection.appendChild(shopItem);
    });

    shopContent.appendChild(sellSection);
    shopContent.appendChild(seedSection);
    shopContent.appendChild(itemSection);
  },

  updateMessage() {
    if (GameState.state.showMessage) {
      this.elements.message.textContent = GameState.state.showMessage;
      this.elements.message.classList.add('show');
    } else {
      this.elements.message.classList.remove('show');
    }
  },

  getToolIcon(toolId) {
    const icons = {
      hand: '✋',
      water: '💧',
      fertilizer: '🌿',
      ripening: '⚡',
      shovel: '⛏️'
    };
    return icons[toolId] || '❓';
  }
};

window.UI = UI;
