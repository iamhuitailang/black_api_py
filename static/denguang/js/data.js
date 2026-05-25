const SCENES = [
  {
    id: 'livehouse',
    name: '室内Livehouse',
    style: '潮流简约',
    genres: ['流行', '说唱'],
    lightType: 'cold_strobe',
    lightColor: '#00bfff',
    lightPattern: 'strobe',
    ambientColor: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    description: '潮流简约的室内演出空间，适合流行音乐和说唱表演'
  },
  {
    id: 'outdoor',
    name: '户外音乐节',
    style: '热血开阔',
    genres: ['摇滚', '民谣'],
    lightType: 'warm_follow',
    lightColor: '#ff8c00',
    lightPattern: 'follow',
    ambientColor: 'linear-gradient(135deg, #2d1b0e 0%, #4a3728 100%)',
    description: '热血沸腾的户外大型音乐节，摇滚与民谣的完美舞台'
  },
  {
    id: 'banquet',
    name: '晚宴宴会厅',
    style: '典雅大气',
    genres: ['抒情', '古典'],
    lightType: 'soft_diffuse',
    lightColor: '#ffd700',
    lightPattern: 'diffuse',
    ambientColor: 'linear-gradient(135deg, #2c1810 0%, #4a2c2a 100%)',
    description: '典雅大气的宴会厅，抒情音乐与古典乐的优雅殿堂'
  },
  {
    id: 'club',
    name: '电音派对场',
    style: '赛博动感',
    genres: ['电音', 'DJ曲'],
    lightType: 'rgb_beam',
    lightColor: '#ff00ff',
    lightPattern: 'beam',
    ambientColor: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 100%)',
    description: '赛博朋克风格的电音派对场，霓虹灯光与动感节拍'
  }
]

const GENRES = [
  { id: 'pop', name: '流行', tempo: 120, energy: 0.7, mood: 'upbeat' },
  { id: 'rap', name: '说唱', tempo: 90, energy: 0.8, mood: 'street' },
  { id: 'rock', name: '摇滚', tempo: 140, energy: 0.9, mood: 'powerful' },
  { id: 'folk', name: '民谣', tempo: 80, energy: 0.4, mood: 'warm' },
  { id: 'ballad', name: '抒情', tempo: 70, energy: 0.3, mood: 'emotional' },
  { id: 'classical', name: '古典', tempo: 60, energy: 0.2, mood: 'elegant' },
  { id: 'edm', name: '电音', tempo: 130, energy: 1.0, mood: 'energetic' },
  { id: 'dj', name: 'DJ曲', tempo: 128, energy: 0.95, mood: 'party' }
]

