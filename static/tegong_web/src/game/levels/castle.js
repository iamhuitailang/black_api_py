import { Enemy } from '../Enemy.js'

export const castleLevel = {
  id: 2,
  name: '古堡潜入',
  theme: 'castle',
  width: 2800,
  height: 600,
  gravity: 0.8,
  bgColor: '#1a1a2e',
  platforms: [
    { x: 0, y: 550, width: 2800, height: 50, type: 'ground' },
    { x: 150, y: 470, width: 120, height: 20, type: 'stone' },
    { x: 350, y: 400, width: 100, height: 20, type: 'stone' },
    { x: 550, y: 330, width: 150, height: 20, type: 'stone' },
    { x: 800, y: 450, width: 200, height: 20, type: 'stone' },
    { x: 1100, y: 380, width: 120, height: 20, type: 'stone' },
    { x: 1300, y: 300, width: 180, height: 20, type: 'stone' },
    { x: 1550, y: 380, width: 100, height: 20, type: 'stone' },
    { x: 1750, y: 450, width: 150, height: 20, type: 'stone' },
    { x: 2000, y: 350, width: 120, height: 20, type: 'stone' },
    { x: 2200, y: 280, width: 200, height: 20, type: 'stone' },
    { x: 2500, y: 380, width: 150, height: 20, type: 'stone' },
  ],
  hidingSpots: [
    { x: 250, y: 350, width: 40, height: 200 },
    { x: 700, y: 300, width: 50, height: 250 },
    { x: 1000, y: 320, width: 40, height: 230 },
    { x: 1450, y: 280, width: 50, height: 270 },
    { x: 1900, y: 300, width: 40, height: 250 },
    { x: 2350, y: 250, width: 50, height: 300 },
  ],
  enemies: [
    { type: 'patrol', x: 300, y: 495, patrolStart: 150, patrolEnd: 450 },
    { type: 'archer', x: 600, y: 280, patrolStart: 550, patrolEnd: 700 },
    { type: 'patrol', x: 900, y: 495, patrolStart: 800, patrolEnd: 1100 },
    { type: 'patrol', x: 1350, y: 250, patrolStart: 1300, patrolEnd: 1480 },
    { type: 'archer', x: 1800, y: 400, patrolStart: 1750, patrolEnd: 1900 },
    { type: 'patrol', x: 2100, y: 495, patrolStart: 2000, patrolEnd: 2300 },
  ],
  scrolls: [
    { id: 'castle_scroll_1', x: 600, y: 280, skillId: 'healing_breath', skillName: '疗伤功法' },
    { id: 'castle_scroll_2', x: 1350, y: 250, skillId: 'dragon_fury', skillName: '龙怒' },
  ],
  hazards: [],
  decorations: [
    { type: 'lantern', x: 200, y: 350 },
    { type: 'lantern', x: 500, y: 280 },
    { type: 'lantern', x: 900, y: 320 },
    { type: 'lantern', x: 1300, y: 250 },
    { type: 'lantern', x: 1700, y: 300 },
    { type: 'lantern', x: 2100, y: 280 },
    { type: 'lantern', x: 2500, y: 320 },
  ],
  playerStart: { x: 50, y: 480 },
  exit: { x: 2700, y: 480, width: 60, height: 70 }
}

export function createCastleLevel() {
  const level = JSON.parse(JSON.stringify(castleLevel))
  level.enemies = level.enemies.map(e => 
    new Enemy(e.type, e.x, e.y, e.patrolStart, e.patrolEnd)
  )
  return level
}
