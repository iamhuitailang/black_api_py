import type { ResourceConfig, ResourceType } from './types'

export const RESOURCES: Record<ResourceType, ResourceConfig> = {
  iron: {
    name: '铁矿',
    icon: '⚙️',
    color: '#C0C0C0',
    initialMax: 500,
    initialCurrent: 100
  },
  water: {
    name: '水资源',
    icon: '💧',
    color: '#00D4FF',
    initialMax: 300,
    initialCurrent: 150
  },
  energy: {
    name: '能源',
    icon: '⚡',
    color: '#FFD600',
    initialMax: 200,
    initialCurrent: 100
  },
  oxygen: {
    name: '氧气',
    icon: '🌬️',
    color: '#00C853',
    initialMax: 150,
    initialCurrent: 100
  },
  food: {
    name: '食物',
    icon: '🍞',
    color: '#8BC34A',
    initialMax: 200,
    initialCurrent: 80
  },
  rareMineral: {
    name: '稀有矿物',
    icon: '💎',
    color: '#E040FB',
    initialMax: 100,
    initialCurrent: 0
  },
  techFragment: {
    name: '科技碎片',
    icon: '🔮',
    color: '#FF6B00',
    initialMax: 50,
    initialCurrent: 0
  }
}

export const RESOURCE_ORDER: ResourceType[] = [
  'energy',
  'oxygen',
  'water',
  'food',
  'iron',
  'rareMineral',
  'techFragment'
]
