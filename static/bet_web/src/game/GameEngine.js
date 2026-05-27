import { GAME_CONFIG, SCENE_CONFIGS } from './constants'
import { Player } from './Player'
import { EnemyAI } from './EnemyAI'
import { Bullet } from './Bullet'
import { Scene } from './Scene'

export class GameEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.width = GAME_CONFIG.CANVAS_WIDTH
    this.height = GAME_CONFIG.CANVAS_HEIGHT
    
    this.gameMode = options.gameMode || 'single'
    this.sceneName = options.sceneName || 'space'
    this.onGameOver = options.onGameOver || (() => {})
    this.onStateChange = options.onStateChange || (() => {})
    
    this.resizeCanvas()
    
    this.scene = new Scene(this.sceneName)
    this.player1 = new Player(150, this.height / 2, true)
    this.player2 = null
    this.enemy = null
    
    if (this.gameMode === 'single') {
      this.enemy = new EnemyAI(this.width - 150, this.height / 2)
    } else {
      this.player2 = new Player(this.width - 150, this.height / 2, false)
    }
    
    this.bullets = []
    this.explosions = []
    this.keys = {}
    this.lastTime = 0
    this.animationId = null
    this.isRunning = false
    this.isPaused = false
    this.gameOver = false
    this.winner = null
    this.gameTime = 0
    
    this.lastSpacePress = 0
    this.lastJPress = 0
    this.lastMouseDown = 0
    
    this.player2IsCharging = false
    
    this.bindEvents()
    this.handleResize = this.resizeCanvas.bind(this)
    window.addEventListener('resize', this.handleResize)
  }

  resizeCanvas() {
    const container = this.canvas.parentElement
    const maxWidth = Math.min(window.innerWidth - 40, this.width)
    const maxHeight = Math.min(window.innerHeight - 200, this.height)
    
    const scale = Math.min(maxWidth / this.width, maxHeight / this.height, 1)
    
    this.canvas.width = this.width
    this.canvas.height = this.height
    this.canvas.style.width = `${this.width * scale}px`
    this.canvas.style.height = `${this.height * scale}px`
  }

  bindEvents() {
    window.addEventListener('keydown', this.handleKeyDown.bind(this))
    window.addEventListener('keyup', this.handleKeyUp.bind(this))
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this))
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this))
  }

  unbindEvents() {
    window.removeEventListener('keydown', this.handleKeyDown.bind(this))
    window.removeEventListener('keyup', this.handleKeyUp.bind(this))
    this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this))
    this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this))
    window.removeEventListener('resize', this.handleResize)
  }

  handleKeyDown(e) {
    this.keys[e.code] = true
    
    const now = Date.now()
    
    if (e.code === 'Space') {
      e.preventDefault()
      if (now - this.lastSpacePress < GAME_CONFIG.DOUBLE_CLICK_DELAY) {
        this.useSkill(this.player1)
      } else {
        this.player1.startCharging()
      }
      this.lastSpacePress = now
    }
    
    if (e.code === 'KeyJ' && this.gameMode === 'double') {
      if (now - this.lastJPress < GAME_CONFIG.DOUBLE_CLICK_DELAY) {
        this.useSkill(this.player2)
      } else {
        this.player2.startCharging()
      }
      this.lastJPress = now
    }
    
    if (e.code === 'Escape') {
      this.togglePause()
    }
  }

  handleKeyUp(e) {
    this.keys[e.code] = false
    
    if (e.code === 'Space') {
      this.playerFire(this.player1)
    }
    
    if (e.code === 'KeyJ' && this.gameMode === 'double') {
      this.playerFire(this.player2)
    }
  }

  handleMouseDown(e) {
    const now = Date.now()
    if (now - this.lastMouseDown < GAME_CONFIG.DOUBLE_CLICK_DELAY) {
      this.useSkill(this.player1)
    } else {
      this.player1.startCharging()
    }
    this.lastMouseDown = now
  }

  handleMouseUp(e) {
    this.playerFire(this.player1)
  }

  playerFire(player) {
    if (!player || !player.isCharging) return
    const bulletData = player.fire()
    if (bulletData) {
      this.createBullet(bulletData, player)
    }
  }

  useSkill(player) {
    if (!player || !player.useSkill()) return
    
    const target = player === this.player1 
      ? (this.gameMode === 'single' ? this.enemy : this.player2)
      : this.player1
    
    if (!target) return
    
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        if (this.isRunning && !this.gameOver) {
          const bullet = new Bullet(
            player.x + (player.facingRight ? player.width / 2 : -player.width / 2),
            player.y + (i - 1) * 20,
            player.facingRight ? 1 : -1,
            6,
            'tracking',
            target
          )
          bullet.ownerId = player === this.player1 ? 1 : 2
          this.bullets.push(bullet)
        }
      }, i * 200)
    }
  }

  createBullet(bulletData, shooter) {
    const target = shooter === this.player1 
      ? (this.gameMode === 'single' ? this.enemy : this.player2)
      : this.player1
    
    const bullet = new Bullet(
      bulletData.x,
      bulletData.y,
      bulletData.direction,
      bulletData.speed,
      bulletData.type,
      bulletData.type === 'tracking' ? target : null
    )
    bullet.ownerId = shooter === this.player1 ? 1 : 2
    this.bullets.push(bullet)
  }

  start() {
    this.isRunning = true
    this.lastTime = performance.now()
    this.gameLoop()
  }

  stop() {
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused
    this.onStateChange({ paused: this.isPaused })
  }

  gameLoop(currentTime = performance.now()) {
    if (!this.isRunning) return
    
    const deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime
    
    if (!this.isPaused && !this.gameOver) {
      this.update(deltaTime)
    }
    
    this.draw()
    
    this.animationId = requestAnimationFrame(this.gameLoop.bind(this))
  }

  update(deltaTime) {
    this.gameTime += deltaTime
    this.scene.update()
    
    this.player1.update(this.keys, deltaTime)
    
    if (this.gameMode === 'single' && this.enemy) {
      this.enemy.update(this.player1, this.bullets, deltaTime)
      
      if (this.enemy.state === 'attacking' && this.enemy.isCharging && this.enemy.chargeAmount >= GAME_CONFIG.MAX_CHARGE) {
        const bulletData = this.enemy.fire()
        if (bulletData) {
          this.createBullet(bulletData, this.enemy)
        }
      }
      
      if (this.enemy.health < this.enemy.maxHealth * 0.4 && this.enemy.skillCooldown <= 0 && Math.random() < 0.001) {
        this.enemy.useSkill(this.player1)
      }
    } else if (this.gameMode === 'double' && this.player2) {
      this.player2.update(this.keys, deltaTime, true)
    }
    
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i]
      
      if (bullet.type === 'tracking' && bullet.target) {
        bullet.update(bullet.target.x, bullet.target.y)
      } else {
        bullet.update()
      }
      
      if (bullet.ownerId === 1) {
        const target = this.gameMode === 'single' ? this.enemy : this.player2
        if (target && bullet.checkCollision(target)) {
          target.takeDamage(bullet.damage)
          this.createExplosion(bullet.x, bullet.y, bullet.color)
          this.bullets.splice(i, 1)
          continue
        }
      } else if (bullet.ownerId === 2 || bullet.ownerId === 'enemy') {
        if (this.player1 && bullet.checkCollision(this.player1)) {
          this.player1.takeDamage(bullet.damage)
          this.createExplosion(bullet.x, bullet.y, bullet.color)
          this.bullets.splice(i, 1)
          continue
        }
      }
      
      if (!bullet.active) {
        this.bullets.splice(i, 1)
      }
    }
    
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].life -= deltaTime
      if (this.explosions[i].life <= 0) {
        this.explosions.splice(i, 1)
      }
    }
    
    this.checkGameOver()
    
    this.onStateChange({
      player1Health: this.player1.health,
      player2Health: this.gameMode === 'single' ? this.enemy.health : this.player2.health,
      player1Charge: this.player1.chargeAmount,
      player2Charge: this.gameMode === 'single' ? this.enemy.chargeAmount : this.player2.chargeAmount,
      player1SkillCooldown: this.player1.skillCooldown,
      player2SkillCooldown: this.gameMode === 'single' ? this.enemy.skillCooldown : this.player2.skillCooldown,
      gameTime: this.gameTime
    })
  }

  createExplosion(x, y, color) {
    this.explosions.push({
      x, y, color,
      life: 300,
      maxLife: 300,
      particles: Array(10).fill(null).map(() => ({
        x: 0,
        y: 0,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        size: Math.random() * 5 + 2
      }))
    })
  }

  checkGameOver() {
    if (this.player1.health <= 0) {
      this.gameOver = true
      this.winner = this.gameMode === 'single' ? 'enemy' : 'player2'
      this.onGameOver({ winner: this.winner, gameTime: this.gameTime })
    } else if (this.gameMode === 'single' && this.enemy.health <= 0) {
      this.gameOver = true
      this.winner = 'player1'
      this.onGameOver({ winner: this.winner, gameTime: this.gameTime })
    } else if (this.gameMode === 'double' && this.player2.health <= 0) {
      this.gameOver = true
      this.winner = 'player1'
      this.onGameOver({ winner: this.winner, gameTime: this.gameTime })
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height)
    
    this.scene.draw(this.ctx)
    
    for (const explosion of this.explosions) {
      const alpha = explosion.life / explosion.maxLife
      for (const p of explosion.particles) {
        p.x += p.vx
        p.y += p.vy
        this.ctx.fillStyle = explosion.color + Math.floor(alpha * 255).toString(16).padStart(2, '0')
        this.ctx.beginPath()
        this.ctx.arc(explosion.x + p.x, explosion.y + p.y, p.size * alpha, 0, Math.PI * 2)
        this.ctx.fill()
      }
    }
    
    for (const bullet of this.bullets) {
      bullet.draw(this.ctx)
    }
    
    this.player1.draw(this.ctx, this.scene.config)
    
    if (this.gameMode === 'single' && this.enemy) {
      this.enemy.draw(this.ctx, this.scene.config)
    } else if (this.gameMode === 'double' && this.player2) {
      this.player2.draw(this.ctx, this.scene.config)
    }
    
    if (this.isPaused) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      this.ctx.fillRect(0, 0, this.width, this.height)
      this.ctx.fillStyle = '#ffffff'
      this.ctx.font = 'bold 48px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('暂停', this.width / 2, this.height / 2)
      this.ctx.font = '24px Arial'
      this.ctx.fillText('按 ESC 继续', this.width / 2, this.height / 2 + 50)
    }
  }

  setScene(sceneName) {
    this.sceneName = sceneName
    this.scene.setScene(sceneName)
  }

  reset() {
    this.player1.reset(150, this.height / 2)
    
    if (this.gameMode === 'single' && this.enemy) {
      this.enemy.reset(this.width - 150, this.height / 2)
    } else if (this.gameMode === 'double' && this.player2) {
      this.player2.reset(this.width - 150, this.height / 2)
    }
    
    this.bullets = []
    this.explosions = []
    this.gameOver = false
    this.winner = null
    this.gameTime = 0
    this.isPaused = false
  }

  getState() {
    return {
      player1: {
        x: this.player1.x,
        y: this.player1.y,
        health: this.player1.health,
        charge: this.player1.chargeAmount,
        skillCooldown: this.player1.skillCooldown,
        facingRight: this.player1.facingRight,
        velocityX: this.player1.velocityX,
        velocityY: this.player1.velocityY,
        isCharging: this.player1.isCharging
      },
      player2: this.gameMode === 'single' ? {
        x: this.enemy.x,
        y: this.enemy.y,
        health: this.enemy.health,
        charge: this.enemy.chargeAmount,
        skillCooldown: this.enemy.skillCooldown,
        facingRight: this.enemy.facingRight,
        velocityX: this.enemy.velocityX,
        velocityY: this.enemy.velocityY,
        isCharging: this.enemy.isCharging,
        state: this.enemy.state
      } : {
        x: this.player2.x,
        y: this.player2.y,
        health: this.player2.health,
        charge: this.player2.chargeAmount,
        skillCooldown: this.player2.skillCooldown,
        facingRight: this.player2.facingRight,
        velocityX: this.player2.velocityX,
        velocityY: this.player2.velocityY,
        isCharging: this.player2.isCharging
      },
      bullets: this.bullets.map(b => b.toJSON()),
      gameTime: this.gameTime,
      gameOver: this.gameOver,
      winner: this.winner,
      scene: this.sceneName
    }
  }

  loadState(state) {
    if (!state || !state.player1) return
    
    this.player1.x = state.player1.x
    this.player1.y = state.player1.y
    this.player1.health = state.player1.health
    this.player1.chargeAmount = state.player1.charge || 0
    this.player1.skillCooldown = state.player1.skillCooldown || 0
    if (state.player1.facingRight !== undefined) {
      this.player1.facingRight = state.player1.facingRight
    }
    if (state.player1.velocityX !== undefined) {
      this.player1.velocityX = state.player1.velocityX
    }
    if (state.player1.velocityY !== undefined) {
      this.player1.velocityY = state.player1.velocityY
    }
    if (state.player1.isCharging !== undefined) {
      this.player1.isCharging = state.player1.isCharging
    }
    
    if (this.gameMode === 'single' && this.enemy && state.player2) {
      this.enemy.x = state.player2.x
      this.enemy.y = state.player2.y
      this.enemy.health = state.player2.health
      this.enemy.chargeAmount = state.player2.charge || 0
      this.enemy.skillCooldown = state.player2.skillCooldown || 0
      if (state.player2.facingRight !== undefined) {
        this.enemy.facingRight = state.player2.facingRight
      }
      if (state.player2.velocityX !== undefined) {
        this.enemy.velocityX = state.player2.velocityX
      }
      if (state.player2.velocityY !== undefined) {
        this.enemy.velocityY = state.player2.velocityY
      }
      if (state.player2.isCharging !== undefined) {
        this.enemy.isCharging = state.player2.isCharging
      }
      if (state.player2.state !== undefined) {
        this.enemy.state = state.player2.state
      }
    } else if (this.gameMode === 'double' && this.player2 && state.player2) {
      this.player2.x = state.player2.x
      this.player2.y = state.player2.y
      this.player2.health = state.player2.health
      this.player2.chargeAmount = state.player2.charge || 0
      this.player2.skillCooldown = state.player2.skillCooldown || 0
      if (state.player2.facingRight !== undefined) {
        this.player2.facingRight = state.player2.facingRight
      }
      if (state.player2.velocityX !== undefined) {
        this.player2.velocityX = state.player2.velocityX
      }
      if (state.player2.velocityY !== undefined) {
        this.player2.velocityY = state.player2.velocityY
      }
      if (state.player2.isCharging !== undefined) {
        this.player2.isCharging = state.player2.isCharging
      }
    }
    
    if (state.bullets && Array.isArray(state.bullets)) {
      this.bullets = state.bullets.map(b => {
        const bullet = Bullet.fromJSON(b)
        if (bullet.tracking) {
          if (bullet.ownerId === 1) {
            bullet.target = this.gameMode === 'single' ? this.enemy : this.player2
          } else {
            bullet.target = this.player1
          }
        }
        return bullet
      })
    }
    
    this.gameTime = state.gameTime || 0
    this.gameOver = state.gameOver || false
    this.winner = state.winner || null
    if (state.scene) {
      this.setScene(state.scene)
    }
  }

  destroy() {
    this.stop()
    this.unbindEvents()
  }
}
