import { generateId, clamp, checkCollision, randomRange, randomInt, distance } from './utils'
import type {
  PlayerState,
  EnemyState,
  EnemyType,
  BulletState,
  PowerUpState,
  PowerUpType,
  ParticleState,
  GameState
} from './types'
import type { Plane, Wave } from '@/types'

const CANVAS_WIDTH = 480
const CANVAS_HEIGHT = 720

export class GameEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private animationId: number = 0
  private lastTime: number = 0
  private stars: { x: number; y: number; speed: number; size: number; brightness: number }[] = []
  private nebulaParticles: { x: number; y: number; size: number; alpha: number; speed: number; color: string }[] = []

  public player: PlayerState | null = null
  public enemies: EnemyState[] = []
  public playerBullets: BulletState[] = []
  public enemyBullets: BulletState[] = []
  public powerUps: PowerUpState[] = []
  public particles: ParticleState[] = []
  public shockwaves: { x: number; y: number; radius: number; maxRadius: number; alpha: number; color: string; width: number }[] = []

  public gameState: GameState = {
    isRunning: false,
    isPaused: false,
    isGameOver: false,
    score: 0,
    wave: 1,
    kills: 0,
    playTime: 0,
    stateId: null,
    waveAnnouncement: false,
    waveAnnouncementTime: 0,
    waveIntervalTime: 0,
    betweenWaves: false,
    collectedItems: [],
    usedPlanes: [],
    perfectWaves: 0,
    currentWaveDamaged: false,
    newAchievements: []
  }

  public keys: Set<string> = new Set()
  public mousePos = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 100 }
  public useMouseControl = false
  public currentPlane: Plane | null = null
  public currentWaveConfig: Wave | null = null
  public enemiesToSpawn: { type: EnemyType; count: number }[] = []
  public spawnTimer: number = 0
  public waveSpawnComplete: boolean = false

  public onStateSave?: () => void
  public onGameOver?: () => void
  public onWaveComplete?: () => void
  public onAchievementUnlock?: (achievement: any) => void

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.canvas.width = CANVAS_WIDTH
    this.canvas.height = CANVAS_HEIGHT
    this.initStars()
    this.initNebula()
    this.setupInput()
  }

  private initStars() {
    this.stars = []
    for (let i = 0; i < 180; i++) {
      this.stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        speed: randomRange(15, 90),
        size: randomRange(0.3, 3),
        brightness: randomRange(0.3, 1)
      })
    }
  }

  private initNebula() {
    this.nebulaParticles = []
    const colors = ['#0066ff', '#6600ff', '#ff3366', '#00ccff']
    for (let i = 0; i < 25; i++) {
      this.nebulaParticles.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: randomRange(40, 120),
        alpha: randomRange(0.02, 0.07),
        speed: randomRange(3, 15),
        color: colors[randomInt(0, colors.length - 1)]
      })
    }
  }

  private setupInput() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase())
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault()
        this.useSkill()
      }
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        this.togglePause()
      }
    })

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase())
    })

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect()
      const scaleX = this.canvas.width / rect.width
      const scaleY = this.canvas.height / rect.height
      this.mousePos.x = (e.clientX - rect.left) * scaleX
      this.mousePos.y = (e.clientY - rect.top) * scaleY
      this.useMouseControl = true
    })

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault()
      const rect = this.canvas.getBoundingClientRect()
      const touch = e.touches[0]
      const scaleX = this.canvas.width / rect.width
      const scaleY = this.canvas.height / rect.height
      this.mousePos.x = (touch.clientX - rect.left) * scaleX
      this.mousePos.y = (touch.clientY - rect.top) * scaleY
      this.useMouseControl = true
    })

    this.canvas.addEventListener('click', () => {
      this.useSkill()
    })
  }

  public start(plane: Plane, _waveConfig: Wave, savedState?: any) {
    this.currentPlane = plane

    if (savedState && savedState.playerX !== undefined) {
      this.loadState(savedState)
    } else {
      this.initPlayer(plane)
      this.gameState.wave = 1
      this.gameState.score = 0
      this.gameState.kills = 0
      this.gameState.playTime = 0
      this.gameState.collectedItems = []
      this.gameState.usedPlanes = [plane.plane_id]
      this.gameState.perfectWaves = 0
      this.enemies = []
      this.playerBullets = []
      this.enemyBullets = []
      this.powerUps = []
      this.particles = []
      this.shockwaves = []
      this.startWave(1)
    }

    this.gameState.isRunning = true
    this.gameState.isPaused = false
    this.gameState.isGameOver = false
    this.lastTime = performance.now()
    this.gameLoop()
  }

  private initPlayer(plane: Plane) {
    this.player = {
      id: 'player',
      x: CANVAS_WIDTH / 2 - 25,
      y: CANVAS_HEIGHT - 120,
      width: 50,
      height: 60,
      speed: plane.speed,
      hp: plane.hp,
      maxHp: plane.hp,
      weaponLevel: 1,
      weaponDamage: plane.weapon_damage,
      fireRate: plane.weapon_fire_rate,
      lastFireTime: 0,
      skillCooldown: plane.skill_cooldown,
      lastSkillTime: -plane.skill_cooldown * 1000,
      invincible: false,
      invincibleTime: 0,
      shieldTime: 0,
      speedBoostTime: 0,
      planeId: plane.plane_id,
      color: plane.color,
      active: true
    }
  }

  private loadState(savedState: any) {
    const plane = this.currentPlane!

    this.player = {
      id: 'player',
      x: savedState.playerX ?? CANVAS_WIDTH / 2 - 25,
      y: savedState.playerY ?? CANVAS_HEIGHT - 120,
      width: 50,
      height: 60,
      speed: plane.speed,
      hp: savedState.hp ?? plane.hp,
      maxHp: plane.hp,
      weaponLevel: savedState.weaponLevel ?? 1,
      weaponDamage: plane.weapon_damage * (1 + ((savedState.weaponLevel ?? 1) - 1) * 0.5),
      fireRate: plane.weapon_fire_rate * (1 - ((savedState.weaponLevel ?? 1) - 1) * 0.1),
      lastFireTime: 0,
      skillCooldown: plane.skill_cooldown,
      lastSkillTime: -plane.skill_cooldown * 1000,
      invincible: false,
      invincibleTime: 0,
      shieldTime: savedState.shieldTime ?? 0,
      speedBoostTime: savedState.speedBoostTime ?? 0,
      planeId: plane.plane_id,
      color: plane.color,
      active: true
    }

    this.gameState.score = savedState.score ?? 0
    this.gameState.wave = savedState.wave ?? 1
    this.gameState.kills = savedState.kills ?? 0
    this.gameState.playTime = savedState.playTime ?? 0
    this.gameState.collectedItems = savedState.collectedItems ?? []
    this.gameState.usedPlanes = savedState.usedPlanes ?? [plane.plane_id]
    this.gameState.perfectWaves = savedState.perfectWaves ?? 0
    this.gameState.stateId = savedState.id ?? null

    if (savedState.enemies && savedState.enemies.length > 0) {
      this.enemies = savedState.enemies.map((e: any) => ({
        ...e,
        patternTime: Math.random() * Math.PI * 2,
        lastFireTime: performance.now(),
        active: true
      }))
      this.waveSpawnComplete = true
    } else {
      this.startWave(this.gameState.wave)
    }

    if (savedState.powerups && savedState.powerups.length > 0) {
      this.powerUps = savedState.powerups.map((p: any) => ({
        ...p,
        createdAt: performance.now(),
        active: true
      }))
    }
  }

  public getStateData() {
    if (!this.player) return null
    return {
      playerX: this.player.x,
      playerY: this.player.y,
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      weaponLevel: this.player.weaponLevel,
      score: this.gameState.score,
      wave: this.gameState.wave,
      kills: this.gameState.kills,
      playTime: this.gameState.playTime,
      shieldTime: this.player.shieldTime,
      speedBoostTime: this.player.speedBoostTime,
      collectedItems: this.gameState.collectedItems,
      usedPlanes: this.gameState.usedPlanes,
      perfectWaves: this.gameState.perfectWaves,
      enemies: this.enemies.filter(e => e.active).map(e => ({
        id: e.id,
        x: e.x,
        y: e.y,
        type: e.type,
        hp: e.hp,
        maxHp: e.maxHp,
        width: e.width,
        height: e.height,
        speed: e.speed,
        damage: e.damage,
        score: e.score,
        color: e.color,
        fireRate: e.fireRate,
        isBoss: e.isBoss,
        phase: e.phase
      })),
      powerups: this.powerUps.filter(p => p.active).map(p => ({
        id: p.id,
        x: p.x,
        y: p.y,
        type: p.type,
        width: p.width,
        height: p.height
      }))
    }
  }

  private gameLoop = () => {
    if (!this.gameState.isRunning) return

    const now = performance.now()
    const deltaTime = Math.min((now - this.lastTime) / 1000, 0.05)
    this.lastTime = now

    if (!this.gameState.isPaused && !this.gameState.isGameOver) {
      this.update(deltaTime)
    }

    this.render()
    this.animationId = requestAnimationFrame(this.gameLoop)
  }

  private update(dt: number) {
    this.gameState.playTime += dt
    this.updateStars(dt)
    this.updateNebula(dt)
    this.updatePlayer(dt)
    this.updateEnemies(dt)
    this.updateBullets(dt)
    this.updatePowerUps(dt)
    this.updateParticles(dt)
    this.updateShockwaves(dt)
    this.checkCollisions()
    this.updateWaveLogic(dt)
  }

  private updateStars(dt: number) {
    for (const star of this.stars) {
      star.y += star.speed * dt
      if (star.y > CANVAS_HEIGHT + 5) {
        star.y = -5
        star.x = Math.random() * CANVAS_WIDTH
      }
    }
  }

  private updateNebula(dt: number) {
    for (const nebula of this.nebulaParticles) {
      nebula.y += nebula.speed * dt
      if (nebula.y > CANVAS_HEIGHT + nebula.size) {
        nebula.y = -nebula.size
        nebula.x = Math.random() * CANVAS_WIDTH
      }
    }
  }

  private updatePlayer(dt: number) {
    if (!this.player || !this.player.active) return

    const p = this.player
    let speedMultiplier = 1
    if (p.speedBoostTime > 0) {
      speedMultiplier = 1.5
      p.speedBoostTime -= dt
    }

    if (p.shieldTime > 0) {
      p.shieldTime -= dt
    }

    if (p.invincible) {
      p.invincibleTime -= dt
      if (p.invincibleTime <= 0) {
        p.invincible = false
      }
    }

    const speed = p.speed * speedMultiplier * dt

    if (this.useMouseControl) {
      const targetX = this.mousePos.x - p.width / 2
      const targetY = this.mousePos.y - p.height / 2
      p.x += (targetX - p.x) * 0.18
      p.y += (targetY - p.y) * 0.18
    } else {
      if (this.keys.has('arrowleft') || this.keys.has('a')) p.x -= speed
      if (this.keys.has('arrowright') || this.keys.has('d')) p.x += speed
      if (this.keys.has('arrowup') || this.keys.has('w')) p.y -= speed
      if (this.keys.has('arrowdown') || this.keys.has('s')) p.y += speed
    }

    p.x = clamp(p.x, 0, CANVAS_WIDTH - p.width)
    p.y = clamp(p.y, 0, CANVAS_HEIGHT - p.height)

    const now = performance.now()
    if (now - p.lastFireTime > p.fireRate * 1000) {
      this.playerFire()
      p.lastFireTime = now
    }

    this.addEngineTrail()
  }

  private playerFire() {
    if (!this.player) return

    const p = this.player
    const centerX = p.x + p.width / 2
    const topY = p.y
    const bulletSpeed = 700
    const damage = p.weaponDamage

    if (p.weaponLevel === 1) {
      this.playerBullets.push(this.createBullet(centerX - 3, topY, 0, -bulletSpeed, damage, true, p.color, 'normal'))
    } else if (p.weaponLevel === 2) {
      this.playerBullets.push(this.createBullet(centerX - 15, topY + 5, 0, -bulletSpeed, damage, true, p.color, 'normal'))
      this.playerBullets.push(this.createBullet(centerX + 9, topY + 5, 0, -bulletSpeed, damage, true, p.color, 'normal'))
    } else {
      this.playerBullets.push(this.createBullet(centerX - 3, topY, 0, -bulletSpeed, damage * 1.3, true, p.color, 'normal'))
      this.playerBullets.push(this.createBullet(centerX - 22, topY + 10, -50, -bulletSpeed * 0.9, damage, true, p.color, 'normal'))
      this.playerBullets.push(this.createBullet(centerX + 16, topY + 10, 50, -bulletSpeed * 0.9, damage, true, p.color, 'normal'))
    }

    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: centerX + randomRange(-6, 6),
        y: topY,
        vx: randomRange(-30, 30),
        vy: randomRange(-40, -120),
        life: 0.2,
        maxLife: 0.2,
        size: randomRange(1.5, 3.5),
        color: p.color,
        type: 'muzzle'
      })
    }
  }

  private createBullet(x: number, y: number, vx: number, vy: number, damage: number, isPlayer: boolean, color: string, type: string): BulletState {
    return {
      id: generateId(),
      x, y,
      width: isPlayer ? 6 : 10,
      height: isPlayer ? 18 : 10,
      speedX: vx,
      speedY: vy,
      damage,
      isPlayerBullet: isPlayer,
      color,
      type,
      active: true
    }
  }

  private addEngineTrail() {
    if (!this.player) return
    const p = this.player

    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: p.x + p.width / 2 + randomRange(-12, 12),
        y: p.y + p.height - 2,
        vx: randomRange(-20, 20),
        vy: randomRange(70, 160),
        life: 0.5,
        maxLife: 0.5,
        size: randomRange(3, 8),
        color: i < 2 ? '#ff6600' : i === 2 ? '#ffcc00' : p.color,
        type: 'trail'
      })
    }
  }

  public useSkill() {
    if (!this.player || !this.gameState.isRunning || this.gameState.isPaused) return

    const p = this.player
    const now = performance.now()

    if (now - p.lastSkillTime < p.skillCooldown * 1000) return

    p.lastSkillTime = now

    if (p.planeId === 'lightning') {
      p.invincible = true
      p.invincibleTime = 1
      p.y -= 150
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          if (this.gameState.isRunning) {
            this.createExplosion(p.x + p.width / 2, p.y + p.height / 2 + i * 25, p.color, 12)
          }
        }, i * 25)
      }
      this.shockwaves.push({
        x: p.x + p.width / 2,
        y: p.y + p.height / 2,
        radius: 0,
        maxRadius: 80,
        alpha: 0.8,
        color: p.color,
        width: 3
      })
    } else if (p.planeId === 'vanguard') {
      p.shieldTime = Math.max(p.shieldTime, 6)
      this.createExplosion(p.x + p.width / 2, p.y + p.height / 2, '#00d4ff', 35)
      this.shockwaves.push({
        x: p.x + p.width / 2,
        y: p.y + p.height / 2,
        radius: 0,
        maxRadius: 120,
        alpha: 1,
        color: '#00d4ff',
        width: 4
      })
    } else if (p.planeId === 'titan') {
      for (const enemy of this.enemies) {
        if (enemy.active && !enemy.isBoss) {
          this.damageEnemy(enemy, p.weaponDamage * 6)
        } else if (enemy.active && enemy.isBoss) {
          this.damageEnemy(enemy, p.weaponDamage * 1.5)
        }
      }
      for (let i = 0; i < 20; i++) {
        setTimeout(() => {
          if (this.gameState.isRunning) {
            const ex = randomRange(50, CANVAS_WIDTH - 50)
            const ey = randomRange(80, 550)
            this.createExplosion(ex, ey, '#ff8c00', 35)
            this.shockwaves.push({
              x: ex, y: ey,
              radius: 0,
              maxRadius: 70,
              alpha: 0.8,
              color: '#ff6600',
              width: 3
            })
          }
        }, i * 40)
      }
    }
  }

  public getSkillCooldownPercent(): number {
    if (!this.player) return 0
    const p = this.player
    const now = performance.now()
    const elapsed = (now - p.lastSkillTime) / 1000
    return Math.min(1, elapsed / p.skillCooldown)
  }

  private updateEnemies(dt: number) {
    for (const enemy of this.enemies) {
      if (!enemy.active) continue

      enemy.patternTime += dt

      switch (enemy.type) {
        case 'small':
          enemy.y += enemy.speed * dt
          enemy.x += Math.sin(enemy.patternTime * 2.5) * 60 * dt
          break
        case 'medium':
          enemy.y += enemy.speed * dt
          enemy.x += Math.sin(enemy.patternTime * 1.8) * 25 * dt
          break
        case 'heavy':
          enemy.y += enemy.speed * dt * 0.5
          break
        case 'elite':
          enemy.y += enemy.speed * dt * 0.85
          enemy.x += Math.sin(enemy.patternTime * 3) * 80 * dt
          break
        case 'boss':
          if (enemy.y < 80) {
            enemy.y += enemy.speed * dt * 0.4
          } else {
            enemy.x += Math.sin(enemy.patternTime * 0.5) * 90 * dt
          }
          break
      }

      const now = performance.now()
      if (enemy.fireRate > 0 && now - enemy.lastFireTime > enemy.fireRate * 1000) {
        this.enemyFire(enemy)
        enemy.lastFireTime = now
      }

      if (enemy.y > CANVAS_HEIGHT + 100) {
        enemy.active = false
      }
    }

    this.enemies = this.enemies.filter(e => e.active)
  }

  private enemyFire(enemy: EnemyState) {
    if (!this.player) return

    const centerX = enemy.x + enemy.width / 2
    const bottomY = enemy.y + enemy.height
    const bulletSpeed = 280

    if (enemy.type === 'boss') {
      for (let i = -4; i <= 4; i++) {
        const angle = Math.PI / 2 + i * 0.22
        this.enemyBullets.push(this.createBullet(
          centerX, bottomY,
          Math.cos(angle) * bulletSpeed,
          Math.sin(angle) * bulletSpeed,
          enemy.damage, false, '#ff3333', 'enemy'
        ))
      }
    } else if (enemy.type === 'elite') {
      const angle = Math.atan2(
        this.player.y + this.player.height / 2 - enemy.y,
        this.player.x + this.player.width / 2 - centerX
      )
      this.enemyBullets.push(this.createBullet(
        centerX, bottomY,
        Math.cos(angle) * bulletSpeed,
        Math.sin(angle) * bulletSpeed,
        enemy.damage, false, '#ff8c00', 'enemy'
      ))
      for (let i = -1; i <= 1; i += 2) {
        this.enemyBullets.push(this.createBullet(
          centerX + i * 18, bottomY,
          Math.cos(angle + i * 0.25) * bulletSpeed * 0.85,
          Math.sin(angle + i * 0.25) * bulletSpeed * 0.85,
          enemy.damage * 0.6, false, '#ffcc00', 'enemy'
        ))
      }
    } else if (enemy.type === 'heavy') {
      for (let i = -1; i <= 1; i++) {
        this.enemyBullets.push(this.createBullet(
          centerX + i * 15, bottomY,
          0, bulletSpeed * 0.9, enemy.damage,
          false, '#ff4444', 'enemy'
        ))
      }
    } else if (enemy.type === 'medium') {
      this.enemyBullets.push(this.createBullet(
        centerX - 10, bottomY, 0, bulletSpeed, enemy.damage, false, '#ff3333', 'enemy'
      ))
      this.enemyBullets.push(this.createBullet(
        centerX + 6, bottomY, 0, bulletSpeed, enemy.damage, false, '#ff3333', 'enemy'
      ))
    } else {
      this.enemyBullets.push(this.createBullet(
        centerX - 3, bottomY, 0, bulletSpeed, enemy.damage, false, '#ff6666', 'enemy'
      ))
    }
  }

  private updateBullets(dt: number) {
    for (const bullet of this.playerBullets) {
      if (!bullet.active) continue
      bullet.x += bullet.speedX * dt
      bullet.y += bullet.speedY * dt
      if (bullet.y < -40 || bullet.y > CANVAS_HEIGHT + 40 || bullet.x < -40 || bullet.x > CANVAS_WIDTH + 40) {
        bullet.active = false
      }
    }

    for (const bullet of this.enemyBullets) {
      if (!bullet.active) continue
      bullet.x += bullet.speedX * dt
      bullet.y += bullet.speedY * dt
      if (bullet.y < -40 || bullet.y > CANVAS_HEIGHT + 40 || bullet.x < -40 || bullet.x > CANVAS_WIDTH + 40) {
        bullet.active = false
      }
    }

    this.playerBullets = this.playerBullets.filter(b => b.active)
    this.enemyBullets = this.enemyBullets.filter(b => b.active)
  }

  private updatePowerUps(dt: number) {
    for (const powerUp of this.powerUps) {
      if (!powerUp.active) continue
      powerUp.y += 45 * dt

      if (powerUp.y > CANVAS_HEIGHT + 60) {
        powerUp.active = false
      }

      if (performance.now() - powerUp.createdAt > 8000) {
        powerUp.active = false
      }
    }

    this.powerUps = this.powerUps.filter(p => p.active)
  }

  private updateParticles(dt: number) {
    for (const particle of this.particles) {
      particle.life -= dt
      particle.x += particle.vx * dt
      particle.y += particle.vy * dt

      if (particle.type === 'explosion' || particle.type === 'spark') {
        particle.vx *= 0.95
        particle.vy *= 0.95
      }
      if (particle.type === 'trail') {
        particle.vy += 40 * dt
      }
    }

    this.particles = this.particles.filter(p => p.life > 0)
  }

  private updateShockwaves(dt: number) {
    for (const sw of this.shockwaves) {
      sw.radius += 350 * dt
      sw.alpha -= dt * 2.5
      sw.width -= dt * 3
    }
    this.shockwaves = this.shockwaves.filter(s => s.alpha > 0 && s.width > 0)
  }

  private checkCollisions() {
    if (!this.player || !this.player.active) return

    for (const bullet of this.playerBullets) {
      if (!bullet.active) continue
      for (const enemy of this.enemies) {
        if (!enemy.active) continue
        if (checkCollision(bullet, enemy)) {
          bullet.active = false
          this.damageEnemy(enemy, bullet.damage)
          this.createSparks(bullet.x, bullet.y, bullet.color, 6)
          break
        }
      }
    }

    if (this.player.shieldTime > 0) {
      for (const bullet of this.enemyBullets) {
        if (!bullet.active) continue
        if (checkCollision(bullet, this.player)) {
          bullet.active = false
          this.createSparks(bullet.x, bullet.y, '#00d4ff', 5)
        }
      }
      for (const enemy of this.enemies) {
        if (!enemy.active) continue
        if (checkCollision(enemy, this.player)) {
          this.damageEnemy(enemy, enemy.hp * 0.5)
        }
      }
    } else if (!this.player.invincible) {
      for (const bullet of this.enemyBullets) {
        if (!bullet.active) continue
        if (checkCollision(bullet, this.player)) {
          bullet.active = false
          this.damagePlayer(bullet.damage)
          this.createSparks(bullet.x, bullet.y, '#ff3333', 10)
        }
      }
      for (const enemy of this.enemies) {
        if (!enemy.active) continue
        if (checkCollision(enemy, this.player)) {
          this.damagePlayer(enemy.damage * 2)
          this.damageEnemy(enemy, enemy.hp * 0.3)
          this.createExplosion(
            (enemy.x + this.player.x + enemy.width / 2 + this.player.width / 2) / 2,
            (enemy.y + this.player.y + enemy.height / 2 + this.player.height / 2) / 2,
            '#ff8c00', 30
          )
        }
      }
    }

    for (const powerUp of this.powerUps) {
      if (!powerUp.active) continue
      if (checkCollision(powerUp, this.player)) {
        powerUp.active = false
        this.collectPowerUp(powerUp.type)
      }
    }
  }

  private damageEnemy(enemy: EnemyState, damage: number) {
    enemy.hp -= damage

    if (enemy.hp <= 0) {
      enemy.active = false
      this.gameState.kills++
      this.gameState.score += enemy.score

      const expCount = enemy.isBoss ? 70 : enemy.type === 'heavy' ? 40 : enemy.type === 'elite' ? 35 : 22
      this.createExplosion(
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2,
        enemy.color,
        expCount
      )

      this.shockwaves.push({
        x: enemy.x + enemy.width / 2,
        y: enemy.y + enemy.height / 2,
        radius: 0,
        maxRadius: enemy.isBoss ? 150 : enemy.type === 'heavy' ? 60 : 40,
        alpha: enemy.isBoss ? 1 : 0.7,
        color: enemy.color,
        width: enemy.isBoss ? 5 : 3
      })

      this.tryDropPowerUp(enemy)
    }
  }

  private damagePlayer(damage: number) {
    if (!this.player) return

    this.player.hp -= damage
    this.player.invincible = true
    this.player.invincibleTime = 1.5
    this.gameState.currentWaveDamaged = true

    this.createSparks(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#ff3333', 18)

    if (this.player.hp <= 0) {
      this.player.hp = 0
      this.gameOver()
    }
  }

  private createSparks(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = randomRange(40, 180)
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: randomRange(0.25, 0.6),
        maxLife: 0.6,
        size: randomRange(1.5, 5),
        color,
        type: 'spark'
      })
    }
  }

  private tryDropPowerUp(enemy: EnemyState) {
    let dropRate = 0.3
    if (enemy.type === 'elite') dropRate = 0.65
    if (enemy.type === 'boss') dropRate = 1.0
    if (enemy.type === 'heavy') dropRate = 0.4

    if (Math.random() < dropRate) {
      const types: PowerUpType[] = ['shield', 'clear', 'weapon', 'health', 'speed']
      const weights = [0.18, 0.12, 0.25, 0.25, 0.2]
      const type = this.weightedRandom(types, weights)

      this.powerUps.push({
        id: generateId(),
        x: enemy.x + enemy.width / 2 - 20,
        y: enemy.y + enemy.height / 2,
        width: 40,
        height: 40,
        type,
        duration: 0,
        createdAt: performance.now(),
        active: true
      })
    }

    if (enemy.type === 'boss') {
      const types: PowerUpType[] = ['health', 'weapon', 'shield', 'clear']
      for (let i = 0; i < 4; i++) {
        this.powerUps.push({
          id: generateId(),
          x: enemy.x + enemy.width / 2 - 20 + randomRange(-80, 80),
          y: enemy.y + enemy.height / 2 + randomRange(-40, 40),
          width: 40,
          height: 40,
          type: types[i % types.length],
          duration: 0,
          createdAt: performance.now(),
          active: true
        })
      }
    }
  }

  private weightedRandom<T>(items: T[], weights: number[]): T {
    const total = weights.reduce((a, b) => a + b, 0)
    let random = Math.random() * total
    for (let i = 0; i < items.length; i++) {
      random -= weights[i]
      if (random <= 0) return items[i]
    }
    return items[items.length - 1]
  }

  private collectPowerUp(type: PowerUpType) {
    if (!this.player) return

    if (!this.gameState.collectedItems.includes(type)) {
      this.gameState.collectedItems.push(type)
    }

    const p = this.player

    switch (type) {
      case 'shield':
        p.shieldTime = Math.max(p.shieldTime, 5)
        this.shockwaves.push({
          x: p.x + p.width / 2, y: p.y + p.height / 2,
          radius: 0, maxRadius: 100, alpha: 0.9,
          color: '#00d4ff', width: 4
        })
        break
      case 'clear':
        for (const enemy of this.enemies) {
          if (enemy.active && !enemy.isBoss) {
            this.gameState.score += enemy.score
            this.gameState.kills++
            this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, 25)
            this.shockwaves.push({
              x: enemy.x + enemy.width / 2, y: enemy.y + enemy.height / 2,
              radius: 0, maxRadius: 50, alpha: 0.6,
              color: enemy.color, width: 2
            })
            enemy.active = false
          } else if (enemy.active && enemy.isBoss) {
            this.damageEnemy(enemy, enemy.maxHp * 0.2)
          }
        }
        this.enemyBullets = []
        this.shockwaves.push({
          x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2,
          radius: 0, maxRadius: CANVAS_WIDTH, alpha: 0.5,
          color: '#ffffff', width: 6
        })
        break
      case 'weapon':
        if (p.weaponLevel < 3) {
          p.weaponLevel++
          p.weaponDamage *= 1.5
          p.fireRate *= 0.82
          this.shockwaves.push({
            x: p.x + p.width / 2, y: p.y,
            radius: 0, maxRadius: 60, alpha: 0.8,
            color: '#ff8c00', width: 3
          })
        } else {
          this.gameState.score += 1000
        }
        break
      case 'health':
        const heal = p.maxHp * 0.4
        p.hp = Math.min(p.maxHp, p.hp + heal)
        this.shockwaves.push({
          x: p.x + p.width / 2, y: p.y + p.height / 2,
          radius: 0, maxRadius: 50, alpha: 0.7,
          color: '#00ff88', width: 3
        })
        break
      case 'speed':
        p.speedBoostTime = Math.max(p.speedBoostTime, 7)
        break
    }

    this.createExplosion(p.x + p.width / 2, p.y, '#00ff88', 30)
  }

  private createExplosion(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6
      const speed = randomRange(100, 300)
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: randomRange(0.5, 1.2),
        maxLife: 1.2,
        size: randomRange(3, 9),
        color,
        type: 'explosion'
      })
    }
    for (let i = 0; i < Math.floor(count / 2); i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = randomRange(30, 100)
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: randomRange(0.8, 1.5),
        maxLife: 1.5,
        size: randomRange(2, 5),
        color: '#ffcc00',
        type: 'spark'
      })
    }
    for (let i = 0; i < Math.floor(count / 3); i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = randomRange(50, 150)
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: randomRange(0.4, 0.8),
        maxLife: 0.8,
        size: randomRange(4, 8),
        color: '#ffffff',
        type: 'spark'
      })
    }
  }

  private startWave(waveNum: number) {
    this.gameState.wave = waveNum
    this.gameState.waveAnnouncement = true
    this.gameState.waveAnnouncementTime = 2
    this.gameState.betweenWaves = false
    this.gameState.currentWaveDamaged = false
    this.waveSpawnComplete = false
    this.spawnTimer = 0.5

    const isBossWave = waveNum % 5 === 0
    const multiplier = 1 + Math.floor((waveNum - 1) / 10) * 0.2

    if (isBossWave) {
      this.enemiesToSpawn = [{ type: 'boss', count: 1 }]
    } else {
      const baseCount = 5 + Math.floor(waveNum * 1.3)
      const types: { type: EnemyType; weight: number }[] = []

      types.push({ type: 'small', weight: 5 })
      if (waveNum >= 2) types.push({ type: 'medium', weight: 3 })
      if (waveNum >= 4) types.push({ type: 'heavy', weight: 2 })
      if (waveNum >= 6) types.push({ type: 'elite', weight: 1.5 })

      const totalWeight = types.reduce((s, t) => s + t.weight, 0)
      this.enemiesToSpawn = types.map(t => ({
        type: t.type,
        count: Math.ceil((baseCount * t.weight) / totalWeight)
      }))
    }

    for (const et of this.enemiesToSpawn) {
      et.count = Math.ceil(et.count * multiplier)
    }
  }

  private updateWaveLogic(dt: number) {
    if (this.gameState.waveAnnouncement) {
      this.gameState.waveAnnouncementTime -= dt
      if (this.gameState.waveAnnouncementTime <= 0) {
        this.gameState.waveAnnouncement = false
      }
      return
    }

    if (!this.waveSpawnComplete) {
      this.spawnTimer -= dt
      if (this.spawnTimer <= 0) {
        this.spawnNextEnemy()
        const isBossWave = this.gameState.wave % 5 === 0
        const baseInterval = isBossWave ? 0 : Math.max(0.5, 1.4 - this.gameState.wave * 0.05)
        this.spawnTimer = baseInterval
      }
    }

    const activeEnemies = this.enemies.filter(e => e.active).length
    const remainingToSpawn = this.enemiesToSpawn.reduce((sum, e) => sum + e.count, 0)

    if (this.waveSpawnComplete && activeEnemies === 0 && remainingToSpawn === 0) {
      if (!this.gameState.currentWaveDamaged) {
        this.gameState.perfectWaves++
      }

      if (this.onWaveComplete) {
        this.onWaveComplete()
      }

      this.gameState.betweenWaves = true
      this.gameState.waveIntervalTime = 3

      setTimeout(() => {
        if (this.gameState.isRunning && !this.gameState.isGameOver) {
          this.startWave(this.gameState.wave + 1)
        }
      }, 3000)
    }
  }

  private spawnNextEnemy() {
    const available = this.enemiesToSpawn.filter(e => e.count > 0)
    if (available.length === 0) {
      this.waveSpawnComplete = true
      return
    }

    const totalWeight = available.reduce((sum, e) => sum + e.count, 0)
    let random = Math.random() * totalWeight
    let selected = available[0]
    for (const et of available) {
      random -= et.count
      if (random <= 0) {
        selected = et
        break
      }
    }

    selected.count--

    const enemy = this.createEnemy(selected.type)
    this.enemies.push(enemy)

    if (selected.type === 'small' && Math.random() < 0.5) {
      setTimeout(() => {
        if (this.gameState.isRunning && !this.gameState.isGameOver) {
          const extraEnemy = this.createEnemy(selected.type)
          extraEnemy.x = enemy.x + randomRange(-50, 50)
          this.enemies.push(extraEnemy)
        }
      }, 150)
    }
  }

  private createEnemy(type: EnemyType): EnemyState {
    const multiplier = 1 + Math.floor((this.gameState.wave - 1) / 10) * 0.2
    const waveMult = 1 + (this.gameState.wave - 1) * 0.1

    let width: number, height: number, hp: number, speed: number, damage: number
    let score: number, color: string, fireRate: number

    switch (type) {
      case 'small':
        width = 30; height = 30
        hp = 12 * waveMult * multiplier
        speed = 160
        damage = 6
        score = 100
        color = '#00aaff'
        fireRate = 0
        break
      case 'medium':
        width = 46; height = 46
        hp = 45 * waveMult * multiplier
        speed = 95
        damage = 10
        score = 250
        color = '#ff8c00'
        fireRate = 2.0
        break
      case 'heavy':
        width = 65; height = 60
        hp = 160 * waveMult * multiplier
        speed = 40
        damage = 18
        score = 500
        color = '#8b4513'
        fireRate = 2.5
        break
      case 'elite':
        width = 52; height = 52
        hp = 95 * waveMult * multiplier
        speed = 105
        damage = 16
        score = 400
        color = '#9932cc'
        fireRate = 1.2
        break
      case 'boss':
        width = 140; height = 120
        hp = 1500 * waveMult * multiplier
        speed = 22
        damage = 22
        score = 5000
        color = '#ff3333'
        fireRate = 0.9
        break
      default:
        width = 40; height = 40
        hp = 30; speed = 100; damage = 10; score = 100
        color = '#ffffff'; fireRate = 0
    }

    const x = randomRange(20, CANVAS_WIDTH - width - 20)
    const y = -height - 40

    return {
      id: generateId(),
      x, y,
      width, height,
      type,
      hp,
      maxHp: hp,
      speed,
      damage,
      score,
      dropRate: type === 'boss' ? 1 : type === 'elite' ? 0.5 : 0.15,
      fireRate,
      lastFireTime: performance.now() + randomRange(500, 2500),
      color,
      pattern: 'straight',
      patternTime: Math.random() * Math.PI * 2,
      isBoss: type === 'boss',
      phase: 1,
      active: true
    }
  }

  private gameOver() {
    this.gameState.isGameOver = true
    this.gameState.isRunning = false

    if (this.player) {
      this.createExplosion(
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height / 2,
        '#ff6600', 60
      )
      this.shockwaves.push({
        x: this.player.x + this.player.width / 2,
        y: this.player.y + this.player.height / 2,
        radius: 0, maxRadius: 200, alpha: 1,
        color: '#ff3333', width: 6
      })
    }

    if (this.onGameOver) {
      setTimeout(() => this.onGameOver?.(), 500)
    }
  }

  public togglePause() {
    if (!this.gameState.isRunning || this.gameState.isGameOver) return
    this.gameState.isPaused = !this.gameState.isPaused
    if (this.gameState.isPaused && this.onStateSave) {
      this.onStateSave()
    }
  }

  public destroy() {
    this.gameState.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
  }

  private render() {
    const ctx = this.ctx

    ctx.fillStyle = '#050710'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    this.renderNebula()
    this.renderStars()
    this.renderGrid()
    this.renderPowerUps()
    this.renderEnemies()
    this.renderPlayer()
    this.renderBullets()
    this.renderParticles()
    this.renderShockwaves()
    this.renderUI()

    if (this.gameState.waveAnnouncement) {
      this.renderWaveAnnouncement()
    }

    if (this.gameState.isPaused) {
      this.renderPauseScreen()
    }

    if (this.gameState.isGameOver) {
      this.renderGameOver()
    }
  }

  private renderNebula() {
    const ctx = this.ctx
    for (const nebula of this.nebulaParticles) {
      const gradient = ctx.createRadialGradient(
        nebula.x, nebula.y, 0,
        nebula.x, nebula.y, nebula.size
      )
      const rgb = this.hexToRgb(nebula.color)
      gradient.addColorStop(0, `rgba(${rgb}, ${nebula.alpha})`)
      gradient.addColorStop(0.6, `rgba(${rgb}, ${nebula.alpha * 0.4})`)
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(nebula.x, nebula.y, nebula.size, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  private renderStars() {
    const ctx = this.ctx
    for (const star of this.stars) {
      const twinkle = 0.6 + Math.sin(performance.now() / 400 + star.x * 0.1) * 0.4
      const alpha = star.brightness * twinkle
      ctx.fillStyle = `rgba(200, 230, 255, ${alpha})`
      ctx.shadowColor = '#ffffff'
      ctx.shadowBlur = star.size > 2 ? 3 : 0
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.shadowBlur = 0
  }

  private renderGrid() {
    const ctx = this.ctx
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.07)'
    ctx.lineWidth = 1

    const offset = (performance.now() * 0.015) % 40

    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, CANVAS_HEIGHT)
      ctx.stroke()
    }

    for (let y = -40 + offset; y < CANVAS_HEIGHT; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(CANVAS_WIDTH, y)
      ctx.stroke()
    }
  }

  private renderPlayer() {
    if (!this.player || !this.player.active) return

    const ctx = this.ctx
    const p = this.player

    if (p.invincible && Math.floor(performance.now() / 50) % 2 === 0) {
      return
    }

    ctx.save()
    ctx.translate(p.x + p.width / 2, p.y + p.height / 2)

    if (p.shieldTime > 0) {
      const shieldPulse = 1 + Math.sin(performance.now() / 120) * 0.12

      const gradient = ctx.createRadialGradient(0, 0, p.width * 0.5, 0, 0, p.width * 1.1 * shieldPulse)
      gradient.addColorStop(0, 'rgba(0, 212, 255, 0)')
      gradient.addColorStop(0.7, 'rgba(0, 212, 255, 0.2)')
      gradient.addColorStop(1, 'rgba(0, 212, 255, 0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(0, 0, p.width * 1.1 * shieldPulse, 0, Math.PI * 2)
      ctx.fill()

      ctx.beginPath()
      ctx.arc(0, 0, p.width * 0.9 * shieldPulse, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(0, 212, 255, 1)'
      ctx.lineWidth = 3
      ctx.shadowColor = '#00d4ff'
      ctx.shadowBlur = 25
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(0, 0, p.width * 0.7 * shieldPulse, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    ctx.shadowColor = p.color
    ctx.shadowBlur = 20

    const w = p.width
    const h = p.height

    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.moveTo(0, -h / 2)
    ctx.lineTo(w * 0.4, -h * 0.15)
    ctx.lineTo(w * 0.5, h * 0.15)
    ctx.lineTo(w * 0.35, h * 0.5)
    ctx.lineTo(-w * 0.35, h * 0.5)
    ctx.lineTo(-w * 0.5, h * 0.15)
    ctx.lineTo(-w * 0.4, -h * 0.15)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.beginPath()
    ctx.moveTo(0, -h / 2.2)
    ctx.lineTo(w * 0.2, -h * 0.05)
    ctx.lineTo(-w * 0.2, -h * 0.05)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
    ctx.fillRect(-w * 0.5 - 8, h * 0.05, 12, h * 0.4)
    ctx.fillRect(w * 0.5 - 4, h * 0.05, 12, h * 0.4)

    ctx.fillStyle = p.color
    ctx.shadowBlur = 10
    ctx.fillRect(-w * 0.5 - 6, -h * 0.15, 8, h * 0.35)
    ctx.fillRect(w * 0.5 - 2, -h * 0.15, 8, h * 0.35)

    ctx.fillStyle = '#00d4ff'
    ctx.shadowColor = '#00d4ff'
    ctx.shadowBlur = 15
    ctx.beginPath()
    ctx.arc(0, -h * 0.2, 6, 0, Math.PI * 2)
    ctx.fill()

    ctx.shadowBlur = 0
    ctx.restore()
  }

  private renderEnemies() {
    const ctx = this.ctx

    for (const enemy of this.enemies) {
      if (!enemy.active) continue

      ctx.save()
      ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2)

      ctx.fillStyle = enemy.color
      ctx.shadowColor = enemy.color
      ctx.shadowBlur = 15

      const w = enemy.width
      const h = enemy.height

      if (enemy.type === 'boss') {
        ctx.beginPath()
        ctx.moveTo(0, -h / 2)
        ctx.lineTo(w * 0.55, -h * 0.25)
        ctx.lineTo(w * 0.5, h * 0.05)
        ctx.lineTo(w * 0.35, h * 0.4)
        ctx.lineTo(w * 0.15, h / 2)
        ctx.lineTo(-w * 0.15, h / 2)
        ctx.lineTo(-w * 0.35, h * 0.4)
        ctx.lineTo(-w * 0.5, h * 0.05)
        ctx.lineTo(-w * 0.55, -h * 0.25)
        ctx.closePath()
        ctx.fill()

        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)'
        ctx.shadowColor = '#ff0000'
        ctx.shadowBlur = 30
        ctx.beginPath()
        ctx.arc(0, -h * 0.05, 22, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = '#ffff00'
        ctx.shadowColor = '#ffff00'
        ctx.shadowBlur = 15
        ctx.beginPath()
        ctx.arc(-w * 0.35, h * 0.1, 10, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(w * 0.35, h * 0.1, 10, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
        ctx.fillRect(-w * 0.4, h * 0.2, w * 0.8, h * 0.15)
      } else if (enemy.type === 'elite') {
        ctx.beginPath()
        ctx.moveTo(0, -h / 2)
        ctx.lineTo(w * 0.5, 0)
        ctx.lineTo(w * 0.35, h * 0.45)
        ctx.lineTo(0, h / 2)
        ctx.lineTo(-w * 0.35, h * 0.45)
        ctx.lineTo(-w * 0.5, 0)
        ctx.closePath()
        ctx.fill()

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
        ctx.shadowColor = '#ffffff'
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(0, 0, 10, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
        ctx.beginPath()
        ctx.arc(0, 0, 5, 0, Math.PI * 2)
        ctx.fill()
      } else if (enemy.type === 'heavy') {
        ctx.beginPath()
        ctx.moveTo(-w * 0.35, -h / 2)
        ctx.lineTo(w * 0.35, -h / 2)
        ctx.lineTo(w * 0.5, 0)
        ctx.lineTo(w * 0.4, h / 2)
        ctx.lineTo(-w * 0.4, h / 2)
        ctx.lineTo(-w * 0.5, 0)
        ctx.closePath()
        ctx.fill()

        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
        ctx.fillRect(-w * 0.35, -h * 0.15, w * 0.7, h * 0.3)

        ctx.fillStyle = '#ff6600'
        ctx.shadowColor = '#ff6600'
        ctx.shadowBlur = 12
        ctx.beginPath()
        ctx.arc(0, 0, 8, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.fillRect(-w * 0.3, -h / 2 + 4, w * 0.6, 4)
      } else if (enemy.type === 'medium') {
        ctx.beginPath()
        ctx.moveTo(0, -h / 2)
        ctx.lineTo(w * 0.45, -h * 0.1)
        ctx.lineTo(w * 0.3, h / 2)
        ctx.lineTo(-w * 0.3, h / 2)
        ctx.lineTo(-w * 0.45, -h * 0.1)
        ctx.closePath()
        ctx.fill()

        ctx.fillStyle = 'rgba(255, 200, 0, 0.7)'
        ctx.shadowColor = '#ffcc00'
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(0, -h * 0.05, 6, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
        ctx.fillRect(-w * 0.2, h * 0.15, w * 0.4, h * 0.15)
      } else {
        ctx.beginPath()
        ctx.moveTo(0, -h / 2)
        ctx.lineTo(w * 0.5, h * 0.15)
        ctx.lineTo(w * 0.3, h / 2)
        ctx.lineTo(-w * 0.3, h / 2)
        ctx.lineTo(-w * 0.5, h * 0.15)
        ctx.closePath()
        ctx.fill()

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.shadowColor = '#ffffff'
        ctx.shadowBlur = 5
        ctx.beginPath()
        ctx.arc(0, h * 0.1, 5, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.shadowBlur = 0

      if (enemy.hp < enemy.maxHp) {
        const barWidth = enemy.width + 6
        const barHeight = 6
        const hpPercent = enemy.hp / enemy.maxHp

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(-barWidth / 2, -enemy.height / 2 - 18, barWidth, barHeight)

        const hpColor = hpPercent > 0.5 ? '#00ff88' : hpPercent > 0.25 ? '#ff8c00' : '#ff3333'
        ctx.fillStyle = hpColor
        ctx.shadowColor = hpColor
        ctx.shadowBlur = 8
        ctx.fillRect(-barWidth / 2, -enemy.height / 2 - 18, barWidth * hpPercent, barHeight)
        ctx.shadowBlur = 0

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.lineWidth = 1
        ctx.strokeRect(-barWidth / 2 + 0.5, -enemy.height / 2 - 17.5, barWidth - 1, barHeight - 1)
      }

      if (enemy.isBoss) {
        ctx.fillStyle = '#ff3333'
        ctx.shadowColor = '#ff3333'
        ctx.shadowBlur = 10
        ctx.font = 'bold 11px "Share Tech Mono", monospace'
        ctx.textAlign = 'center'
        ctx.fillText('BOSS', 0, -enemy.height / 2 - 28)
        ctx.shadowBlur = 0
      }

      ctx.restore()
    }
  }

  private renderBullets() {
    const ctx = this.ctx

    for (const bullet of this.playerBullets) {
      if (!bullet.active) continue

      ctx.save()
      ctx.shadowColor = bullet.color
      ctx.shadowBlur = 15

      const gradient = ctx.createLinearGradient(bullet.x, bullet.y + bullet.height, bullet.x, bullet.y)
      gradient.addColorStop(0, bullet.color)
      gradient.addColorStop(0.5, '#ffffff')
      gradient.addColorStop(1, bullet.color)

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.ellipse(
        bullet.x + bullet.width / 2,
        bullet.y + bullet.height / 2,
        bullet.width / 2,
        bullet.height / 2,
        0, 0, Math.PI * 2
      )
      ctx.fill()

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.beginPath()
      ctx.ellipse(
        bullet.x + bullet.width / 2,
        bullet.y + bullet.height / 2 - 2,
        bullet.width / 3,
        bullet.height / 4,
        0, 0, Math.PI * 2
      )
      ctx.fill()

      ctx.restore()
    }

    for (const bullet of this.enemyBullets) {
      if (!bullet.active) continue

      ctx.save()
      ctx.shadowColor = bullet.color
      ctx.shadowBlur = 12

      const gradient = ctx.createRadialGradient(
        bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, 0,
        bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, bullet.width
      )
      gradient.addColorStop(0, '#ffffff')
      gradient.addColorStop(0.3, bullet.color)
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0.3)')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, bullet.width, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }
  }

  private renderPowerUps() {
    const ctx = this.ctx

    for (const powerUp of this.powerUps) {
      if (!powerUp.active) continue

      const time = performance.now() / 1000
      const pulse = 1 + Math.sin(time * 4) * 0.12
      const floatOffset = Math.sin(time * 2.5) * 4

      const cx = powerUp.x + powerUp.width / 2
      const cy = powerUp.y + powerUp.height / 2 + floatOffset

      let color: string
      let icon: string

      switch (powerUp.type) {
        case 'shield':
          color = '#00d4ff'
          icon = 'S'
          break
        case 'clear':
          color = '#ff6600'
          icon = 'B'
          break
        case 'weapon':
          color = '#ffcc00'
          icon = 'W'
          break
        case 'health':
          color = '#00ff88'
          icon = '+'
          break
        case 'speed':
          color = '#ff33ff'
          icon = '»'
          break
        default:
          color = '#ffffff'
          icon = '?'
      }

      ctx.save()

      const outerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, powerUp.width * pulse)
      outerGlow.addColorStop(0, color + '40')
      outerGlow.addColorStop(0.5, color + '15')
      outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = outerGlow
      ctx.beginPath()
      ctx.arc(cx, cy, powerUp.width * pulse, 0, Math.PI * 2)
      ctx.fill()

      ctx.shadowColor = color
      ctx.shadowBlur = 25

      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2
        const x = cx + Math.cos(angle) * (powerUp.width / 2) * pulse
        const y = cy + Math.sin(angle) * (powerUp.height / 2) * pulse
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.stroke()

      const innerGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, powerUp.width / 2)
      innerGradient.addColorStop(0, color + '30')
      innerGradient.addColorStop(1, color + '08')
      ctx.fillStyle = innerGradient
      ctx.fill()

      ctx.shadowBlur = 10
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 18px "Share Tech Mono", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(icon, cx, cy)

      ctx.restore()
    }
  }

  private renderParticles() {
    const ctx = this.ctx

    for (const particle of this.particles) {
      const alpha = particle.life / particle.maxLife
      const size = particle.size * alpha

      ctx.save()

      if (particle.type === 'trail') {
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, size * 1.5
        )
        gradient.addColorStop(0, particle.color)
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.globalAlpha = alpha * 0.7
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, size * 1.5, 0, Math.PI * 2)
        ctx.fill()
      } else if (particle.type === 'explosion') {
        ctx.shadowColor = particle.color
        ctx.shadowBlur = size * 2
        ctx.globalAlpha = alpha
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2)
        ctx.fill()
      } else if (particle.type === 'spark') {
        ctx.shadowColor = particle.color
        ctx.shadowBlur = size * 3
        ctx.globalAlpha = alpha
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, size * 0.6, 0, Math.PI * 2)
        ctx.fill()
      } else if (particle.type === 'muzzle') {
        ctx.shadowColor = particle.color
        ctx.shadowBlur = 8
        ctx.globalAlpha = alpha
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()
    }
  }

  private renderShockwaves() {
    const ctx = this.ctx

    for (const sw of this.shockwaves) {
      ctx.save()
      ctx.globalAlpha = Math.max(0, sw.alpha)
      ctx.strokeStyle = sw.color
      ctx.lineWidth = Math.max(0.5, sw.width)
      ctx.shadowColor = sw.color
      ctx.shadowBlur = 20

      ctx.beginPath()
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2)
      ctx.stroke()

      if (sw.width > 2) {
        ctx.globalAlpha = Math.max(0, sw.alpha * 0.5)
        ctx.lineWidth = Math.max(0.5, sw.width * 0.4)
        ctx.beginPath()
        ctx.arc(sw.x, sw.y, sw.radius * 0.85, 0, Math.PI * 2)
        ctx.stroke()
      }

      ctx.restore()
    }
  }

  private renderUI() {
    const ctx = this.ctx

    if (!this.player) return

    const p = this.player

    ctx.save()

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.fillRect(0, 0, CANVAS_WIDTH, 70)

    ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, 70)
    ctx.lineTo(CANVAS_WIDTH, 70)
    ctx.stroke()

    ctx.fillStyle = '#00d4ff'
    ctx.shadowColor = '#00d4ff'
    ctx.shadowBlur = 8
    ctx.font = 'bold 14px "Share Tech Mono", monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`SCORE: ${this.gameState.score}`, 15, 28)

    ctx.fillStyle = '#ff8c00'
    ctx.shadowColor = '#ff8c00'
    ctx.fillText(`WAVE: ${this.gameState.wave}`, 15, 50)

    ctx.fillStyle = '#00ff88'
    ctx.shadowColor = '#00ff88'
    ctx.textAlign = 'right'
    ctx.fillText(`KILLS: ${this.gameState.kills}`, CANVAS_WIDTH - 15, 28)

    const minutes = Math.floor(this.gameState.playTime / 60)
    const seconds = Math.floor(this.gameState.playTime % 60)
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = '#ffffff'
    ctx.shadowBlur = 4
    ctx.fillText(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`, CANVAS_WIDTH - 15, 50)

    ctx.shadowBlur = 0

    const hpBarWidth = 180
    const hpBarHeight = 14
    const hpBarX = 15
    const hpBarY = CANVAS_HEIGHT - 35

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(hpBarX - 2, hpBarY - 2, hpBarWidth + 4, hpBarHeight + 4)

    const hpPercent = p.hp / p.maxHp
    const hpColor = hpPercent > 0.5 ? '#00ff88' : hpPercent > 0.25 ? '#ffcc00' : '#ff3333'

    const hpGradient = ctx.createLinearGradient(hpBarX, hpBarY, hpBarX, hpBarY + hpBarHeight)
    hpGradient.addColorStop(0, hpColor)
    hpGradient.addColorStop(0.5, '#ffffff')
    hpGradient.addColorStop(1, hpColor)

    ctx.fillStyle = hpColor
    ctx.shadowColor = hpColor
    ctx.shadowBlur = 10
    ctx.fillRect(hpBarX, hpBarY, hpBarWidth * hpPercent, hpBarHeight)

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 1
    ctx.strokeRect(hpBarX + 0.5, hpBarY + 0.5, hpBarWidth - 1, hpBarHeight - 1)

    ctx.fillStyle = '#ffffff'
    ctx.shadowBlur = 5
    ctx.font = 'bold 11px "Share Tech Mono", monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`HP ${Math.ceil(p.hp)}/${p.maxHp}`, hpBarX + hpBarWidth / 2, hpBarY + 11)

    const skillBarWidth = 120
    const skillBarHeight = 10
    const skillBarX = CANVAS_WIDTH - skillBarWidth - 15
    const skillBarY = CANVAS_HEIGHT - 33

    const skillPercent = this.getSkillCooldownPercent()

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(skillBarX - 2, skillBarY - 2, skillBarWidth + 4, skillBarHeight + 4)

    const skillColor = skillPercent >= 1 ? '#ff8c00' : '#666666'
    ctx.fillStyle = skillColor
    ctx.shadowColor = skillColor
    ctx.shadowBlur = skillPercent >= 1 ? 8 : 0
    ctx.fillRect(skillBarX, skillBarY, skillBarWidth * skillPercent, skillBarHeight)

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 1
    ctx.strokeRect(skillBarX + 0.5, skillBarY + 0.5, skillBarWidth - 1, skillBarHeight - 1)

    ctx.fillStyle = '#ffffff'
    ctx.shadowBlur = 3
    ctx.font = 'bold 10px "Share Tech Mono", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('SKILL', skillBarX + skillBarWidth / 2, skillBarY + 9)

    ctx.shadowBlur = 0
    ctx.textAlign = 'left'
    ctx.fillStyle = '#00d4ff'
    ctx.font = '10px "Share Tech Mono", monospace'
    ctx.fillText(`WEAPON LV.${p.weaponLevel}`, 15, CANVAS_HEIGHT - 50)

    if (p.shieldTime > 0) {
      ctx.fillStyle = '#00d4ff'
      ctx.fillText(`SHIELD ${p.shieldTime.toFixed(1)}s`, 130, CANVAS_HEIGHT - 50)
    }

    if (p.speedBoostTime > 0) {
      ctx.fillStyle = '#ff33ff'
      ctx.fillText(`SPEED ${p.speedBoostTime.toFixed(1)}s`, 240, CANVAS_HEIGHT - 50)
    }

    ctx.restore()
  }

  private renderWaveAnnouncement() {
    const ctx = this.ctx
    const time = this.gameState.waveAnnouncementTime
    const totalTime = 2

    let alpha = 1
    if (time > totalTime - 0.3) {
      alpha = (totalTime - time) / 0.3
    } else if (time < 0.3) {
      alpha = time / 0.3
    }

    ctx.save()
    ctx.globalAlpha = Math.max(0, alpha)

    const cx = CANVAS_WIDTH / 2
    const cy = CANVAS_HEIGHT / 2 - 50

    const glowGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 250)
    glowGradient.addColorStop(0, 'rgba(255, 140, 0, 0.3)')
    glowGradient.addColorStop(0.5, 'rgba(255, 140, 0, 0.1)')
    glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = glowGradient
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    ctx.shadowColor = '#ff8c00'
    ctx.shadowBlur = 30

    ctx.strokeStyle = '#ff8c00'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(0, cy - 60)
    ctx.lineTo(CANVAS_WIDTH, cy - 60)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, cy + 60)
    ctx.lineTo(CANVAS_WIDTH, cy + 60)
    ctx.stroke()

    ctx.fillStyle = '#ff8c00'
    ctx.font = 'bold 28px "Share Tech Mono", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const isBossWave = this.gameState.wave % 5 === 0
    if (isBossWave) {
      ctx.fillStyle = '#ff3333'
      ctx.shadowColor = '#ff0000'
      ctx.font = 'bold 24px "Share Tech Mono", monospace'
      ctx.fillText('⚠ BOSS WAVE ⚠', cx, cy - 35)
      ctx.fillStyle = '#ff8c00'
      ctx.shadowColor = '#ff8c00'
    }

    ctx.font = 'bold 36px "Share Tech Mono", monospace'
    ctx.fillText(`WAVE ${this.gameState.wave}`, cx, cy + 5)

    ctx.font = 'bold 14px "Share Tech Mono", monospace'
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = '#ffffff'
    ctx.shadowBlur = 10
    ctx.fillText('GET READY!', cx, cy + 40)

    ctx.restore()
  }

  private renderPauseScreen() {
    const ctx = this.ctx

    ctx.save()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    const cx = CANVAS_WIDTH / 2
    const cy = CANVAS_HEIGHT / 2

    ctx.shadowColor = '#00d4ff'
    ctx.shadowBlur = 30
    ctx.fillStyle = '#00d4ff'
    ctx.font = 'bold 40px "Share Tech Mono", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('PAUSED', cx, cy - 20)

    ctx.shadowBlur = 10
    ctx.fillStyle = '#ffffff'
    ctx.font = '16px "Share Tech Mono", monospace'
    ctx.fillText('Press ESC / P to resume', cx, cy + 30)
    ctx.fillText('Progress auto-saved', cx, cy + 55)

    ctx.restore()
  }

  private renderGameOver() {
    const ctx = this.ctx

    ctx.save()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    const cx = CANVAS_WIDTH / 2
    const cy = CANVAS_HEIGHT / 2 - 40

    ctx.shadowColor = '#ff3333'
    ctx.shadowBlur = 40
    ctx.fillStyle = '#ff3333'
    ctx.font = 'bold 42px "Share Tech Mono", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('GAME OVER', cx, cy - 40)

    ctx.shadowBlur = 15
    ctx.fillStyle = '#ff8c00'
    ctx.font = 'bold 20px "Share Tech Mono", monospace'
    ctx.fillText(`FINAL SCORE`, cx, cy + 10)

    ctx.shadowColor = '#ffffff'
    ctx.shadowBlur = 10
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 32px "Share Tech Mono", monospace'
    ctx.fillText(`${this.gameState.score}`, cx, cy + 50)

    ctx.shadowColor = '#00d4ff'
    ctx.fillStyle = '#00d4ff'
    ctx.font = '14px "Share Tech Mono", monospace'
    ctx.fillText(`Wave: ${this.gameState.wave}  |  Kills: ${this.gameState.kills}`, cx, cy + 85)

    ctx.restore()
  }

  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (result) {
      return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    }
    return '255, 255, 255'
  }
}