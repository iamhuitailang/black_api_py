import { checkDistance, isWithinRange } from './utils/collision.js'

export const ENEMY_TYPES = {
  patrol: {
    width: 36,
    height: 55,
    health: 50,
    damage: 15,
    speed: 1.5,
    alertRange: 200,
    attackRange: 50,
    attackCooldown: 1000,
    color: '#4a5568'
  },
  archer: {
    width: 32,
    height: 50,
    health: 40,
    damage: 20,
    speed: 1,
    alertRange: 300,
    attackRange: 250,
    attackCooldown: 2000,
    color: '#2d3748'
  },
  monster: {
    width: 50,
    height: 60,
    health: 80,
    damage: 25,
    speed: 1.2,
    alertRange: 180,
    attackRange: 60,
    attackCooldown: 1500,
    color: '#2f4f4f'
  },
  wolf: {
    width: 45,
    height: 35,
    health: 35,
    damage: 18,
    speed: 3,
    alertRange: 250,
    attackRange: 45,
    attackCooldown: 800,
    color: '#556b2f'
  }
}

export class Enemy {
  constructor(type, x, y, patrolStart, patrolEnd) {
    const config = ENEMY_TYPES[type] || ENEMY_TYPES.patrol
    
    this.id = Math.random().toString(36).substr(2, 9)
    this.type = type
    this.x = x
    this.y = y
    this.width = config.width
    this.height = config.height
    this.health = config.health
    this.maxHealth = config.health
    this.damage = config.damage
    this.speed = config.speed
    this.alertRange = config.alertRange
    this.attackRange = config.attackRange
    this.attackCooldown = config.attackCooldown
    this.color = config.color
    this.patrolStart = patrolStart
    this.patrolEnd = patrolEnd
    this.direction = 1
    this.state = 'patrol'
    this.currentAttackCooldown = 0
    this.velocityY = 0
    this.isGrounded = false
    this.animFrame = 0
    this.animTimer = 0
    this.alertTimer = 0
  }

  update(deltaTime, player) {
    this.animTimer += deltaTime
    if (this.animTimer > 200) {
      this.animTimer = 0
      this.animFrame = (this.animFrame + 1) % 4
    }

    this.currentAttackCooldown = Math.max(0, this.currentAttackCooldown - deltaTime)

    const detectability = player.getDetectability()
    const distance = checkDistance(this, player)
    const effectiveAlertRange = this.alertRange * detectability

    switch (this.state) {
      case 'patrol':
        this.patrol()
        if (distance < effectiveAlertRange) {
          this.state = 'alert'
          this.alertTimer = 500
        }
        break

      case 'alert':
        this.alertTimer -= deltaTime
        if (this.alertTimer <= 0) {
          if (distance < effectiveAlertRange) {
            this.state = 'chase'
          } else {
            this.state = 'patrol'
          }
        }
        break

      case 'chase':
        this.chase(player)
        if (distance > this.alertRange * 1.5) {
          this.state = 'patrol'
        } else if (distance < this.attackRange && this.currentAttackCooldown <= 0) {
          this.state = 'attack'
        }
        break

      case 'attack':
        if (distance > this.attackRange) {
          this.state = 'chase'
        }
        break
    }

    this.velocityY += 0.6
    this.y += this.velocityY
  }

  patrol() {
    this.x += this.speed * this.direction
    
    if (this.x <= this.patrolStart) {
      this.direction = 1
    } else if (this.x >= this.patrolEnd) {
      this.direction = -1
    }
  }

  chase(player) {
    const dx = player.x - this.x
    this.direction = dx > 0 ? 1 : -1
    this.x += this.speed * 1.5 * this.direction
  }

  canAttack() {
    return this.state === 'attack' && this.currentAttackCooldown <= 0
  }

  attack() {
    this.currentAttackCooldown = this.attackCooldown
    return this.damage
  }

  takeDamage(amount) {
    this.health -= amount
    return this.health <= 0
  }

