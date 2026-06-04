import { Player } from './Player.js'
import { checkCollision, checkPlatformCollision, isWithinRange } from './utils/collision.js'
import { getLevel } from './levels/index.js'

export class GameEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.width = canvas.width
    this.height = canvas.height

    this.keys = {}
    this.prevKeys = {}
    this.isRunning = false
    this.isPaused = false
    this.lastTime = 0
    this.deltaTime = 0

    this.cameraX = 0
    this.level = null
    this.player = null

    this.onScrollCollected = options.onScrollCollected || (() => {})
    this.onLevelComplete = options.onLevelComplete || (() => {})
    this.onPlayerDeath = options.onPlayerDeath || (() => {})
    this.onPlayerHealthChange = options.onPlayerHealthChange || (() => {})
    this.onPlayerEnergyChange = options.onPlayerEnergyChange || (() => {})
    this.onPauseToggle = options.onPauseToggle || (() => {})
    this.onSnapshotSave = options.onSnapshotSave || (() => {})

    this.particles = []
    this.effects = []

    this.animationId = null
    this.snapshotTimer = 0

    this.setupInput()
  }

  setupInput() {
    this.handleKeyDown = (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault()
      }
      this.keys[e.code] = true

      if (e.code === 'KeyJ' && !this.isPaused && this.player) {
        this.player.attack()
      }
      if (e.code === 'KeyK' && !this.isPaused && this.player) {
        this.useSkill('shadow_strike')
      }
      if (e.code === 'Escape') {
        e.stopPropagation()
        this.togglePause()
      }
    }

    this.handleKeyUp = (e) => {
      this.keys[e.code] = false
    }

    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
  }

  cleanupInput() {
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
  }

  loadLevel(levelId, learnedSkills = [], snapshot = null) {
    this.level = getLevel(levelId)
    if (!this.level) return false

    this.player = new Player(
      this.level.playerStart.x,
      this.level.playerStart.y,
      learnedSkills
    )

    if (snapshot) {
      this.player.x = snapshot.x
      this.player.y = snapshot.y
      this.player.health = snapshot.health
      this.player.energy = snapshot.energy
      this.player.velocityX = snapshot.velocityX || 0
      this.player.velocityY = snapshot.velocityY || 0
      this.player.facingRight = snapshot.facingRight !== undefined ? snapshot.facingRight : true
      this.player.isGrounded = true
      console.log('[Engine] Restored snapshot:', snapshot)
    }

    this.cameraX = 0
    this.particles = []
    this.effects = []

    return true
  }

  start() {
    if (this.isRunning) return
    this.isRunning = true
    this.isPaused = false
    this.lastTime = performance.now()
    this.gameLoop()
  }

  stop() {
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    this.cleanupInput()
  }

  togglePause() {
    this.isPaused = !this.isPaused
    this.onPauseToggle(this.isPaused)
  }

  setPaused(paused) {
    if (this.isPaused !== paused) {
      this.isPaused = paused
      this.onPauseToggle(this.isPaused)
    }
  }

  justPressed(code) {
    return this.keys[code] && !this.prevKeys[code]
  }

  gameLoop() {
    if (!this.isRunning) return

    const currentTime = performance.now()
    this.deltaTime = Math.min(currentTime - this.lastTime, 32)
    this.lastTime = currentTime

    if (!this.isPaused) {
      this.update()
    }

    this.render()

    this.prevKeys = { ...this.keys }
    this.animationId = requestAnimationFrame(() => this.gameLoop())
  }

  update() {
    if (!this.player || !this.level) return

    this.player.handleInput(this.keys, this.prevKeys, this.deltaTime)
    this.player.update(this.deltaTime, this.level.gravity)

    this.updatePlatformCollision()
    this.checkBoundary()
    this.updateCamera()
    this.updateEnemies()
    this.updateScrolls()
    this.updateHazards()
    this.updateExit()
    this.updateParticles()
    this.updateEffects()

    if (this.player.health <= 0) {
      this.onPlayerDeath()
    }

    this.onPlayerHealthChange(this.player.health, this.player.maxHealth)
    this.onPlayerEnergyChange(this.player.energy, this.player.maxEnergy)

    this.snapshotTimer += this.deltaTime
    if (this.snapshotTimer >= 3000) {
      this.snapshotTimer = 0
      if (this.player.isGrounded && this.player.health > 0) {
        this.onSnapshotSave({
          x: this.player.x,
          y: this.player.y,
          health: this.player.health,
          energy: this.player.energy,
          velocityX: 0,
          velocityY: 0,
          facingRight: this.player.facingRight
        })
      }
    }
  }

  updatePlatformCollision() {
    this.player.isGrounded = false

    for (const platform of this.level.platforms) {
      const result = checkPlatformCollision(this.player, platform)

      if (result.collision) {
        if (result.side === 'top') {
          this.player.y = platform.y - this.player.height
          this.player.velocityY = 0
          this.player.isGrounded = true
          this.player.isJumping = false
        } else if (result.side === 'bottom') {
          this.player.y = platform.y + platform.height
          this.player.velocityY = 0
        } else if (result.side === 'left') {
          this.player.x = platform.x - this.player.width
          this.player.velocityX = 0
        } else if (result.side === 'right') {
          this.player.x = platform.x + platform.width
          this.player.velocityX = 0
        }
      }
    }

    for (const enemy of this.level.enemies) {
      enemy.isGrounded = false
      for (const platform of this.level.platforms) {
        const result = checkPlatformCollision(enemy, platform)
        if (result.collision && result.side === 'top') {
          enemy.y = platform.y - enemy.height
          enemy.velocityY = 0
          enemy.isGrounded = true
        }
      }
    }
  }

  checkBoundary() {
    if (!this.player || !this.level) return

    if (this.player.x < 0) {
      this.player.x = 0
      this.player.velocityX = 0
    }

    if (this.player.x + this.player.width > this.level.width) {
      this.player.x = this.level.width - this.player.width
      this.player.velocityX = 0
    }

    if (this.player.y > this.level.height + 50) {
      this.player.health = 0
      this.onPlayerDeath()
    }
  }

  updateCamera() {
    if (!this.player) return

    const targetX = this.player.x - this.width / 2 + this.player.width / 2
    this.cameraX += (targetX - this.cameraX) * 0.08
    this.cameraX = Math.max(0, Math.min(this.cameraX, this.level.width - this.width))
  }

  updateEnemies() {
    const attackHitbox = this.player.getAttackHitbox()

    for (let i = this.level.enemies.length - 1; i >= 0; i--) {
      const enemy = this.level.enemies[i]
      enemy.update(this.deltaTime, this.player)

      if (attackHitbox && checkCollision(attackHitbox, enemy)) {
        const isDead = enemy.takeDamage(this.player.attackDamage)
        this.addHitEffect(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2)

        if (isDead) {
          this.level.enemies.splice(i, 1)
          this.addDeathEffect(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2)
        }
      }

      if (enemy.canAttack() && checkCollision(this.player, enemy)) {
        const damage = enemy.attack()
        this.player.takeDamage(damage)
        this.addHitEffect(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2)
      }
    }
  }

  updateScrolls() {
    for (const scroll of this.level.scrolls) {
      if (scroll.collected) continue

      const scrollRect = { x: scroll.x, y: scroll.y, width: 30, height: 40 }
      if (checkCollision(this.player, scrollRect)) {
        scroll.collected = true
        this.player.skillSystem.learnSkill(scroll.skillId)
        this.onScrollCollected(scroll)
        this.addCollectEffect(scroll.x + 15, scroll.y + 20)
      }
    }
  }

  updateHazards() {
    if (!this.level.hazards) return

    for (const hazard of this.level.hazards) {
      if (hazard.type === 'poison') {
        if (checkCollision(this.player, hazard)) {
          this.player.takeDamage(hazard.damage)
        }
      }
    }
  }

  updateExit() {
    if (checkCollision(this.player, this.level.exit)) {
      this.onLevelComplete()
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.1
      p.life -= this.deltaTime
      p.alpha = p.life / p.maxLife

      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }

  updateEffects() {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i]
      e.life -= this.deltaTime
      e.radius += e.expandSpeed
      e.alpha = e.life / e.maxLife

      if (e.life <= 0) {
        this.effects.splice(i, 1)
      }
    }
  }

  useSkill(skillId) {
    if (!this.player || !this.player.canUseSkill(skillId)) return

    const result = this.player.useSkill(skillId)
    if (!result) return

    this.player.energy -= result.energyCost

    for (const effect of result.effects) {
      this.player.applySkillEffect(effect)

      if (effect.type === 'aoe') {
        for (const enemy of this.level.enemies) {
          if (isWithinRange(this.player, enemy, effect.range)) {
            enemy.takeDamage(result.damage)
          }
        }
        this.addAOEEffect(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, effect.range)
      }

      if (effect.type === 'dash') {
        const dashHitbox = {
          x: this.player.facingRight ? this.player.x : this.player.x - effect.range,
          y: this.player.y,
          width: effect.range + this.player.width,
          height: this.player.height
        }
        for (const enemy of this.level.enemies) {
          if (checkCollision(dashHitbox, enemy)) {
            enemy.takeDamage(result.damage)
          }
        }
      }
    }
  }

  addHitEffect(x, y) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 300,
        maxLife: 300,
        color: '#ff4444',
        size: 4 + Math.random() * 4,
        alpha: 1
      })
    }
  }

  addDeathEffect(x, y) {
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12 - 3,
        life: 500,
        maxLife: 500,
        color: '#666',
        size: 3 + Math.random() * 5,
        alpha: 1
      })
    }
  }

  addCollectEffect(x, y) {
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 6 - 2,
        life: 600,
        maxLife: 600,
        color: '#ffd700',
        size: 3 + Math.random() * 3,
        alpha: 1
      })
    }
  }

  addAOEEffect(x, y, range) {
    this.effects.push({
      x, y,
      radius: 10,
      maxRadius: range,
      expandSpeed: 8,
      life: 300,
      maxLife: 300,
      color: 'rgba(255, 100, 0, 0.5)',
      alpha: 1
    })
  }

  render() {
    const ctx = this.ctx

    ctx.globalAlpha = 1
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, this.width, this.height)

    ctx.fillStyle = this.level?.bgColor || '#1a1a2e'
    ctx.fillRect(0, 0, this.width, this.height)

    if (!this.level) return

    this.renderBackground(ctx)
    this.renderDecorations(ctx)
    this.renderHazards(ctx)
    this.renderPlatforms(ctx)
    this.renderHidingSpots(ctx)
    this.renderScrolls(ctx)
    this.renderExit(ctx)
    this.renderEnemies(ctx)

    if (this.player) {
      this.player.draw(ctx, this.cameraX)
    }

    this.renderParticles(ctx)
    this.renderEffects(ctx)
  }

  renderBackground(ctx) {
    const theme = this.level.theme

    if (theme === 'bamboo') {
      ctx.fillStyle = '#0d2810'
      for (let i = 0; i < 10; i++) {
        const x = (i * 300 - this.cameraX * 0.3) % (this.width + 300) - 100
        ctx.fillRect(x, 100, 20, 450)
      }
    } else if (theme === 'castle') {
      ctx.fillStyle = '#2a2a3e'
      for (let i = 0; i < 8; i++) {
        const x = (i * 400 - this.cameraX * 0.2) % (this.width + 400) - 150
        ctx.fillRect(x, 150, 100, 400)
        ctx.fillRect(x - 10, 130, 20, 30)
        ctx.fillRect(x + 20, 130, 20, 30)
        ctx.fillRect(x + 50, 130, 20, 30)
        ctx.fillRect(x + 80, 130, 20, 30)
      }
    } else if (theme === 'swamp') {
      ctx.fillStyle = '#0a1a1a'
      for (let i = 0; i < 6; i++) {
        const x = (i * 500 - this.cameraX * 0.2) % (this.width + 500) - 200
        ctx.beginPath()
        ctx.moveTo(x, 550)
        ctx.quadraticCurveTo(x + 100, 300, x + 50, 100)
        ctx.quadraticCurveTo(x, 300, x + 50, 550)
        ctx.fill()
      }
    } else if (theme === 'snow') {
      ctx.fillStyle = '#a0d8ef'
      for (let i = 0; i < 5; i++) {
        const x = (i * 600 - this.cameraX * 0.1) % (this.width + 600) - 200
        ctx.beginPath()
        ctx.moveTo(x, 550)
        ctx.lineTo(x + 200, 200)
        ctx.lineTo(x + 400, 550)
        ctx.fill()
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      for (let i = 0; i < 50; i++) {
        const x = ((i * 73 + Date.now() * 0.02) % (this.width + 20)) - 10
        const y = ((i * 97 + Date.now() * 0.05) % (this.height + 20)) - 10
        ctx.beginPath()
        ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  renderDecorations(ctx) {
    for (const dec of this.level.decorations) {
      const x = dec.x - this.cameraX

      if (dec.type === 'bamboo') {
        ctx.fillStyle = '#2d5a2d'
        ctx.fillRect(x, dec.y, 15, 400)
        ctx.fillStyle = '#1a3d1a'
        for (let i = 0; i < 8; i++) {
          ctx.fillRect(x - 2, dec.y + i * 50, 19, 5)
        }
      } else if (dec.type === 'lantern') {
        ctx.fillStyle = '#8b0000'
        ctx.beginPath()
        ctx.ellipse(x, dec.y, 15, 20, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#ffd700'
        ctx.fillRect(x - 2, dec.y - 25, 4, 8)
        ctx.fillStyle = 'rgba(255, 200, 0, 0.3)'
        ctx.beginPath()
        ctx.ellipse(x, dec.y, 25, 30, 0, 0, Math.PI * 2)
        ctx.fill()
      } else if (dec.type === 'deadTree') {
        ctx.fillStyle = '#2a2a2a'
        ctx.fillRect(x - 8, dec.y, 16, 250)
        ctx.fillRect(x - 30, dec.y + 50, 25, 8)
        ctx.fillRect(x + 10, dec.y + 80, 30, 8)
        ctx.fillRect(x - 25, dec.y + 120, 20, 6)
      } else if (dec.type === 'pine') {
        ctx.fillStyle = '#4a3728'
        ctx.fillRect(x - 8, dec.y + 100, 16, 150)
        ctx.fillStyle = '#1a4a1a'
        ctx.beginPath()
        ctx.moveTo(x, dec.y)
        ctx.lineTo(x - 40, dec.y + 120)
        ctx.lineTo(x + 40, dec.y + 120)
        ctx.fill()
        ctx.beginPath()
        ctx.moveTo(x, dec.y + 50)
        ctx.lineTo(x - 50, dec.y + 180)
        ctx.lineTo(x + 50, dec.y + 180)
        ctx.fill()
      }
    }
  }

  renderPlatforms(ctx) {
    for (const platform of this.level.platforms) {
      const x = platform.x - this.cameraX

      if (platform.type === 'ground') {
        ctx.fillStyle = this.getGroundColor()
        ctx.fillRect(x, platform.y, platform.width, platform.height)
      } else if (platform.type === 'bamboo') {
        ctx.fillStyle = '#3d7a3d'
        ctx.fillRect(x, platform.y, platform.width, platform.height)
        ctx.fillStyle = '#2d5a2d'
        for (let i = 0; i < platform.width; i += 20) {
          ctx.fillRect(x + i, platform.y, 3, platform.height)
        }
      } else if (platform.type === 'stone') {
        ctx.fillStyle = '#5a5a6a'
        ctx.fillRect(x, platform.y, platform.width, platform.height)
        ctx.strokeStyle = '#3a3a4a'
        ctx.lineWidth = 2
        for (let i = 0; i < platform.width; i += 30) {
          ctx.strokeRect(x + i, platform.y, 30, platform.height)
        }
      } else if (platform.type === 'log') {
        ctx.fillStyle = '#5a3a1a'
        ctx.fillRect(x, platform.y, platform.width, platform.height)
        ctx.fillStyle = '#3a2a0a'
        ctx.fillRect(x, platform.y, platform.width, 3)
        ctx.fillRect(x, platform.y + platform.height - 3, platform.width, 3)
      } else if (platform.type === 'ice') {
        ctx.fillStyle = 'rgba(150, 220, 255, 0.7)'
        ctx.fillRect(x, platform.y, platform.width, platform.height)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.lineWidth = 2
        ctx.strokeRect(x, platform.y, platform.width, platform.height)
      } else if (platform.type === 'snow') {
        ctx.fillStyle = '#e8e8f0'
        ctx.fillRect(x, platform.y, platform.width, platform.height)
        ctx.fillStyle = '#fff'
        ctx.fillRect(x, platform.y, platform.width, 5)
      } else {
        ctx.fillStyle = '#4a4a5a'
        ctx.fillRect(x, platform.y, platform.width, platform.height)
      }
    }
  }

  getGroundColor() {
    const theme = this.level.theme
    switch (theme) {
      case 'bamboo': return '#2a4a2a'
      case 'castle': return '#3a3a4a'
      case 'swamp': return '#1a2a2a'
      case 'snow': return '#d0d0e0'
      default: return '#4a4a5a'
    }
  }

  renderHidingSpots(ctx) {
    for (const spot of this.level.hidingSpots) {
      const x = spot.x - this.cameraX

      if (this.level.theme === 'bamboo') {
        ctx.fillStyle = 'rgba(50, 100, 50, 0.6)'
        ctx.fillRect(x, spot.y, spot.width, spot.height)
        ctx.fillStyle = '#2d5a2d'
        for (let i = 0; i < 3; i++) {
          ctx.fillRect(x + i * 20, spot.y, 8, spot.height)
        }
      } else if (this.level.theme === 'castle') {
        ctx.fillStyle = 'rgba(30, 30, 50, 0.8)'
        ctx.fillRect(x, spot.y, spot.width, spot.height)
      } else {
        ctx.fillStyle = 'rgba(20, 40, 40, 0.7)'
        ctx.fillRect(x, spot.y, spot.width, spot.height)
      }
    }
  }

  renderHazards(ctx) {
    if (!this.level.hazards) return

    for (const hazard of this.level.hazards) {
      const x = hazard.x - this.cameraX

      if (hazard.type === 'poison') {
        ctx.fillStyle = 'rgba(100, 200, 50, 0.4)'
        ctx.fillRect(x, hazard.y, hazard.width, hazard.height)

        ctx.fillStyle = 'rgba(150, 255, 100, 0.6)'
        for (let i = 0; i < 5; i++) {
          const bx = x + ((i * 20 + Date.now() * 0.03) % hazard.width)
          const by = hazard.y + ((i * 15 + Date.now() * 0.02) % hazard.height)
          ctx.beginPath()
          ctx.arc(bx, by, 5 + Math.sin(Date.now() * 0.01 + i) * 2, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
  }

  renderScrolls(ctx) {
    for (const scroll of this.level.scrolls) {
      if (scroll.collected) continue

      const x = scroll.x - this.cameraX
      const floatY = Math.sin(Date.now() * 0.003 + scroll.x) * 5

      ctx.fillStyle = '#f5deb3'
      ctx.fillRect(x, scroll.y + floatY, 30, 40)

      ctx.fillStyle = '#8b4513'
      ctx.fillRect(x, scroll.y + floatY, 30, 5)
      ctx.fillRect(x, scroll.y + floatY + 35, 30, 5)

      ctx.fillStyle = '#4a3a2a'
      ctx.font = '10px Arial'
      ctx.fillText('武', x + 10, scroll.y + floatY + 25)

      ctx.fillStyle = 'rgba(255, 215, 0, 0.3)'
      ctx.beginPath()
      ctx.arc(x + 15, scroll.y + floatY + 20, 25, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  renderExit(ctx) {
    const exit = this.level.exit
    const x = exit.x - this.cameraX

    ctx.fillStyle = '#ffd700'
    ctx.fillRect(x - 5, exit.y - 5, exit.width + 10, exit.height + 10)

    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(x, exit.y, exit.width, exit.height)

    ctx.fillStyle = '#ffd700'
    ctx.font = 'bold 14px Arial'
    ctx.fillText('出口', x + 10, exit.y + 40)

    ctx.fillStyle = `rgba(255, 215, 0, ${0.3 + Math.sin(Date.now() * 0.005) * 0.2})`
    ctx.beginPath()
    ctx.arc(x + exit.width / 2, exit.y + exit.height / 2, 50, 0, Math.PI * 2)
    ctx.fill()
  }

  renderEnemies(ctx) {
    for (const enemy of this.level.enemies) {
      enemy.draw(ctx, this.cameraX)
    }
  }

  renderParticles(ctx) {
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x - this.cameraX, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  renderEffects(ctx) {
    for (const e of this.effects) {
      ctx.globalAlpha = e.alpha
      ctx.strokeStyle = e.color
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(e.x - this.cameraX, e.y, e.radius, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  getLearnedSkills() {
    return this.player?.skillSystem.getLearnedSkills() || []
  }

  getSkillCooldown(skillId) {
    return this.player?.skillSystem.getSkillCooldownPercent(skillId) || 0
  }
}
