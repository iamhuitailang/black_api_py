import { playSound } from './audio'

export class GameEngine {
  constructor(canvas, config, character, onStateChange) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.config = config
    this.character = character
    this.onStateChange = onStateChange
    
    this.isLightMode = true
    this.isRunning = false
    this.score = 0
    this.collectedParticles = []
    this.lives = 3
    this.time = 0
    this.cameraX = 0
    
    this.player = {
      x: config.playerStart.x,
      y: config.playerStart.y,
      width: 40,
      height: 50,
      vx: 0,
      vy: 0,
      speed: 5,
      lightSpeed: 8,
      shadowSpeed: 3.5,
      jumpPower: -14,
      gravity: 0.6,
      onGround: false,
      facingRight: true,
      animFrame: 0,
      animTimer: 0,
      invincible: false,
      invincibleTimer: 0
    }

    this.keys = {}
    this.particles = []
    this.effects = []
    
    this.shadows = config.shadows ? config.shadows.map(s => ({
      ...s,
      originalX: s.x,
      direction: 1
    })) : []
    
    this.torches = config.torches ? config.torches.map(t => ({ ...t })) : []
    
    this.lightParticles = config.lightParticles ? config.lightParticles.map((p, i) => ({
      x: p.x,
      y: p.y,
      collected: false,
      id: i,
      bobOffset: Math.random() * Math.PI * 2
    })) : []

    this.animationId = null
    this.lastTime = 0
    
