import { GAME_CONFIG } from './constants'

export class Player {
  constructor(x, y, isPlayer1 = true) {
    this.x = x
    this.y = y
    this.width = GAME_CONFIG.PLAYER_WIDTH
    this.height = GAME_CONFIG.PLAYER_HEIGHT
    this.velocityX = 0
    this.velocityY = 0
    this.health = 100
    this.maxHealth = 100
    this.isPlayer1 = isPlayer1
    this.facingRight = isPlayer1
    this.isCharging = false
    this.chargeAmount = 0
    this.grounded = false
    this.score = 0
    this.lastShotTime = 0
    this.skillCooldown = 0
    this.isInvincible = false
    this.invincibleTimer = 0
    this.animationFrame = 0
    this.animationTimer = 0
  }

  update(keys, deltaTime, isPlayer2 = false) {
    const speed = GAME_CONFIG.PLAYER_SPEED
    const leftKey = isPlayer2 ? 'KeyA' : 'ArrowLeft'
    const rightKey = isPlayer2 ? 'KeyD' : 'ArrowRight'
    const upKey = isPlayer2 ? 'KeyW' : 'ArrowUp'
    const downKey = isPlayer2 ? 'KeyS' : 'ArrowDown'

    if (keys[leftKey]) {
      this.velocityX = -speed
      this.facingRight = false
    } else if (keys[rightKey]) {
      this.velocityX = speed
      this.facingRight = true
    } else {
      this.velocityX *= 0.8
    }

    if (keys[upKey]) {
      this.velocityY = -speed * 0.8
    } else if (keys[downKey]) {
      this.velocityY = speed * 0.8
    } else {
      this.velocityY *= 0.9
    }

    this.x += this.velocityX
    this.y += this.velocityY

    this.x = Math.max(this.width / 2, Math.min(GAME_CONFIG.CANVAS_WIDTH - this.width / 2, this.x))
    this.y = Math.max(this.height / 2, Math.min(GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GROUND_HEIGHT - this.height / 2, this.y))

    if (this.isCharging) {
      this.chargeAmount = Math.min(GAME_CONFIG.MAX_CHARGE, this.chargeAmount + GAME_CONFIG.CHARGE_RATE)
    }

    if (this.isInvincible) {
      this.invincibleTimer -= deltaTime
      if (this.invincibleTimer <= 0) {
        this.isInvincible = false
      }
    }

    if (this.skillCooldown > 0) {
      this.skillCooldown -= deltaTime
    }

    this.animationTimer += deltaTime
    if (this.animationTimer > 100) {
      this.animationFrame = (this.animationFrame + 1) % 4
      this.animationTimer = 0
    }
  }

  startCharging() {
    this.isCharging = true
    this.chargeAmount = 0
  }

  fire(bulletType = 'normal') {
    if (!this.isCharging) return null
    
    const chargeRatio = this.chargeAmount / GAME_CONFIG.MAX_CHARGE
    const baseSpeed = GAME_CONFIG.MIN_BULLET_SPEED + (GAME_CONFIG.MAX_BULLET_SPEED - GAME_CONFIG.MIN_BULLET_SPEED) * chargeRatio
    
    this.isCharging = false
    const charge = this.chargeAmount
    this.chargeAmount = 0
    
    return {
      x: this.x + (this.facingRight ? this.width / 2 : -this.width / 2),
      y: this.y,
      direction: this.facingRight ? 1 : -1,
      speed: baseSpeed,
      charge: charge,
      type: bulletType
    }
  }

  useSkill() {
    if (this.skillCooldown > 0) return false
    this.skillCooldown = GAME_CONFIG.SKILL_COOLDOWN
    return true
  }

  takeDamage(damage) {
    if (this.isInvincible) return
    
    this.health = Math.max(0, this.health - damage)
    this.isInvincible = true
    this.invincibleTimer = 500
  }

  reset(x, y) {
    this.x = x
    this.y = y
    this.velocityX = 0
    this.velocityY = 0
    this.health = this.maxHealth
    this.isCharging = false
    this.chargeAmount = 0
    this.score = 0
    this.skillCooldown = 0
    this.isInvincible = false
  }

  draw(ctx, sceneConfig) {
    ctx.save()
    
    if (this.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
      ctx.globalAlpha = 0.5
    }

    const bodyColor = this.isPlayer1 ? '#4a90d9' : '#ff6b6b'
    const accentColor = sceneConfig.accentColor

    ctx.translate(this.x, this.y)
    if (!this.facingRight) {
      ctx.scale(-1, 1)
    }

    ctx.fillStyle = bodyColor
    ctx.beginPath()
    ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 8)
    ctx.fill()

    ctx.fillStyle = accentColor
    ctx.beginPath()
    ctx.arc(0, -this.height / 4, 15, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(5, -this.height / 4 - 3, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.arc(6, -this.height / 4 - 3, 2, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#333333'
    ctx.fillRect(this.width / 2 - 5, -5, 15, 10)

    if (this.isCharging) {
      const glowIntensity = this.chargeAmount / GAME_CONFIG.MAX_CHARGE
      ctx.shadowColor = '#ffff00'
      ctx.shadowBlur = 20 * glowIntensity
      ctx.fillStyle = `rgba(255, 255, 0, ${0.3 + glowIntensity * 0.5})`
      ctx.beginPath()
      ctx.arc(this.width / 2 + 10, 0, 8 + glowIntensity * 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    }

    ctx.restore()
  }
}
