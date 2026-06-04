class Ship {
  constructor(name = '先锋号') {
    this.name = name;
    this.hull = CONSTANTS.INITIAL_HULL;
    this.maxHull = CONSTANTS.INITIAL_HULL;
    this.shield = CONSTANTS.INITIAL_SHIELD;
    this.maxShield = CONSTANTS.INITIAL_SHIELD;
    this.cargo = 0;
    this.maxCargo = CONSTANTS.INITIAL_CARGO;
    this.speed = 1;
    this.fuel = CONSTANTS.INITIAL_FUEL;
    this.maxFuel = CONSTANTS.MAX_FUEL;
    this.cargoItems = [];
    this.upgrades = {
      cargo: 1,
      engine: 1,
      shield: 1,
      weapon: 1
    };
    this.weaponDamage = 10;
  }

  getAvailableCargo() {
    return this.maxCargo - this.cargo;
  }

  recalculateCargo() {
    this.cargo = this.cargoItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  addCargo(goodId, quantity, buyPrice) {
    const existing = this.cargoItems.find(item => item.goodId === goodId);
    if (existing) {
      const totalQuantity = existing.quantity + quantity;
      existing.buyPrice = (existing.buyPrice * existing.quantity + buyPrice * quantity) / totalQuantity;
      existing.quantity = totalQuantity;
    } else {
      this.cargoItems.push({ goodId, quantity, buyPrice });
    }
    this.recalculateCargo();
  }

  removeCargo(goodId, quantity) {
    const existing = this.cargoItems.find(item => item.goodId === goodId);
    if (existing) {
      existing.quantity -= quantity;
      if (existing.quantity <= 0) {
        this.cargoItems = this.cargoItems.filter(item => item.goodId !== goodId);
      }
      this.recalculateCargo();
      return true;
    }
    return false;
  }

  getCargoQuantity(goodId) {
    const item = this.cargoItems.find(item => item.goodId === goodId);
    return item ? item.quantity : 0;
  }

  calculateCargoValue() {
    return this.cargoItems.reduce((sum, item) => {
      const good = GOODS[item.goodId];
      return sum + (good ? good.basePrice * item.quantity : 0);
    }, 0);
  }

  takeDamage(amount) {
    if (this.shield > 0) {
      const shieldDamage = Math.min(this.shield, amount);
      this.shield -= shieldDamage;
      amount -= shieldDamage;
    }
    this.hull = Math.max(0, this.hull - amount);
    return this.hull > 0;
  }

  repair(amount) {
    this.hull = Math.min(this.maxHull, this.hull + amount);
  }

  rechargeShield(amount) {
    this.shield = Math.min(this.maxShield, this.shield + amount);
  }

  refuel(amount) {
    this.fuel = Math.min(this.maxFuel, this.fuel + amount);
  }

  consumeFuel(amount) {
    this.fuel = Math.max(0, this.fuel - amount);
    return this.fuel > 0;
  }

  upgrade(type) {
    if (this.upgrades[type] < 10) {
      this.upgrades[type]++;
      this.updateStats();
      return true;
    }
    return false;
  }

  updateStats() {
    this.maxCargo = Helpers.calculateUpgradeValue('cargo', this.upgrades.cargo);
    this.speed = Helpers.calculateUpgradeValue('engine', this.upgrades.engine);
    this.maxShield = Helpers.calculateUpgradeValue('shield', this.upgrades.shield);
    this.shield = Math.min(this.shield, this.maxShield);
    this.weaponDamage = Helpers.calculateUpgradeValue('weapon', this.upgrades.weapon);
  }

  loseCargoPercent(percent) {
    const loseAmount = Math.floor(this.cargo * percent);
    let remaining = loseAmount;
    this.cargoItems = this.cargoItems.filter(item => {
      if (remaining <= 0) return true;
      const toLose = Math.min(item.quantity, remaining);
      item.quantity -= toLose;
      remaining -= toLose;
      return item.quantity > 0;
    });
    this.recalculateCargo();
    return loseAmount;
  }

  toJSON() {
    return {
      name: this.name,
      hull: this.hull,
      maxHull: this.maxHull,
      shield: this.shield,
      maxShield: this.maxShield,
      cargo: this.cargo,
      maxCargo: this.maxCargo,
      speed: this.speed,
      fuel: this.fuel,
      maxFuel: this.maxFuel,
      cargoItems: this.cargoItems,
      upgrades: this.upgrades,
      weaponDamage: this.weaponDamage
    };
  }

  static fromJSON(data) {
    const ship = new Ship(data.name);
    ship.hull = data.hull;
    ship.maxHull = data.maxHull;
    ship.shield = data.shield;
    ship.maxShield = data.maxShield;
    ship.cargo = data.cargo;
    ship.maxCargo = data.maxCargo;
    ship.speed = data.speed;
    ship.fuel = data.fuel;
    ship.maxFuel = data.maxFuel;
    ship.cargoItems = data.cargoItems || [];
    ship.upgrades = data.upgrades || { cargo: 1, engine: 1, shield: 1, weapon: 1 };
    ship.weaponDamage = data.weaponDamage || 10;
    return ship;
  }
}