    this.bindEvents()
  }

  bindEvents() {
    this.handleKeyDown = (e) => {
      this.keys[e.code] = true
      if (e.code === 'Space') {
        e.preventDefault()
        this.toggleMode()
      }
    }
    this.handleKeyUp = (e) => {
      this.keys[e.code] = false
    }
    this.handleClick = () => {
      this.toggleMode()
    }
    this.handleTouchStart = (e) => {
      e.preventDefault()
      this.toggleMode()
    }

    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
    this.canvas.addEventListener('click', this.handleClick)
    this.canvas.addEventListener('touchstart', this.handleTouchStart)
  }

  unbindEvents() {
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    this.canvas.removeEventListener('click', this.handleClick)
    this.canvas.removeEventListener('touchstart', this.handleTouchStart)
  }

  toggleMode() {
    this.isLightMode = !this.isLightMode
    playSound('switch')
    this.spawnSwitchEffect()
    this.notifyState()
  }

  spawnSwitchEffect() {
    for (let i = 0; i < 15; i++) {
      this.effects.push({
        type: 'switch',
        x: this.player.x + this.player.width / 2,
        y: this.player.y + this.player.height / 2,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        color: this.isLightMode ? '#FFD700' : '#4a4a8a',
        size: 4 + Math.random() * 6
      })
    }
  }

  start() {
    this.isRunning = true
    this.lastTime = performance.now()
    this.gameLoop(this.lastTime)
  }

  stop() {
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    this.unbindEvents()
  }

  gameLoop(currentTime) {
    if (!this.isRunning) return

    const deltaTime = (currentTime - this.lastTime) / 16.67
    this.lastTime = currentTime
    this.time += deltaTime

    this.update(deltaTime)
    this.render()

    this.animationId = requestAnimationFrame((t) => this.gameLoop(t))
  }

  update(dt) {
    this.updatePlayer(dt)
    this.updateShadows(dt)
    this.updateParticles(dt)
    this.updateEffects(dt)
    this.updateCamera()
    this.checkCollisions()
  }

  updatePlayer(dt) {
    const p = this.player
    const speed = this.isLightMode ? p.lightSpeed : p.shadowSpeed

    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      p.vx = -speed
      p.facingRight = false
    } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      p.vx = speed
      p.facingRight = true
    } else {
      p.vx *= 0.8
    }

    if ((this.keys['ArrowUp'] || this.keys['KeyW']) && p.onGround) {
      p.vy = p.jumpPower
      p.onGround = false
      playSound('jump')
    }

    p.vy += p.gravity * dt
    if (p.vy > 15) p.vy = 15

    p.x += p.vx * dt
    p.y += p.vy * dt

    p.x = Math.max(0, Math.min(this.config.width - p.width, p.x))

    if (p.y > this.config.height + 100) {
      this.playerDie()
    }

    if (p.invincible) {
      p.invincibleTimer -= dt
      if (p.invincibleTimer <= 0) {
        p.invincible = false
      }
    }

    p.animTimer += dt
    if (p.animTimer > 8) {
      p.animFrame = (p.animFrame + 1) % 4
      p.animTimer = 0
    }

    if (Math.abs(p.vx) < 0.5) p.animFrame = 0
  }

  updateShadows(dt) {
    this.shadows.forEach(shadow => {
      if (shadow.type === 'movingPlatform' && shadow.moveRange) {
        shadow.x += shadow.speed * shadow.direction * dt
        if (shadow.x >= shadow.moveRange.end) {
          shadow.x = shadow.moveRange.end
          shadow.direction = -1
        } else if (shadow.x <= shadow.moveRange.start) {
          shadow.x = shadow.moveRange.start
          shadow.direction = 1
        }
      }
    })
  }

  updateParticles(dt) {
    this.lightParticles.forEach(p => {
      if (!p.collected) {
        p.bobOffset += 0.05 * dt
      }
    })
  }

  updateEffects(dt) {
    this.effects = this.effects.filter(e => {
      e.x += e.vx * dt
      e.y += e.vy * dt
      e.life -= 0.03 * dt
      e.vy += 0.1 * dt
      return e.life > 0
    })
  }

  updateCamera() {
    const targetX = this.player.x - this.canvas.width / 2 + this.player.width / 2
    this.cameraX += (targetX - this.cameraX) * 0.1
    this.cameraX = Math.max(0, Math.min(this.config.width - this.canvas.width, this.cameraX))
  }

  checkCollisions() {
    const p = this.player
    p.onGround = false

    this.config.platforms.forEach(plat => {
      if (this.rectCollide(p, plat)) {
        if (p.vy > 0 && p.y + p.height - p.vy <= plat.y + 10) {
          p.y = plat.y - p.height
          p.vy = 0
          p.onGround = true
        } else if (p.vy < 0 && p.y - p.vy >= plat.y + plat.height - 10) {
          p.y = plat.y + plat.height
          p.vy = 0
        } else {
          if (p.vx > 0) p.x = plat.x - p.width
          else if (p.vx < 0) p.x = plat.x + plat.width
          p.vx = 0
        }
      }
    })

    this.shadows.forEach(shadow => {
      if (shadow.type === 'movingPlatform') {
        const platRect = { x: shadow.x, y: shadow.y, width: shadow.width, height: shadow.height }
        if (this.rectCollide(p, platRect)) {
          if (p.vy > 0 && p.y + p.height - p.vy <= shadow.y + 10) {
            p.y = shadow.y - p.height
            p.vy = 0
            p.onGround = true
            p.x += shadow.speed * shadow.direction * 0.5
          }
        }
      }
    })

    if (this.config.obstacles && !this.isLightMode) {
      this.config.obstacles.forEach(obs => {
        if (this.rectCollide(p, obs) && !p.invincible && obs.type === 'trap') {
          this.playerHit()
        }
      })
    }

    this.lightParticles.forEach(particle => {
      if (!particle.collected) {
        const dist = Math.hypot(
          p.x + p.width / 2 - particle.x,
          p.y + p.height / 2 - particle.y
        )
        const collectRange = this.isLightMode ? 50 : 35
        if (dist < collectRange) {
          this.collectParticle(particle)
        }
      }
    })

    if (this.torches.length > 0) {
      this.torches.forEach(torch => {
        if (!torch.active) {
          const dist = Math.hypot(
            p.x + p.width / 2 - torch.x,
            p.y + p.height / 2 - torch.y
          )
          if (dist < 50) {
            torch.active = true
            playSound('torch')
            this.spawnTorchEffect(torch)
            this.score += 50
            this.notifyState()
          }
        }
      })
    }

    const goal = this.config.goal
    if (this.rectCollide(p, goal)) {
      this.checkWin()
    }
  }

  rectCollide(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y
  }

  collectParticle(particle) {
    particle.collected = true
    this.collectedParticles.push(particle.id)
    this.score += 10
    playSound('collect')
    
    for (let i = 0; i < 10; i++) {
      this.effects.push({
        type: 'collect',
        x: particle.x,
        y: particle.y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6 - 2,
        life: 1,
        color: '#FFD700',
        size: 3 + Math.random() * 4
      })
    }
    
    this.notifyState()
  }

  spawnTorchEffect(torch) {
    for (let i = 0; i < 20; i++) {
      this.effects.push({
        type: 'torch',
        x: torch.x,
        y: torch.y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10 - 3,
        life: 1,
        color: i % 2 === 0 ? '#FF6B35' : '#FFD700',
        size: 5 + Math.random() * 8
      })
    }
  }

  playerHit() {
    this.lives--
    playSound('damage')
    this.player.invincible = true
    this.player.invincibleTimer = 120
    
    for (let i = 0; i < 8; i++) {
      this.effects.push({
        type: 'damage',
        x: this.player.x + this.player.width / 2,
        y: this.player.y + this.player.height / 2,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        color: '#FF4444',
        size: 4 + Math.random() * 5
      })
    }
    
    this.notifyState()
    
    if (this.lives <= 0) {
      this.playerDie()
    }
  }

  playerDie() {
    this.player.x = this.config.playerStart.x
    this.player.y = this.config.playerStart.y
    this.player.vx = 0
    this.player.vy = 0
    this.player.invincible = true
    this.player.invincibleTimer = 60
    this.lives = Math.max(this.lives, 1)
    this.notifyState()
  }

  checkWin() {
    const allCollected = this.lightParticles.every(p => p.collected)
    const allTorchesLit = this.torches.length === 0 || this.torches.every(t => t.active)
    
    if (allCollected && allTorchesLit) {
      this.isRunning = false
      playSound('win')
      if (this.onStateChange) {
        this.onStateChange({
          event: 'win',
          score: this.score,
          particles: this.collectedParticles.length
        })
      }
    }
  }

  notifyState() {
    if (this.onStateChange) {
      this.onStateChange({
        event: 'state',
        isLightMode: this.isLightMode,
        score: this.score,
        lives: this.lives,
        collectedCount: this.collectedParticles.length,
        totalParticles: this.lightParticles.length,
        torchesLit: this.torches.filter(t => t.active).length,
        totalTorches: this.torches.length
      })
    }
  }

  isInShadow(x, y) {
    for (const shadow of this.shadows) {
      if (shadow.type !== 'movingPlatform') {
        if (x >= shadow.x && x <= shadow.x + shadow.width &&
            y >= shadow.y && y <= shadow.y + shadow.height) {
          return true
        }
      }
    }
    
    if (this.torches.length > 0) {
      let inLight = false
      for (const torch of this.torches) {
        if (torch.active) {
          const dist = Math.hypot(x - torch.x, y - torch.y)
          if (dist < torch.radius) {
            inLight = true
            break
          }
        }
      }
      return !inLight
    }
    
    return false
  }

  render() {
    const ctx = this.ctx
    const w = this.canvas.width
    const h = this.canvas.height

    ctx.clearRect(0, 0, w, h)

    this.renderBackground(ctx, w, h)

    ctx.save()
    ctx.translate(-this.cameraX, 0)

    this.renderShadows(ctx)
    this.renderPlatforms(ctx)
    this.renderObstacles(ctx)
    this.renderTorches(ctx)
    this.renderGoal(ctx)
    this.renderLightParticles(ctx)
    this.renderPlayer(ctx)
    this.renderEffects(ctx)

    ctx.restore()

    this.renderVignette(ctx, w, h)
  }

  renderBackground(ctx, w, h) {
    const gradient = ctx.createLinearGradient(0, 0, 0, h)
    this.config.skyGradient.forEach((color, i) => {
      gradient.addColorStop(i / (this.config.skyGradient.length - 1), color)
    })
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)

    if (this.config.theme === 'forest') {
      ctx.fillStyle = 'rgba(34, 139, 34, 0.3)'
      for (let i = 0; i < 8; i++) {
        const x = ((i * 200 - this.cameraX * 0.3) % (w + 200)) - 100
        this.drawTree(ctx, x, h - 100, 0.7)
      }
    } else if (this.config.theme === 'canyon') {
      ctx.fillStyle = 'rgba(139, 69, 19, 0.4)'
      for (let i = 0; i < 6; i++) {
        const x = ((i * 250 - this.cameraX * 0.2) % (w + 250)) - 125
        this.drawMountain(ctx, x, h - 50, 0.8)
      }
    } else if (this.config.theme === 'castle') {
      ctx.fillStyle = 'rgba(100, 100, 150, 0.3)'
      for (let i = 0; i < 5; i++) {
        const x = ((i * 300 - this.cameraX * 0.3) % (w + 300)) - 150
        this.drawCastleBg(ctx, x, h - 80, 0.6)
      }
      this.drawStars(ctx, w, h)
    }
  }

  drawTree(ctx, x, y, scale) {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(-10, -50, 20, 100)
    ctx.fillStyle = '#228B22'
    ctx.beginPath()
    ctx.arc(0, -80, 60, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(-30, -60, 40, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(30, -60, 40, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  drawMountain(ctx, x, y, scale) {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)
    ctx.beginPath()
    ctx.moveTo(-100, 0)
    ctx.lineTo(0, -180)
    ctx.lineTo(100, 0)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  drawCastleBg(ctx, x, y, scale) {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)
    ctx.fillRect(-60, -120, 120, 140)
    ctx.fillRect(-75, -80, 25, 100)
    ctx.fillRect(50, -80, 25, 100)
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(-60 + i * 30, -135, 20, 20)
    }
    ctx.restore()
  }

  drawStars(ctx, w, h) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    for (let i = 0; i < 50; i++) {
      const x = (i * 73) % w
      const y = (i * 47) % (h * 0.5)
      const size = 1 + (i % 3)
      const twinkle = 0.5 + 0.5 * Math.sin(this.time * 0.05 + i)
      ctx.globalAlpha = twinkle
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  renderShadows(ctx) {
    this.shadows.forEach(shadow => {
      if (shadow.type === 'movingPlatform') {
        const gradient = ctx.createLinearGradient(shadow.x, shadow.y, shadow.x, shadow.y + shadow.height)
        gradient.addColorStop(0, '#2a2a4a')
        gradient.addColorStop(1, '#1a1a2e')
        ctx.fillStyle = gradient
        ctx.fillRect(shadow.x, shadow.y, shadow.width, shadow.height)
        
        ctx.strokeStyle = '#4a4a8a'
        ctx.lineWidth = 2
        ctx.strokeRect(shadow.x, shadow.y, shadow.width, shadow.height)
        
        ctx.fillStyle = 'rgba(100, 100, 180, 0.3)'
        ctx.fillRect(shadow.x + 5, shadow.y + 3, shadow.width - 10, 4)
      } else {
        ctx.fillStyle = 'rgba(20, 20, 40, 0.6)'
        ctx.beginPath()
        ctx.moveTo(shadow.x + shadow.width / 2, shadow.y)
        ctx.lineTo(shadow.x + shadow.width, shadow.y + shadow.height)
        ctx.lineTo(shadow.x, shadow.y + shadow.height)
        ctx.closePath()
        ctx.fill()
      }
    })
  }

  renderPlatforms(ctx) {
    this.config.platforms.forEach(plat => {
      if (plat.type === 'ground') {
        const gradient = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + plat.height)
        gradient.addColorStop(0, this.config.groundColor)
        gradient.addColorStop(1, '#1a1a1a')
        ctx.fillStyle = gradient
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height)
        
        ctx.fillStyle = this.config.theme === 'forest' ? '#4CAF50' : 
                        this.config.theme === 'canyon' ? '#CD853F' : '#3a3a5a'
        ctx.fillRect(plat.x, plat.y, plat.width, 8)
      } else {
        const gradient = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + plat.height)
        gradient.addColorStop(0, '#6a5a4a')
        gradient.addColorStop(1, '#4a3a2a')
        ctx.fillStyle = gradient
        this.roundRect(ctx, plat.x, plat.y, plat.width, plat.height, 6)
        ctx.fill()
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.fillRect(plat.x + 5, plat.y + 3, plat.width - 10, 3)
      }
    })
  }

  renderObstacles(ctx) {
    if (!this.config.obstacles) return
    this.config.obstacles.forEach(obs => {
      if (obs.type === 'trap') {
        ctx.fillStyle = this.isLightMode ? '#8B0000' : '#4a1a1a'
        for (let i = 0; i < obs.width / 12; i++) {
          ctx.beginPath()
          ctx.moveTo(obs.x + i * 12, obs.y + obs.height)
          ctx.lineTo(obs.x + i * 12 + 6, obs.y)
          ctx.lineTo(obs.x + i * 12 + 12, obs.y + obs.height)
          ctx.closePath()
          ctx.fill()
        }
        ctx.fillStyle = this.isLightMode ? 'rgba(255, 50, 50, 0.3)' : 'rgba(100, 20, 20, 0.3)'
        ctx.fillRect(obs.x, obs.y - 5, obs.width, 5)
      }
    })
  }

  renderTorches(ctx) {
    this.torches.forEach(torch => {
      ctx.fillStyle = '#5a4030'
      ctx.fillRect(torch.x - 4, torch.y, 8, 40)
      
      if (torch.active) {
        const flicker = Math.sin(this.time * 0.3) * 3
        
        const glow = ctx.createRadialGradient(torch.x, torch.y - 10, 0, torch.x, torch.y - 10, torch.radius)
        glow.addColorStop(0, 'rgba(255, 200, 100, 0.4)')
        glow.addColorStop(0.5, 'rgba(255, 150, 50, 0.15)')
        glow.addColorStop(1, 'rgba(255, 100, 0, 0)')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(torch.x, torch.y - 10, torch.radius, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.fillStyle = '#FF6B35'
        ctx.beginPath()
        ctx.ellipse(torch.x, torch.y - 15 + flicker, 10, 25, 0, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.fillStyle = '#FFD700'
        ctx.beginPath()
        ctx.ellipse(torch.x, torch.y - 18 + flicker, 5, 15, 0, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.fillStyle = '#2a2a2a'
        ctx.beginPath()
        ctx.arc(torch.x, torch.y - 5, 8, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.arc(torch.x, torch.y - 10, 30, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
      }
    })
  }

  renderGoal(ctx) {
    const g = this.config.goal
    const allCollected = this.lightParticles.every(p => p.collected)
    const allTorchesLit = this.torches.length === 0 || this.torches.every(t => t.active)
    const ready = allCollected && allTorchesLit
    
    if (ready) {
      const glow = ctx.createRadialGradient(g.x + g.width / 2, g.y + g.height / 2, 0, g.x + g.width / 2, g.y + g.height / 2, 100)
      glow.addColorStop(0, 'rgba(255, 215, 0, 0.5)')
      glow.addColorStop(1, 'rgba(255, 215, 0, 0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(g.x + g.width / 2, g.y + g.height / 2, 100, 0, Math.PI * 2)
      ctx.fill()
    }
    
    ctx.fillStyle = ready ? '#FFD700' : '#8B8B8B'
    ctx.fillRect(g.x + g.width / 2 - 3, g.y, 6, g.height)
    
    const flagWave = Math.sin(this.time * 0.1) * 5
    ctx.fillStyle = ready ? '#FF6B35' : '#5a5a5a'
    ctx.beginPath()
    ctx.moveTo(g.x + g.width / 2 + 3, g.y + 5)
    ctx.lineTo(g.x + g.width / 2 + 50 + flagWave, g.y + 20)
    ctx.lineTo(g.x + g.width / 2 + 3, g.y + 40)
    ctx.closePath()
    ctx.fill()
    
    ctx.font = '30px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(ready ? '🏆' : '🔒', g.x + g.width / 2, g.y + g.height - 10)
  }

  renderLightParticles(ctx) {
    this.lightParticles.forEach(p => {
      if (p.collected) return
      
      const bobY = Math.sin(this.time * 0.08 + p.bobOffset) * 8
      const y = p.y + bobY
      
      if (this.isLightMode) {
        const glow = ctx.createRadialGradient(p.x, y, 0, p.x, y, 30)
        glow.addColorStop(0, 'rgba(255, 215, 0, 0.6)')
        glow.addColorStop(1, 'rgba(255, 215, 0, 0)')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(p.x, y, 30, 0, Math.PI * 2)
        ctx.fill()
      }
      
      ctx.fillStyle = this.isLightMode ? '#FFD700' : '#FFA500'
      ctx.beginPath()
      ctx.arc(p.x, y, 10, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(p.x - 3, y - 3, 4, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.save()
      ctx.translate(p.x, y)
      ctx.rotate(this.time * 0.05)
      ctx.fillStyle = this.isLightMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 200, 100, 0.6)'
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2)
        ctx.beginPath()
        ctx.moveTo(0, -15)
        ctx.lineTo(3, 0)
        ctx.lineTo(-3, 0)
        ctx.closePath()
        ctx.fill()
      }
      ctx.restore()
    })
  }

  renderPlayer(ctx) {
    const p = this.player
    
    if (p.invincible && Math.floor(p.invincibleTimer / 8) % 2 === 0) {
      ctx.globalAlpha = 0.4
    }
    
    const centerX = p.x + p.width / 2
    const centerY = p.y + p.height / 2
    
    if (this.isLightMode) {
      const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 50)
      glow.addColorStop(0, 'rgba(255, 215, 0, 0.4)')
      glow.addColorStop(1, 'rgba(255, 215, 0, 0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(centerX, centerY, 50, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillStyle = 'rgba(50, 50, 80, 0.4)'
      ctx.beginPath()
      ctx.ellipse(centerX, centerY, 30, 35, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    
    ctx.save()
    ctx.translate(centerX, centerY)
    
    if (!p.facingRight) {
      ctx.scale(-1, 1)
    }
    
    const bounce = p.onGround ? Math.sin(this.time * 0.3) * (Math.abs(p.vx) > 0.5 ? 2 : 0) : 0
    
    ctx.font = this.isLightMode ? '42px sans-serif' : '38px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    if (this.isLightMode) {
      ctx.shadowColor = this.character.color
      ctx.shadowBlur = 20
    } else {
      ctx.globalAlpha *= 0.8
    }
    
    ctx.fillText(this.character.emoji, 0, bounce)
    
    ctx.restore()
    ctx.globalAlpha = 1
  }

  renderEffects(ctx) {
    this.effects.forEach(e => {
      ctx.globalAlpha = e.life
      ctx.fillStyle = e.color
      ctx.beginPath()
      ctx.arc(e.x, e.y, e.size * e.life, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.globalAlpha = 1
  }

  renderVignette(ctx, w, h) {
    const gradient = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.8)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
    gradient.addColorStop(1, this.isLightMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.6)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }
}
