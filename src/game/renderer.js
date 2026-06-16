export class GameRenderer {
  constructor(ctx, width, height) {
    this.ctx = ctx
    this.width = width
    this.height = height
    this.stars = this.generateStars(100)
  }

  generateStars(count) {
    const stars = []
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.5 + 0.5,
        twinkleSpeed: Math.random() * 0.02 + 0.01
      })
    }
    return stars
  }

  clear(bgColor = '#0a0a1a') {
    this.ctx.fillStyle = bgColor
    this.ctx.fillRect(0, 0, this.width, this.height)
  }

  drawStars(time) {
    for (const star of this.stars) {
      const twinkle = Math.sin(time * star.twinkleSpeed) * 0.3 + 0.7
      this.ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * twinkle})`
      this.ctx.beginPath()
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
      this.ctx.fill()
    }
  }

  drawPlanets(planets, time) {
    for (const planet of planets) {
      const gradient = this.ctx.createRadialGradient(
        planet.x - planet.radius * 0.3,
        planet.y - planet.radius * 0.3,
        0,
        planet.x,
        planet.y,
        planet.radius
      )
      gradient.addColorStop(0, this.lightenColor(planet.color, 30))
      gradient.addColorStop(1, this.darkenColor(planet.color, 30))
      
      this.ctx.fillStyle = gradient
      this.ctx.beginPath()
      this.ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2)
      this.ctx.fill()
      
      this.ctx.strokeStyle = `rgba(100, 150, 255, 0.2)`
      this.ctx.lineWidth = 1
      for (let i = 1; i <= 3; i++) {
        this.ctx.beginPath()
        this.ctx.arc(planet.x, planet.y, planet.radius + i * 30, 0, Math.PI * 2)
        this.ctx.stroke()
      }
    }
  }

  drawShip(ship) {
    this.ctx.save()
    this.ctx.translate(ship.x, ship.y)
    this.ctx.rotate(ship.angle)
    
    if (ship.thrusting) {
      const flameLength = 15 + Math.random() * 8
      const gradient = this.ctx.createLinearGradient(-ship.size, 0, -ship.size - flameLength, 0)
      gradient.addColorStop(0, 'rgba(255, 200, 50, 1)')
      gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.8)')
      gradient.addColorStop(1, 'rgba(255, 50, 0, 0)')
      
      this.ctx.fillStyle = gradient
      this.ctx.beginPath()
      this.ctx.moveTo(-ship.size + 2, -6)
      this.ctx.lineTo(-ship.size - flameLength, 0)
      this.ctx.lineTo(-ship.size + 2, 6)
      this.ctx.closePath()
      this.ctx.fill()
    }
    
    this.ctx.fillStyle = '#4a9eff'
    this.ctx.strokeStyle = '#2a6ecc'
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    this.ctx.moveTo(ship.size, 0)
    this.ctx.lineTo(-ship.size, -ship.size * 0.7)
    this.ctx.lineTo(-ship.size * 0.6, 0)
    this.ctx.lineTo(-ship.size, ship.size * 0.7)
    this.ctx.closePath()
    this.ctx.fill()
    this.ctx.stroke()
    
    this.ctx.fillStyle = '#7ec8e3'
    this.ctx.beginPath()
    this.ctx.arc(ship.size * 0.2, 0, 4, 0, Math.PI * 2)
    this.ctx.fill()
    
    this.ctx.restore()
    
    if (ship.pickRadiusBonus > 0) {
      this.ctx.strokeStyle = 'rgba(74, 158, 255, 0.3)'
      this.ctx.lineWidth = 1
      this.ctx.setLineDash([3, 3])
      this.ctx.beginPath()
      this.ctx.arc(ship.x, ship.y, 20 + ship.pickRadiusBonus, 0, Math.PI * 2)
      this.ctx.stroke()
      this.ctx.setLineDash([])
    }
  }

  drawDebris(debrisList) {
    for (const debris of debrisList) {
      if (debris.collected) continue
      
      this.ctx.save()
      this.ctx.translate(debris.x, debris.y)
      this.ctx.rotate(debris.rotation)
      
      if (debris.type.isDangerous) {
        const blink = debris.isBlinking() ? 1 : 0.4
        this.ctx.fillStyle = `rgba(255, 50, 50, ${blink})`
        this.ctx.strokeStyle = `rgba(255, 100, 100, ${blink})`
        
        this.ctx.lineWidth = 2
        this.ctx.beginPath()
        const spikes = 6
        for (let i = 0; i < spikes; i++) {
          const angle = (i / spikes) * Math.PI * 2
          const innerR = debris.radius * 0.5
          const outerR = debris.radius
          const x1 = Math.cos(angle) * outerR
          const y1 = Math.sin(angle) * outerR
          const x2 = Math.cos(angle + Math.PI / spikes) * innerR
          const y2 = Math.sin(angle + Math.PI / spikes) * innerR
          if (i === 0) {
            this.ctx.moveTo(x1, y1)
          } else {
            this.ctx.lineTo(x1, y1)
          }
          this.ctx.lineTo(x2, y2)
        }
        this.ctx.closePath()
        this.ctx.fill()
        this.ctx.stroke()
      } else if (debris.type.isRare) {
        const glow = Math.sin(debris.blinkPhase * 2) * 0.3 + 0.7
        
        this.ctx.shadowColor = '#ffd700'
        this.ctx.shadowBlur = 10 * glow
        
        this.ctx.fillStyle = '#ffd700'
        this.ctx.strokeStyle = '#ffec8b'
        this.ctx.lineWidth = 1.5
        
        this.ctx.beginPath()
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 - Math.PI / 2
          const x = Math.cos(angle) * debris.radius
          const y = Math.sin(angle) * debris.radius
          if (i === 0) this.ctx.moveTo(x, y)
          else this.ctx.lineTo(x, y)
        }
        this.ctx.closePath()
        this.ctx.fill()
        this.ctx.stroke()
        
        this.ctx.shadowBlur = 0
      } else {
        this.ctx.fillStyle = debris.type.color
        this.ctx.strokeStyle = this.lightenColor(debris.type.color, 20)
        this.ctx.lineWidth = 1
        
        this.ctx.beginPath()
        if (debris.type.id === 'small_screw') {
          this.ctx.arc(0, 0, debris.radius, 0, Math.PI * 2)
          this.ctx.fill()
          this.ctx.stroke()
          this.ctx.fillStyle = this.darkenColor(debris.type.color, 20)
          this.ctx.fillRect(-1, -debris.radius - 2, 2, 4)
        } else if (debris.type.id === 'medium_panel') {
          this.ctx.fillRect(-debris.radius, -debris.radius * 0.6, debris.radius * 2, debris.radius * 1.2)
          this.ctx.strokeRect(-debris.radius, -debris.radius * 0.6, debris.radius * 2, debris.radius * 1.2)
        } else if (debris.type.id === 'large_wreck') {
          this.ctx.beginPath()
          this.ctx.moveTo(-debris.radius, 0)
          this.ctx.lineTo(-debris.radius * 0.5, -debris.radius * 0.8)
          this.ctx.lineTo(debris.radius * 0.7, -debris.radius * 0.6)
          this.ctx.lineTo(debris.radius, debris.radius * 0.3)
          this.ctx.lineTo(debris.radius * 0.3, debris.radius * 0.9)
          this.ctx.lineTo(-debris.radius * 0.6, debris.radius * 0.7)
          this.ctx.closePath()
          this.ctx.fill()
          this.ctx.stroke()
        } else {
          this.ctx.arc(0, 0, debris.radius, 0, Math.PI * 2)
          this.ctx.fill()
          this.ctx.stroke()
        }
      }
      
      this.ctx.restore()
    }
  }

  drawPickupEffect(x, y, color, progress) {
    const size = 20 + progress * 30
    const alpha = 1 - progress
    
    this.ctx.save()
    this.ctx.strokeStyle = color
    this.ctx.globalAlpha = alpha
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    this.ctx.arc(x, y, size, 0, Math.PI * 2)
    this.ctx.stroke()
    this.ctx.restore()
  }

  drawDamageFlash(intensity) {
    this.ctx.fillStyle = `rgba(255, 0, 0, ${intensity * 0.3})`
    this.ctx.fillRect(0, 0, this.width, this.height)
  }

  lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = Math.min(255, (num >> 16) + amt)
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt)
    const B = Math.min(255, (num & 0x0000FF) + amt)
    return `rgb(${R}, ${G}, ${B})`
  }

  darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = Math.max(0, (num >> 16) - amt)
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt)
    const B = Math.max(0, (num & 0x0000FF) - amt)
    return `rgb(${R}, ${G}, ${B})`
  }

  resize(width, height) {
    this.width = width
    this.height = height
    this.stars = this.generateStars(100)
  }
}
