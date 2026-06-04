import { Enemy } from '../Enemy.js'

export const bambooLevel = {
  id: 1,
  name: '竹林密踪',
  theme: 'bamboo',
  width: 2400,
  height: 600,
  gravity: 0.8,
  bgColor: '#1a3d1a',
  platforms: [
    { x: 0, y: 550, width: 2400, height: 50, type: 'ground' },
    { x: 200, y: 450, width: 150, height: 20, type: 'platform' },
    { x: 450, y: 380, width: 120, height: 20, type: 'platform' },
    { x: 650, y: 320, width: 100, height: 20, type: 'bamboo' },
    { x: 850, y: 400, width: 180, height: 20, type: 'platform' },
    { x: 1100, y: 350, width: 100, height: 20, type: 'bamboo' },
    { x: 1300, y: 280, width: 120, height: 20, type: 'platform' },
    { x: 1500, y: 380, width: 150, height: 20, type: 'platform' },
    { x: 1750, y: 320, width: 100, height: 20, type: 'bamboo' },
    { x: 1950, y: 420, width: 200, height: 20, type: 'platform' },
    { x: 2200, y: 350, width: 150, height: 20, type: 'platform' },
  ],
  hidingSpots: [
    { x: 300, y: 400, width: 60, height: 150 },
    { x: 750, y: 350, width: 50, height: 200 },
    { x: 1200, y: 300, width: 60, height: 250 },
    { x: 1650, y: 380, width: 50, height: 170 },
    { x: 2050, y: 350, width: 60, height: 200 },
  ],
  enemies: [
    { type: 'patrol', x: 400, y: 495, patrolStart: 300, patrolEnd: 550 },
    { type: 'patrol', x: 900, y: 495, patrolStart: 750, patrolEnd: 1050 },
    { type: 'patrol', x: 1400, y: 495, patrolStart: 1250, patrolEnd: 1550 },
    { type: 'patrol', x: 1850, y: 495, patrolStart: 1700, patrolEnd: 2000 },
  ],
  scrolls: [
    { id: 'bamboo_scroll_1', x: 500, y: 330, skillId: 'smoke_bomb', skillName: '烟雾弹' },
    { id: 'bamboo_scroll_2', x: 1350, y: 230, skillId: 'throwing_knife', skillName: '飞刀' },
  ],
  hazards: [],
  decorations: [
    { type: 'bamboo', x: 100, y: 200 },
    { type: 'bamboo', x: 350, y: 150 },
    { type: 'bamboo', x: 600, y: 180 },
    { type: 'bamboo', x: 900, y: 120 },
    { type: 'bamboo', x: 1200, y: 160 },
    { type: 'bamboo', x: 1500, y: 140 },
    { type: 'bamboo', x: 1800, y: 170 },
    { type: 'bamboo', x: 2100, y: 130 },
  ],
  playerStart: { x: 50, y: 480 },
  exit: { x: 2300, y: 480, width: 60, height: 70 }
}

export function createBambooLevel() {
  const level = JSON.parse(JSON.stringify(bambooLevel))
  level.enemies = level.enemies.map(e => 
    new Enemy(e.type, e.x, e.y, e.patrolStart, e.patrolEnd)
  )
  return level
}
