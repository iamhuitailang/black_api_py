export const GAME_CONFIG = {
  SHIP: {
    baseMaxSpeed: 3.5,
    acceleration: 0.06,
    rotationSpeed: 0.025,
    baseFuelMax: 100,
    fuelConsumptionIdle: 0.03,
    fuelConsumptionThrust: 0.1,
    baseHp: 100,
    basePickRadius: 20,
    size: 15,
    drag: 0.988
  },
  GRAVITY: {
    coefficient: 350
  },
  DEBRIS: {
    baseCount: 20,
    spawnMargin: 50,
    minVelocity: 0.1,
    maxVelocity: 0.8
  },
  STAR_COUNT: 100,
  CANVAS: {
    width: 900,
    height: 600
  }
}
