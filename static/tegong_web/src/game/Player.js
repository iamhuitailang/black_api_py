import { SkillSystem } from './Skill.js'

const GRAVITY_SCALE = 0.06
const JUMP_FORCE = 11
const MOVE_SPEED = 3.5
const GROUND_FRICTION = 0.82
const AIR_FRICTION = 0.92
const ACCEL_GROUND = 0.35
const ACCEL_AIR = 0.2
const MAX_FALL_SPEED = 15
const COYOTE_DURATION = 80
const JUMP_BUFFER_DURATION = 80
const JUMP_CUT_MULTIPLIER = 0.4

export class Player {
  constructor(x, y, learnedSkills = []) {
    this.x = x
    this.y = y
    this.width = 40
    this.height = 60
    this.velocityX = 0
    this.velocityY = 0
    this.isGrounded = false
    this.isJumping = false
    this.isCrouching = false
    this.isStealth = false
    this.isAttacking = false
    this.isInvisible = false
    this.facingRight = true
    this.attackCooldown = 0
    this.attackDuration = 0
    this.attackDamage = 25
    this.attackRange = 60
    this.health = 100
    this.maxHealth = 100
    this.energy = 100
    this.maxEnergy = 100
    this.energyRegen = 0.03
    this.skillSystem = new SkillSystem(learnedSkills)
    this.invisibleTimer = 0
    this.damageFlash = 0
    this.animFrame = 0
    this.animTimer = 0
    this.coyoteTimer = 0
    this.jumpBufferTimer = 0
    this.jumpKeyWasReleased = true
    this.wasGrounded = false
  }

  handleInput(keys, prevKeys, dt) {
    if (this.isAttacking) {
      this.velocityX *= GROUND_FRICTION
      return
    }

    let moveDir = 0
    if (keys['KeyA'] || keys['ArrowLeft']) {
      moveDir -= 1
      this.facingRight = false
    }
    if (keys['KeyD'] || keys['ArrowRight']) {
      moveDir += 1
      this.facingRight = true
    }

    const accel = this.isGrounded ? ACCEL_GROUND : ACCEL_AIR
    const targetSpeed = moveDir * MOVE_SPEED

    if (moveDir !== 0) {
      this.velocityX += (targetSpeed - this.velocityX) * accel
    } else {
      this.velocityX *= this.isGrounded ? GROUND_FRICTION : AIR_FRICTION
    }

    if (Math.abs(this.velocityX) < 0.1) {
      this.velocityX = 0
    }

    const jumpKey = keys['Space'] || keys['KeyW'] || keys['ArrowUp']
    const jumpJustPressed = jumpKey && !(prevKeys['Space'] || prevKeys['KeyW'] || prevKeys['ArrowUp'])

    if (jumpJustPressed) {
      this.jumpBufferTimer = JUMP_BUFFER_DURATION
    }

    if (!jumpKey) {
      this.jumpKeyWasReleased = true
      if (this.isJumping && this.velocityY < 0) {
        this.velocityY *= JUMP_CUT_MULTIPLIER
        this.isJumping = false
      }
    }

    if (this.jumpBufferTimer > 0) {
      if (this.isGrounded || this.coyoteTimer > 0) {
        if (this.jumpKeyWasReleased) {
          this.velocityY = -JUMP_FORCE
          this.isJumping = true
          this.isGrounded = false
          this.coyoteTimer = 0
          this.jumpBufferTimer = 0
          this.jumpKeyWasReleased = false
        }
      }
    }

    this.isCrouching = !!(keys['KeyS'] || keys['ArrowDown'])
    if (this.isCrouching && this.isGrounded) {
      this.velocityX *= 0.6
    }

    this.isStealth = !!keys['KeyL']
    if (this.isStealth) {
      this.velocityX *= 0.5
    }
  }

  attack() {
    if (this.attackCooldown > 0 || this.isAttacking) return false

    this.isAttacking = true
    this.attackDuration = 250
    this.attackCooldown = 400
    return true
  }

  useSkill(skillId) {
    return this.skillSystem.useSkill(skillId, this, [])
  }

  canUseSkill(skillId) {
    return this.skillSystem.canUseSkill(skillId, this.energy)
  }

