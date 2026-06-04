class StarSystem {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.x = config.x;
    this.y = config.y;
    this.type = config.type;
    this.description = config.description;
    this.specialty = config.specialty || [];
    this.scarcity = config.scarcity || [];
    this.color = config.color || '#ffffff';
    this.goods = [];
    this.investments = [];
    this.tradeBan = false;
    this.banEndTime = 0;
    this.initializeGoods();
    this.initializeInvestments();
  }

  initializeGoods() {
    this.goods = GOOD_IDS.map(goodId => {
      const good = GOODS[goodId];
      let priceMultiplier = 1;
      let quantityMultiplier = 1;

      if (this.specialty.includes(goodId)) {
        priceMultiplier = 0.7;
        quantityMultiplier = 2;
      } else if (this.scarcity.includes(goodId)) {
        priceMultiplier = 1.5;
        quantityMultiplier = 0.5;
      }

      if (good.rarity === 'rare') {
        quantityMultiplier *= 0.3;
      } else if (good.rarity === 'legendary') {
        quantityMultiplier *= 0.1;
      }

      const basePrice = Math.floor(good.basePrice * priceMultiplier);
      const currentPrice = Math.floor(basePrice * Helpers.randomRange(0.85, 1.15));
      const quantity = Math.floor(Helpers.randomRange(10, 100) * quantityMultiplier);

      return {
        goodId,
        price: currentPrice,
        basePrice,
        quantity,
        priceHistory: [currentPrice],
        trend: 'stable'
      };
    });
  }

  initializeInvestments() {
    const numProjects = Helpers.randomInt(2, 4);
    const availableTemplates = [...INVESTMENT_TEMPLATES];
    this.investments = [];

    for (let i = 0; i < numProjects && availableTemplates.length > 0; i++) {
      const templateIndex = Helpers.randomInt(0, availableTemplates.length - 1);
      const template = availableTemplates.splice(templateIndex, 1)[0];
      const costMultiplier = Helpers.randomRange(0.9, 1.3);

      this.investments.push({
        id: `${this.id}_${template.id}_${Helpers.generateId()}`,
        templateId: template.id,
        name: template.name,
        description: template.description,
        icon: template.icon,
        cost: Math.floor(template.baseCost * costMultiplier),
        duration: template.duration,
        returnRate: template.returnRate,
        risk: template.risk,
        progress: 0,
        startTime: null,
        ownerId: null,
        systemId: this.id
      });
    }
  }

  updatePrices() {
    this.goods.forEach(stationGood => {
      const fluctuation = Helpers.randomRange(
        1 - CONSTANTS.PRICE_FLUCTUATION,
        1 + CONSTANTS.PRICE_FLUCTUATION
      );
      const newPrice = Math.floor(stationGood.basePrice * fluctuation);
      
      const clampedPrice = Helpers.clamp(
        newPrice,
        Math.floor(stationGood.basePrice * 0.5),
        Math.floor(stationGood.basePrice * 2)
      );

      if (stationGood.priceHistory.length >= 10) {
        stationGood.priceHistory.shift();
      }
      stationGood.priceHistory.push(clampedPrice);

      if (clampedPrice > stationGood.price * 1.05) {
        stationGood.trend = 'up';
      } else if (clampedPrice < stationGood.price * 0.95) {
        stationGood.trend = 'down';
      } else {
        stationGood.trend = 'stable';
      }

      stationGood.price = clampedPrice;

      const regenAmount = Helpers.randomInt(0, 5);
      stationGood.quantity = Math.min(999, stationGood.quantity + regenAmount);
    });

    if (this.tradeBan && Date.now() > this.banEndTime) {
      this.tradeBan = false;
      this.banEndTime = 0;
    }
  }

  getGood(goodId) {
    return this.goods.find(g => g.goodId === goodId);
  }

  buyGood(goodId, quantity) {
    const good = this.getGood(goodId);
    if (good && good.quantity >= quantity) {
      good.quantity -= quantity;
      return true;
    }
    return false;
  }

  sellGood(goodId, quantity) {
    const good = this.getGood(goodId);
    if (good) {
      good.quantity += quantity;
      return true;
    }
    return false;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      x: this.x,
      y: this.y,
      type: this.type,
      description: this.description,
      specialty: this.specialty,
      scarcity: this.scarcity,
      color: this.color,
      goods: this.goods,
      investments: this.investments,
      tradeBan: this.tradeBan,
      banEndTime: this.banEndTime
    };
  }

  static fromJSON(data) {
    const system = new StarSystem({
      id: data.id,
      name: data.name,
      x: data.x,
      y: data.y,
      type: data.type,
      description: data.description,
      specialty: data.specialty,
      scarcity: data.scarcity,
      color: data.color
    });
    system.goods = data.goods || [];
    system.investments = data.investments || [];
    system.tradeBan = data.tradeBan || false;
    system.banEndTime = data.banEndTime || 0;
    return system;
  }
}
