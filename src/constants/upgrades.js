export const UPGRADE_TYPES = {
  ENGINE: {
    id: 'engine',
    name: '引擎升级',
    description: '提高最大速度',
    baseCost: 100,
    costMultiplier: 1.8,
    maxLevel: 3,
    effect: '+1 最大速度/级',
    getValue: (level) => level
  },
  FUEL_TANK: {
    id: 'fuel_tank',
    name: '扩容油箱',
    description: '增加燃料上限',
    baseCost: 80,
    costMultiplier: 1.6,
    maxLevel: 4,
    effect: '+50 燃料上限/级',
    getValue: (level) => level * 50
  },
  ARMOR: {
    id: 'armor',
    name: '加强装甲',
    description: '减少碰撞伤害',
    baseCost: 120,
    costMultiplier: 2.0,
    maxLevel: 3,
    effect: '-5 碰撞伤害/级',
    getValue: (level) => level * 5
  },
  PICK_RADIUS: {
    id: 'pick_radius',
    name: '扩展拾取',
    description: '增加拾取范围',
    baseCost: 90,
    costMultiplier: 1.7,
    maxLevel: 4,
    effect: '+5px 拾取半径/级',
    getValue: (level) => level * 5
  }
}

export const UPGRADE_LIST = Object.values(UPGRADE_TYPES)

export function getUpgradeCost(upgrade, currentLevel) {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel))
}
