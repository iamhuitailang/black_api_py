export const DEBRIS_TYPES = {
  SMALL_SCREW: {
    id: 'small_screw',
    name: '小型螺丝',
    radius: 5,
    value: 10,
    pickRadius: 20,
    color: '#888888',
    spawnWeight: 40
  },
  MEDIUM_PANEL: {
    id: 'medium_panel',
    name: '中型面板',
    radius: 12,
    value: 30,
    pickRadius: 25,
    color: '#4a9eff',
    spawnWeight: 30
  },
  LARGE_WRECK: {
    id: 'large_wreck',
    name: '大型残骸',
    radius: 20,
    value: 80,
    pickRadius: 30,
    color: '#6b7280',
    spawnWeight: 15
  },
  DANGEROUS: {
    id: 'dangerous',
    name: '危险碎片',
    radius: 8,
    value: 0,
    pickRadius: 12,
    color: '#ff3333',
    damage: 15,
    isDangerous: true,
    spawnWeight: 10
  },
  RARE_PART: {
    id: 'rare_part',
    name: '稀有零件',
    radius: 8,
    value: 200,
    pickRadius: 22,
    color: '#ffd700',
    isRare: true,
    spawnWeight: 5
  }
}

export const DEBRIS_LIST = Object.values(DEBRIS_TYPES)

const DEBRIS_BY_ID = {}
for (const dt of DEBRIS_LIST) {
  DEBRIS_BY_ID[dt.id] = dt
}

export function getDebrisTypeById(id) {
  return DEBRIS_BY_ID[id] || DEBRIS_TYPES.SMALL_SCREW
}

export function getRandomDebrisType() {
  const totalWeight = DEBRIS_LIST.reduce((sum, d) => sum + d.spawnWeight, 0)
  let random = Math.random() * totalWeight
  for (const debris of DEBRIS_LIST) {
    random -= debris.spawnWeight
    if (random <= 0) return debris
  }
  return DEBRIS_TYPES.SMALL_SCREW
}
