import { GAME_CONFIG, ENEMY_STATES, BULLET_TYPES } from './constants'
import { Bullet } from './Bullet'

export class EnemyAI {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.width = GAME_CONFIG.PLAYER_WIDTH
    this.height = GAME_CONFIG.PLAYER_HEIGHT
    this.velocityX = 0
    this.velocityY = 0
    this.health = 100
    this.maxHealth = 100
    this.facingRight = false
    this.isCharging = false
    this.chargeAmount = 0
    this.score = 0
    this.skillCooldown = 0
    this.isInvincible = false
    this.invincibleTimer = 0
    
    this.state = ENEMY_STATES.IDLE
    this.stateTimer = 0
    this.targetX = x
    this.targetY = y
    this.dodgeDirection = 1
    this.lastShotTime = 0
    this.shotCooldown = 1500
    
    this.aggressionLevel = 0.5
    this.reactionTime = 300
    this.lastReaction = 0
  }

  update(player, bullets, deltaTime) {
    this.stateTimer += deltaTime
    
    this.facingRight = player.x > this.x
    
    if (this.isInvincible) {
      this.invincibleTimer -= deltaTime
      if (this.invincibleTimer <= 0) {
        this.isInvincible = false
      }
    }
    
    if (this.skillCooldown > 0) {
      this.skillCooldown -= deltaTime
    }
    
    const incomingBullets = bullets.filter(b => 
      b.direction === -1 && 
      b.active && 
      Math.abs(b.y - this.y) < 100 &&
      b.x < this.x + 200
    )
    
    this.decideState(player, incomingBullets, deltaTime)
    this.executeState(player, incomingBullets, deltaTime)
    
    this.x += this.velocityX
    this.y += this.velocityY
    
    this.x = Math.max(this.width / 2, Math.min(GAME_CONFIG.CANVAS_WIDTH - this.width / 2, this.x))
    this.y = Math.max(this.height / 2, Math.min(GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GROUND_HEIGHT - this.height / 2, this.y))
    
    if (this.isCharging) {
      this.chargeAmount = Math.min(GAME_CONFIG.MAX_CHARGE, this.chargeAmount + GAME_CONFIG.CHARGE_RATE)
    }
  }

  decideState(player, incomingBullets, deltaTime) {
    if (incomingBullets.length > 0) {
      const nearestBullet = incomingBullets.reduce((nearest, b) => 
        Math.abs(b.x - this.x) < Math.abs(nearest.x - this.x) ? b : nearest
      )
      if (Math.abs(nearestBullet.x - this.x) < 150) {
        this.state = ENEMY_STATES.DODGING
        return
      }
    }
    
    const distance = Math.sqrt(
      Math.pow(player.x - this.x, 2) + 
      Math.pow(player.y - this.y, 2)
    )
    
    switch (this.state) {
      case ENEMY_STATES.IDLE:
        if (this.stateTimer > 1000) {
          this.state = ENEMY_STATES.CIRCLING
          this.stateTimer = 0
        }
        break
        
      case ENEMY_STATES.CIRCLING:
        if (this.stateTimer > 2000 + Math.random() * 2000) {
          if (Math.random() < this.aggressionLevel) {
            this.state = ENEMY_STATES.CHARGING
          } else if (distance < 300 && Math.random() < 0.3) {
            this.state = ENEMY_STATES.RUSHING
          }
          this.stateTimer = 0
        }
        break
        
      case ENEMY_STATES.DODGING:
        if (this.stateTimer > 500 || incomingBullets.length === 0) {
          this.state = ENEMY_STATES.CIRCLING
          this.stateTimer = 0
        }
        break
        
      case ENEMY_STATES.CHARGING:
        if (this.chargeAmount >= GAME_CONFIG.MAX_CHARGE || this.stateTimer > 1500) {
          this.state = ENEMY_STATES.ATTACKING
          this.stateTimer = 0
        }
        break
        
      case ENEMY_STATES.ATTACKING:
        if (this.stateTimer > 300) {
          this.state = ENEMY_STATES.CIRCLING
          this.stateTimer = 0
        }
        break
        
      case ENEMY_STATES.RUSHING:
        if (this.stateTimer > 1500 || distance < 100) {
          this.state = ENEMY_STATES.CIRCLING
          this.stateTimer = 0
        }
        break
    }
  }

  executeState(player, incomingBullets, deltaTime) {
    const speed = GAME_CONFIG.PLAYER_SPEED * 0.8
    
    switch (this.state) {
      case ENEMY_STATES.IDLE:
        this.velocityX *= 0.9
        this.velocityY *= 0.9
        break
        
      case ENEMY_STATES.CIRCLING:
        const centerY = GAME_CONFIG.CANVAS_HEIGHT / 2 - 50
        this.targetY = centerY + Math.sin(Date.now() / 1000) * 80
        
        if (player.x < this.x) {
          this.targetX = Math.max(GAME_CONFIG.CANVAS_WIDTH * 0.6, player.x + 300)
        } else {
          this.targetX = Math.min(GAME_CONFIG.CANVAS_WIDTH * 0.85, player.x + 300)
        }
        
        this.velocityX = (this.targetX - this.x) * 0.05
        this.velocityY = (this.targetY - this.y) * 0.05
        break
        
      case ENEMY_STATES.DODGING:
        if (this.stateTimer < 100) {
          this.dodgeDirection = Math.random() > 0.5 ? 1 : -1
        }
        this.velocityY = this.dodgeDirection * speed * 1.5
        this.velocityX = -speed * 0.5
        break
        
      case ENEMY_STATES.CHARGING:
        this.velocityX *= 0.9
        this.velocityY *= 0.9
        if (!this.isCharging) {
          this.startCharging()
        }
        break
        
      case ENEMY_STATES.ATTACKING:
        if (this.stateTimer < 50 && this.isCharging) {
          this.fire()
        }
        this.velocityX *= 0.95
        this.velocityY *= 0.95
        break
        
      case ENEMY_STATES.RUSHING:
        const rushSpeed = speed * 1.5
        const dx = player.x - this.x
        const dy = player.y - this.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 0) {
          this.velocityX = (dx / dist) * rushSpeed * 0.8
          this.velocityY = (dy / dist) * rushSpeed * 0.5
        }
        break
    }
  }

  startCharging() {
    this.isCharging = true
    this.chargeAmount = 0
  }

  fire() {
    if (!this.isCharging) return null
    
    const chargeRatio = this.chargeAmount / GAME_CONFIG.MAX_CHARGE
    const baseSpeed = GAME_CONFIG.MIN_BULLET_SPEED + (GAME_CONFIG.MAX_BULLET_SPEED - GAME_CONFIG.MIN_BULLET_SPEED) * chargeRatio
    
    this.isCharging = false
    const charge = this.chargeAmount
    this.chargeAmount = 0
    
    const bulletType = this.chooseBulletType()
    
    return {
      x: this.x + (this.facingRight ? this.width / 2 : -this.width / 2),
      y: this.y,
      direction: this.facingRight ? 1 : -1,
      speed: baseSpeed,
      charge: charge,
      type: bulletType
    }
  }

  chooseBulletType() {
    const rand = Math.random()
    if (rand < 0.6) return 'normal'
    if (rand < 0.8) return 'rapid'
    if (rand < 0.95) return 'heavy'
    return 'tracking'
  }

  useSkill(target) {
    if (this.skillCooldown > 0) return []
    
    this.skillCooldown = GAME_CONFIG.SKILL_COOLDOWN
    const bullets = []
    
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        bullets.push(new Bullet(
          this.x + (this.facingRight ? this.width / 2 : -this.width / 2),
          this.y + (i - 1) * 20,
          this.facingRight ? 1 : -1,
          6,
          'tracking',
          target
        ))
      }, i * 200)
    }
    
    return bullets
  }

  takeDamage(damage) {
    if (this.isInvincible) return
    
    this.health = Math.max(0, this.health - damage)
    this.isInvincible = true
    this.invincibleTimer = 500
    
    if (this.health < this.maxHealth * 0.3) {
      this.aggressionLevel = Math.min(1, this.aggressionLevel + 0.2)
    }
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
    this.state = ENEMY_STATES.IDLE
    this.stateTimer = 0
    this.aggressionLevel = 0.5
  }

  draw(ctx, sceneConfig) {
    ctx.save()
    
    if (this.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
      ctx.globalAlpha = 0.5
    }

    const bodyColor = '#ff6b6b'
    const accentColor = '#ffa94d'

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
    
    ctx.fillStyle = '#ffffff'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    const stateText = {
      [ENEMY_STATES.IDLE]: '待机',
      [ENEMY_STATES.CIRCLING]: '迂回',
      [ENEMY_STATES.DODGING]: '躲避',
      [ENEMY_STATES.CHARGING]: '蓄力',
      [ENEMY_STATES.ATTACKING]: '攻击',
      [ENEMY_STATES.RUSHING]: '突袭'
    }
    ctx.fillText(stateText[this.state] || '', this.x, this.y - this.height / 2 - 15)
  }
}
