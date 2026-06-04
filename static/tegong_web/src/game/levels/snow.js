import { Enemy } from '../Enemy.js'

export const snowLevel = {
  id: 4,
  name: '雪山危机',
  theme: 'snow',
  width: 3200,
  height: 600,
  gravity: 0.8,
  bgColor: '#87ceeb',
  platforms: [
    { x: 0, y: 550, width: 500, height: 50, type: 'ice' },
    { x: 600, y: 550, width: 400, height: 50, type: 'ice' },
    { x: 1100, y: 550, width: 300, height: 50, type: 'ice' },
    { x: 1500, y: 550, width: 500, height: 50, type: 'ice' },
    { x: 2100, y: 550, width: 400, height: 50, type: 'ice' },
    { x: 2600, y: 550, width: 600, height: 50, type: 'ice' },
    { x: 200, y: 470, width: 100, height: 20, type: 'snow' },
    { x: 400, y: 400, width: 120, height: 20, type: 'ice' },
    { x: 650, y: 480, width: 100, height: 20, type: 'snow' },
    { x: 850, y: 400, width: 150, height: 20, type: 'ice' },
    { x: 1150, y: 450, width: 100, height: 20, type: 'snow' },
    { x: 1350, y: 380, width: 120, height: 20, type: 'ice' },
    { x: 1600, y: 450, width: 150, height: 20, type: 'snow' },
    { x: 1850, y: 380, width: 100, height: 20, type: 'ice' },
    { x: 2050, y: 300, width: 120, height: 20, type: 'snow' },
    { x: 2300, y: 380, width: 150, height: 20, type: 'ice' },
    { x: 2550, y: 450, width: 100, height: 20, type: 'snow' },
    { x: 2800, y: 350, width: 150, height: 20, type: 'ice' },
  ],
  hidingSpots: [
    { x: 300, y: 420, width: 60, height: 130 },
    { x: 750, y: 430, width: 50, height: 120 },
    { x: 1250, y: 400, width: 60, height: 150 },
    { x: 1750, y: 400, width: 50, height: 150 },
    { x: 2200, y: 330, width: 60, height: 170 },
    { x: 2700, y: 400, width: 50, height: 150 },
  ],
  enemies: [
    { type: 'wolf', x: 250, y: 515, patrolStart: 100, patrolEnd: 400 },
    { type: 'patrol', x: 700, y: 495, patrolStart: 600, patrolEnd: 900 },
    { type: 'wolf', x: 1200, y: 515, patrolStart: 1100, patrolEnd: 1350 },
    { type: 'patrol', x: 1700, y: 495, patrolStart: 1550, patrolEnd: 1900 },
    { type: 'wolf', x: 2250, y: 515, patrolStart: 2100, patrolEnd: 2400 },
    { type: 'patrol', x: 2800, y: 495, patrolStart: 2650, patrolEnd: 3000 },
  ],
  scrolls: [
    { id: 'snow_scroll_1', x: 900, y: 350, skillId: 'dragon_fury', skillName: '龙怒' },
    { id: 'snow_scroll_2', x: 2100, y: 250, skillId: 'throwing_knife', skillName: '飞刀' },
  ],
  hazards: [
    { type: 'avalanche', x: 500, y: 0, width: 100, height: 550, damage: 30 },
    { type: 'avalanche', x: 1400, y: 0, width: 100, height: 550, damage: 30 },
    { type: 'avalanche', x: 2400, y: 0, width: 100, height: 550, damage: 30 },
    { type: 'ice', x: 600, y: 550, width: 400, height: 50, slippery: true },
    { type: 'ice', x: 1500, y: 550, width: 500, height: 50, slippery: true },
  ],
  decorations: [
    { type: 'pine', x: 100, y: 350 },
    { type: 'pine', x: 450, y: 320 },
    { type: 'pine', x: 800, y: 350 },
    { type: 'pine', x: 1200, y: 330 },
    { type: 'pine', x: 1600, y: 350 },
    { type: 'pine', x: 2000, y: 320 },
    { type: 'pine', x: 2450, y: 350 },
    { type: 'pine', x: 2900, y: 330 },
  ],
  playerStart: { x: 50, y: 480 },
  exit: { x: 3100, y: 480, width: 60, height: 70 }
}

export function createSnowLevel() {
  const level = JSON.parse(JSON.stringify(snowLevel))
  level.enemies = level.enemies.map(e => 
    new Enemy(e.type, e.x, e.y, e.patrolStart, e.patrolEnd)
  )
  return level
}
