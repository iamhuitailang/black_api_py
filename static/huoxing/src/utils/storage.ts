import type { GameState, ResourceState, RegionState, TechState, BuildingInstance, ActiveEvent } from '../config/types'
import { RESOURCES } from '../config/resources'
import { REGIONS } from '../config/regions'
import { TECHNOLOGIES } from '../config/technologies'

const STORAGE_KEY = 'mars_colony_save'

export interface SaveData {
  gameState: GameState
  resources: Record<string, ResourceState>
  regions: Record<string, RegionState>
  technologies: Record<string, TechState>
  buildings: BuildingInstance[]
  activeEvents: ActiveEvent[]
  timestamp: number
}

export function createInitialSaveData(): SaveData {
  const resources: Record<string, ResourceState> = {}
  for (const [key, config] of Object.entries(RESOURCES)) {
    resources[key] = {
      current: config.initialCurrent,
      max: config.initialMax,
      production: 0,
      consumption: 0,
      ratio: config.initialCurrent / config.initialMax
    }
  }

  const regions: Record<string, RegionState> = {}
  for (const [key, config] of Object.entries(REGIONS)) {
    regions[key] = {
      id: config.id,
      unlocked: key === 'landing',
      explored: 0,
      buildings: [],
      roverPresent: key === 'landing',
      environment: { ...config.environment },
      tasks: config.tasks.map(t => ({ ...t, progress: 0, completed: false }))
    }
  }

  const technologies: Record<string, TechState> = {}
  for (const tech of TECHNOLOGIES) {
    technologies[tech.id] = {
      id: tech.id,
      researched: false,
      progress: 0,
      researching: false
    }
  }

  return {
    gameState: {
      isNewGame: true,
      isPaused: false,
      gameSpeed: 1,
      baseLevel: 1,
      currentRegion: 'landing',
      totalPlayTime: 0,
      victory: false,
      gameOver: false
    },
    resources,
    regions,
    technologies,
    buildings: [],
    activeEvents: [],
    timestamp: Date.now()
  }
}

export function saveGame(data: SaveData): void {
  try {
    data.timestamp = Date.now()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save game:', e)
  }
}

export function loadGame(): SaveData | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved) as SaveData
    }
  } catch (e) {
    console.error('Failed to load game:', e)
  }
  return null
}

export function hasSavedGame(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null
}

export function deleteSave(): void {
  localStorage.removeItem(STORAGE_KEY)
}

let saveTimeout: number | null = null

export function throttledSave(data: SaveData, delay: number = 1000): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  saveTimeout = window.setTimeout(() => {
    saveGame(data)
    saveTimeout = null
  }, delay)
}
