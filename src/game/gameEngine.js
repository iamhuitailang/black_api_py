import { Ship } from './ship.js'
import { createDebris, wrapPosition, Debris } from './debris.js'
import { GameRenderer } from './renderer.js'
import { checkPlanetCollision } from './gravity.js'
import { soundManager } from './soundManager.js'
import { getDebrisTypeById } from '../constants/debrisTypes.js'
import { GAME_CONFIG } from '../constants/gameConfig.js'

export class GameEngine {
  constructor(canvas, gameState) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.gameState = gameState
    this.width = canvas.width
    this.height = canvas.height
    
    this.renderer = new GameRenderer(this.ctx, this.width, this.height)
    
    this.ship = null
    this.debris = []
    this.planets = []
    this.bgColor = '#0a0a1a'
    
    this.keys = {}
    this.running = false
    this.animationId = null
    this.time = 0
    
    this.pickupEffects = []
    this.damageFlash = 0
    
    this.collectedValue = 0
    this.zoneCompleted = false
    
    this.setupInput()
  }

  setupInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true
      if (e.code === 'KeyP') {
        this.gameState.togglePause()
      }
    })
    
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false
    })
  }

  initZone(systemData, zoneData) {
    const baseWidth = 900
    const baseHeight = 600
    const scaleX = this.width / baseWidth
    const scaleY = this.height / baseHeight
    
    this.planets = systemData.planets.map(p => ({
      ...p,
      x: p.x * scaleX,
      y: p.y * scaleY,
      radius: p.radius * Math.min(scaleX, scaleY)
    }))
    
    this.bgColor = systemData.bgColor
    
    let startX = this.width / 2
    let startY = this.height / 2
    
    if (!this.isSafePosition(startX, startY, 30)) {
      const safePos = this.findSafePosition(30)
      startX = safePos.x
      startY = safePos.y
    }
    
    this.ship = new Ship(startX, startY, this.gameState.state.upgrades)
    this.debris = createDebris(zoneData.debrisCount, this.width, this.height, this.planets)
    
    this.collectedValue = 0
    this.zoneCompleted = false
    this.pickupEffects = []
    this.damageFlash = 0
    this.time = 0
  }
  
  isSafePosition(x, y, margin = 20) {
    for (const planet of this.planets) {
      const dx = x - planet.x
      const dy = y - planet.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < planet.radius + margin) {
        return false
      }
    }
    return true
  }
  
  findSafePosition(margin = 30) {
    const centerX = this.width / 2
    const centerY = this.height / 2
    
    for (let r = 50; r < Math.max(this.width, this.height); r += 30) {
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const x = centerX + Math.cos(angle) * r
        const y = centerY + Math.sin(angle) * r
        
        if (x > margin && x < this.width - margin &&
            y > margin && y < this.height - margin &&
            this.isSafePosition(x, y, margin)) {
          return { x, y }
        }
      }
    }
    
    return { x: this.width / 2, y: this.height / 2 }
  }

  start() {
    if (this.running) return
    this.running = true
    this.gameLoop()
  }

  stop() {
    this.running = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  gameLoop() {
    if (!this.running) return
    
    this.animationId = requestAnimationFrame(() => this.gameLoop())
    
    if (!this.gameState.state.isPaused && !this.gameState.state.isGameOver) {
      this.update()
    }
    
    this.render()
  }

  update() {
    this.time++
    
    let isThrusting = false
    
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      this.ship.rotateLeft()
    }
    if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      this.ship.rotateRight()
    }
    if (this.keys['ArrowUp'] || this.keys['KeyW']) {
      this.ship.thrust()
      isThrusting = true
      if (this.time % 5 === 0) {
        soundManager.playThrust()
      }
    }
    if (this.keys['ArrowDown'] || this.keys['KeyS']) {
    }
    
    this.ship.update(this.planets, GAME_CONFIG.GRAVITY.coefficient, isThrusting)
    
    wrapPosition(this.ship, this.width, this.height)
    
    const planetHit = checkPlanetCollision(this.ship, this.planets)
    if (planetHit.collided) {
      this.ship.takeDamage(30)
      this.damageFlash = 1
      soundManager.playAlarm()
      
      const dx = this.ship.x - planetHit.planet.x
      const dy = this.ship.y - planetHit.planet.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      this.ship.vx = (dx / dist) * 3
      this.ship.vy = (dy / dist) * 3
    }
    
    for (const d of this.debris) {
      if (d.collected) continue
      d.update(this.planets, GAME_CONFIG.GRAVITY.coefficient)
      wrapPosition(d, this.width, this.height)
    }
    
    this.checkDebrisCollisions()
    
    this.pickupEffects = this.pickupEffects.filter(effect => {
      effect.progress += 0.05
      return effect.progress < 1
    })
    
    if (this.damageFlash > 0) {
      this.damageFlash -= 0.05
    }
    
    if (this.ship.isDead()) {
      this.gameState.state.isGameOver = true
      this.gameState.saveToStorage()
    }
    
    if (!this.zoneCompleted) {
      this.zoneCompleted = this.gameState.checkZoneComplete(this.collectedValue)
    }
  }

  checkDebrisCollisions() {
    for (const d of this.debris) {
      if (d.collected) continue
      
      if (d.checkPickup(this.ship)) {
        if (d.isDangerous()) {
          const damage = this.ship.takeDamage(d.type.damage)
          this.damageFlash = 1
          soundManager.playAlarm()
          d.collected = true
          
          this.pickupEffects.push({
            x: d.x,
            y: d.y,
            color: '#ff3333',
            progress: 0
          })
          
          this.gameState.addCollected(d.type)
        } else {
          d.collected = true
          this.collectedValue += d.type.value
          this.gameState.addMoney(d.type.value)
          this.gameState.addCollected(d.type)
          soundManager.playPickup()
          
          this.pickupEffects.push({
            x: d.x,
            y: d.y,
            color: d.type.color,
            progress: 0
          })
        }
      }
    }
    
    this.debris = this.debris.filter(d => !d.collected)
  }

  render() {
    this.renderer.clear(this.bgColor)
    this.renderer.drawStars(this.time)
    this.renderer.drawPlanets(this.planets, this.time)
    this.renderer.drawDebris(this.debris)
    this.renderer.drawShip(this.ship)
    
    for (const effect of this.pickupEffects) {
      this.renderer.drawPickupEffect(effect.x, effect.y, effect.color, effect.progress)
    }
    
    if (this.damageFlash > 0) {
      this.renderer.drawDamageFlash(this.damageFlash)
    }
  }

  resize(width, height) {
    this.width = width
    this.height = height
    this.canvas.width = width
    this.canvas.height = height
    this.renderer.resize(width, height)
  }

  getShipStats() {
    if (!this.ship) return null
    return {
      fuel: this.ship.fuel,
      fuelMax: this.ship.fuelMax,
      hp: this.ship.hp,
      hpMax: this.ship.hpMax,
      speed: Math.sqrt(this.ship.vx * this.ship.vx + this.ship.vy * this.ship.vy),
      maxSpeed: this.ship.maxSpeed,
      x: this.ship.x,
      y: this.ship.y,
      angle: this.ship.angle
    }
  }

  getRemainingDebris() {
    return this.debris.filter(d => !d.collected).length
  }

  getCollectedValue() {
    return this.collectedValue
  }

  serialize() {
    if (!this.ship) return null
    
    const shipData = {
      x: this.ship.x,
      y: this.ship.y,
      vx: this.ship.vx,
      vy: this.ship.vy,
      angle: this.ship.angle,
      fuel: this.ship.fuel,
      hp: this.ship.hp,
      targetVx: this.ship.targetVx || 0,
      targetVy: this.ship.targetVy || 0
    }
    
    const debrisData = this.debris.map(d => ({
      typeId: d.type.id,
      x: d.x,
      y: d.y,
      vx: d.vx,
      vy: d.vy,
      rotation: d.rotation,
      rotationSpeed: d.rotationSpeed,
      blinkPhase: d.blinkPhase,
      collected: d.collected
    }))
    
    return {
      ship: shipData,
      debris: debrisData,
      collectedValue: this.collectedValue,
      time: this.time,
      bgColor: this.bgColor,
      width: this.width,
      height: this.height
    }
  }

  restoreFromSave(sceneData, systemData) {
    if (!sceneData || !sceneData.ship) return false
    
    const baseWidth = 900
    const baseHeight = 600
    const scaleX = this.width / baseWidth
    const scaleY = this.height / baseHeight
    
    this.planets = systemData.planets.map(p => ({
      ...p,
      x: p.x * scaleX,
      y: p.y * scaleY,
      radius: p.radius * Math.min(scaleX, scaleY)
    }))
    
    this.bgColor = systemData.bgColor
    
    const savedScaleX = sceneData.width ? this.width / sceneData.width : 1
    const savedScaleY = sceneData.height ? this.height / sceneData.height : 1
    
    this.ship = new Ship(0, 0, this.gameState.state.upgrades)
    this.ship.x = sceneData.ship.x * savedScaleX
    this.ship.y = sceneData.ship.y * savedScaleY
    this.ship.vx = sceneData.ship.vx * savedScaleX
    this.ship.vy = sceneData.ship.vy * savedScaleY
    this.ship.angle = sceneData.ship.angle
    this.ship.fuel = sceneData.ship.fuel
    this.ship.hp = sceneData.ship.hp
    this.ship.targetVx = sceneData.ship.targetVx || 0
    this.ship.targetVy = sceneData.ship.targetVy || 0
    this.ship.thrusting = false
    
    this.debris = []
    if (Array.isArray(sceneData.debris)) {
      for (const dd of sceneData.debris) {
        if (dd.collected) continue
        const type = getDebrisTypeById(dd.typeId)
        const d = new Debris(
          dd.x * savedScaleX,
          dd.y * savedScaleY,
          type,
          dd.vx * savedScaleX,
          dd.vy * savedScaleY
        )
        d.rotation = dd.rotation || 0
        d.rotationSpeed = dd.rotationSpeed || 0
        d.blinkPhase = dd.blinkPhase || 0
        this.debris.push(d)
      }
    }
    
    this.collectedValue = sceneData.collectedValue || 0
    this.time = sceneData.time || 0
    this.zoneCompleted = false
    this.pickupEffects = []
    this.damageFlash = 0
    
    console.log('[场景] 恢复成功: 飞船(', this.ship.x.toFixed(0), ',', this.ship.y.toFixed(0), ') 碎片', this.debris.length, '个 燃料', this.ship.fuel.toFixed(0), 'HP', this.ship.hp.toFixed(0))
    
    return true
  }
}
