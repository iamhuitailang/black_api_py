import { GAME_CONFIG } from '../constants/gameConfig.js'

export function calculateGravityForce(body, planets) {
  let fx = 0
  let fy = 0
  const G = GAME_CONFIG.GRAVITY.coefficient
  
  for (const planet of planets) {
    const dx = planet.x - body.x
    const dy = planet.y - body.y
    const distSq = dx * dx + dy * dy
    const dist = Math.sqrt(distSq)
    
    if (dist < planet.radius + (body.size || body.radius || 10)) {
      continue
    }
    
    const force = G / distSq
    fx += (dx / dist) * force
    fy += (dy / dist) * force
  }
  
  return { fx, fy }
}

export function drawGravityField(ctx, planets, width, height) {
  const resolution = 30
  const G = GAME_CONFIG.GRAVITY.coefficient * 100
  
  ctx.save()
  ctx.globalAlpha = 0.15
  
  for (let x = 0; x < width; x += resolution) {
    for (let y = 0; y < height; y += resolution) {
      let totalForce = 0
      
      for (const planet of planets) {
        const dx = planet.x - x
        const dy = planet.y - y
        const distSq = dx * dx + dy * dy
        const dist = Math.sqrt(distSq)
        
        if (dist < planet.radius) continue
        
        totalForce += G / distSq
      }
      
      const intensity = Math.min(totalForce, 1)
      if (intensity > 0.05) {
        ctx.fillStyle = `rgba(100, 150, 255, ${intensity * 0.3})`
        ctx.fillRect(x - resolution / 2, y - resolution / 2, resolution, resolution)
      }
    }
  }
  
  ctx.restore()
}

export function checkPlanetCollision(body, planets) {
  for (const planet of planets) {
    const dx = body.x - planet.x
    const dy = body.y - planet.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const bodyRadius = body.size || body.radius || 10
    
    if (dist < planet.radius + bodyRadius) {
      return { collided: true, planet }
    }
  }
  return { collided: false, planet: null }
}
