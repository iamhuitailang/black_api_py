import Matter from 'matter-js'
import type { GadgetConfig } from './types'

const { Engine, Render, Runner, Bodies, Body, Composite, Events, Constraint, Vector } = Matter

export interface EngineCallbacks {
  onGadgetTriggered: (gadgetType: string, baseScore: number, x: number, y: number) => void
  onBallLost: () => void
  onGameOver: () => void
  onMultiplierActivated: (durationSec: number) => void
  onSplitterActivated: (durationSec: number) => void
}

export class PinballEngine {
  private canvas: HTMLCanvasElement
  private engine: Matter.Engine
  private render: Matter.Render
  private runner: Matter.Runner
  private world: Matter.World
  private callbacks: EngineCallbacks

  private leftFlipper!: Matter.Body
  private rightFlipper!: Matter.Body
  private spring!: Matter.Body
  private springBase!: Matter.Body
  private balls: Matter.Body[] = []
  private gadgets: { body: Matter.Body; config: GadgetConfig }[] = []
  private rotators: { body: Matter.Body; config: GadgetConfig; angle: number }[] = []
  private portalMap: Map<string, Matter.Body> = new Map()

  private isLeftFlipperActive = false
  private isRightFlipperActive = false
  private readonly flipperSpeed = 0.35

  private isChargingSpring = false
  private springPower = 0
  private readonly maxSpringPower = 25
  private readonly chargeSpeed = 0.5

  private isPlaying = false
  private isPaused = false
  private ballsLeft = 5
  private totalBalls = 5

  private readonly gameWidth = 400
  private readonly gameHeight = 711
  private readonly ballRadius = 10

  private particles: Array<{
    x: number
    y: number
    vx: number
    vy: number
    life: number
    maxLife: number
    color: string
    size: number
  }> = []

  private trailBalls: Map<string, Array<{ x: number; y: number; alpha: number }>> = new Map()

  private animationFrameId: number | null = null
  private launchCount = 0
  private triggeredGadgetTypes: Set<string> = new Set()

  private multiplierActive = false
  private multiplierEndTime = 0
  private splitterActive = false
  private splitterEndTime = 0

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas
    this.callbacks = callbacks

    this.engine = Engine.create({
      gravity: { x: 0, y: 1, scale: 0.002 },
    })
    this.world = this.engine.world

    this.render = Render.create({
      canvas: canvas,
      engine: this.engine,
      options: {
        width: this.gameWidth,
        height: this.gameHeight,
        wireframes: false,
        background: 'transparent',
        pixelRatio: window.devicePixelRatio || 1,
      },
    })

    this.runner = Runner.create()

