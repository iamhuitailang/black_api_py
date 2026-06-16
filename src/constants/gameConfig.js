export const GAME_CONFIG = {
  SHIP: {
    baseMaxSpeed: 5,
    acceleration: 0.15,
    rotationSpeed: 0.045,
    baseFuelMax: 100,
    fuelConsumptionIdle: 0.05,
    fuelConsumptionThrust: 0.15,
    baseHp: 100,
    basePickRadius: 20,
    size: 15,
    drag: 0.995
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
