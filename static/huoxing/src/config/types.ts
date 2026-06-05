export type ResourceType = 'iron' | 'water' | 'energy' | 'oxygen' | 'food' | 'rareMineral' | 'techFragment'

export interface ResourceConfig {
  name: string
  icon: string
  color: string
  initialMax: number
  initialCurrent: number
}

export interface ResourceState {
  current: number
  max: number
  production: number
  consumption: number
  ratio: number
}

export type BuildingCategory = 'habitat' | 'power' | 'life' | 'production' | 'research'

export interface BuildingConfig {
  id: string
  name: string
  description: string
  icon: string
  category: BuildingCategory
  cost: Partial<Record<ResourceType, number>>
  production: Partial<Record<ResourceType, number>>
  consumption: Partial<Record<ResourceType, number>>
  buildTime: number
  maxLevel: number
  unlockCondition?: {
    tech?: string
    region?: string
    baseLevel?: number
  }
}

export interface BuildingInstance {
  id: string
  configId: string
  level: number
  built: boolean
  progress: number
  position?: { x: number; y: number }
  regionId: string
}

export interface TechEffect {
  type: 'production_modifier' | 'storage_bonus' | 'unlock_building' | 'unlock_region' | 'environment_resist'
  target: string
  value: number
}

export interface TechConfig {
  id: string
  name: string
  description: string
  icon: string
  tier: number
  cost: {
    techFragment: number
    energy: number
  }
  researchTime: number
  prerequisites: string[]
  effects: TechEffect[]
}

export interface TechState {
  id: string
  researched: boolean
  progress: number
  researching: boolean
}

export type RegionId = 'landing' | 'canyon' | 'polar' | 'volcano' | 'ruins'

export interface RegionResource {
  abundance: number
  maxExtract: number
}

export interface RegionEnvironment {
  temperature: { min: number; max: number; current: number }
  radiation: number
  dustLevel: number
}

export interface RegionTask {
  id: string
  name: string
  description: string
  type: 'explore' | 'collect' | 'build' | 'research'
  target: number
  progress: number
  reward: Partial<Record<ResourceType, number>>
  completed: boolean
}

export interface RegionConfig {
  id: RegionId
  name: string
  description: string
  position: { lat: number; lng: number }
  unlockCondition?: {
    tech?: string
    baseLevel?: number
    completedRegion?: RegionId
  }
  environment: RegionEnvironment
  resources: Partial<Record<ResourceType, RegionResource>>
  tasks: RegionTask[]
}

export interface RegionState {
  id: RegionId
  unlocked: boolean
  explored: number
  buildings: BuildingInstance[]
  roverPresent: boolean
  roverPosition?: { x: number; y: number }
  environment: RegionEnvironment
  tasks: RegionTask[]
}

export type EventType = 'disaster' | 'opportunity' | 'malfunction' | 'discovery'
export type EventSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface EventEffect {
  type: 'resource_change' | 'production_modifier' | 'production_bonus' | 'building_damage' | 'unlock_content'
  target: string
  value: number
}

export interface EventChoice {
  id: string
  text: string
  cost?: Partial<Record<ResourceType, number>>
  successRate: number
  successEffect: { description: string; effects: EventEffect[] }
  failureEffect: { description: string; effects: EventEffect[] }
}

export interface EventConfig {
  id: string
  name: string
  description: string
  icon: string
  type: EventType
  severity: EventSeverity
  regionId?: RegionId
  duration: number
  effects: EventEffect[]
  choices: EventChoice[]
  triggerChance: number
}

export interface ActiveEvent {
  configId: string
  triggered: boolean
  active: boolean
  timeRemaining: number
  choiceMade?: string
  choiceResult?: 'success' | 'failure'
}

export type SciFiPanelBorderColor = 'blue' | 'red' | 'orange' | 'green' | 'purple'

export interface GameState {
  isNewGame: boolean
  isPaused: boolean
  gameSpeed: number
  baseLevel: number
  currentRegion: RegionId
  totalPlayTime: number
  victory: boolean
  gameOver: boolean
}
