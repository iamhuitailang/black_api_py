import { GAME_CONFIG } from '../constants/gameConfig.js'

export class Ship {
  constructor(x, y, upgrades = {}) {
    this.x = x
    this.y = y
    this.vx = 0
    this.vy = 0
    this.angle = -Math.PI / 2
    this.thrusting = false
    
    this.maxSpeed = GAME_CONFIG.SHIP.baseMaxSpeed + (upgrades.engine || 0)
    this.fuelMax = GAME_CONFIG.SHIP.baseFuelMax + (upgrades.fuel_tank || 0) * 50
    this.fuel = this.fuelMax
    this.hp = GAME_CONFIG.SHIP.baseHp
    this.hpMax = GAME_CONFIG.SHIP.baseHp
    this.armorReduction = (upgrades.armor || 0) * 5
    this.pickRadiusBonus = (upgrades.pick_radius || 0) * 5
    
    this.size = GAME_CONFIG.SHIP.size
  }

  applyUpgrade(upgradeId, level) {
    switch (upgradeId) {
      case 'engine':
        this.maxSpeed = GAME_CONFIG.SHIP.baseMaxSpeed + level
        break
      case 'fuel_tank':
        const oldMax = this.fuelMax
        this.fuelMax = GAME_CONFIG.SHIP.baseFuelMax + level * 50
        this.fuel += (this.fuelMax - oldMax)
        break
      case 'armor':
        this.armorReduction = level * 5
        break
      case 'pick_radius':
        this.pickRadiusBonus = level * 5
        break
    }
  }

  thrust() {
    if (this.fuel <= 0) return
    
    this.thrusting = true
    const accel = GAME_CONFIG.SHIP.acceleration
    this.vx += Math.cos(this.angle) * accel
    this.vy += Math.sin(this.angle) * accel
    
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy)
    if (speed > this.maxSpeed) {
      const ratio = this.maxSpeed / speed
      this.vx *= ratio
      this.vy *= ratio
    }
  }

  rotateLeft() {
    this.angle -= GAME_CONFIG.SHIP.rotationSpeed
  }

  rotateRight() {
    this.angle += GAME_CONFIG.SHIP.rotationSpeed
  }

  applyGravity(planets, gravityCoeff) {
    for (const planet of planets) {
      const dx = planet.x - this.x
      const dy = planet.y - this.y
      const distSq = dx * dx + dy * dy
      const dist = Math.sqrt(distSq)
      
      if (dist < planet.radius + this.size) continue
      
      const force = gravityCoeff / distSq
      this.vx += (dx / dist) * force
      this.vy += (dy / dist) * force
    }
  }

  update(planets, gravityCoeff, isThrusting) {
    this.thrusting = isThrusting && this.fuel > 0
    
    if (this.thrusting) {
      this.fuel -= GAME_CONFIG.SHIP.fuelConsumptionThrust
    } else {
      this.fuel -= GAME_CONFIG.SHIP.fuelConsumptionIdle
    }
    this.fuel = Math.max(0, this.fuel)
    
    this.applyGravity(planets, gravityCoeff)
    
    this.x += this.vx
    this.y += this.vy
  }

  takeDamage(amount) {
    const actualDamage = Math.max(1, amount - this.armorReduction)
    this.hp -= actualDamage
    return actualDamage
  }

  isDead() {
    return this.hp <= 0
  }

  getPickRadius(baseRadius) {
    return baseRadius + this.pickRadiusBonus
  }

  refillFuel(amount) {
    this.fuel = Math.min(this.fuelMax, this.fuel + amount)
  }

  repair(amount) {
    this.hp = Math.min(this.hpMax, this.hp + amount)
  }

  reset(x, y) {
    this.x = x
    this.y = y
    this.vx = 0
    this.vy = 0
    this.angle = -Math.PI / 2
    this.fuel = this.fuelMax
    this.hp = this.hpMax
    this.thrusting = false
  }
}
