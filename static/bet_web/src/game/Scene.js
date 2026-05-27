import { GAME_CONFIG, SCENE_CONFIGS } from './constants'

export class Scene {
  constructor(sceneName = 'space') {
    this.sceneName = sceneName
    this.config = SCENE_CONFIGS[sceneName] || SCENE_CONFIGS.space
    this.particles = []
    this.initBackgroundElements()
  }

  initBackgroundElements() {
    this.particles = []
    
    if (this.config.stars) {
      for (let i = 0; i < 100; i++) {
        this.particles.push({
          x: Math.random() * GAME_CONFIG.CANVAS_WIDTH,
          y: Math.random() * GAME_CONFIG.CANVAS_HEIGHT,
          size: Math.random() * 2 + 1,
          speed: Math.random() * 0.5 + 0.1,
          opacity: Math.random() * 0.5 + 0.5,
          type: 'star'
        })
      }
    }
    
    if (this.config.buildings) {
      this.buildings = []
      for (let i = 0; i < 15; i++) {
        this.buildings.push({
          x: i * 90 - 20,
          width: 60 + Math.random() * 40,
          height: 100 + Math.random() * 200,
          color: `hsl(${240 + Math.random() * 30}, 30%, ${15 + Math.random() * 15}%)`
        })
      }
    }
    
    if (this.config.clouds) {
      for (let i = 0; i < 5; i++) {
        this.particles.push({
          x: Math.random() * GAME_CONFIG.CANVAS_WIDTH,
          y: 50 + Math.random() * 150,
          size: 40 + Math.random() * 60,
          speed: Math.random() * 0.3 + 0.1,
          opacity: Math.random() * 0.3 + 0.2,
          type: 'cloud'
        })
      }
    }
  }

  setScene(sceneName) {
    this.sceneName = sceneName
    this.config = SCENE_CONFIGS[sceneName] || SCENE_CONFIGS.space
    this.initBackgroundElements()
  }

  update() {
    for (const particle of this.particles) {
      particle.x -= particle.speed
      
      if (particle.x < -100) {
        particle.x = GAME_CONFIG.CANVAS_WIDTH + 100
        if (particle.type === 'star') {
          particle.y = Math.random() * GAME_CONFIG.CANVAS_HEIGHT
        }
      }
    }
  }

  draw(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.CANVAS_HEIGHT)
    gradient.addColorStop(0, this.config.backgroundColor)
    gradient.addColorStop(1, this.darkenColor(this.config.backgroundColor, 30))
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT)
    
    for (const particle of this.particles) {
      if (particle.type === 'star') {
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
      } else if (particle.type === 'cloud') {
        ctx.fillStyle = `rgba(200, 180, 150, ${particle.opacity})`
        this.drawCloud(ctx, particle.x, particle.y, particle.size)
      }
    }
    
    if (this.config.buildings && this.buildings) {
      for (const building of this.buildings) {
        ctx.fillStyle = building.color
        ctx.fillRect(
          building.x, 
          GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GROUND_HEIGHT - building.height,
          building.width,
          building.height
        )
        
        ctx.fillStyle = '#ffeb3b'
        for (let row = 0; row < Math.floor(building.height / 30); row++) {
          for (let col = 0; col < Math.floor(building.width / 20); col++) {
            if (Math.random() > 0.3) {
              ctx.fillRect(
                building.x + 5 + col * 20,
                GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GROUND_HEIGHT - building.height + 10 + row * 30,
                10,
                15
              )
            }
          }
        }
      }
    }
    
    ctx.fillStyle = this.config.groundColor
    ctx.fillRect(0, GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GROUND_HEIGHT, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.GROUND_HEIGHT)
    
    ctx.strokeStyle = this.config.accentColor
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GROUND_HEIGHT)
    ctx.lineTo(GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GROUND_HEIGHT)
    ctx.stroke()
  }

  drawCloud(ctx, x, y, size) {
    ctx.beginPath()
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2)
    ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.4, 0, Math.PI * 2)
    ctx.arc(x + size * 0.8, y, size * 0.45, 0, Math.PI * 2)
    ctx.arc(x + size * 0.4, y + size * 0.1, size * 0.35, 0, Math.PI * 2)
    ctx.fill()
  }

  darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = Math.max(0, (num >> 16) - amt)
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt)
    const B = Math.max(0, (num & 0x0000FF) - amt)
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
  }
}
