import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GameState, ResourceState, RegionState, TechState, BuildingInstance, ActiveEvent, ResourceType, RegionId } from '../config/types'
import { RESOURCES } from '../config/resources'
import { REGIONS } from '../config/regions'
import { TECHNOLOGIES } from '../config/technologies'
import { BUILDINGS } from '../config/buildings'
import { timeSystem } from '../engine/TimeSystem'
import { createInitialSaveData, saveGame, loadGame, hasSavedGame, throttledSave } from '../utils/storage'
import { generateId, clamp } from '../utils/formatters'

export const useGameStore = defineStore('game', () => {
  const gameState = ref<GameState>({
    isNewGame: true,
    isPaused: false,
    gameSpeed: 1,
    baseLevel: 1,
    currentRegion: 'landing',
    totalPlayTime: 0,
    victory: false,
    gameOver: false
  })

  const resources = ref<Record<string, ResourceState>>({})
  const regions = ref<Record<string, RegionState>>({})
  const technologies = ref<Record<string, TechState>>({})
  const buildings = ref<BuildingInstance[]>([])
  const activeEvents = ref<ActiveEvent[]>([])
  const eventLog = ref<{ time: string; message: string; type: string }[]>([])
  const productionModifiers = ref<Record<string, number>>({})
  const storageModifiers = ref<Record<string, number>>({})
  const environmentResist = ref<Record<string, number>>({})

  const initialized = ref(false)

  function initNewGame(): void {
    const initial = createInitialSaveData()
    gameState.value = initial.gameState
    resources.value = initial.resources
    regions.value = initial.regions
    technologies.value = initial.technologies
    buildings.value = initial.buildings
    activeEvents.value = initial.activeEvents
    timeSystem.reset()
    initialized.value = true
    gameState.value.isNewGame = false
    recalculateProduction()
  }

  function loadSavedGame(): boolean {
    const saved = loadGame()
    if (saved) {
      gameState.value = saved.gameState
      resources.value = saved.resources
      regions.value = saved.regions
      technologies.value = saved.technologies
      buildings.value = saved.buildings
      activeEvents.value = saved.activeEvents
      timeSystem.loadFromSave({ totalSeconds: gameState.value.totalPlayTime })
      initialized.value = true
      recalculateProduction()
      return true
    }
    return false
  }

  function saveCurrentGame(): void {
    const saveData = {
      gameState: gameState.value,
      resources: resources.value,
      regions: regions.value,
      technologies: technologies.value,
      buildings: buildings.value,
      activeEvents: activeEvents.value,
      timestamp: Date.now()
    }
    throttledSave(saveData)
  }

  function forceSave(): void {
    const saveData = {
      gameState: gameState.value,
      resources: resources.value,
      regions: regions.value,
      technologies: technologies.value,
      buildings: buildings.value,
      activeEvents: activeEvents.value,
      timestamp: Date.now()
    }
    saveGame(saveData)
  }

  function addResource(type: ResourceType, amount: number): void {
    const res = resources.value[type]
    if (res) {
      res.current = clamp(res.current + amount, 0, res.max)
      res.ratio = res.current / res.max
    }
  }

  function consumeResource(type: ResourceType, amount: number): boolean {
    const res = resources.value[type]
    if (res && res.current >= amount) {
      res.current -= amount
      res.ratio = res.current / res.max
      return true
    }
    return false
  }

  function hasEnoughResources(cost: Partial<Record<ResourceType, number>>): boolean {
    for (const [type, amount] of Object.entries(cost)) {
      const res = resources.value[type]
      if (!res || res.current < (amount || 0)) {
        return false
      }
    }
    return true
  }

  function payCost(cost: Partial<Record<ResourceType, number>>): boolean {
    if (!hasEnoughResources(cost)) return false
    for (const [type, amount] of Object.entries(cost)) {
      if (amount) {
        consumeResource(type as ResourceType, amount)
      }
    }
    return true
  }

  function recalculateProduction(): void {
    for (const key of Object.keys(RESOURCES)) {
      resources.value[key].production = 0
      resources.value[key].consumption = 0
    }

    for (const building of buildings.value) {
      if (!building.built) continue

      const config = BUILDINGS.find(b => b.id === building.configId)
      if (!config) continue

      const levelMultiplier = 1 + (building.level - 1) * 0.5

      for (const [type, amount] of Object.entries(config.production || {})) {
        if (amount) {
          let finalAmount = amount * levelMultiplier
          const modifier = productionModifiers.value[type] || 0
          if (modifier) {
            finalAmount *= (1 + modifier)
          }
          if (type === 'energy' && timeSystem.isNight && config.id === 'solar_panel') {
            finalAmount *= 0.3
          }
          resources.value[type].production += finalAmount
        }
      }

      for (const [type, amount] of Object.entries(config.consumption || {})) {
        if (amount) {
          resources.value[type].consumption += amount * levelMultiplier
        }
      }
    }
  }

  function startBuilding(configId: string, regionId: string): boolean {
    const config = BUILDINGS.find(b => b.id === configId)
    if (!config) return false

    if (!isBuildingUnlocked(configId)) return false
    if (!payCost(config.cost)) return false

    const building: BuildingInstance = {
      id: generateId(),
      configId,
      level: 1,
      built: false,
      progress: 0,
      regionId,
      position: { x: Math.random() * 100, y: Math.random() * 100 }
    }

    buildings.value.push(building)
    regions.value[regionId].buildings.push(building)
    addEventLog(`开始建造 ${config.name}`, 'info')
    return true
  }

  function isBuildingUnlocked(configId: string): boolean {
    const config = BUILDINGS.find(b => b.id === configId)
    if (!config) return false

    if (!config.unlockCondition) return true

    const cond = config.unlockCondition
    if (cond.tech && !technologies.value[cond.tech]?.researched) return false
    if (cond.region && !regions.value[cond.region]?.unlocked) return false
    if (cond.baseLevel && gameState.value.baseLevel < cond.baseLevel) return false

    return true
  }

  function startResearch(techId: string): boolean {
    const tech = TECHNOLOGIES.find(t => t.id === techId)
    if (!tech) return false
    if (technologies.value[techId]?.researched) return false
    if (technologies.value[techId]?.researching) return false

    for (const prereq of tech.prerequisites) {
      if (!technologies.value[prereq]?.researched) return false
    }

    if (!payCost(tech.cost)) return false

    technologies.value[techId].researching = true
    technologies.value[techId].progress = 0
    addEventLog(`开始研究 ${tech.name}`, 'info')
    return true
  }

  function applyTechEffects(techId: string): void {
    const tech = TECHNOLOGIES.find(t => t.id === techId)
    if (!tech) return

    for (const effect of tech.effects) {
      switch (effect.type) {
        case 'production_modifier':
          if (effect.target === 'all') {
            for (const key of Object.keys(productionModifiers.value)) {
              productionModifiers.value[key] = (productionModifiers.value[key] || 0) + effect.value
            }
          } else {
            productionModifiers.value[effect.target] = (productionModifiers.value[effect.target] || 0) + effect.value
          }
          break
        case 'storage_bonus':
          if (effect.target === 'all') {
            for (const key of Object.keys(resources.value)) {
              resources.value[key].max *= (1 + effect.value)
            }
          } else {
            resources.value[effect.target].max *= (1 + effect.value)
          }
          break
        case 'unlock_region':
          regions.value[effect.target].unlocked = true
          break
        case 'unlock_building':
          break
        case 'environment_resist':
          if (effect.target === 'all') {
            for (const key of ['cold', 'heat', 'radiation', 'dust']) {
              environmentResist.value[key] = (environmentResist.value[key] || 0) + effect.value
            }
          } else {
            environmentResist.value[effect.target] = (environmentResist.value[effect.target] || 0) + effect.value
          }
          break
      }
    }

    recalculateProduction()
  }

  function changeRegion(regionId: RegionId): void {
    if (regions.value[regionId]?.unlocked) {
      gameState.value.currentRegion = regionId
    }
  }

  function addEventLog(message: string, type: string = 'info'): void {
    eventLog.value.unshift({
      time: timeSystem.getTimeString(),
      message,
      type
    })
    if (eventLog.value.length > 50) {
      eventLog.value.pop()
    }
  }

  function updateBaseLevel(): void {
    const totalBuildings = buildings.value.filter(b => b.built).length
    const newLevel = Math.min(5, Math.floor(totalBuildings / 5) + 1)
    if (newLevel > gameState.value.baseLevel) {
      gameState.value.baseLevel = newLevel
      addEventLog(`基地升级到 ${newLevel} 级！`, 'success')
    }
  }

  function checkVictory(): boolean {
    const allRegionsExplored = Object.values(regions.value).every(r => r.explored >= 100)
    const allTechResearched = Object.values(technologies.value).every(t => t.researched)
    return allRegionsExplored && allTechResearched
  }

  function checkGameOver(): boolean {
    return resources.value.oxygen?.current <= 0 ||
           resources.value.food?.current <= 0 ||
           resources.value.energy?.current <= 0
  }

  const netProduction = computed(() => {
    const result: Record<string, number> = {}
    for (const [key, res] of Object.entries(resources.value)) {
      result[key] = res.production - res.consumption
    }
    return result
  })

  const unlockedRegions = computed(() => {
    return Object.values(regions.value).filter(r => r.unlocked)
  })

  const currentRegionState = computed(() => {
    return regions.value[gameState.value.currentRegion]
  })

  const researchingTech = computed(() => {
    return Object.values(technologies.value).find(t => t.researching)
  })

  return {
    initialized,
    gameState,
    resources,
    regions,
    technologies,
    buildings,
    activeEvents,
    eventLog,
    productionModifiers,
    storageModifiers,
    environmentResist,
    netProduction,
    unlockedRegions,
    currentRegionState,
    researchingTech,
    initNewGame,
    loadSavedGame,
    saveCurrentGame,
    forceSave,
    hasSavedGame,
    addResource,
    consumeResource,
    hasEnoughResources,
    payCost,
    recalculateProduction,
    startBuilding,
    isBuildingUnlocked,
    startResearch,
    applyTechEffects,
    changeRegion,
    addEventLog,
    updateBaseLevel,
    checkVictory,
    checkGameOver
  }
})
