export const GAME_CONFIG = {
  SHIP: {
    baseMaxSpeed: 6,
    acceleration: 0.3,
    rotationSpeed: 0.08,
    baseFuelMax: 100,
    fuelConsumptionIdle: 0.1,
    fuelConsumptionThrust: 0.3,
    baseHp: 100,
    basePickRadius: 20,
    size: 15
  },
  GRAVITY: {
    coefficient: 500
  },
  DEBRIS: {
    baseCount: 20,
    spawnMargin: 50,
    minVelocity: 0.2,
    maxVelocity: 1.5
  },
  STAR_COUNT: 100,
  CANVAS: {
    width: 900,
    height: 600
  }
}
