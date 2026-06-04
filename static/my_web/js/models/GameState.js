class GameState {
  constructor() {
    this.version = CONSTANTS.VERSION;
    this.player = new Player();
    this.ship = new Ship();
    this.systems = [];
    this.aiTraders = [];
    this.currentSystemId = 'sol';
    this.gameTime = 0;
    this.lastSaveTime = Date.now();
    this.theme = CONSTANTS.THEMES.SCI_FI;
    this.discoveredSystems = ['sol'];
    this.eventLog = [];
    this.isNavigating = false;
    this.navigationTarget = null;
    this.navigationProgress = 0;
    this.navigationStartTime = 0;
    this.navigationDuration = 0;
    this.marketCrashEndTime = 0;
    this.notifications = [];
  }

  initialize() {
    this.systems = STAR_SYSTEMS.map(config => new StarSystem(config));
    this.aiTraders = this.initializeAITraders();
  }

  initializeAITraders() {
    const traderConfigs = [
      { id: 'ai_1', name: '星际野狼', avatar: '🐺', personality: 'aggressive', credits: 12000 },
      { id: 'ai_2', name: '稳健商人', avatar: '🦊', personality: 'conservative', credits: 15000 },
      { id: 'ai_3', name: '银河使者', avatar: '🦅', personality: 'balanced', credits: 11000 },
      { id: 'ai_4', name: '暗影猎手', avatar: '🐍', personality: 'aggressive', credits: 10000 },
      { id: 'ai_5', name: '和平使者', avatar: '🕊️', personality: 'conservative', credits: 13000 }
    ];

    return traderConfigs.map(config => new AITrader(config));
  }

  getCurrentSystem() {
    return this.systems.find(s => s.id === this.currentSystemId);
  }

  getSystemById(systemId) {
    return this.systems.find(s => s.id === systemId);
  }

  getTotalMarketValue() {
    const playerValue = this.player.totalAssets;
    const aiValue = this.aiTraders.reduce((sum, t) => sum + t.credits, 0);
    return playerValue + aiValue;
  }

  updateMarketShares() {
    const totalMarket = this.getTotalMarketValue();
    if (totalMarket > 0) {
      this.player.marketShare = (this.player.totalAssets / totalMarket) * 100;
      this.aiTraders.forEach(trader => trader.updateMarketShare(totalMarket));
    }
  }

  updatePlayerAssets() {
    const cargoValue = this.ship.calculateCargoValue();
    const investmentsValue = this.systems.reduce((sum, system) => {
      return sum + system.investments
        .filter(inv => inv.ownerId === 'player')
        .reduce((s, inv) => s + inv.progress, 0);
    }, 0);
    this.player.updateTotalAssets(cargoValue, investmentsValue);
  }

  tick(deltaDays) {
    this.gameTime += deltaDays;
    this.updatePlayerAssets();
    this.updateMarketShares();

    this.systems.forEach(system => {
      if (Math.random() < 0.1) {
        system.updatePrices();
      }
    });

    if (this.marketCrashEndTime > 0 && this.gameTime >= this.marketCrashEndTime) {
      this.marketCrashEndTime = 0;
    }

    this.systems.forEach(system => {
      system.investments.forEach(investment => {
        if (investment.ownerId === 'player' && investment.startTime !== null) {
          const elapsed = this.gameTime - investment.startTime;
          if (elapsed >= investment.duration) {
            this.completeInvestment(system, investment);
          }
        }
      });
    });

    this.aiTraders.forEach(trader => {
      const action = trader.decideAction(this);
      if (action && (action.type === 'buy' || action.type === 'sell')) {
        eventBus.emit(CONSTANTS.EVENTS.AI_TRADE, action);
      }
    });

    if (this.isNavigating) {
      const elapsed = Date.now() - this.navigationStartTime;
      this.navigationProgress = Math.min(1, elapsed / this.navigationDuration);
      if (this.navigationProgress >= 1) {
        this.completeNavigation();
      }
    }
  }

  completeInvestment(system, investment) {
    const riskMultiplier = investment.risk === 'low' ? 0.9 :
                           investment.risk === 'medium' ? 0.75 : 0.5;
    const isSuccess = Math.random() < riskMultiplier;

    if (isSuccess) {
      const returns = Math.floor(investment.cost * (1 + investment.returnRate));
      this.player.addCredits(returns);
      eventBus.emit(CONSTANTS.EVENTS.INVESTMENT_COMPLETE, {
        investment,
        success: true,
        returns
      });
    } else {
      const loss = Math.floor(investment.cost * 0.5);
      this.player.addCredits(loss);
      eventBus.emit(CONSTANTS.EVENTS.INVESTMENT_COMPLETE, {
        investment,
        success: false,
        returns: loss
      });
    }

    investment.ownerId = null;
    investment.startTime = null;
    investment.progress = 0;
  }

  startNavigation(targetSystemId) {
    const currentSystem = this.getCurrentSystem();
    const targetSystem = this.getSystemById(targetSystemId);

    if (!currentSystem || !targetSystem) return false;

    const distance = Helpers.calculateDistance(currentSystem, targetSystem);
    const fuelNeeded = distance * CONSTANTS.FUEL_PER_DISTANCE / this.ship.speed;

    if (this.ship.fuel < fuelNeeded) {
      eventBus.emit(CONSTANTS.EVENTS.UI_NOTIFICATION, {
        type: 'error',
        message: '燃料不足，无法航行！'
      });
      return false;
    }

    this.ship.consumeFuel(fuelNeeded);
    this.isNavigating = true;
    this.navigationTarget = targetSystemId;
    this.navigationProgress = 0;
    this.navigationStartTime = Date.now();
    this.navigationDuration = (distance * 1000) / this.ship.speed;

    eventBus.emit(CONSTANTS.EVENTS.NAVIGATE_START, {
      from: currentSystem,
      to: targetSystem,
      distance,
      fuelUsed: fuelNeeded
    });

    return true;
  }

  completeNavigation() {
    const targetSystem = this.getSystemById(this.navigationTarget);
    if (targetSystem) {
      this.currentSystemId = this.navigationTarget;
      
      if (!this.discoveredSystems.includes(this.navigationTarget)) {
        this.discoveredSystems.push(this.navigationTarget);
      }

      eventBus.emit(CONSTANTS.EVENTS.NAVIGATE_COMPLETE, { system: targetSystem });
      eventBus.emit(CONSTANTS.EVENTS.RANDOM_EVENT_TRIGGER);
    }

    this.isNavigating = false;
    this.navigationTarget = null;
    this.navigationProgress = 0;
  }

  cancelNavigation() {
    this.isNavigating = false;
    this.navigationTarget = null;
    this.navigationProgress = 0;
    eventBus.emit(CONSTANTS.EVENTS.NAVIGATE_CANCEL);
  }

  addEventLog(event) {
    this.eventLog.unshift({
      ...event,
      timestamp: this.gameTime,
      id: Helpers.generateId()
    });
    if (this.eventLog.length > 50) {
      this.eventLog = this.eventLog.slice(0, 50);
    }
  }

  toJSON() {
    return {
      version: this.version,
      player: this.player.toJSON(),
      ship: this.ship.toJSON(),
      systems: this.systems.map(s => s.toJSON()),
      aiTraders: this.aiTraders.map(t => t.toJSON()),
      currentSystemId: this.currentSystemId,
      gameTime: this.gameTime,
      lastSaveTime: Date.now(),
      theme: this.theme,
      discoveredSystems: this.discoveredSystems,
      eventLog: this.eventLog,
      isNavigating: this.isNavigating,
      navigationTarget: this.navigationTarget,
      navigationProgress: this.navigationProgress,
      navigationStartTime: this.navigationStartTime,
      navigationDuration: this.navigationDuration,
      marketCrashEndTime: this.marketCrashEndTime
    };
  }

  static fromJSON(data) {
    const state = new GameState();
    state.version = data.version || CONSTANTS.VERSION;
    state.player = Player.fromJSON(data.player);
    state.ship = Ship.fromJSON(data.ship);
    state.systems = data.systems.map(s => StarSystem.fromJSON(s));
    state.aiTraders = data.aiTraders.map(t => AITrader.fromJSON(t));
    state.currentSystemId = data.currentSystemId;
    state.gameTime = data.gameTime || 0;
    state.lastSaveTime = data.lastSaveTime || Date.now();
    state.theme = data.theme || CONSTANTS.THEMES.SCI_FI;
    state.discoveredSystems = data.discoveredSystems || ['sol'];
    state.eventLog = data.eventLog || [];
    state.isNavigating = data.isNavigating || false;
    state.navigationTarget = data.navigationTarget || null;
    state.navigationProgress = data.navigationProgress || 0;
    state.navigationStartTime = data.navigationStartTime || 0;
    state.navigationDuration = data.navigationDuration || 0;
    state.marketCrashEndTime = data.marketCrashEndTime || 0;
    return state;
  }
}
