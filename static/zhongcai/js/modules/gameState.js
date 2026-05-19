const GameState = {
  state: {},
  plots: [],
  inventory: {},
  crops: {},
  listeners: [],

  init() {
    const saved = Storage.load();
    if (saved) {
      this.state = { ...Config.INITIAL_STATE, ...saved.state };
      this.plots = saved.plots;
      this.inventory = { ...Config.INVENTORY, ...saved.inventory };
      if (!this.inventory.harvested) {
        this.inventory.harvested = {};
      }
      this.crops = { ...Config.CROPS, ...saved.crops };
      this.state.isGameStarted = true;
    } else {
      this.reset();
    }
  },

  reset() {
    this.state = { ...Config.INITIAL_STATE };
    this.plots = JSON.parse(JSON.stringify(Config.INITIAL_PLOTS));
    this.inventory = JSON.parse(JSON.stringify(Config.INVENTORY));
    this.crops = JSON.parse(JSON.stringify(Config.CROPS));
    this.inventory.seeds['qingcai'] = 5;
    Storage.clear();
  },

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  },

  notify() {
    this.listeners.forEach(cb => cb());
  },

  save() {
    Storage.save(this);
  },

  addCoins(amount) {
    this.state.coins += amount;
    this.notify();
    this.save();
  },

  spendCoins(amount) {
    if (this.state.coins >= amount) {
      this.state.coins -= amount;
      this.notify();
      this.save();
      return true;
    }
    return false;
  },

  addExp(amount) {
    this.state.exp += amount;
    while (this.state.exp >= this.state.expToNextLevel) {
      this.state.exp -= this.state.expToNextLevel;
      this.state.level++;
      this.state.expToNextLevel = Math.floor(this.state.expToNextLevel * 1.5);
      this.checkLevelUnlocks();
      this.showMessage(`🎉 升级了！当前等级: ${this.state.level}`);
    }
    this.notify();
    this.save();
  },

  checkLevelUnlocks() {
    Object.values(this.crops).forEach(crop => {
      if (!crop.unlocked && crop.unlockLevel <= this.state.level) {
        crop.unlocked = true;
        this.showMessage(`🎁 解锁新作物: ${crop.name} ${crop.emoji}`);
      }
    });
  },

  setTool(toolId) {
    this.state.selectedTool = toolId;
    this.state.selectedSeed = null;
    this.notify();
  },

  setSeed(cropId) {
    this.state.selectedSeed = cropId;
    this.state.selectedTool = 'hand';
    this.notify();
  },

  addSeed(cropId, amount = 1) {
    if (!this.inventory.seeds[cropId]) {
      this.inventory.seeds[cropId] = 0;
    }
    this.inventory.seeds[cropId] += amount;
    this.notify();
    this.save();
  },

  useSeed(cropId) {
    if (this.inventory.seeds[cropId] && this.inventory.seeds[cropId] > 0) {
      this.inventory.seeds[cropId]--;
      this.notify();
      this.save();
      return true;
    }
    return false;
  },

  addHarvested(cropId, amount = 1) {
    if (!this.inventory.harvested[cropId]) {
      this.inventory.harvested[cropId] = 0;
    }
    this.inventory.harvested[cropId] += amount;
    this.notify();
    this.save();
  },

  sellHarvested(cropId, amount = 1) {
    if (this.inventory.harvested[cropId] && this.inventory.harvested[cropId] >= amount) {
      const crop = this.crops[cropId];
      const earnings = crop.sellPrice * amount;
      this.inventory.harvested[cropId] -= amount;
      if (this.inventory.harvested[cropId] === 0) {
        delete this.inventory.harvested[cropId];
      }
      this.addCoins(earnings);
      this.notify();
      this.save();
      return earnings;
    }
    return 0;
  },

  sellAllHarvested() {
    let totalEarnings = 0;
    Object.keys(this.inventory.harvested).forEach(cropId => {
      const amount = this.inventory.harvested[cropId];
      const earnings = this.sellHarvested(cropId, amount);
      totalEarnings += earnings;
    });
    return totalEarnings;
  },

  addItem(itemId, amount = 1) {
    if (!this.inventory.items[itemId]) {
      this.inventory.items[itemId] = 0;
    }
    this.inventory.items[itemId] += amount;
    this.notify();
    this.save();
  },

  useItem(itemId) {
    if (this.inventory.items[itemId] && this.inventory.items[itemId] > 0) {
      this.inventory.items[itemId]--;
      this.notify();
      this.save();
      return true;
    }
    return false;
  },

  unlockCrop(cropId) {
    const crop = this.crops[cropId];
    if (!crop || crop.unlocked) return false;
    if (this.spendCoins(crop.unlockCost)) {
      crop.unlocked = true;
      this.addSeed(cropId, 3);
      this.showMessage(`🎊 解锁成功: ${crop.name}，已赠送3颗种子！`);
      this.notify();
      this.save();
      return true;
    }
    return false;
  },

  unlockPlot(plotId) {
    const plot = this.plots.find(p => p.id === plotId);
    if (!plot || plot.unlocked) return false;
    if (this.spendCoins(plot.unlockCost)) {
      plot.unlocked = true;
      this.showMessage('🌱 地块解锁成功！');
      this.notify();
      this.save();
      return true;
    }
    return false;
  },

  showMessage(text, duration = 2500) {
    this.state.showMessage = text;
    this.state.messageTimer = duration;
    this.notify();
  },

  togglePause() {
    this.state.isPaused = !this.state.isPaused;
    this.state.showMenu = this.state.isPaused;
    this.notify();
  },

  toggleShop() {
    this.state.showShop = !this.state.showShop;
    this.notify();
  },

  startGame() {
    this.state.isGameStarted = true;
    this.notify();
    this.save();
  }
};

window.GameState = GameState;
