window.GameMaps = (function () {
  var MAPS = {
    ice_world: {
      id: 'ice_world',
      name: '冰雪世界',
      desc: '初学者的乐园，宁静的冰雪世界等待你的探索',
      unlockPrice: 0,
      unlockType: 'coin',
      bgColor: '#d0e8f8',
      groundColor: '#f0f4ff',
      width: 800,
      height: 600,
      spawnPoints: [
        { x: 100, y: 100 },
        { x: 700, y: 100 },
        { x: 100, y: 500 },
        { x: 700, y: 500 }
      ],
      snowPatches: [
        { x: 200, y: 150, radius: 40 },
        { x: 400, y: 100, radius: 35 },
        { x: 600, y: 180, radius: 45 },
        { x: 150, y: 300, radius: 38 },
        { x: 350, y: 280, radius: 42 },
        { x: 550, y: 320, radius: 36 },
        { x: 250, y: 450, radius: 40 },
        { x: 450, y: 480, radius: 44 },
        { x: 650, y: 420, radius: 37 },
        { x: 400, y: 550, radius: 39 }
      ],
      obstacles: [
        { x: 280, y: 200, width: 50, height: 40, type: 'rock' },
        { x: 500, y: 220, width: 45, height: 50, type: 'rock' },
        { x: 180, y: 400, width: 55, height: 35, type: 'rock' },
        { x: 580, y: 400, width: 40, height: 55, type: 'rock' },
        { x: 380, y: 380, width: 50, height: 45, type: 'rock' },
        { x: 320, y: 140, width: 30, height: 30, type: 'tree' },
        { x: 480, y: 500, width: 30, height: 30, type: 'tree' },
        { x: 620, y: 300, width: 30, height: 30, type: 'tree' }
      ],
      hazards: [
        { x: 400, y: -30, radius: 25, type: 'snowball', speed: 1.2, direction: 'down' }
      ],
      icePatches: [
        { x: 220, y: 240, width: 100, height: 60 },
        { x: 500, y: 350, width: 90, height: 70 }
      ],
      decorations: [
        { x: 50, y: 50, type: 'pine' },
        { x: 750, y: 50, type: 'pine' },
        { x: 50, y: 550, type: 'snowman' },
        { x: 750, y: 550, type: 'snowman' },
        { x: 400, y: 30, type: 'flag' },
        { x: 400, y: 570, type: 'flag' }
      ],
      specialGuest: {
        id: 'penguin',
        name: '企鹅',
        spawnChance: 0.1
      },
      theme: {
        snowColor: '#ffffff',
        iceColor: '#b8e0f0',
        treeColor: '#2d6a4f',
        skyGradient: ['#d0e8f8', '#a8d4f0']
      }
    },

    antarctic: {
      id: 'antarctic',
      name: '南极冰川',
      desc: '冰冷的南极冰川，暗藏危机的冰封之地',
      unlockPrice: 500,
      unlockType: 'coin',
      bgColor: '#1a5276',
      groundColor: '#d6eaf8',
      width: 800,
      height: 600,
      spawnPoints: [
        { x: 80, y: 80 },
        { x: 720, y: 80 },
        { x: 80, y: 520 },
        { x: 720, y: 520 }
      ],
      snowPatches: [
        { x: 200, y: 120, radius: 38 },
        { x: 500, y: 130, radius: 35 },
        { x: 350, y: 250, radius: 40 },
        { x: 160, y: 350, radius: 36 },
        { x: 600, y: 280, radius: 34 },
        { x: 300, y: 430, radius: 37 },
        { x: 550, y: 450, radius: 39 },
        { x: 400, y: 540, radius: 33 }
      ],
      obstacles: [
        { x: 240, y: 180, width: 60, height: 30, type: 'ice' },
        { x: 440, y: 200, width: 30, height: 60, type: 'ice' },
        { x: 300, y: 340, width: 80, height: 25, type: 'ice' },
        { x: 520, y: 360, width: 25, height: 70, type: 'ice' },
        { x: 180, y: 460, width: 50, height: 40, type: 'rock' },
        { x: 600, y: 460, width: 45, height: 45, type: 'rock' },
        { x: 370, y: 150, width: 50, height: 40, type: 'rock' },
        { x: 100, y: 230, width: 35, height: 80, type: 'ice' },
        { x: 660, y: 190, width: 35, height: 80, type: 'ice' }
      ],
      hazards: [
        { x: -30, y: 200, radius: 28, type: 'snowball', speed: 1.8, direction: 'right' },
        { x: 830, y: 400, radius: 28, type: 'snowball', speed: 1.8, direction: 'left' }
      ],
      icePatches: [
        { x: 150, y: 150, width: 120, height: 70 },
        { x: 500, y: 150, width: 110, height: 75 },
        { x: 200, y: 380, width: 130, height: 65 },
        { x: 480, y: 400, width: 115, height: 80 }
      ],
      decorations: [
        { x: 40, y: 40, type: 'igloo' },
        { x: 760, y: 40, type: 'crystal' },
        { x: 40, y: 560, type: 'crystal' },
        { x: 760, y: 560, type: 'igloo' },
        { x: 400, y: 20, type: 'flag' },
        { x: 400, y: 580, type: 'flag' }
      ],
      specialGuest: {
        id: 'snowman',
        name: '雪人',
        spawnChance: 0.15
      },
      theme: {
        snowColor: '#e8f0fe',
        iceColor: '#85c1e9',
        treeColor: '#1b4f72',
        skyGradient: ['#1a5276', '#2980b9']
      }
    },

    snow_peak: {
      id: 'snow_peak',
      name: '雪山之巅',
      desc: '险峻的雪山之巅，只有勇敢的仓鼠才敢挑战',
      unlockPrice: 800,
      unlockType: 'coin',
      bgColor: '#2c3e50',
      groundColor: '#ecf0f1',
      width: 800,
      height: 600,
      spawnPoints: [
        { x: 100, y: 80 },
        { x: 700, y: 80 },
        { x: 100, y: 520 },
        { x: 700, y: 520 }
      ],
      snowPatches: [
        { x: 200, y: 130, radius: 28 },
        { x: 400, y: 100, radius: 25 },
        { x: 600, y: 150, radius: 27 },
        { x: 150, y: 320, radius: 26 },
        { x: 500, y: 350, radius: 24 },
        { x: 350, y: 500, radius: 28 }
      ],
      obstacles: [
        { x: 180, y: 160, width: 60, height: 50, type: 'rock' },
        { x: 350, y: 180, width: 70, height: 40, type: 'rock' },
        { x: 560, y: 200, width: 55, height: 55, type: 'rock' },
        { x: 250, y: 280, width: 40, height: 80, type: 'rock' },
        { x: 430, y: 260, width: 80, height: 35, type: 'rock' },
        { x: 620, y: 300, width: 50, height: 60, type: 'rock' },
        { x: 140, y: 420, width: 70, height: 45, type: 'rock' },
        { x: 330, y: 400, width: 45, height: 70, type: 'rock' },
        { x: 520, y: 430, width: 65, height: 40, type: 'rock' },
        { x: 650, y: 450, width: 55, height: 55, type: 'rock' },
        { x: 270, y: 520, width: 50, height: 40, type: 'rock' },
        { x: 480, y: 530, width: 60, height: 35, type: 'rock' }
      ],
      hazards: [
        { x: 400, y: -30, radius: 30, type: 'snowball', speed: 2.5, direction: 'down' },
        { x: -30, y: 300, radius: 28, type: 'snowball', speed: 2.2, direction: 'right' },
        { x: 830, y: 450, radius: 26, type: 'snowball', speed: 2.4, direction: 'left' }
      ],
      icePatches: [
        { x: 320, y: 320, width: 80, height: 50 },
        { x: 500, y: 220, width: 70, height: 55 },
        { x: 200, y: 480, width: 85, height: 45 }
      ],
      decorations: [
        { x: 50, y: 50, type: 'pine' },
        { x: 750, y: 50, type: 'pine' },
        { x: 400, y: 30, type: 'flag' },
        { x: 200, y: 570, type: 'candy' },
        { x: 600, y: 570, type: 'candy' },
        { x: 750, y: 550, type: 'flag' }
      ],
      specialGuest: {
        id: 'yeti',
        name: '雪人仓鼠',
        spawnChance: 0.08
      },
      theme: {
        snowColor: '#f0f0f0',
        iceColor: '#95a5a6',
        treeColor: '#1a3c34',
        skyGradient: ['#2c3e50', '#4a6274']
      }
    },

    aurora_field: {
      id: 'aurora_field',
      name: '极光冰原',
      desc: '神秘的极光冰原，传说中蕴藏着无尽的宝藏',
      unlockPrice: 15,
      unlockType: 'gem',
      bgColor: '#1a0533',
      groundColor: '#e8e0f0',
      width: 800,
      height: 600,
      spawnPoints: [
        { x: 100, y: 100 },
        { x: 700, y: 100 },
        { x: 100, y: 500 },
        { x: 700, y: 500 }
      ],
      snowPatches: [
        { x: 200, y: 120, radius: 32 },
        { x: 400, y: 80, radius: 30 },
        { x: 600, y: 130, radius: 28 },
        { x: 130, y: 280, radius: 34 },
        { x: 300, y: 250, radius: 26 },
        { x: 500, y: 270, radius: 30 },
        { x: 670, y: 290, radius: 32 },
        { x: 220, y: 430, radius: 28 },
        { x: 380, y: 460, radius: 34 },
        { x: 540, y: 440, radius: 26 },
        { x: 680, y: 480, radius: 30 },
        { x: 400, y: 560, radius: 33 }
      ],
      obstacles: [
        { x: 180, y: 170, width: 50, height: 45, type: 'rock' },
        { x: 340, y: 160, width: 40, height: 55, type: 'ice' },
        { x: 500, y: 170, width: 55, height: 40, type: 'rock' },
        { x: 640, y: 190, width: 45, height: 50, type: 'ice' },
        { x: 230, y: 300, width: 70, height: 30, type: 'ice' },
        { x: 420, y: 320, width: 30, height: 70, type: 'rock' },
        { x: 560, y: 330, width: 65, height: 30, type: 'ice' },
        { x: 150, y: 400, width: 50, height: 50, type: 'rock' },
        { x: 300, y: 380, width: 40, height: 60, type: 'ice' },
        { x: 480, y: 400, width: 55, height: 45, type: 'rock' },
        { x: 630, y: 390, width: 45, height: 55, type: 'ice' },
        { x: 260, y: 510, width: 60, height: 35, type: 'rock' },
        { x: 560, y: 520, width: 50, height: 40, type: 'rock' }
      ],
      hazards: [
        { x: -30, y: 150, radius: 26, type: 'snowball', speed: 2.0, direction: 'right' },
        { x: 830, y: 300, radius: 24, type: 'snowball', speed: 1.8, direction: 'left' },
        { x: 400, y: -30, radius: 28, type: 'snowball', speed: 2.2, direction: 'down' },
        { x: 200, y: 630, radius: 22, type: 'snowball', speed: 2.5, direction: 'up' }
      ],
      icePatches: [
        { x: 130, y: 180, width: 90, height: 55 },
        { x: 380, y: 210, width: 80, height: 60 },
        { x: 600, y: 250, width: 95, height: 50 },
        { x: 250, y: 440, width: 85, height: 55 },
        { x: 500, y: 480, width: 90, height: 60 }
      ],
      decorations: [
        { x: 50, y: 50, type: 'crystal' },
        { x: 750, y: 50, type: 'crystal' },
        { x: 50, y: 550, type: 'crystal' },
        { x: 750, y: 550, type: 'crystal' },
        { x: 400, y: 30, type: 'flag' },
        { x: 400, y: 570, type: 'flag' },
        { x: 300, y: 560, type: 'candy' },
        { x: 500, y: 560, type: 'candy' }
      ],
      specialGuest: {
        id: 'aurora_spirit',
        name: '极光精灵仓鼠',
        spawnChance: 0.05
      },
      theme: {
        snowColor: '#f0e8ff',
        iceColor: '#9b59b6',
        treeColor: '#2d1b4e',
        skyGradient: ['#1a0533', '#0b3d0b', '#1a0533']
      }
    }
  };

  var MAP_LIST = ['ice_world', 'antarctic', 'snow_peak', 'aurora_field'];

  function getMap(id) {
    return MAPS[id] || null;
  }

  return {
    MAPS: MAPS,
    MAP_LIST: MAP_LIST,
    getMap: getMap
  };
})();
