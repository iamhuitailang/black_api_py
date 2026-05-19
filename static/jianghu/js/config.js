const CONFIG = {
  CANVAS: {
    WIDTH: 1200,
    HEIGHT: 600,
    GROUND_Y: 500
  },
  GAME: {
    FPS: 60,
    GRAVITY: 0.8,
    JUMP_FORCE: -15,
    MOVE_SPEED: 5
  },
  CHARACTERS: {
    jinyiwei: {
      id: 'jinyiwei',
      name: '锦衣卫',
      type: '均衡稳健型',
      hp: 100,
      attack: 11,
      defense: 6,
      speed: '中等',
      jumpPower: 24,
      color: '#8B0000',
      skills: ['流云掌', '破空斩'],
      skillDamage: { '流云掌': 25, '破空斩': 30 }
    },
    langzi: {
      id: 'langzi',
      name: '江湖浪子',
      type: '爆发攻击型',
      hp: 92,
      attack: 15,
      defense: 4,
      speed: '中等',
      jumpPower: 29,
      color: '#4B0082',
      skills: ['烈焰腿', '惊雷斩'],
      skillDamage: { '烈焰腿': 28, '惊雷斩': 32 }
    },
    nvxia: {
      id: 'nvxia',
      name: '烟雨女侠',
      type: '敏捷速度型',
      hp: 88,
      attack: 9,
      defense: 7,
      speed: '极快',
      jumpPower: 21,
      color: '#2F4F4F',
      skills: ['幻影腿', '烟波掌'],
      skillDamage: { '幻影腿': 22, '烟波掌': 26 }
    }
  },
  ATTACKS: {
    lightPunch: { name: '轻拳', damage: 7, duration: 50, range: 60, type: 'punch' },
    heavyPunch: { name: '重拳', damage: 13, duration: 120, range: 90, type: 'punch' },
    lightKick: { name: '轻腿', damage: 6, duration: 70, range: 80, type: 'kick' },
    heavyKick: { name: '重腿', damage: 14, duration: 150, range: 110, type: 'kick' }
  },
  CONTROLS: {
    PLAYER: {
      LEFT: 'ArrowLeft',
      RIGHT: 'ArrowRight',
      UP: 'ArrowUp',
      DOWN: 'ArrowDown',
      LIGHT_PUNCH: 'j',
      HEAVY_PUNCH: 'k',
      LIGHT_KICK: 'u',
      HEAVY_KICK: 'i',
      BLOCK: 'o',
      SKILL: 'l'
    }
  },
  AI: {
    REACTION_TIME: 300,
    ATTACK_CHANCE: 0.08,
    MOVE_CHANCE: 0.04,
    BLOCK_CHANCE: 0.03
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
