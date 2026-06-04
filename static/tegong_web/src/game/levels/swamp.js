import { Enemy } from '../Enemy.js'

export const swampLevel = {
  id: 3,
  name: '毒沼迷途',
  theme: 'swamp',
  width: 3000,
  height: 600,
  gravity: 0.8,
  bgColor: '#0d1f1f',
  platforms: [
    { x: 0, y: 550, width: 400, height: 50, type: 'ground' },
    { x: 500, y: 550, width: 300, height: 50, type: 'ground' },
    { x: 900, y: 550, width: 400, height: 50, type: 'ground' },
    { x: 1400, y: 550, width: 300, height: 50, type: 'ground' },
    { x: 1800, y: 550, width: 400, height: 50, type: 'ground' },
    { x: 2300, y: 550, width: 700, height: 50, type: 'ground' },
    { x: 200, y: 450, width: 100, height: 20, type: 'log' },
    { x: 420, y: 480, width: 80, height: 20, type: 'log' },
    { x: 650, y: 420, width: 120, height: 20, type: 'log' },
    { x: 850, y: 350, width: 100, height: 20, type: 'log' },
    { x: 1100, y: 420, width: 150, height: 20, type: 'log' },
    { x: 1350, y: 350, width: 100, height: 20, type: 'log' },
    { x: 1550, y: 420, width: 120, height: 20, type: 'log' },
    { x: 1750, y: 350, width: 100, height: 20, type: 'log' },
    { x: 2000, y: 400, width: 150, height: 20, type: 'log' },
    { x: 2250, y: 320, width: 100, height: 20, type: 'log' },
    { x: 2500, y: 400, width: 120, height: 20, type: 'log' },
  ],
  hidingSpots: [
    { x: 150, y: 400, width: 60, height: 150 },
    { x: 750, y: 380, width: 50, height: 170 },
    { x: 1250, y: 350, width: 60, height: 200 },
    { x: 1650, y: 380, width: 50, height: 170 },
    { x: 2150, y: 350, width: 60, height: 200 },
  ],
  enemies: [
    { type: 'monster', x: 350, y: 490, patrolStart: 200, patrolEnd: 500 },
    { type: 'monster', x: 750, y: 490, patrolStart: 600, patrolEnd: 900 },
    { type: 'patrol', x: 1100, y: 495, patrolStart: 950, patrolEnd: 1250 },
    { type: 'monster', x: 1550, y: 490, patrolStart: 1450, patrolEnd: 1700 },
    { type: 'patrol', x: 2000, y: 495, patrolStart: 1850, patrolEnd: 2150 },
    { type: 'monster', x: 2500, y: 490, patrolStart: 2350, patrolEnd: 2700 },
  ],
  scrolls: [
    { id: 'swamp_scroll_1', x: 900, y: 300, skillId: 'smoke_bomb', skillName: '烟雾弹' },
    { id: 'swamp_scroll_2', x: 1800, y: 300, skillId: 'healing_breath', skillName: '疗伤功法' },
  ],
  hazards: [
    { type: 'poison', x: 400, y: 520, width: 100, height: 30, damage: 0.5 },
    { type: 'poison', x: 800, y: 520, width: 100, height: 30, damage: 0.5 },
    { type: 'poison', x: 1300, y: 520, width: 100, height: 30, damage: 0.5 },
    { type: 'poison', x: 1700, y: 520, width: 100, height: 30, damage: 0.5 },
    { type: 'poison', x: 2200, y: 520, width: 100, height: 30, damage: 0.5 },
  ],
  decorations: [
    { type: 'deadTree', x: 100, y: 300 },
    { type: 'deadTree', x: 550, y: 280 },
    { type: 'deadTree', x: 1000, y: 320 },
    { type: 'deadTree', x: 1500, y: 290 },
    { type: 'deadTree', x: 2000, y: 310 },
    { type: 'deadTree', x: 2600, y: 280 },
  ],
  playerStart: { x: 50, y: 480 },
  exit: { x: 2900, y: 480, width: 60, height: 70 }
}

export function createSwampLevel() {
  const level = JSON.parse(JSON.stringify(swampLevel))
  level.enemies = level.enemies.map(e => 
    new Enemy(e.type, e.x, e.y, e.patrolStart, e.patrolEnd)
  )
  return level
}
