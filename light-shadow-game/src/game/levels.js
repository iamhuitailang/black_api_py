export const getLevelConfig = (levelId) => {
  const configs = {
    1: {
      name: '晨光森林',
      emoji: '🌲',
      background: 'linear-gradient(180deg, #87CEEB 0%, #98FB98 50%, #228B22 100%)',
      groundColor: '#3d5c3d',
      skyGradient: ['#87CEEB', '#B0E0E6', '#98FB98'],
      theme: 'forest',
      width: 2400,
      height: 600,
      playerStart: { x: 80, y: 400 },
      goal: { x: 2300, y: 350, width: 80, height: 120 },
      platforms: [
        { x: 0, y: 520, width: 600, height: 80, type: 'ground' },
        { x: 700, y: 520, width: 400, height: 80, type: 'ground' },
        { x: 1200, y: 450, width: 150, height: 30, type: 'platform' },
        { x: 1400, y: 380, width: 150, height: 30, type: 'platform' },
        { x: 1600, y: 520, width: 800, height: 80, type: 'ground' },
        { x: 1800, y: 420, width: 120, height: 30, type: 'platform' },
        { x: 2000, y: 350, width: 120, height: 30, type: 'platform' }
      ],
      obstacles: [
        { x: 620, y: 480, width: 60, height: 40, type: 'trap' },
        { x: 1120, y: 480, width: 60, height: 40, type: 'trap' },
        { x: 1560, y: 480, width: 30, height: 40, type: 'trap' }
      ],
      shadows: [
        { x: 550, y: 200, width: 120, height: 320, moving: false },
        { x: 1000, y: 150, width: 150, height: 370, moving: false },
        { x: 1650, y: 180, width: 100, height: 340, moving: false },
        { x: 2100, y: 200, width: 130, height: 320, moving: false }
      ],
      lightParticles: [
        { x: 300, y: 400 },
        { x: 500, y: 350 },
        { x: 800, y: 420 },
        { x: 1050, y: 300 },
        { x: 1275, y: 380 },
        { x: 1475, y: 310 },
        { x: 1700, y: 420 },
        { x: 1860, y: 350 },
        { x: 2060, y: 280 },
        { x: 2250, y: 400 }
      ]
    },

    2: {
      name: '黄昏峡谷',
      emoji: '🏜️',
      background: 'linear-gradient(180deg, #FF6B35 0%, #F7931E 40%, #8B4513 100%)',
      groundColor: '#8B4513',
      skyGradient: ['#FF6B35', '#F7931E', '#FFD700'],
      theme: 'canyon',
      width: 2800,
      height: 600,
      playerStart: { x: 80, y: 400 },
      goal: { x: 2700, y: 200, width: 80, height: 120 },
      platforms: [
        { x: 0, y: 520, width: 400, height: 80, type: 'ground' },
        { x: 2500, y: 320, width: 300, height: 280, type: 'ground' }
      ],
      obstacles: [],
      shadows: [
        { x: 450, y: 400, width: 120, height: 30, type: 'movingPlatform', moveRange: { start: 450, end: 650 }, speed: 2 },
        { x: 700, y: 350, width: 120, height: 30, type: 'movingPlatform', moveRange: { start: 700, end: 900 }, speed: 2.5 },
        { x: 950, y: 300, width: 120, height: 30, type: 'movingPlatform', moveRange: { start: 950, end: 1150 }, speed: 3 },
        { x: 1200, y: 350, width: 120, height: 30, type: 'movingPlatform', moveRange: { start: 1200, end: 1400 }, speed: 2.5 },
        { x: 1450, y: 400, width: 120, height: 30, type: 'movingPlatform', moveRange: { start: 1450, end: 1650 }, speed: 2 },
        { x: 1700, y: 350, width: 120, height: 30, type: 'movingPlatform', moveRange: { start: 1700, end: 1900 }, speed: 3 },
        { x: 1950, y: 300, width: 120, height: 30, type: 'movingPlatform', moveRange: { start: 1950, end: 2150 }, speed: 2.5 },
        { x: 2200, y: 280, width: 120, height: 30, type: 'movingPlatform', moveRange: { start: 2200, end: 2400 }, speed: 2 }
      ],
      lightParticles: [
        { x: 200, y: 400 },
        { x: 510, y: 340 },
        { x: 760, y: 290 },
        { x: 1010, y: 240 },
        { x: 1260, y: 290 },
        { x: 1510, y: 340 },
        { x: 1760, y: 290 },
        { x: 2010, y: 240 },
        { x: 2260, y: 220 },
        { x: 2550, y: 250 },
        { x: 2680, y: 180 }
      ]
    },

    3: {
      name: '午夜城堡',
      emoji: '🏰',
      background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3e 50%, #2a2a4e 100%)',
      groundColor: '#1a1a2e',
      skyGradient: ['#0a0a1a', '#1a1a3e', '#2a2a4e'],
      theme: 'castle',
      width: 2600,
      height: 600,
      playerStart: { x: 80, y: 400 },
      goal: { x: 2500, y: 100, width: 80, height: 120 },
      platforms: [
        { x: 0, y: 520, width: 500, height: 80, type: 'ground' },
        { x: 600, y: 520, width: 300, height: 80, type: 'ground' },
        { x: 1000, y: 450, width: 200, height: 30, type: 'platform' },
        { x: 1300, y: 520, width: 400, height: 80, type: 'ground' },
        { x: 1400, y: 380, width: 200, height: 30, type: 'platform' },
        { x: 1800, y: 520, width: 300, height: 80, type: 'ground' },
        { x: 1900, y: 300, width: 200, height: 30, type: 'platform' },
        { x: 2200, y: 520, width: 400, height: 80, type: 'ground' },
        { x: 2300, y: 220, width: 300, height: 30, type: 'platform' }
      ],
      obstacles: [
        { x: 520, y: 480, width: 60, height: 40, type: 'trap' },
        { x: 1720, y: 480, width: 60, height: 40, type: 'trap' },
        { x: 2120, y: 480, width: 60, height: 40, type: 'trap' }
      ],
      torches: [
        { x: 100, y: 440, radius: 180, active: true },
        { x: 750, y: 440, radius: 180, active: false },
        { x: 1100, y: 370, radius: 200, active: false },
        { x: 1500, y: 440, radius: 180, active: false },
        { x: 1500, y: 300, radius: 180, active: false },
        { x: 2000, y: 440, radius: 180, active: false },
        { x: 2000, y: 220, radius: 200, active: false },
        { x: 2400, y: 440, radius: 200, active: false },
        { x: 2450, y: 140, radius: 200, active: false }
      ],
      lightParticles: [
        { x: 200, y: 400 },
        { x: 400, y: 420 },
        { x: 700, y: 420 },
        { x: 1080, y: 380 },
        { x: 1150, y: 380 },
        { x: 1400, y: 420 },
        { x: 1480, y: 310 },
        { x: 1580, y: 310 },
        { x: 1850, y: 420 },
        { x: 1980, y: 230 },
        { x: 2050, y: 230 },
        { x: 2280, y: 420 },
        { x: 2380, y: 150 },
        { x: 2480, y: 150 }
      ]
    }
  }

  return configs[levelId] || configs[1]
}
