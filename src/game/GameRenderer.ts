import type { GameState } from './GameEngine'
import { Vector2 } from './utils'

export class GameRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private particles: Particle[] = []
  private snowflakes: Snowflake[] = []

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Cannot get 2d context')
    this.ctx = ctx
    
    this.initSnowflakes()
  }

  private initSnowflakes(): void {
    for (let i = 0; i < 50; i++) {
      this.snowflakes.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: 2 + Math.random() * 4,
        speed: 0.5 + Math.random() * 1.5,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.02 + Math.random() * 0.03
      })
    }
  }

  render(state: GameState, camera: Vector2): void {
    const { ctx, canvas } = this
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    this.drawBackground(state)
    this.drawGround(state, camera)
    
    ctx.save()
    ctx.translate(-camera.x, -camera.y)
    
    this.drawGrid(state, camera)
    this.drawObstacles(state)
    this.drawItems(state)
    this.drawSnowballTrails(state)
    this.drawHamsters(state)
    this.drawSpecialGuest(state)
    
    ctx.restore()
    
    this.drawSnowflakes()
    this.updateParticles()
    this.drawParticles()
  }

  private drawBackground(state: GameState): void {
    const { ctx, canvas } = this
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    
    const colors = state.map.bgGradient
    gradient.addColorStop(0, colors[0])
    gradient.addColorStop(1, colors[1])
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (state.map.weather === 'aurora') {
      this.drawAurora()
    }
  }

  private drawAurora(): void {
    const { ctx, canvas } = this
    const time = Date.now() * 0.0005
    
    for (let i = 0; i < 3; i++) {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.6)
      const hue = (time * 20 + i * 60) % 360
      gradient.addColorStop(0, `hsla(${hue}, 80%, 60%, 0)`)
      gradient.addColorStop(0.5, `hsla(${hue + 30}, 70%, 50%, ${0.15 + Math.sin(time + i) * 0.05})`)
      gradient.addColorStop(1, `hsla(${hue + 60}, 60%, 40%, 0)`)
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.moveTo(0, canvas.height * 0.1)
      
      for (let x = 0; x <= canvas.width; x += 20) {
        const y = canvas.height * 0.2 + 
                  Math.sin(x * 0.01 + time + i) * 30 +
                  Math.sin(x * 0.02 + time * 1.5 + i * 2) * 20
        ctx.lineTo(x, y)
      }
      
      ctx.lineTo(canvas.width, 0)
      ctx.lineTo(0, 0)
      ctx.closePath()
      ctx.fill()
    }
  }

  private drawGround(state: GameState, camera: Vector2): void {
    const { ctx, canvas } = this
    const groundY = 0
    
    ctx.fillStyle = state.map.groundColor
    ctx.fillRect(0, groundY, canvas.width, canvas.height)
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    for (let i = 0; i < 20; i++) {
      const x = ((i * 137 - camera.x * 0.5) % canvas.width + canvas.width) % canvas.width
      const y = 50 + i * 30
      ctx.beginPath()
      ctx.ellipse(x, y, 30 + i * 2, 10, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  private drawGrid(state: GameState, camera: Vector2): void {
    const { ctx } = this
    const gridSize = 100
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 1
    
    const startX = Math.floor(camera.x / gridSize) * gridSize
    const startY = Math.floor(camera.y / gridSize) * gridSize
    const endX = camera.x + this.canvas.width
    const endY = camera.y + this.canvas.height
    
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, camera.y)
      ctx.lineTo(x, endY)
      ctx.stroke()
    }
    
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(camera.x, y)
      ctx.lineTo(endX, y)
      ctx.stroke()
    }
  }

  private drawObstacles(state: GameState): void {
    const { ctx } = this
    
    for (const obstacle of state.obstacles) {
      const x = obstacle.position.x
      const y = obstacle.position.y
      const w = obstacle.width
      const h = obstacle.height
      
      switch (obstacle.type) {
        case 'snowdrift':
          this.drawSnowdrift(x, y, w, h)
          break
        case 'ice_crack':
          this.drawIceCrack(x, y, w, h)
          break
        case 'ice_ramp':
          this.drawIceRamp(x, y, w, h)
          break
        case 'bounce_pad':
          this.drawBouncePad(x, y, w, h, obstacle.animationTime)
          break
        case 'rock':
          this.drawRock(x, y, w, h)
          break
      }
    }
  }

  private drawSnowdrift(x: number, y: number, w: number, h: number): void {
    const { ctx } = this
    const gradient = ctx.createRadialGradient(
      x + w/2, y + h/2, 0,
      x + w/2, y + h/2, Math.max(w, h) / 2
    )
    gradient.addColorStop(0, '#FFFFFF')
    gradient.addColorStop(1, '#E0E8F0')
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.ellipse(x + w/2, y + h/2, w/2, h/2, 0, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.beginPath()
    ctx.ellipse(x + w*0.3, y + h*0.3, w*0.15, h*0.1, -0.5, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawIceCrack(x: number, y: number, w: number, h: number): void {
    const { ctx } = this
    
    ctx.fillStyle = 'rgba(100, 149, 237, 0.3)'
    ctx.fillRect(x, y, w, h)
    
    ctx.strokeStyle = 'rgba(70, 130, 180, 0.6)'
    ctx.lineWidth = 2
    
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.moveTo(x + w * (0.2 + i * 0.15), y)
      ctx.lineTo(x + w * (0.1 + i * 0.2), y + h)
      ctx.stroke()
    }
  }

  private drawIceRamp(x: number, y: number, w: number, h: number): void {
    const { ctx } = this
    
    const gradient = ctx.createLinearGradient(x, y, x + w, y + h)
    gradient.addColorStop(0, 'rgba(135, 206, 250, 0.8)')
    gradient.addColorStop(1, 'rgba(70, 130, 180, 0.6)')
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.moveTo(x, y + h)
    ctx.lineTo(x + w, y)
    ctx.lineTo(x + w, y + h)
    ctx.closePath()
    ctx.fill()
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 1
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.moveTo(x + w * (0.3 + i * 0.2), y + h * 0.7)
      ctx.lineTo(x + w * (0.4 + i * 0.2), y + h * 0.3)
      ctx.stroke()
    }
  }

  private drawBouncePad(x: number, y: number, w: number, h: number, time: number): void {
    const { ctx } = this
    const bounce = Math.sin(time * 0.005) * 3
    
    ctx.fillStyle = '#FF69B4'
    ctx.beginPath()
    ctx.ellipse(x + w/2, y + h/2 + bounce, w/2, h/2, 0, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#FFB6C1'
    ctx.beginPath()
    ctx.ellipse(x + w/2, y + h/3 + bounce, w*0.3, h*0.2, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawRock(x: number, y: number, w: number, h: number): void {
    const { ctx } = this
    
    ctx.fillStyle = '#808080'
    ctx.beginPath()
    ctx.ellipse(x + w/2, y + h/2, w/2, h/2, 0, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#A0A0A0'
    ctx.beginPath()
    ctx.ellipse(x + w*0.35, y + h*0.35, w*0.2, h*0.15, -0.5, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.beginPath()
    ctx.ellipse(x + w/2, y + h*0.1, w*0.3, h*0.08, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawItems(state: GameState): void {
    const { ctx } = this
    
    for (const item of state.items) {
      if (item.collected) continue
      
      const yOffset = item.getYOffset()
      const x = item.position.x
      const y = item.position.y + yOffset
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
      ctx.beginPath()
      ctx.ellipse(x, y + item.radius, item.radius * 0.8, item.radius * 0.3, 0, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.fillStyle = 'rgba(255, 215, 0, 0.3)'
      ctx.beginPath()
      ctx.arc(x, y, item.radius + 5, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.font = `${item.radius * 1.5}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(item.emoji, x, y)
    }
  }

  private drawSnowballTrails(state: GameState): void {
    const { ctx } = this
    const allHamsters = []
    if (state.player) allHamsters.push(state.player)
    for (const { hamster } of state.opponents) {
      allHamsters.push(hamster)
    }
  }

  private drawHamsters(state: GameState): void {
    const allHamsters = []
    if (state.player) allHamsters.push(state.player)
    for (const { hamster } of state.opponents) {
      allHamsters.push(hamster)
    }
    
    allHamsters.sort((a, b) => a.position.y - b.position.y)
    
    for (const hamster of allHamsters) {
      this.drawHamster(hamster)
    }
  }

  private drawHamster(hamster: any): void {
    const { ctx } = this
    const x = hamster.position.x
    const y = hamster.position.y
    const size = 25
    
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(hamster.direction)
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.beginPath()
    ctx.ellipse(0, size * 0.8, size * 0.8, size * 0.3, 0, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = hamster.color
    ctx.beginPath()
    ctx.ellipse(0, 0, size, size * 0.8, 0, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = hamster.bellyColor
    ctx.beginPath()
    ctx.ellipse(0, size * 0.2, size * 0.6, size * 0.5, 0, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = hamster.color
    ctx.beginPath()
    ctx.arc(size * 0.6, -size * 0.3, size * 0.4, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.beginPath()
    ctx.arc(size * 0.8, -size * 0.6, size * 0.15, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(size * 0.4, -size * 0.6, size * 0.15, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#FFB6C1'
    ctx.beginPath()
    ctx.arc(size * 0.8, -size * 0.6, size * 0.08, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(size * 0.4, -size * 0.6, size * 0.08, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#1a1a1a'
    ctx.beginPath()
    ctx.arc(size * 0.75, -size * 0.35, size * 0.08, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(size * 0.55, -size * 0.35, size * 0.08, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(size * 0.78, -size * 0.38, size * 0.03, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(size * 0.58, -size * 0.38, size * 0.03, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#FFB6C1'
    ctx.beginPath()
    ctx.arc(size * 0.9, -size * 0.2, size * 0.08, 0, Math.PI * 2)
    ctx.fill()
    
    if (hamster.hasShield && hamster.hasShield()) {
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(0, 0, size * 1.3, 0, Math.PI * 2)
      ctx.stroke()
      
      ctx.fillStyle = 'rgba(100, 200, 255, 0.2)'
      ctx.beginPath()
      ctx.arc(0, 0, size * 1.3, 0, Math.PI * 2)
      ctx.fill()
    }
    
    ctx.restore()
    
    this.drawSnowball(hamster.snowball, hamster.direction)
    
    if (hamster.isPlayer) {
      const { ctx: c } = this
      c.fillStyle = '#FFD700'
      c.font = 'bold 14px sans-serif'
      c.textAlign = 'center'
      c.fillText('👑 ' + hamster.name, x, y - 40)
    } else {
      const { ctx: c } = this
      c.fillStyle = '#FFFFFF'
      c.font = '12px sans-serif'
      c.textAlign = 'center'
      c.strokeStyle = 'rgba(0,0,0,0.5)'
      c.lineWidth = 3
      c.strokeText(hamster.name, x, y - 35)
      c.fillText(hamster.name, x, y - 35)
    }
  }

  private drawSnowball(snowball: any, direction: number): void {
    const { ctx } = this
    const x = snowball.position.x
    const y = snowball.position.y
    const radius = snowball.getRadius()
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.beginPath()
    ctx.ellipse(x, y + radius * 0.9, radius * 0.9, radius * 0.2, 0, 0, Math.PI * 2)
    ctx.fill()
    
    const gradient = ctx.createRadialGradient(
      x - radius * 0.3, y - radius * 0.3, 0,
      x, y, radius
    )
    gradient.addColorStop(0, '#FFFFFF')
    gradient.addColorStop(0.7, '#F0F8FF')
    gradient.addColorStop(1, '#B0C4DE')
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(snowball.rotation)
    
    ctx.fillStyle = 'rgba(200, 220, 240, 0.5)'
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2
      const dist = radius * 0.5
      ctx.beginPath()
      ctx.arc(
        Math.cos(angle) * dist,
        Math.sin(angle) * dist,
        radius * 0.15,
        0, Math.PI * 2
      )
      ctx.fill()
    }
    
    ctx.restore()
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.beginPath()
    ctx.ellipse(x - radius * 0.3, y - radius * 0.3, radius * 0.25, radius * 0.15, -0.5, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawSpecialGuest(state: GameState): void {
    if (!state.specialGuest || !state.specialGuestActive) return
    
    const { ctx } = this
    const guest = state.specialGuest
    const x = state.map.width / 2
    const y = 100
    
    ctx.font = '50px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(guest.emoji, x, y)
    
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 16px sans-serif'
    ctx.fillText(`✨ ${guest.name} 登场！`, x, y + 40)
  }

  private drawSnowflakes(): void {
    const { ctx, canvas } = this
    
    for (const flake of this.snowflakes) {
      flake.y += flake.speed
      flake.wobble += flake.wobbleSpeed
      flake.x += Math.sin(flake.wobble) * 0.5
      
      if (flake.y > canvas.height) {
        flake.y = -10
        flake.x = Math.random() * canvas.width
      }
      
      ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + flake.size * 0.1})`
      ctx.beginPath()
      ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  addParticle(x: number, y: number, type: string): void {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5 - 2,
        life: 1,
        maxLife: 1,
        size: 3 + Math.random() * 5,
        color: type === 'collect' ? '#FFD700' : '#FFFFFF'
      })
    }
  }

  private updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.1
      p.life -= 0.02
      
      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }

  private drawParticles(): void {
    const { ctx } = this
    
    for (const p of this.particles) {
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      ctx.fill()
    }
    
    ctx.globalAlpha = 1
  }

  resize(width: number, height: number): void {
    this.canvas.width = width
    this.canvas.height = height
  }
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
}

interface Snowflake {
  x: number
  y: number
  size: number
  speed: number
  wobble: number
  wobbleSpeed: number
}