  draw(ctx, cameraX = 0) {
    const drawX = this.x - cameraX

    ctx.save()

    if (this.direction < 0) {
      ctx.translate(drawX + this.width, 0)
      ctx.scale(-1, 1)
      ctx.translate(-drawX, 0)
    }

    switch (this.type) {
      case 'patrol':
        this.drawPatrol(ctx, drawX)
        break
      case 'archer':
        this.drawArcher(ctx, drawX)
        break
      case 'monster':
        this.drawMonster(ctx, drawX)
        break
      case 'wolf':
        this.drawWolf(ctx, drawX)
        break
    }

    const healthPercent = this.health / this.maxHealth
    ctx.fillStyle = '#333'
    ctx.fillRect(drawX, this.y - 10, this.width, 5)
    ctx.fillStyle = healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#eab308' : '#ef4444'
    ctx.fillRect(drawX, this.y - 10, this.width * healthPercent, 5)

    if (this.state === 'alert') {
      ctx.fillStyle = '#fbbf24'
      ctx.font = '16px Arial'
      ctx.fillText('?', drawX + this.width / 2 - 5, this.y - 15)
    } else if (this.state === 'chase' || this.state === 'attack') {
      ctx.fillStyle = '#ef4444'
      ctx.font = '16px Arial'
      ctx.fillText('!', drawX + this.width / 2 - 3, this.y - 15)
    }

    ctx.restore()
  }

  drawPatrol(ctx, x) {
    ctx.fillStyle = this.color
    ctx.fillRect(x + 6, this.y + 15, 24, 30)
    
    ctx.fillStyle = '#fcd5b5'
    ctx.beginPath()
    ctx.arc(x + 18, this.y + 10, 10, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#654321'
    ctx.fillRect(x + 8, this.y + 2, 20, 8)
    
    ctx.fillStyle = '#000'
    ctx.fillRect(x + 22, this.y + 8, 3, 2)
    
    const legOffset = Math.sin(this.animFrame * Math.PI / 2) * 4
    ctx.fillStyle = this.color
    ctx.fillRect(x + 8, this.y + 43, 6, 12 + legOffset)
    ctx.fillRect(x + 20, this.y + 43, 6, 12 - legOffset)
    
    ctx.fillStyle = '#c0c0c0'
    ctx.fillRect(x + 28, this.y + 20, 20, 3)
  }

  drawArcher(ctx, x) {
    ctx.fillStyle = this.color
    ctx.fillRect(x + 5, this.y + 12, 22, 28)
    
    ctx.fillStyle = '#fcd5b5'
    ctx.beginPath()
    ctx.arc(x + 16, this.y + 8, 9, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#228b22'
    ctx.beginPath()
    ctx.moveTo(x + 7, this.y + 5)
    ctx.lineTo(x + 16, this.y - 5)
    ctx.lineTo(x + 25, this.y + 5)
    ctx.fill()
    
    ctx.strokeStyle = '#8b4513'
    ctx.beginPath()
    ctx.arc(x + 30, this.y + 20, 15, -Math.PI/2, Math.PI/2)
    ctx.lineWidth = 2
    ctx.stroke()
  }

  drawMonster(ctx, x) {
    ctx.fillStyle = this.color
    ctx.fillRect(x + 5, this.y + 10, 40, 40)
    
    ctx.fillStyle = '#3d5c5c'
    ctx.fillRect(x + 10, this.y + 5, 30, 25)
    
    ctx.fillStyle = '#ff0'
    ctx.fillRect(x + 15, this.y + 12, 6, 6)
    ctx.fillRect(x + 29, this.y + 12, 6, 6)
    
    ctx.fillStyle = '#fff'
    ctx.fillRect(x + 15, this.y + 25, 20, 8)
    ctx.fillStyle = '#000'
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(x + 17 + i * 4, this.y + 25, 2, 6)
    }
  }

  drawWolf(ctx, x) {
    ctx.fillStyle = this.color
    ctx.fillRect(x + 10, this.y + 10, 25, 18)
    
    ctx.fillRect(x + 30, this.y + 5, 15, 15)
    
    ctx.beginPath()
    ctx.moveTo(x + 32, this.y + 5)
    ctx.lineTo(x + 35, this.y - 5)
    ctx.lineTo(x + 38, this.y + 5)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(x + 38, this.y + 5)
    ctx.lineTo(x + 41, this.y - 3)
    ctx.lineTo(x + 44, this.y + 5)
    ctx.fill()
    
    ctx.fillStyle = '#ff0000'
    ctx.fillRect(x + 38, this.y + 9, 4, 3)
    
    ctx.fillStyle = this.color
    ctx.fillRect(x + 12, this.y + 26, 5, 9 + (this.animFrame % 2) * 3)
    ctx.fillRect(x + 20, this.y + 26, 5, 9 - (this.animFrame % 2) * 3)
    ctx.fillRect(x + 28, this.y + 26, 5, 9 + (this.animFrame % 2) * 3)
    
    ctx.fillRect(x, this.y + 12, 12, 4)
  }
}
