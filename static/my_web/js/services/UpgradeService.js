const UpgradeService = {
  getUpgradeCost(type, currentLevel) {
    return Helpers.calculateUpgradeCost(type, currentLevel);
  },

  getUpgradeValue(type, level) {
    return Helpers.calculateUpgradeValue(type, level);
  },

  canUpgrade(gameState, type) {
    const currentLevel = gameState.ship.upgrades[type];
    if (currentLevel >= 10) return false;

    const cost = this.getUpgradeCost(type, currentLevel);
    return gameState.player.canAfford(cost);
  },

  purchaseUpgrade(gameState, type) {
    if (!this.canUpgrade(gameState, type)) {
      return { success: false, message: '无法升级' };
    }

    const currentLevel = gameState.ship.upgrades[type];
    const cost = this.getUpgradeCost(type, currentLevel);

    gameState.player.addCredits(-cost);
    gameState.ship.upgrade(type);

    const oldValue = this.getUpgradeValue(type, currentLevel);
    const newValue = this.getUpgradeValue(type, currentLevel + 1);

    eventBus.emit(CONSTANTS.EVENTS.UPGRADE_PURCHASE, {
      type,
      fromLevel: currentLevel,
      toLevel: currentLevel + 1,
      cost,
      oldValue,
      newValue
    });

    return {
      success: true,
      message: `${this.getUpgradeName(type)} 升级成功！`,
      data: { type, level: currentLevel + 1, cost, oldValue, newValue }
    };
  },

  getUpgradeName(type) {
    const theme = ThemeController.getCurrentTheme();
    const names = {
      [CONSTANTS.THEMES.SCI_FI]: {
        cargo: '货舱容量',
        engine: '引擎速度',
        shield: '护盾强度',
        weapon: '武器系统'
      },
      [CONSTANTS.THEMES.WASTELAND]: {
        cargo: '背包容量',
        engine: '引擎马力',
        shield: '装甲强度',
        weapon: '火力系统'
      }
    };
    return names[theme][type] || type;
  },

  getUpgradeIcon(type) {
    const theme = ThemeController.getCurrentTheme();
    const icons = {
      [CONSTANTS.THEMES.SCI_FI]: {
        cargo: '📦',
        engine: '🚀',
        shield: '🛡️',
        weapon: '⚔️'
      },
      [CONSTANTS.THEMES.WASTELAND]: {
        cargo: '🎒',
        engine: '⚙️',
        shield: '🛡️',
        weapon: '🔫'
      }
    };
    return icons[theme][type] || '⬆️';
  },

  getUpgradeDescription(type) {
    const theme = ThemeController.getCurrentTheme();
    const descriptions = {
      [CONSTANTS.THEMES.SCI_FI]: {
        cargo: '增加货舱容量，可以携带更多商品',
        engine: '提升航行速度，减少旅行时间和燃料消耗',
        shield: '增强护盾，提高战斗和事件中的生存能力',
        weapon: '升级武器系统，增加在战斗中的胜率'
      },
      [CONSTANTS.THEMES.WASTELAND]: {
        cargo: '扩展背包容量，可以携带更多物资',
        engine: '强化战车引擎，减少跋涉时间和燃料消耗',
        shield: '加装装甲，提高遭遇战中的生存能力',
        weapon: '升级火力系统，增加在火拼中的胜率'
      }
    };
    return descriptions[theme][type] || '';
  },

  repairShip(gameState, amount) {
    const repairCost = amount * 10;
    if (!gameState.player.canAfford(repairCost)) {
      return { success: false, message: '信用点不足' };
    }

    gameState.player.addCredits(-repairCost);
    gameState.ship.repair(amount);

    return {
      success: true,
      message: `修复了 ${amount} 点船体`,
      data: { amount, cost: repairCost }
    };
  },

  rechargeShield(gameState, amount) {
    const rechargeCost = amount * 5;
    if (!gameState.player.canAfford(rechargeCost)) {
      return { success: false, message: '信用点不足' };
    }

    gameState.player.addCredits(-rechargeCost);
    gameState.ship.rechargeShield(amount);

    return {
      success: true,
      message: `充能了 ${amount} 点护盾`,
      data: { amount, cost: rechargeCost }
    };
  },

  refuel(gameState, amount) {
    const fuelCost = amount * 2;
    if (!gameState.player.canAfford(fuelCost)) {
      return { success: false, message: '信用点不足' };
    }

    gameState.player.addCredits(-fuelCost);
    gameState.ship.refuel(amount);

    return {
      success: true,
      message: `补充了 ${amount} 单位燃料`,
      data: { amount, cost: fuelCost }
    };
  }
};
