import { getRandomDebrisType } from '../constants/debrisTypes.js'
import { GAME_CONFIG } from '../constants/gameConfig.js'

let debrisIdCounter = 0

export class Debris {
  constructor(x, y, type, vx = 0, vy = 0) {
    this.id = ++debrisIdCounter
    this.x = x
    this.y = y
    this.type = type
    this.vx = vx
    this.vy = vy
    this.radius = type.radius
    this.rotation = Math.random() * Math.PI * 2
    this.rotationSpeed = (Math.random() - 0.5) * 0.05
    this.blinkPhase = Math.random() * Math.PI * 2
    this.collected = false
  }

  update(planets, gravityCoeff) {
    for (const planet of planets) {
      const dx = planet.x - this.x
      const dy = planet.y - this.y
      const distSq = dx * dx + dy * dy
      const dist = Math.sqrt(distSq)
      
      if (dist < planet.radius + this.radius) continue
      
      const force = gravityCoeff * 0.5 / distSq
      this.vx += (dx / dist) * force
      this.vy += (dy / dist) * force
    }
    
    this.x += this.vx
    this.y += this.vy
    this.rotation += this.rotationSpeed
    this.blinkPhase += 0.15
  }

  checkPickup(ship) {
    const dx = this.x - ship.x
    const dy = this.y - ship.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const pickupRadius = ship.getPickRadius(this.type.pickRadius)
    return dist < pickupRadius
  }

  checkCollision(ship) {
    const dx = this.x - ship.x
    const dy = this.y - ship.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    return dist < this.radius + ship.size
  }

  isDangerous() {
    return this.type.isDangerous === true
  }

  isBlinking() {
    if (!this.isDangerous()) return false
    return Math.sin(this.blinkPhase) > 0
  }
}

export function createDebris(count, canvasWidth, canvasHeight, planets) {
  const debris = []
  const margin = GAME_CONFIG.DEBRIS.spawnMargin
  
  for (let i = 0; i < count; i++) {
    let x, y, valid
    let attempts = 0
    
    do {
      valid = true
      x = margin + Math.random() * (canvasWidth - margin * 2)
      y = margin + Math.random() * (canvasHeight - margin * 2)
      
      for (const planet of planets) {
        const dx = x - planet.x
        const dy = y - planet.y
        if (Math.sqrt(dx * dx + dy * dy) < planet.radius + 30) {
          valid = false
          break
        }
      }
      
      if (Math.abs(x - canvasWidth / 2) < 80 && Math.abs(y - canvasHeight / 2) < 80) {
        valid = false
      }
      
      attempts++
    } while (!valid && attempts < 50)
    
    const type = getRandomDebrisType()
    const angle = Math.random() * Math.PI * 2
    const speed = GAME_CONFIG.DEBRIS.minVelocity + 
      Math.random() * (GAME_CONFIG.DEBRIS.maxVelocity - GAME_CONFIG.DEBRIS.minVelocity)
    
    debris.push(new Debris(
      x, y, type,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    ))
  }
  
  return debris
}

export function wrapPosition(obj, width, height) {
  if (obj.x < -50) obj.x = width + 50
  if (obj.x > width + 50) obj.x = -50
  if (obj.y < -50) obj.y = height + 50
  if (obj.y > height + 50) obj.y = -50
}