const EQUIPMENT_CATEGORIES = {
  audio: {
    name: '音响设备',
    icon: '🎵',
    items: [
      {
        id: 'speaker_basic',
        name: '基础音箱',
        icon: '🔊',
        level: 1,
        unlocked: true,
        power: 10,
        quality: 70,
        bass: 5,
        treble: 5,
        price: 0,
        description: '标准配置音响，适合各类演出'
      },
      {
        id: 'speaker_pro',
        name: '专业音箱',
        icon: '🎙️',
        level: 2,
        unlocked: false,
        unlockScore: 6000,
        power: 15,
        quality: 85,
        bass: 8,
        treble: 8,
        price: 0,
        description: '专业级音响系统，音质更纯净'
      },
      {
        id: 'subwoofer',
        name: '低音炮',
        icon: '🔉',
        level: 2,
        unlocked: false,
        unlockScore: 5000,
        power: 20,
        quality: 75,
        bass: 15,
        treble: 2,
        price: 0,
        description: '增强低频效果，震撼体验'
      },
      {
        id: 'mixer',
        name: '调音台',
        icon: '🎚️',
        level: 3,
        unlocked: false,
        unlockScore: 8000,
        power: 5,
        quality: 95,
        bass: 10,
        treble: 10,
        price: 0,
        description: '专业调音设备，精细控制每个参数'
      }
    ]
  },
  lighting: {
    name: '灯光设备',
    icon: '💡',
    items: [
      {
        id: 'spotlight_basic',
        name: '基础射灯',
        icon: '💡',
        level: 1,
        unlocked: true,
        brightness: 10,
        colorRange: 5,
        effect: 'focus',
        price: 0,
        description: '基础聚光灯，提供基础照明'
      },
      {
        id: 'par_light',
        name: 'PAR灯',
        icon: '🔦',
        level: 1,
        unlocked: true,
        brightness: 15,
        colorRange: 8,
        effect: 'wash',
        price: 0,
        description: '染色灯，营造氛围色彩'
      },
      {
        id: 'strobe_light',
        name: '频闪灯',
        icon: '⚡',
        level: 2,
        unlocked: false,
        unlockScore: 5000,
        brightness: 20,
        colorRange: 10,
        effect: 'strobe',
        price: 0,
        description: '高速频闪，营造动感效果'
      },
      {
        id: 'moving_head',
        name: '摇头灯',
        icon: '🌟',
        level: 3,
        unlocked: false,
        unlockScore: 8000,
        brightness: 25,
        colorRange: 15,
        effect: 'beam',
        price: 0,
        description: '专业摇头光束灯，动态效果丰富'
      },
      {
        id: 'laser_light',
        name: '激光灯',
        icon: '🔮',
        level: 4,
        unlocked: false,
        unlockScore: 12000,
        brightness: 30,
        colorRange: 20,
        effect: 'laser',
        price: 0,
        description: '顶级激光设备，打造梦幻舞台'
      }
    ]
  },
  props: {
    name: '舞台道具',
    icon: '🎭',
    items: [
      {
        id: 'mic_stand',
        name: '麦克风架',
        icon: '🎤',
        level: 1,
        unlocked: true,
        quality: 70,
        effect: 'vocal',
        price: 0,
        description: '标准麦克风支架'
      },
      {
        id: 'drum_kit',
        name: '架子鼓',
        icon: '🥁',
        level: 2,
        unlocked: false,
        unlockScore: 6000,
        quality: 85,
        effect: 'rhythm',
        price: 0,
        description: '完整架子鼓套装'
      },
      {
        id: 'guitar',
        name: '吉他',
        icon: '🎸',
        level: 2,
        unlocked: false,
        unlockScore: 5000,
        quality: 80,
        effect: 'melody',
        price: 0,
        description: '电吉他/木吉他'
      },
      {
        id: 'piano',
        name: '钢琴/键盘',
        icon: '🎹',
        level: 3,
        unlocked: false,
        unlockScore: 8000,
        quality: 90,
        effect: 'harmony',
        price: 0,
        description: '专业键盘乐器'
      },
      {
        id: 'smoke_machine',
        name: '烟雾机',
        icon: '💨',
        level: 3,
        unlocked: false,
        unlockScore: 7000,
        quality: 85,
        effect: 'atmosphere',
        price: 0,
        description: '营造舞台烟雾效果'
      }
    ]
  }
}

const AUDIO_PARAMS = {
  volume: { min: 0, max: 100, default: 70, step: 5, label: '主音量' },
  bass: { min: -12, max: 12, default: 0, step: 1, label: '低音' },
  treble: { min: -12, max: 12, default: 0, step: 1, label: '高音' },
  mid: { min: -12, max: 12, default: 0, step: 1, label: '中音' },
  reverb: { min: 0, max: 100, default: 30, step: 5, label: '混响' },
  echo: { min: 0, max: 100, default: 20, step: 5, label: '回声' }
}

const LIGHT_PARAMS = {
  brightness: { min: 0, max: 100, default: 80, step: 5, label: '亮度' },
  hue: { min: 0, max: 360, default: 0, step: 10, label: '色相' },
  saturation: { min: 0, max: 100, default: 100, step: 5, label: '饱和度' },
  speed: { min: 0, max: 100, default: 50, step: 5, label: '频率' },
  pattern: { 
    min: 0, max: 4, default: 0, step: 1, label: '模式',
    options: ['静态', '呼吸', '闪烁', '流动', '脉冲']
  }
}

const STAGE_LAYOUT = {
  width: 100,
  height: 100,
  zones: {
    front: { x: 20, y: 60, w: 60, h: 35 },
    center: { x: 25, y: 30, w: 50, h: 40 },
    back: { x: 10, y: 5, w: 80, h: 30 },
    left: { x: 0, y: 25, w: 25, h: 50 },
    right: { x: 75, y: 25, w: 25, h: 50 }
  }
}

window.GAME_DATA = {
  SCENES,
  GENRES,
  EQUIPMENT_CATEGORIES,
  AUDIO_PARAMS,
  LIGHT_PARAMS,
  STAGE_LAYOUT
}
