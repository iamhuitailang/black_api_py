import type { EventConfig } from './types'

export const EVENTS: EventConfig[] = [
  {
    id: 'dust_storm_small',
    name: '小型沙尘暴',
    description: '一场小型沙尘暴正在接近，太阳能发电效率将暂时降低。',
    icon: '🌪️',
    type: 'disaster',
    severity: 'low',
    duration: 30,
    triggerChance: 0.02,
    effects: [
      { type: 'production_modifier', target: 'energy', value: -0.3 }
    ],
    choices: [
      {
        id: 'wait',
        text: '等待风暴过去',
        successRate: 100,
        successEffect: { description: '风暴过去了，一切恢复正常。', effects: [] },
        failureEffect: { description: '', effects: [] }
      },
      {
        id: 'boost',
        text: '消耗能源维持运转',
        cost: { energy: 20 },
        successRate: 90,
        successEffect: { description: '成功维持了基地运转，损失较小。', effects: [] },
        failureEffect: { description: '能源系统过载，造成额外损失。', effects: [{ type: 'resource_change', target: 'energy', value: -30 }] }
      }
    ]
  },
  {
    id: 'dust_storm_large',
    name: '巨型沙尘暴',
    description: '警告！一场巨型沙尘暴正在席卷整个区域，所有室外设施都面临危险！',
    icon: '🌪️🌪️',
    type: 'disaster',
    severity: 'high',
    duration: 60,
    triggerChance: 0.008,
    effects: [
      { type: 'production_modifier', target: 'energy', value: -0.7 },
      { type: 'production_modifier', target: 'water', value: -0.3 }
    ],
    choices: [
      {
        id: 'shutdown',
        text: '关闭所有非必要设施',
        successRate: 85,
        successEffect: { description: '设施安全关闭，等待风暴过去。', effects: [] },
        failureEffect: { description: '部分设施受损。', effects: [{ type: 'building_damage', target: 'random', value: 1 }] }
      },
      {
        id: 'shield',
        text: '启动防护罩（需要防护罩已建造）',
        cost: { energy: 100 },
        successRate: 95,
        successEffect: { description: '防护罩成功抵御了沙尘暴！', effects: [{ type: 'resource_change', target: 'techFragment', value: 5 }] },
        failureEffect: { description: '防护罩能量不足，部分设施受损。', effects: [{ type: 'building_damage', target: 'random', value: 2 }] }
      }
    ]
  },
  {
    id: 'equipment_failure',
    name: '设备故障',
    description: '一座设施发生了机械故障，需要立即维修。',
    icon: '🔧',
    type: 'malfunction',
    severity: 'medium',
    duration: 20,
    triggerChance: 0.015,
    effects: [],
    choices: [
      {
        id: 'repair',
        text: '立即维修',
        cost: { iron: 15, energy: 10 },
        successRate: 95,
        successEffect: { description: '设备已修复，恢复正常运转。', effects: [] },
        failureEffect: { description: '维修失败，需要更多资源。', effects: [{ type: 'resource_change', target: 'iron', value: -10 }] }
      },
      {
        id: 'ignore',
        text: '暂时忽略',
        successRate: 50,
        successEffect: { description: '设备自动恢复了。', effects: [] },
        failureEffect: { description: '故障扩大，需要更多资源维修。', effects: [{ type: 'production_modifier', target: 'all', value: -0.2 }] }
      }
    ]
  },
  {
    id: 'solar_flare',
    name: '太阳耀斑',
    description: '检测到强烈的太阳耀斑，辐射水平急剧上升！',
    icon: '☀️⚠️',
    type: 'disaster',
    severity: 'critical',
    regionId: 'landing',
    duration: 45,
    triggerChance: 0.005,
    effects: [
      { type: 'production_modifier', target: 'energy', value: 0.5 },
      { type: 'resource_change', target: 'oxygen', value: -15 }
    ],
    choices: [
      {
        id: 'shelter',
        text: '所有人进入避难所',
        cost: { energy: 30 },
        successRate: 90,
        successEffect: { description: '安全度过了太阳耀斑。', effects: [] },
        failureEffect: { description: '部分人员受到辐射影响。', effects: [{ type: 'resource_change', target: 'food', value: -20 }] }
      },
      {
        id: 'collect',
        text: '冒险收集额外太阳能',
        successRate: 40,
        successEffect: { description: '收集到了大量额外能源！', effects: [{ type: 'resource_change', target: 'energy', value: 100 }] },
        failureEffect: { description: '辐射造成了严重损失。', effects: [{ type: 'resource_change', target: 'oxygen', value: -30 }, { type: 'resource_change', target: 'food', value: -25 }] }
      }
    ]
  },
  {
    id: 'water_discovery',
    name: '发现地下水源',
    description: '火星车在探索中发现了一处丰富的地下水源！',
    icon: '💧🎉',
    type: 'discovery',
    severity: 'low',
    duration: 0,
    triggerChance: 0.01,
    effects: [],
    choices: [
      {
        id: 'extract',
        text: '立即开采',
        successRate: 100,
        successEffect: { description: '获得了大量水资源！', effects: [{ type: 'resource_change', target: 'water', value: 80 }] },
        failureEffect: { description: '', effects: [] }
      },
      {
        id: 'mark',
        text: '标记位置，稍后开采',
        successRate: 100,
        successEffect: { description: '已标记位置，未来水资源产量提升。', effects: [{ type: 'production_modifier', target: 'water', value: 0.2 }] },
        failureEffect: { description: '', effects: [] }
      }
    ]
  },
  {
    id: 'rare_mineral_deposit',
    name: '稀有矿脉',
    description: '探测到一处高浓度稀有矿物矿脉！',
    icon: '💎✨',
    type: 'discovery',
    severity: 'medium',
    regionId: 'canyon',
    duration: 0,
    triggerChance: 0.008,
    effects: [],
    choices: [
      {
        id: 'quick_mine',
        text: '快速开采',
        cost: { energy: 40 },
        successRate: 75,
        successEffect: { description: '成功开采到稀有矿物！', effects: [{ type: 'resource_change', target: 'rareMineral', value: 30 }] },
        failureEffect: { description: '矿脉坍塌，只获得少量矿物。', effects: [{ type: 'resource_change', target: 'rareMineral', value: 10 }] }
      },
      {
        id: 'careful',
        text: '小心开采',
        cost: { energy: 60, iron: 20 },
        successRate: 95,
        successEffect: { description: '安全开采，获得大量稀有矿物！', effects: [{ type: 'resource_change', target: 'rareMineral', value: 50 }, { type: 'resource_change', target: 'techFragment', value: 5 }] },
        failureEffect: { description: '还是出了点小问题。', effects: [{ type: 'resource_change', target: 'rareMineral', value: 25 }] }
      }
    ]
  },
  {
    id: 'trader_ship',
    name: '补给飞船',
    description: '地球发来的补给飞船正在接近，可以申请紧急物资援助。',
    icon: '🚀',
    type: 'opportunity',
    severity: 'medium',
    duration: 40,
    triggerChance: 0.006,
    effects: [],
    choices: [
      {
        id: 'request_supplies',
        text: '申请基础物资',
        successRate: 100,
        successEffect: { description: '收到基础补给物资！', effects: [{ type: 'resource_change', target: 'food', value: 50 }, { type: 'resource_change', target: 'water', value: 30 }, { type: 'resource_change', target: 'iron', value: 40 }] },
        failureEffect: { description: '', effects: [] }
      },
      {
        id: 'request_tech',
        text: '申请科技援助',
        successRate: 80,
        successEffect: { description: '收到了珍贵的科技资料！', effects: [{ type: 'resource_change', target: 'techFragment', value: 15 }] },
        failureEffect: { description: '请求被拒绝了，资源需要留给更紧急的任务。', effects: [] }
      }
    ]
  },
  {
    id: 'alien_signal',
    name: '神秘信号',
    description: '通讯系统接收到一个来源不明的信号，似乎来自远古遗迹方向...',
    icon: '📡👽',
    type: 'discovery',
    severity: 'high',
    regionId: 'ruins',
    duration: 0,
    triggerChance: 0.003,
    effects: [],
    choices: [
      {
        id: 'trace',
        text: '追踪信号源',
        cost: { energy: 50 },
        successRate: 70,
        successEffect: { description: '追踪到信号源，发现了科技碎片！', effects: [{ type: 'resource_change', target: 'techFragment', value: 25 }] },
        failureEffect: { description: '信号消失了，什么也没找到。', effects: [] }
      },
      {
        id: 'decode',
        text: '尝试解码信号',
        cost: { techFragment: 5 },
        successRate: 50,
        successEffect: { description: '解码成功！获得了珍贵的外星科技数据！', effects: [{ type: 'resource_change', target: 'techFragment', value: 50 }] },
        failureEffect: { description: '解码失败，消耗了科技碎片。', effects: [] }
      }
    ]
  },
  {
    id: 'meteor_shower',
    name: '流星雨',
    description: '一场壮观的流星雨正在划过火星天空，但也可能对基地造成威胁。',
    icon: '☄️',
    type: 'disaster',
    severity: 'medium',
    duration: 25,
    triggerChance: 0.01,
    effects: [],
    choices: [
      {
        id: 'defense',
        text: '启动防御系统',
        cost: { energy: 40 },
        successRate: 90,
        successEffect: { description: '成功拦截了所有流星！', effects: [{ type: 'resource_change', target: 'rareMineral', value: 10 }] },
        failureEffect: { description: '部分流星突破防御，造成损失。', effects: [{ type: 'building_damage', target: 'random', value: 1 }] }
      },
      {
        id: 'collect',
        text: '冒险收集陨石',
        successRate: 60,
        successEffect: { description: '收集到了珍贵的陨石样本！', effects: [{ type: 'resource_change', target: 'rareMineral', value: 25 }, { type: 'resource_change', target: 'techFragment', value: 8 }] },
        failureEffect: { description: '被流星击中，造成损失。', effects: [{ type: 'resource_change', target: 'iron', value: -30 }, { type: 'resource_change', target: 'energy', value: -20 }] }
      }
    ]
  },
  {
    id: 'geothermal_activity',
    name: '地热活动',
    description: '检测到附近地热活动增强，可能带来额外能源，也可能有危险。',
    icon: '🌋',
    type: 'opportunity',
    severity: 'high',
    regionId: 'volcano',
    duration: 50,
    triggerChance: 0.007,
    effects: [
      { type: 'production_modifier', target: 'energy', value: 0.5 }
    ],
    choices: [
      {
        id: 'harness',
        text: '利用地热能',
        successRate: 75,
        successEffect: { description: '成功利用地热能，获得大量能源！', effects: [{ type: 'resource_change', target: 'energy', value: 150 }] },
        failureEffect: { description: '设备过热损坏。', effects: [{ type: 'building_damage', target: 'random', value: 1 }] }
      },
      {
        id: 'evacuate',
        text: '撤离危险区域',
        successRate: 100,
        successEffect: { description: '安全撤离，等待地热活动平息。', effects: [] },
        failureEffect: { description: '', effects: [] }
      }
    ]
  },
  {
    id: 'ancient_tech',
    name: '远古科技',
    description: '探索队在遗迹中发现了疑似远古科技装置！',
    icon: '🛸',
    type: 'discovery',
    severity: 'critical',
    regionId: 'ruins',
    duration: 0,
    triggerChance: 0.004,
    effects: [],
    choices: [
      {
        id: 'activate',
        text: '尝试激活装置',
        cost: { techFragment: 20, energy: 100 },
        successRate: 40,
        successEffect: { description: '装置激活！获得了前所未有的科技数据！', effects: [{ type: 'resource_change', target: 'techFragment', value: 100 }] },
        failureEffect: { description: '装置失控，释放出能量脉冲。', effects: [{ type: 'resource_change', target: 'energy', value: -50 }] }
      },
      {
        id: 'study',
        text: '小心研究',
        cost: { techFragment: 10 },
        successRate: 85,
        successEffect: { description: '研究取得进展。', effects: [{ type: 'resource_change', target: 'techFragment', value: 30 }] },
        failureEffect: { description: '研究没有进展。', effects: [] }
      }
    ]
  }
]

export const EVENT_TYPE_COLORS: Record<string, string> = {
  disaster: '#EF4444',
  opportunity: '#10B981',
  malfunction: '#F59E0B',
  discovery: '#8B5CF6'
}

export const EVENT_SEVERITY_COLORS: Record<string, string> = {
  low: '#9CA3AF',
  medium: '#F59E0B',
  high: '#EF4444',
  critical: '#DC2626'
}
