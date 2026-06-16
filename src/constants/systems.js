export const SYSTEMS = [
  {
    id: 0,
    name: '近地轨道',
    description: '太阳系内圈，碎片密集但危险较少',
    bgColor: '#0a0a2e',
    planets: [
      { x: 180, y: 160, radius: 40, mass: 500, color: '#4a6fa5' }
    ],
    zones: [
      { id: 0, name: '训练区', debrisCount: 15, dangerLevel: 0.1, requiredValue: 200 },
      { id: 1, name: '废弃卫星带', debrisCount: 20, dangerLevel: 0.15, requiredValue: 500 },
      { id: 2, name: '近地碎片云', debrisCount: 25, dangerLevel: 0.2, requiredValue: 1000 },
      { id: 3, name: '同步轨道', debrisCount: 30, dangerLevel: 0.25, requiredValue: 2000 },
      { id: 4, name: '月球轨道', debrisCount: 35, dangerLevel: 0.3, requiredValue: 4000 }
    ]
  },
  {
    id: 1,
    name: '小行星带',
    description: '火星与木星之间，稀有零件较多',
    bgColor: '#1a0a2e',
    planets: [
      { x: 160, y: 460, radius: 35, mass: 400, color: '#8b6914' },
      { x: 740, y: 140, radius: 30, mass: 350, color: '#6b4423' }
    ],
    zones: [
      { id: 0, name: '内环带', debrisCount: 25, dangerLevel: 0.25, requiredValue: 3000 },
      { id: 1, name: '中域矿区', debrisCount: 30, dangerLevel: 0.3, requiredValue: 6000 },
      { id: 2, name: '外环带', debrisCount: 35, dangerLevel: 0.35, requiredValue: 10000 },
      { id: 3, name: '特洛伊群', debrisCount: 40, dangerLevel: 0.4, requiredValue: 15000 },
      { id: 4, name: '深空遗迹', debrisCount: 45, dangerLevel: 0.45, requiredValue: 25000 }
    ]
  },
  {
    id: 2,
    name: '外太阳系',
    description: '危险与机遇并存的边疆区域',
    bgColor: '#0a1a1a',
    planets: [
      { x: 160, y: 200, radius: 50, mass: 600, color: '#d4a574' },
      { x: 740, y: 220, radius: 45, mass: 550, color: '#c9a86c' },
      { x: 450, y: 520, radius: 35, mass: 400, color: '#7ec8e3' }
    ],
    zones: [
      { id: 0, name: '木星轨道', debrisCount: 35, dangerLevel: 0.4, requiredValue: 20000 },
      { id: 1, name: '土星环带', debrisCount: 40, dangerLevel: 0.45, requiredValue: 35000 },
      { id: 2, name: '天王星域', debrisCount: 45, dangerLevel: 0.5, requiredValue: 50000 },
      { id: 3, name: '海王星边', debrisCount: 50, dangerLevel: 0.55, requiredValue: 75000 },
      { id: 4, name: '柯伊伯带', debrisCount: 55, dangerLevel: 0.6, requiredValue: 100000 }
    ]
  }
]
