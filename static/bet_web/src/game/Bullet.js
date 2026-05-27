import { GAME_CONFIG, BULLET_TYPES } from './constants'

export class Bullet {
  constructor(x, y, direction, speed, type = 'normal', target = null) {
    this.x = x
    this.y = y
    this.direction = direction
    this.baseSpeed = speed
    this.type = type
    this.target = target
    this.active = true
    this.ownerId = 1
    
    const config = BULLET_TYPES[type] || BULLET_TYPES.normal
    this.damage = config.damage
    this.speed = config.speed
    this.size = config.size
    this.color = config.color
    this.tracking = config.tracking
    
    this.velocityX = direction * speed
    this.velocityY = 0
    this.trail = []
    this.maxTrailLength = 10
  }

  toJSON() {
    return {
      x: this.x,
      y: this.y,
      direction: this.direction,
      baseSpeed: this.baseSpeed,
      type: this.type,
      active: this.active,
      ownerId: this.ownerId,
      damage: this.damage,
      speed: this.speed,
      size: this.size,
      color: this.color,
      tracking: this.tracking,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      trail: this.trail
    }
  }

  static fromJSON(data) {
    const bullet = new Bullet(data.x, data.y, data.direction, data.baseSpeed, data.type)
    bullet.active = data.active
    bullet.ownerId = data.ownerId || 1
    bullet.damage = data.damage
    bullet.speed = data.speed
    bullet.size = data.size
    bullet.color = data.color
    bullet.tracking = data.tracking
    bullet.velocityX = data.velocityX
    bullet.velocityY = data.velocityY
    bullet.trail = data.trail || []
    return bullet
  }

  update(targetX, targetY) {
    if (this.tracking && this.target) {
      const dx = targetX - this.x
      const dy = targetY - this.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      if (dist > 0) {
        const turnSpeed = 0.05
        this.velocityX += (dx / dist) * turnSpeed * this.speed
        this.velocityY += (dy / dist) * turnSpeed * this.speed
        
        const currentSpeed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY)
        if (currentSpeed > this.speed) {
          this.velocityX = (this.velocityX / currentSpeed) * this.speed
          this.velocityY = (this.velocityY / currentSpeed) * this.speed
        }
      }
    }
    
    this.x += this.velocityX
    this.y += this.velocityY
    
    this.trail.push({ x: this.x, y: this.y })
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift()
    }
    
    if (this.x < -50 || this.x > GAME_CONFIG.CANVAS_WIDTH + 50 ||
        this.y < -50 || this.y > GAME_CONFIG.CANVAS_HEIGHT + 50) {
      this.active = false
    }
  }

  checkCollision(player) {
    const dx = this.x - player.x
    const dy = this.y - player.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    return distance < (this.size + player.width / 2)
  }

  draw(ctx) {
    for (let i = 0; i < this.trail.length; i++) {
      const alpha = (i + 1) / this.trail.length * 0.5
      const size = this.size * (i + 1) / this.trail.length * 0.5
      ctx.fillStyle = this.color + Math.floor(alpha * 255).toString(16).padStart(2, '0')
      ctx.beginPath()
      ctx.arc(this.trail[i].x, this.trail[i].y, size, 0, Math.PI * 2)
      ctx.fill()
    }
    
    ctx.save()
    ctx.shadowColor = this.color
    ctx.shadowBlur = 15
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
    
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
    gradient.addColorStop(0.5, this.color)
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}