  takeDamage(amount) {
    if (this.isInvisible) return

    this.health = Math.max(0, this.health - amount)
    this.damageFlash = 200
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount)
  }

  applySkillEffect(effect) {
    switch (effect.type) {
      case 'invisible':
        this.isInvisible = true
        this.invisibleTimer = effect.duration
        break
      case 'heal':
        this.heal(effect.amount)
        break
      case 'dash':
        this.velocityX = this.facingRight ? 18 : -18
        break
    }
  }

  update(deltaTime, gravity = 0.8) {
    const dt = deltaTime / 16.67

    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= deltaTime
    }

    this.wasGrounded = this.isGrounded

    if (this.isGrounded) {
      this.coyoteTimer = COYOTE_DURATION
    } else {
      this.coyoteTimer -= deltaTime
      if (this.coyoteTimer < 0) this.coyoteTimer = 0
    }

    this.velocityY += gravity * GRAVITY_SCALE * dt * 60
    if (this.velocityY > MAX_FALL_SPEED) {
      this.velocityY = MAX_FALL_SPEED
    }

    this.x += this.velocityX * dt
    this.y += this.velocityY * dt

    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime
    }
    if (this.attackDuration > 0) {
      this.attackDuration -= deltaTime
      if (this.attackDuration <= 0) {
        this.isAttacking = false
      }
    }

    if (this.invisibleTimer > 0) {
      this.invisibleTimer -= deltaTime
      if (this.invisibleTimer <= 0) {
        this.isInvisible = false
      }
    }

    if (this.damageFlash > 0) {
      this.damageFlash -= deltaTime
    }

    this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegen * dt)

    this.skillSystem.update(deltaTime)

    this.animTimer += deltaTime
    const animSpeed = Math.abs(this.velocityX) > 0.5 ? 80 : 150
    if (this.animTimer > animSpeed) {
      this.animTimer = 0
      this.animFrame = (this.animFrame + 1) % 4
    }
  }

  getAttackHitbox() {
    if (!this.isAttacking) return null

    return {
      x: this.facingRight ? this.x + this.width : this.x - this.attackRange,
      y: this.y + 10,
      width: this.attackRange,
      height: this.height - 20
    }
  }

  getDetectability() {
    if (this.isInvisible) return 0
    if (this.isStealth) return 0.3
    if (this.isCrouching) return 0.5
    return 1
  }

  draw(ctx, cameraX = 0) {
    const drawX = this.x - cameraX

    ctx.save()

    if (this.isInvisible) {
      ctx.globalAlpha = 0.25
    } else if (this.isStealth) {
      ctx.globalAlpha = 0.65
    }

    if (this.damageFlash > 0 && Math.floor(this.damageFlash / 40) % 2 === 0) {
      ctx.globalAlpha = 0.4
    }

    if (!this.facingRight) {
      ctx.translate(drawX + this.width / 2, 0)
      ctx.scale(-1, 1)
      ctx.translate(-(drawX + this.width / 2), 0)
    }

    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(drawX + 8, this.y + 15, 24, 35)

    ctx.fillStyle = '#2d2d44'
    ctx.beginPath()
    ctx.arc(drawX + 20, this.y + 12, 12, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#ffd700'
    ctx.fillRect(drawX + 10, this.y + 8, 20, 4)

    ctx.fillStyle = '#ff0000'
    ctx.fillRect(drawX + 22, this.y + 9, 5, 2)

    const isMoving = Math.abs(this.velocityX) > 0.5
    const legOffset = isMoving ? Math.sin(this.animFrame * Math.PI / 2) * 6 : 0
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(drawX + 10, this.y + 48, 8, 12 + legOffset)
    ctx.fillRect(drawX + 22, this.y + 48, 8, 12 - legOffset)

    if (this.isAttacking) {
      ctx.fillStyle = '#c0c0c0'
      ctx.fillRect(drawX + 28, this.y + 20, 38, 4)
      ctx.fillStyle = '#ffd700'
      ctx.fillRect(drawX + 26, this.y + 18, 4, 8)
    } else {
      ctx.fillStyle = '#c0c0c0'
      ctx.fillRect(drawX + 28, this.y + 26, 16, 3)
    }

    if (this.isStealth) {
      ctx.fillStyle = 'rgba(50, 0, 50, 0.4)'
      ctx.beginPath()
      ctx.arc(drawX + 20, this.y + 30, 32, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }
}
