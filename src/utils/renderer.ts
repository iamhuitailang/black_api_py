
import { GAME_CONFIG, CHARACTERS } from '../data/characters'
import type { PlayerState } from '../composables/useCharacter'
import type { Particle } from '../composables/useGameEngine'

const GROUND_Y = GAME_CONFIG.GROUND_Y

export function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // 天空渐变
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y)
  sky.addColorStop(0, '#0a0e27')
  sky.addColorStop(0.5, '#131a3a')
  sky.addColorStop(1, '#1a2348')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, GROUND_Y)

  // 远景星星
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  for (let i = 0; i < 40; i++) {
    const x = (i * 73) % w
    const y = ((i * 37) % (GROUND_Y - 80)) + 20
    const s = (i % 3 === 0) ? 2 : 1
    ctx.fillRect(x, y, s, s)
  }

  // 地平线光柱
  ctx.strokeStyle = 'rgba(0,212,255,0.15)'
  ctx.lineWidth = 1
  for (let i = 0; i < 8; i++) {
    const x = (i + 1) * (w / 9)
    ctx.beginPath()
    ctx.moveTo(x, GROUND_Y)
    ctx.lineTo(x, 60)
    ctx.stroke()
  }

  // 地面
  const ground = ctx.createLinearGradient(0, GROUND_Y, 0, h)
  ground.addColorStop(0, '#2a1e3a')
  ground.addColorStop(0.4, '#1a1228')
  ground.addColorStop(1, '#0a0612')
  ctx.fillStyle = ground
  ctx.fillRect(0, GROUND_Y, w, h - GROUND_Y)

  // 地面网格线
  ctx.strokeStyle = 'rgba(255,45,85,0.25)'
  ctx.lineWidth = 1
  const gridW = 60
  for (let x = 0; x < w; x += gridW) {
    ctx.beginPath()
    ctx.moveTo(x, GROUND_Y)
    ctx.lineTo(x - 60, h)
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(0,212,255,0.2)'
  for (let y = GROUND_Y + 30; y < h; y += 30) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }

  // 地平线发光
  const lineGrad = ctx.createLinearGradient(0, GROUND_Y - 4, 0, GROUND_Y + 4)
  lineGrad.addColorStop(0, 'rgba(255,45,85,0)')
  lineGrad.addColorStop(0.5, 'rgba(255,45,85,0.7)')
  lineGrad.addColorStop(1, 'rgba(0,212,255,0)')
  ctx.fillStyle = lineGrad
  ctx.fillRect(0, GROUND_Y - 4, w, 8)
}

