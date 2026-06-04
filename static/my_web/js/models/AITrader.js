class AITrader {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.avatar = config.avatar;
    this.personality = config.personality || 'balanced';
    this.credits = config.credits || CONSTANTS.INITIAL_CREDITS;
    this.ship = new Ship(config.shipName || `${config.name}号`);
    this.currentSystem = config.currentSystem || 'sol';
    this.marketShare = 0;
    this.lastActionTime = 0;
    this.actionCooldown = 5000;
  }

  decideAction(gameState) {
    if (Date.now() - this.lastActionTime < this.actionCooldown) {
      return null;
    }

    const currentSystem = gameState.systems.find(s => s.id === this.currentSystem);
    if (!currentSystem) return null;

    const personalityWeights = this.getPersonalityWeights();
    const roll = Math.random();
    let cumulative = 0;

    for (const [action, weight] of Object.entries(personalityWeights)) {
      cumulative += weight;
      if (roll < cumulative) {
        return this.executeAction(action, gameState, currentSystem);
      }
    }

    return null;
  }

  getPersonalityWeights() {
    switch (this.personality) {
      case 'aggressive':
        return { trade: 0.4, navigate: 0.4, hold: 0.2 };
      case 'conservative':
        return { trade: 0.5, navigate: 0.2, hold: 0.3 };
      case 'balanced':
      default:
        return { trade: 0.45, navigate: 0.35, hold: 0.2 };
    }
  }

  executeAction(action, gameState, currentSystem) {
    this.lastActionTime = Date.now();

    switch (action) {
      case 'trade':
        return this.executeTrade(currentSystem);
      case 'navigate':
        return this.executeNavigate(gameState);
      case 'hold':
      default:
        return { type: 'hold', trader: this.name };
    }
  }

  executeTrade(currentSystem) {
    const profitableGoods = currentSystem.goods.filter(g => {
      const good = GOODS[g.goodId];
      return good && g.price < good.basePrice * 0.9 && g.quantity > 0;
    });

    if (profitableGoods.length > 0 && this.ship.getAvailableCargo() > 10) {
      const goodToBuy = Helpers.randomChoice(profitableGoods);
      const maxAffordable = Math.floor(this.credits / goodToBuy.price);
      const maxCargo = this.ship.getAvailableCargo();
      const quantity = Math.min(maxAffordable, maxCargo, Helpers.randomInt(5, 20));

      if (quantity > 0 && currentSystem.buyGood(goodToBuy.goodId, quantity)) {
        const cost = goodToBuy.price * quantity;
        this.credits -= cost;
        this.ship.addCargo(goodToBuy.goodId, quantity, goodToBuy.price);
        return {
          type: 'buy',
          trader: this.name,
          good: GOODS[goodToBuy.goodId].name,
          quantity,
          system: currentSystem.name
        };
      }
    }

    const cargoToSell = this.ship.cargoItems.find(item => {
      const stationGood = currentSystem.getGood(item.goodId);
      return stationGood && stationGood.price > item.buyPrice * 1.1;
    });

    if (cargoToSell) {
      const stationGood = currentSystem.getGood(cargoToSell.goodId);
      const quantity = Math.min(cargoToSell.quantity, Helpers.randomInt(5, cargoToSell.quantity));
      const revenue = stationGood.price * quantity;
      const fee = revenue * CONSTANTS.TRADE_FEE_RATE;

      this.ship.removeCargo(cargoToSell.goodId, quantity);
      currentSystem.sellGood(cargoToSell.goodId, quantity);
      this.credits += revenue - fee;

      return {
        type: 'sell',
        trader: this.name,
        good: GOODS[cargoToSell.goodId].name,
        quantity,
        profit: Math.floor((stationGood.price - cargoToSell.buyPrice) * quantity)
      };
    }

    return { type: 'hold', trader: this.name };
  }

  executeNavigate(gameState) {
    const availableSystems = gameState.systems.filter(s => s.id !== this.currentSystem);
    const targetSystem = Helpers.randomChoice(availableSystems);
    const currentSystem = gameState.systems.find(s => s.id === this.currentSystem);

    const distance = Helpers.calculateDistance(currentSystem, targetSystem);
    const fuelNeeded = distance * CONSTANTS.FUEL_PER_DISTANCE;

    if (this.ship.fuel >= fuelNeeded) {
      this.ship.consumeFuel(fuelNeeded);
      this.currentSystem = targetSystem.id;
      return {
        type: 'navigate',
        trader: this.name,
        from: currentSystem.name,
        to: targetSystem.name
      };
    }

    return { type: 'hold', trader: this.name, reason: 'insufficient fuel' };
  }

  updateMarketShare(totalMarket) {
    if (totalMarket > 0) {
      this.marketShare = (this.credits / totalMarket) * 100;
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      avatar: this.avatar,
      personality: this.personality,
      credits: this.credits,
      ship: this.ship.toJSON(),
      currentSystem: this.currentSystem,
      marketShare: this.marketShare,
      lastActionTime: this.lastActionTime
    };
  }

  static fromJSON(data) {
    const trader = new AITrader({
      id: data.id,
      name: data.name,
      avatar: data.avatar,
      personality: data.personality,
      credits: data.credits,
      currentSystem: data.currentSystem
    });
    trader.ship = Ship.fromJSON(data.ship);
    trader.marketShare = data.marketShare || 0;
    trader.lastActionTime = data.lastActionTime || 0;
    return trader;
  }
}
