
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
  isIdle: boolean
) {
  const char = CHARACTERS[p.characterId]
  const color = char.color
  const baseX = p.x
  const baseY = GROUND_Y
  const f = p.facing

  ctx.save()
  ctx.translate(baseX, baseY)

  // 被击倒时旋转
  if (p.state === 'knockdown') {
    ctx.rotate(f * Math.PI / 2.2)
    ctx.translate(0, -15)
  }

  // 待机晃动
  let sway = 0
  if (isIdle && (p.state === 'idle' || p.state === 'walk')) {
    sway = Math.sin(p.idleAnimFrame * 0.06) * 1.2
  }
  ctx.translate(0, sway)

  // 受伤闪烁
  const hurtFlash = p.hurtTimer > 0 && (p.hurtTimer % 4 < 2)
  const strokeColor = hurtFlash ? '#ffffff' : color

  ctx.strokeStyle = strokeColor
  ctx.fillStyle = strokeColor
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // 蓄力光环
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

  // 防御光盾
  if (p.isBlocking) {
    ctx.save()
    ctx.strokeStyle = 'rgba(100,200,255,0.7)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(f * 16, -50, 30, -Math.PI / 2.5, Math.PI / 2.5)
    ctx.stroke()
    ctx.restore()
  }

  // 头
  const headR = 14
  const headY = -92
  ctx.beginPath()
  ctx.arc(0, headY, headR, 0, Math.PI * 2)
  ctx.stroke()

  // 眼睛（方向）
  ctx.fillStyle = strokeColor
  ctx.beginPath()
  ctx.arc(f * 5, headY - 2, 2.5, 0, Math.PI * 2)
  ctx.fill()

  // 待机动画：打哈欠
  if (isIdle && Math.sin(p.idleAnimFrame * 0.015) > 0.92 && p.state === 'idle') {
    ctx.save()
    ctx.fillStyle = '#111'
    ctx.beginPath()
    ctx.ellipse(0, headY + 6, 4, 6, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  } else {
    // 普通嘴
    ctx.beginPath()
    ctx.moveTo(-3, headY + 5)
    ctx.lineTo(3, headY + 5)
    ctx.stroke()
  }

  // 身体
  const shoulderY = headY + headR
  const hipY = -35
  ctx.beginPath()
  ctx.moveTo(0, shoulderY)
  ctx.lineTo(0, hipY)
  ctx.stroke()

  // 腿
  let legSwing = 0
  if (p.state === 'walk') {
    legSwing = Math.sin(p.idleAnimFrame * 0.35) * 12
  }
  // 左腿
  ctx.beginPath()
  ctx.moveTo(0, hipY)
  ctx.lineTo(-10 + legSwing, 0)
  ctx.stroke()
  // 右腿
  ctx.beginPath()
  ctx.moveTo(0, hipY)
  ctx.lineTo(10 - legSwing, 0)
  ctx.stroke()

  // 手臂
  if (p.state === 'attack' && p.attackFrame <= 8 && p.attackFrame > 0) {
    // 出拳
    const punchExt = f * 42
    ctx.beginPath()
    ctx.moveTo(0, shoulderY + 6)
    ctx.lineTo(punchExt, shoulderY + 2)
    ctx.stroke()
    // 拳头
    ctx.beginPath()
    ctx.arc(punchExt, shoulderY + 2, 7, 0, Math.PI * 2)
    ctx.fill()
    // 后臂
    ctx.beginPath()
    ctx.moveTo(0, shoulderY + 6)
    ctx.lineTo(-f * 14, shoulderY + 16)
    ctx.stroke()
  } else if (p.state === 'special') {
    // 必杀动作
    const spExt = f * (48 + Math.sin(p.idleAnimFrame * 0.6) * 6)
    ctx.beginPath()
    ctx.moveTo(0, shoulderY + 6)
    ctx.lineTo(spExt, shoulderY - 6)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(spExt, shoulderY - 6, 9, 0, Math.PI * 2)
    ctx.fill()
    // 必杀轨迹
    ctx.save()
    ctx.strokeStyle = color
    ctx.globalAlpha = 0.5
    ctx.lineWidth = 2
    for (let t = 0; t < 5; t++) {
      const off = t * 10
      ctx.beginPath()
      ctx.arc(spExt - f * off, shoulderY - 6, 9 + t * 2, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.restore()
    // 另一只手
    ctx.beginPath()
    ctx.moveTo(0, shoulderY + 6)
    ctx.lineTo(-f * 18, shoulderY + 20)
    ctx.stroke()
  } else if (p.state === 'hurt') {
    // 受伤姿势
    ctx.beginPath()
    ctx.moveTo(0, shoulderY + 6)
    ctx.lineTo(-f * 20, shoulderY - 8)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, shoulderY + 6)
    ctx.lineTo(-f * 14, shoulderY + 22)
    ctx.stroke()
  } else if (p.isBlocking) {
    // 防御姿势
    ctx.beginPath()
    ctx.moveTo(0, shoulderY + 6)
    ctx.lineTo(f * 18, shoulderY - 10)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, shoulderY + 6)
    ctx.lineTo(f * 22, shoulderY + 14)
    ctx.stroke()
  } else {
    // 普通/待机手臂
    let armSwing = 0
    if (p.state === 'walk') armSwing = Math.sin(p.idleAnimFrame * 0.35) * 8
    // 前臂
    ctx.beginPath()
    ctx.moveTo(0, shoulderY + 6)
    ctx.lineTo(f * 16 - armSwing, shoulderY + 24)
    ctx.stroke()
    // 后臂
    ctx.beginPath()
    ctx.moveTo(0, shoulderY + 6)
    ctx.lineTo(-f * 14 + armSwing, shoulderY + 22)
    ctx.stroke()
  }

  // 角色名字（小标签）
  ctx.save()
  ctx.fillStyle = color
  ctx.font = 'bold 11px VT323, monospace'
  ctx.textAlign = 'center'
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