export function drawStickman(
  ctx: CanvasRenderingContext2D,
  p: PlayerState,
  playerNum: 1 | 2,
  isIdle: boolean
) {
  const char = CHARACTERS[p.characterId]
  const color = char.color
  const baseX = p.x
  const baseY = GROUND_Y
  const f = p.facing

  const playerColor = playerNum === 1 ? '#ff2d55' : '#00d4ff'

  ctx.save()
  ctx.translate(baseX, baseY)

  ctx.save()
  const shadowGrad = ctx.createRadialGradient(0, -2, 0, 0, -2, 36)
  shadowGrad.addColorStop(0, playerColor + '55')
  shadowGrad.addColorStop(0.6, playerColor + '22')
  shadowGrad.addColorStop(1, 'transparent')
  ctx.fillStyle = shadowGrad
  ctx.beginPath()
  ctx.ellipse(0, -2, 36, 8, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  let sway = 0
  if (isIdle && (p.state === 'idle' || p.state === 'walk')) {
    sway = Math.sin(p.idleAnimFrame * 0.06) * 1.2
  }
  ctx.translate(0, sway)

  const hurtFlash = p.hurtTimer > 0 && (p.hurtTimer % 4 < 2)
  const strokeColor = hurtFlash ? '#ffffff' : color

  ctx.strokeStyle = strokeColor
  ctx.fillStyle = strokeColor
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (p.state === 'charge') {
    ctx.save()
    const pulse = 25 + Math.sin(p.idleAnimFrame * 0.3) * 8
    const ringGrad = ctx.createRadialGradient(0, -50, 0, 0, -50, pulse)
    ringGrad.addColorStop(0, 'rgba(255,255,180,0)')
    ringGrad.addColorStop(0.6, 'rgba(255,200,80,0.5)')
    ringGrad.addColorStop(1, 'rgba(255,120,0,0)')
    ctx.fillStyle = ringGrad
    ctx.beginPath()
    ctx.arc(0, -50, pulse, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  ctx.save()
  ctx.scale(f, 1)

  if (p.state === 'knockdown') {
    ctx.rotate(Math.PI / 2.2)
    ctx.translate(0, -15)
  }

  if (p.isBlocking) {
    ctx.save()
    ctx.strokeStyle = 'rgba(100,200,255,0.7)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(16, -50, 30, -Math.PI / 2.5, Math.PI / 2.5)
    ctx.stroke()
    ctx.restore()
  }

  const headR = 14
  const headY = -92
  ctx.beginPath()
  ctx.arc(0, headY, headR, 0, Math.PI * 2)
  ctx.stroke()

  ctx.fillStyle = strokeColor
  ctx.beginPath()
  ctx.arc(5, headY - 2, 2.5, 0, Math.PI * 2)
  ctx.fill()

  if (isIdle && Math.sin(p.idleAnimFrame * 0.015) > 0.92 && p.state === 'idle') {
    ctx.save()
    ctx.fillStyle = '#111'
    ctx.beginPath()
    ctx.ellipse(0, headY + 6, 4, 6, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  } else {
    ctx.beginPath()
    ctx.moveTo(-3, headY + 5)
    ctx.lineTo(3, headY + 5)
    ctx.stroke()
  }

  const shoulderY = headY + headR
  const hipY = -35
  ctx.beginPath()
  ctx.moveTo(0, shoulderY)
  ctx.lineTo(0, hipY)
  ctx.stroke()

  let legSwing = 0
  if (p.state === 'walk') {
    legSwing = Math.sin(p.idleAnimFrame * 0.35) * 12
  }
  ctx.beginPath()
  ctx.moveTo(0, hipY)
  ctx.lineTo(-10 + legSwing, 0)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(0, hipY)
  ctx.lineTo(10 - legSwing, 0)
  ctx.stroke()

  if (p.state === 'attack' && p.attackFrame <= 8 && p.attackFrame > 0) {
    ctx.beginPath()
    ctx.moveTo(0, shoulderY + 6)
    ctx.lineTo(42, shoulderY + 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(42, shoulderY + 2, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(0, shoulderY + 6)
    ctx.lineTo(-14, shoulderY + 16)
    ctx.stroke()
  } else if (p.state === 'special') {
    const spExt = 48 + Math.sin(p.idleAnimFrame * 0.6) * 6
    ctx.beginPath()
    ctx.moveTo(0, shoulderY + 6)
    ctx.lineTo(spExt, shoulderY - 6)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(spExt, shoulderY - 6, 9, 0, Math.PI * 2)
    ctx.fill()
    ctx.save()
    ctx.strokeStyle = color
    ctx.globalAlpha = 0.5
    ctx.lineWidth = 2
    for (let t = 0; t < 5; t++) {
      const off = t * 10
      ctx.beginPath()
      ctx.arc(spExt - off, shoulderY - 6, 9 + t * 2, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.restore()
    ctx.beginPath()
    ctx.moveTo(0, shoulderY + 6)
    ctx.lineTo(-18, shoulderY + 20)
    ctx.stroke()
  } else if (p.state === 'hurt') {
    ctx.beginPath()
    ctx.moveTo(0, shoulderY + 6)
    ctx.lineTo(-20, shoulderY - 8)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, shoulderY + 6)
    ctx.lineTo(-14, shoulderY + 22)
    ctx.stroke()
  } else if (p.isBlocking) {
    ctx.beginPath()
    ctx.moveTo(0, shoulderY + 6)
    ctx.lineTo(18, shoulderY - 10)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, shoulderY + 6)
    ctx.lineTo(22, shoulderY + 14)
    ctx.stroke()
  } else {
    let armSwing = 0
    if (p.state === 'walk') armSwing = Math.sin(p.idleAnimFrame * 0.35) * 8
    ctx.beginPath()
    ctx.moveTo(0, shoulderY + 6)
    ctx.lineTo(16 - armSwing, shoulderY + 24)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, shoulderY + 6)
    ctx.lineTo(-14 + armSwing, shoulderY + 22)
    ctx.stroke()
  }

  ctx.restore()

  ctx.save()
  ctx.fillStyle = playerColor
  ctx.font = 'bold 10px VT323, monospace'
  ctx.textAlign = 'center'
  ctx.fillText('P' + playerNum, 0, -134)
  ctx.fillStyle = color
  ctx.font = 'bold 12px VT323, monospace'
  ctx.fillText(char.name, 0, -120)
  ctx.restore()

  ctx.restore()
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const pt of particles) {
    const alpha = Math.max(0, pt.life / pt.maxLife)
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = pt.color
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, pt.size * alpha, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

export function drawEffects(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  flashColor: string | null,
  flashAlpha: number,
  shake: number
) {
  if (flashColor && flashAlpha > 0.02) {
    ctx.save()
    ctx.globalAlpha = Math.min(1, flashAlpha)
    ctx.fillStyle = flashColor
    ctx.fillRect(0, 0, w, h)
    ctx.restore()
  }
}

export function applyShake(ctx: CanvasRenderingContext2D, shake: number) {
  if (shake > 0.1) {
    const sx = (Math.random() - 0.5) * shake * 2
    const sy = (Math.random() - 0.5) * shake * 2
    ctx.translate(sx, sy)
  }
}
