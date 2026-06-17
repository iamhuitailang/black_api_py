class UpgradeSystem {
  constructor() {
    this.upgradeData = {};
  }

  loadUpgradeData(data) {
    this.upgradeData = data || {};
  }

  getUpgradeCost(tower) {
    var baseCost = TOWER_TYPES[tower.type].cost;
    if (tower.level >= 3) return -1;
    var costMultiplier = tower.level === 1 ? 0.6 : 0.8;
    return Math.floor(baseCost * costMultiplier);
  }

  upgradeTower(tower) {
    if (tower.level >= 3) return false;
    tower.level++;
    var cfg = tower.getConfig();
    tower.totalInvested += this.getUpgradeCost({ type: tower.type, level: tower.level - 1 });
    return true;
  }

  getSellValue(tower) {
    return Math.floor(tower.totalInvested * 0.5);
  }

  sellTower(tower) {
    return this.getSellValue(tower);
  }

  getTowerStats(tower) {
    return {
      damage: tower.getDamage().toFixed(1),
      range: tower.getRange().toFixed(0),
      attackSpeed: tower.getAttackSpeed().toFixed(2),
      level: tower.level,
      upgradeCost: this.getUpgradeCost(tower),
      sellValue: this.getSellValue(tower)
    };
  }
}