    this.initWalls()
    this.initFlippers()
    this.initSpring()
    this.setupCollisionHandler()
    this.setupKeyboard()
  }

  private initWalls() {
    const wallThickness = 20
    const w = this.gameWidth
    const h = this.gameHeight

    const leftWall = Bodies.rectangle(wallThickness / 2, h / 2, wallThickness, h, {
      isStatic: true,
      render: { fillStyle: '#00d4ff' },
      label: 'wall_left',
    })

    const rightWall = Bodies.rectangle(w - wallThickness / 2, h / 2, wallThickness, h, {
      isStatic: true,
      render: { fillStyle: '#00d4ff' },
      label: 'wall_right',
    })

    const topWall = Bodies.rectangle(w / 2, wallThickness / 2, w, wallThickness, {
      isStatic: true,
      render: { fillStyle: '#00d4ff' },
      label: 'wall_top',
    })

    const drainY = h - 30
    const drainWidth = 120

    const leftDrain = Bodies.rectangle(drainWidth / 2, drainY, drainWidth, wallThickness, {
      isStatic: true,
      angle: 0.35,
      render: { fillStyle: '#ff0066' },
      label: 'drain_left',
    })

    const rightDrain = Bodies.rectangle(w - drainWidth / 2, drainY, drainWidth, wallThickness, {
      isStatic: true,
      angle: -0.35,
      render: { fillStyle: '#ff0066' },
      label: 'drain_right',
    })

    Composite.add(this.world, [leftWall, rightWall, topWall, leftDrain, rightDrain])

    const drainSensor = Bodies.rectangle(w / 2, h + 30, w, 60, {
      isStatic: true,
      isSensor: true,
      label: 'drain_sensor',
      render: { visible: false },
    })
    Composite.add(this.world, drainSensor)
  }

  private initFlippers() {
    const flipperWidth = 70
    const flipperHeight = 14
    const flipperY = this.gameHeight - 100
    const centerX = this.gameWidth / 2
    const pivotOffset = flipperWidth / 2 - 6

    this.leftFlipper = Bodies.rectangle(centerX - 70, flipperY, flipperWidth, flipperHeight, {
      density: 0.01,
      restitution: 0.5,
      render: { fillStyle: '#00ff88' },
      label: 'flipper_left',
    })

    this.rightFlipper = Bodies.rectangle(centerX + 70, flipperY, flipperWidth, flipperHeight, {
      density: 0.01,
      restitution: 0.5,
      render: { fillStyle: '#00ff88' },
      label: 'flipper_right',
    })

    const leftConstraint = Constraint.create({
      pointA: { x: centerX - 70 - pivotOffset, y: flipperY },
      bodyB: this.leftFlipper,
      pointB: { x: -pivotOffset, y: 0 },
      stiffness: 0.95,
      length: 0,
      render: { visible: false },
    })

    const rightConstraint = Constraint.create({
      pointA: { x: centerX + 70 + pivotOffset, y: flipperY },
      bodyB: this.rightFlipper,
      pointB: { x: pivotOffset, y: 0 },
      stiffness: 0.95,
      length: 0,
      render: { visible: false },
    })

    Composite.add(this.world, [
      this.leftFlipper,
      this.rightFlipper,
      leftConstraint,
      rightConstraint,
    ])
  }

  private initSpring() {
    const springX = this.gameWidth - 42
    const springY = this.gameHeight - 220
    const springWidth = 22
    const springHeight = 90

    this.springBase = Bodies.rectangle(springX, springY + springHeight / 2 + 25, springWidth + 8, 18, {
      isStatic: true,
      render: { fillStyle: '#555' },
      label: 'spring_base',
    })

    this.spring = Bodies.rectangle(springX, springY, springWidth, springHeight, {
      isStatic: true,
      render: { fillStyle: '#ff6600' },
      label: 'spring',
    })

    const launchTubeLeft = Bodies.rectangle(springX - 28, springY - 90, 5, 240, {
      isStatic: true,
      render: { fillStyle: '#3a3a5e' },
      label: 'launch_tube_left',
    })

    const launchTubeRight = Bodies.rectangle(springX + 28, springY - 90, 5, 240, {
      isStatic: true,
      render: { fillStyle: '#3a3a5e' },
      label: 'launch_tube_right',
    })

    Composite.add(this.world, [
      this.spring,
      this.springBase,
      launchTubeLeft,
      launchTubeRight,
    ])
  }

  private setupCollisionHandler() {
    Events.on(this.engine, 'collisionStart', (event) => {
      const pairs = event.pairs

      for (const pair of pairs) {
        const { bodyA, bodyB } = pair

        if (bodyA.label === 'drain_sensor' || bodyB.label === 'drain_sensor') {
          const ballBody = bodyA.label?.startsWith('ball_') ? bodyA : bodyB
          if (ballBody.label?.startsWith('ball_')) {
            this.handleBallDrain(ballBody as Matter.Body)
          }
          continue
        }

        for (const gadget of this.gadgets) {
          if (bodyA === gadget.body || bodyB === gadget.body) {
            const ballBody = bodyA === gadget.body ? bodyB : bodyA
            if (ballBody.label?.startsWith('ball_')) {
              this.handleGadgetCollision(gadget, ballBody as Matter.Body)
            }
          }
        }
      }
    })
  }

  private handleBallDrain(ballBody: Matter.Body) {
    Composite.remove(this.world, ballBody)
    this.balls = this.balls.filter((b) => b !== ballBody)
    this.trailBalls.delete(ballBody.label || '')

    if (this.balls.length === 0) {
      this.ballsLeft--
      this.callbacks.onBallLost()

      if (this.ballsLeft <= 0) {
        this.isPlaying = false
        this.callbacks.onGameOver()
      }
    }
  }

  private handleGadgetCollision(gadget: { body: Matter.Body; config: GadgetConfig }, ball: Matter.Body) {
    const { type, score: baseScore } = gadget.config
    const { x, y } = ball.position

    const alreadyTriggered = this.triggeredGadgetTypes.has(type)
    this.triggeredGadgetTypes.add(type)

    switch (type) {
      case 'bumper':
        this.applyBumperForce(gadget, ball)
        break
      case 'accelerator':
        this.applyAccelerator(gadget, ball)
        break
      case 'portal_in':
        this.handlePortalTeleport(gadget, ball)
        break
      case 'multiplier':
        this.handleMultiplierPickup(gadget)
        break
      case 'splitter':
        this.handleSplitterPickup(gadget, ball)
        break
    }

    if (baseScore > 0) {
      this.callbacks.onGadgetTriggered(type, baseScore, x, y)
    }

    this.spawnParticles(x, y, gadget.config.color || '#00ff88', 10)
  }

  private applyBumperForce(gadget: { body: Matter.Body; config: GadgetConfig }, ball: Matter.Body) {
    const force = gadget.config.force || 15
    const direction = Vector.normalise(Vector.sub(ball.position, gadget.body.position))
    Body.setVelocity(ball, Vector.mult(direction, force))
  }

  private applyAccelerator(gadget: { body: Matter.Body; config: GadgetConfig }, ball: Matter.Body) {
    const speedBoost = gadget.config.speedBoost || 1.5
    const angle = gadget.config.angle || gadget.position.angle || 0

    const boostVec = Vector.rotate({ x: speedBoost * 3, y: -3 }, angle)
    Body.setVelocity(ball, Vector.add(ball.velocity, boostVec))
  }

  private handlePortalTeleport(gadget: { body: Matter.Body; config: GadgetConfig }, ball: Matter.Body) {
    const targetId = gadget.config.targetId
    const targetPortal = this.portalMap.get(targetId)

    if (targetPortal) {
      const outPos = targetPortal.position
      const speed = Vector.magnitude(ball.velocity)
      const angle = Math.random() * Math.PI * 2
      const newVel = {
        x: Math.cos(angle) * speed * 0.7,
        y: -Math.abs(Math.sin(angle) * speed) - 4,
      }

      Body.setPosition(ball, { x: outPos.x, y: outPos.y - 25 })
      Body.setVelocity(ball, newVel)
      this.spawnParticles(outPos.x, outPos.y, '#aa00ff', 15)
    }
  }

  private handleMultiplierPickup(gadget: { body: Matter.Body; config: GadgetConfig }) {
    const duration = gadget.config.duration || 3
    this.multiplierActive = true
    this.multiplierEndTime = Date.now() + duration * 1000
    this.callbacks.onMultiplierActivated(duration)
  }

  private handleSplitterPickup(gadget: { body: Matter.Body; config: GadgetConfig }, ball: Matter.Body) {
    const duration = gadget.config.duration || 5
    this.splitterActive = true
    this.splitterEndTime = Date.now() + duration * 1000
    this.callbacks.onSplitterActivated(duration)

    if (this.balls.length < 5) {
      const newBall = this.createBall(ball.position.x + 12, ball.position.y - 8)
      Body.setVelocity(newBall, { x: 2.5, y: -4 })
    }
  }

  private setupKeyboard() {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (this.isPaused) return

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.isLeftFlipperActive = true
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.isRightFlipperActive = true
      }
      if (e.code === 'Space') {
        e.preventDefault()
        if (!this.isChargingSpring && this.balls.length < 3 && this.ballsLeft > 0) {
          this.isChargingSpring = true
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.isLeftFlipperActive = false
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.isRightFlipperActive = false
      }
      if (e.code === 'Space') {
        e.preventDefault()
        if (this.isChargingSpring) {
          this.launchBall()
        }
        this.isChargingSpring = false
        this.springPower = 0
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
  }

  private createBall(x: number, y: number): Matter.Body {
    const ball = Bodies.circle(x, y, this.ballRadius, {
      restitution: 0.7,
      friction: 0.005,
      density: 0.002,
      label: `ball_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      render: {
        fillStyle: '#e8e8e8',
        strokeStyle: '#ffffff',
        lineWidth: 2,
      },
    })

    Composite.add(this.world, ball)
    this.balls.push(ball)
    this.trailBalls.set(ball.label || '', [])

    return ball
  }

  private launchBall() {
    if (!this.isPlaying || this.ballsLeft <= 0) return
    if (this.balls.length >= 3) return

    const ball = this.createBall(this.gameWidth - 42, this.gameHeight - 320)
    const power = Math.max(this.springPower, 8)

    Body.setVelocity(ball, { x: -1.5, y: -power - 8 })
    this.launchCount++

    this.spring.position.y = this.springBase.position.y - 65
  }

  public setGadgets(configs: GadgetConfig[]) {
    for (const gadget of this.gadgets) {
      Composite.remove(this.world, gadget.body)
    }
    this.gadgets = []
    this.rotators = []
    this.portalMap.clear()

    const portalOuts: { body: Matter.Body; config: GadgetConfig }[] = []

    for (const config of configs) {
      const { type, position, config: cfg } = config
      let body: Matter.Body | null = null

      switch (type) {
        case 'bumper':
          body = Bodies.circle(position.x, position.y, cfg.radius || 25, {
            isStatic: true,
            restitution: 1.3,
            render: { fillStyle: cfg.color || '#ff00ff' },
            label: `gadget_${type}_${config.id}`,
          })
          break

        case 'accelerator':
          body = Bodies.rectangle(position.x, position.y, cfg.width || 80, cfg.height || 15, {
            isStatic: true,
            isSensor: true,
            angle: position.angle || 0,
            render: { fillStyle: cfg.color || '#00ff88' },
            label: `gadget_${type}_${config.id}`,
          })
          break

        case 'rotator':
          body = Bodies.rectangle(position.x, position.y, cfg.length || 80, 8, {
            isStatic: true,
            render: { fillStyle: cfg.color || '#ffaa00' },
            label: `gadget_${type}_${config.id}`,
          })
          this.rotators.push({ body, config, angle: 0 })
          break

        case 'portal_in':
          body = Bodies.circle(position.x, position.y, cfg.radius || 20, {
            isStatic: true,
            isSensor: true,
            render: { fillStyle: cfg.color || '#ff00aa' },
            label: `gadget_${type}_${config.id}`,
          })
          break

        case 'portal_out':
          body = Bodies.circle(position.x, position.y, cfg.radius || 20, {
            isStatic: true,
            isSensor: true,
            render: { fillStyle: cfg.color || '#aa00ff' },
            label: `gadget_${type}_${config.id}`,
          })
          portalOuts.push({ body, config })
          break

        case 'multiplier':
        case 'splitter':
          body = Bodies.circle(position.x, position.y, cfg.radius || 22, {
            isStatic: true,
            isSensor: true,
            render: { fillStyle: cfg.color || '#ffff00' },
            label: `gadget_${type}_${config.id}`,
          })
          break
      }

      if (body) {
        this.gadgets.push({ body, config })
        Composite.add(this.world, body)
      }
    }

    for (const gadget of this.gadgets) {
      if (gadget.config.type === 'portal_in') {
        const targetId = gadget.config.config.targetId
        const outPortal = portalOuts.find((p) => p.config.config.portalId === targetId)
        if (outPortal) {
          this.portalMap.set(targetId, outPortal.body)
        }
      }
    }
  }

  public startGame(totalBalls = 5) {
    this.totalBalls = totalBalls
    this.ballsLeft = totalBalls
    this.isPlaying = true
    this.isPaused = false
    this.launchCount = 0
    this.triggeredGadgetTypes = new Set()
    this.balls = []
    this.multiplierActive = false
    this.splitterActive = false

    Runner.run(this.runner, this.engine)
    this.startRenderLoop()
  }

  public pause() {
    this.isPaused = true
  }

  public resume() {
    this.isPaused = false
  }

  public stop() {
    this.isPlaying = false
    Runner.stop(this.runner)
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  public destroy() {
    this.stop()
    Render.stop(this.render)
    Composite.clear(this.world)
    Engine.clear(this.engine)
  }

  private startRenderLoop() {
    const render = () => {
      this.update()
      this.renderScene()
      this.animationFrameId = requestAnimationFrame(render)
    }
    render()
  }

  private update() {
    if (this.isPaused) return

    if (this.isLeftFlipperActive) {
      Body.setAngularVelocity(this.leftFlipper, -this.flipperSpeed)
    } else {
      Body.setAngularVelocity(this.leftFlipper, this.flipperSpeed * 0.45)
    }

    if (this.isRightFlipperActive) {
      Body.setAngularVelocity(this.rightFlipper, this.flipperSpeed)
    } else {
      Body.setAngularVelocity(this.rightFlipper, -this.flipperSpeed * 0.45)
    }

    if (this.isChargingSpring) {
      this.springPower = Math.min(this.springPower + this.chargeSpeed, this.maxSpringPower)
      const compress = 20 + (this.springPower / this.maxSpringPower) * 35
      this.spring.position.y = this.springBase.position.y - 65 + compress
    }

    for (const rotator of this.rotators) {
      rotator.angle += rotator.config.config.speed || 0.03
      Body.setAngle(rotator.body, rotator.angle)
    }

    this.updateParticles()
    this.updateTrails()

    if (this.multiplierActive && Date.now() > this.multiplierEndTime) {
      this.multiplierActive = false
    }
    if (this.splitterActive && Date.now() > this.splitterEndTime) {
      this.splitterActive = false
    }
  }

  private updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.12
      p.life--
      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }

  private updateTrails() {
    for (const ball of this.balls) {
      const label = ball.label || ''
      const trail = this.trailBalls.get(label) || []
      trail.unshift({ x: ball.position.x, y: ball.position.y, alpha: 1 })
      if (trail.length > 12) {
        trail.pop()
      }
      for (let i = 0; i < trail.length; i++) {
        trail[i].alpha = 1 - i / trail.length
      }
      this.trailBalls.set(label, trail)
    }
  }

  private spawnParticles(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 4 + 1
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 28,
        maxLife: 28,
        color,
        size: Math.random() * 4 + 2,
      })
    }
  }

  private renderScene() {
    const ctx = this.canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, this.gameWidth, this.gameHeight)

    const gradient = ctx.createLinearGradient(0, 0, 0, this.gameHeight)
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(1, '#0f0f1e')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, this.gameWidth, this.gameHeight)

    this.renderTrails(ctx)
    Render.world(this.render)
    this.renderParticles(ctx)
    this.renderGlowEffects(ctx)
  }

  private renderTrails(ctx: CanvasRenderingContext2D) {
    for (const [, trail] of this.trailBalls) {
      for (let i = 0; i < trail.length; i++) {
        const t = trail[i]
        const radius = this.ballRadius * (0.9 - i * 0.06)
        ctx.beginPath()
        ctx.arc(t.x, t.y, Math.max(radius, 2), 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 200, 120, ${t.alpha * 0.25})`
        ctx.fill()
      }
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.globalAlpha = alpha
      ctx.fill()
      ctx.globalAlpha = 1
    }
  }

  private renderGlowEffects(ctx: CanvasRenderingContext2D) {
    for (const gadget of this.gadgets) {
      const { type, config, position } = gadget.config
      if (type === 'bumper' || type === 'multiplier' || type === 'splitter') {
        const radius = config.radius || 25
        const color = config.color || '#ff00ff'

        ctx.save()
        ctx.shadowBlur = 25
        ctx.shadowColor = color
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.8
        ctx.beginPath()
        ctx.arc(position.x, position.y, radius + 6, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }
    }
  }

  public getSpringPower(): number {
    return this.springPower
  }

  public getMaxSpringPower(): number {
    return this.maxSpringPower
  }

  public getLaunchCount(): number {
    return this.launchCount
  }

  public getTriggeredGadgetTypes(): string[] {
    return Array.from(this.triggeredGadgetTypes)
  }

  public getBallsLeft(): number {
    return this.ballsLeft
  }

  public getTotalBalls(): number {
    return this.totalBalls
  }

  public isMultiplierActive(): boolean {
    return this.multiplierActive && Date.now() < this.multiplierEndTime
  }

  public getState(): Record<string, any> {
    const balls = this.balls.map((ball) => ({
      x: ball.position.x,
      y: ball.position.y,
      vx: ball.velocity.x,
      vy: ball.velocity.y,
      angle: ball.angle,
      angularVelocity: ball.angularVelocity,
    }))

    return {
      balls,
      ballsLeft: this.ballsLeft,
      totalBalls: this.totalBalls,
      launchCount: this.launchCount,
      triggeredGadgetTypes: Array.from(this.triggeredGadgetTypes),
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      springPower: this.springPower,
      multiplierActive: this.multiplierActive,
      multiplierEndTime: this.multiplierEndTime,
      splitterActive: this.splitterActive,
      splitterEndTime: this.splitterEndTime,
    }
  }

  public setState(state: Record<string, any>) {
    for (const ball of this.balls) {
      Composite.remove(this.world, ball)
    }
    this.balls = []
    this.trailBalls.clear()

    this.ballsLeft = state.ballsLeft || 5
    this.totalBalls = state.totalBalls || 5
    this.launchCount = state.launchCount || 0
    this.triggeredGadgetTypes = new Set(state.triggeredGadgetTypes || [])
    this.isPlaying = state.isPlaying ?? true
    this.isPaused = state.isPaused ?? false
    this.springPower = state.springPower || 0
    this.multiplierActive = state.multiplierActive || false
    this.multiplierEndTime = state.multiplierEndTime || 0
    this.splitterActive = state.splitterActive || false
    this.splitterEndTime = state.splitterEndTime || 0

    if (state.balls && state.balls.length > 0) {
      for (const ballState of state.balls) {
        const ball = this.createBall(ballState.x, ballState.y)
        Body.setVelocity(ball, { x: ballState.vx, y: ballState.vy })
        Body.setAngle(ball, ballState.angle || 0)
        Body.setAngularVelocity(ball, ballState.angularVelocity || 0)
      }
    }
  }
}
