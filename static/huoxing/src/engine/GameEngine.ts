import { timeSystem } from './TimeSystem'
import { useGameStore } from '../stores/gameStore'
import { BUILDINGS } from '../config/buildings'
import { TECHNOLOGIES } from '../config/technologies'
import { EVENTS } from '../config/events'
import { REGIONS } from '../config/regions'
import type { ActiveEvent, EventEffect, ResourceType, EventChoice } from '../config/types'
import { clamp, generateId } from '../utils/formatters'

export class GameEngine {
  private static instance: GameEngine
  private isRunning = false
  private lastTime = 0
  private animationFrameId: number | null = null
  private store: ReturnType<typeof useGameStore> | null = null
  private pendingEvent: ActiveEvent | null = null

  static getInstance(): GameEngine {
    if (!GameEngine.instance) {
      GameEngine.instance = new GameEngine()
    }
    return GameEngine.instance
  }

  init(store: ReturnType<typeof useGameStore>): void {
    this.store = store
  }

  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.lastTime = performance.now()
    this.loop()
  }

  stop(): void {
    this.isRunning = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  pause(): void {
    if (this.store) {
      this.store.gameState.isPaused = true
    }
  }

  resume(): void {
    if (this.store) {
      this.store.gameState.isPaused = false
    }
  }

  setSpeed(speed: number): void {
    if (this.store) {
      this.store.gameState.gameSpeed = speed
    }
  }

  private loop = (): void => {
    if (!this.isRunning) return

    const currentTime = performance.now()
    const rawDelta = (currentTime - this.lastTime) / 1000
    this.lastTime = currentTime

    if (this.store && !this.store.gameState.isPaused && !this.store.gameState.victory && !this.store.gameState.gameOver) {
      const deltaTime = rawDelta * this.store.gameState.gameSpeed
      this.update(deltaTime)
    }

    this.animationFrameId = requestAnimationFrame(this.loop)
  }

  private update(deltaTime: number): void {
    if (!this.store) return

    timeSystem.update(deltaTime)
    this.store.gameState.totalPlayTime += deltaTime

    this.updateResources(deltaTime)
    this.updateBuildings(deltaTime)
    this.updateResearch(deltaTime)
    this.updateExploration(deltaTime)
    this.updateEvents(deltaTime)
    this.updateEnvironment(deltaTime)
    this.updateTasks(deltaTime)

    this.store.updateBaseLevel()

    if (this.store.checkVictory()) {
      this.store.gameState.victory = true
      this.store.addEventLog('🎉 恭喜！你成功完成了火星殖民！', 'success')
    }

    if (this.store.checkGameOver()) {
      this.store.gameState.gameOver = true
      this.store.addEventLog('💀 殖民失败...资源耗尽', 'error')
    }

    if (timeSystem.shouldAutoSave()) {
      this.store.saveCurrentGame()
    }
  }

  private updateResources(deltaTime: number): void {
    if (!this.store) return

    for (const [type, res] of Object.entries(this.store.resources)) {
      const net = res.production - res.consumption
      if (net !== 0) {
        res.current = clamp(res.current + net * deltaTime, 0, res.max)
        res.ratio = res.current / res.max
      }
    }
  }

  private updateBuildings(deltaTime: number): void {
    if (!this.store) return

    for (const building of this.store.buildings) {
      if (!building.built && building.progress < 100) {
        const config = BUILDINGS.find(b => b.id === building.configId)
        if (config) {
          building.progress += (deltaTime / config.buildTime) * 100
          if (building.progress >= 100) {
            building.progress = 100
            building.built = true
            this.store.addEventLog(`${config.name} 建造完成！`, 'success')
            this.store.recalculateProduction()
            this.checkTaskProgress('build', building.configId)
          }
        }
      }
    }
  }

  private updateResearch(deltaTime: number): void {
    if (!this.store) return

    for (const [techId, tech] of Object.entries(this.store.technologies)) {
      if (tech.researching && !tech.researched) {
        const config = TECHNOLOGIES.find(t => t.id === techId)
        if (config) {
          const labCount = this.store.buildings.filter(b => b.built && b.configId === 'research_lab').length
          const speedBonus = 1 + labCount * 0.25
          tech.progress += (deltaTime / config.researchTime) * 100 * speedBonus

          if (tech.progress >= 100) {
            tech.progress = 100
            tech.researched = true
            tech.researching = false
            this.store.applyTechEffects(techId)
            this.store.addEventLog(`🔬 ${config.name} 研究完成！`, 'success')
          }
        }
      }
    }
  }

  private updateExploration(deltaTime: number): void {
    if (!this.store) return

    const currentRegion = this.store.currentRegionState
    if (currentRegion && currentRegion.roverPresent && currentRegion.explored < 100) {
      const exploreSpeed = 2
      currentRegion.explored = clamp(currentRegion.explored + exploreSpeed * deltaTime, 0, 100)
      this.checkTaskProgress('explore', null, currentRegion.explored)

      if (Math.random() < 0.01 * deltaTime) {
        const resourceGain = Math.random() * 5 + 1
        this.store.addResource('iron', resourceGain)
      }
    }
  }

  private updateEvents(deltaTime: number): void {
    if (!this.store) return

    for (let i = this.store.activeEvents.length - 1; i >= 0; i--) {
      const event = this.store.activeEvents[i]
      if (event.active && event.timeRemaining > 0) {
        event.timeRemaining -= deltaTime
        if (event.timeRemaining <= 0) {
          event.active = false
          this.store.activeEvents.splice(i, 1)
          this.store.recalculateProduction()
        }
      }
    }

    if (this.pendingEvent) return

    const eventTrigger = Math.random()
    let cumulativeChance = 0

    for (const eventConfig of EVENTS) {
      if (eventConfig.regionId && eventConfig.regionId !== this.store.gameState.currentRegion) continue

      cumulativeChance += eventConfig.triggerChance * deltaTime

      if (eventTrigger < cumulativeChance) {
        const hasActiveEvent = this.store.activeEvents.some(e => e.configId === eventConfig.id)
        if (!hasActiveEvent) {
          this.triggerEvent(eventConfig.id)
          break
        }
      }
    }
  }

  private triggerEvent(eventId: string): void {
    if (!this.store) return

    const config = EVENTS.find(e => e.id === eventId)
    if (!config) return

    const activeEvent: ActiveEvent = {
      configId: eventId,
      triggered: true,
      active: true,
      timeRemaining: config.duration
    }

    this.pendingEvent = activeEvent
    this.applyEventEffects(config.effects)
    this.store.activeEvents.push(activeEvent)
    this.store.addEventLog(`${config.icon} ${config.name}`, config.type)
  }

  handleEventChoice(choiceId: string): void {
    if (!this.store || !this.pendingEvent) return

    const config = EVENTS.find(e => e.id === this.pendingEvent!.configId)
    if (!config) return

    const choice = config.choices.find(c => c.id === choiceId)
    if (!choice) return

    if (choice.cost && !this.store.hasEnoughResources(choice.cost)) {
      return
    }

    if (choice.cost) {
      this.store.payCost(choice.cost)
    }

    const roll = Math.random() * 100
    const success = roll < choice.successRate

    this.pendingEvent.choiceMade = choiceId
    this.pendingEvent.choiceResult = success ? 'success' : 'failure'

    const resultEffect = success ? choice.successEffect : choice.failureEffect
    this.store.addEventLog(resultEffect.description, success ? 'success' : 'error')
    this.applyEventEffects(resultEffect.effects)

    this.pendingEvent = null
  }

  private applyEventEffects(effects: EventEffect[]): void {
    if (!this.store) return

    for (const effect of effects) {
      switch (effect.type) {
        case 'resource_change':
          if (effect.target === 'random') {
            const types = Object.keys(this.store.resources)
            const randomType = types[Math.floor(Math.random() * types.length)] as ResourceType
            this.store.addResource(randomType, effect.value)
          } else {
            this.store.addResource(effect.target as ResourceType, effect.value)
          }
          break
        case 'production_modifier':
        case 'production_bonus':
          if (effect.target === 'all') {
            for (const key of Object.keys(this.store.productionModifiers)) {
              this.store.productionModifiers[key] = (this.store.productionModifiers[key] || 0) + effect.value
            }
          } else {
            this.store.productionModifiers[effect.target] = (this.store.productionModifiers[effect.target] || 0) + effect.value
          }
          this.store.recalculateProduction()
          break
        case 'building_damage':
          const builtBuildings = this.store.buildings.filter(b => b.built)
          if (builtBuildings.length > 0) {
            const randomBuilding = builtBuildings[Math.floor(Math.random() * builtBuildings.length)]
            randomBuilding.built = false
            randomBuilding.progress = 50
            this.store.addEventLog(`一座建筑受损，需要修复`, 'error')
            this.store.recalculateProduction()
          }
          break
      }
    }
  }

  private updateEnvironment(deltaTime: number): void {
    if (!this.store) return

    const currentRegion = this.store.currentRegionState
    if (!currentRegion) return

    const config = REGIONS[currentRegion.id]
    if (!config) return

    const temp = currentRegion.environment.temperature
    const dayNightFactor = Math.sin(timeSystem.dayProgress * Math.PI * 2 - Math.PI / 2)
    temp.current = (temp.min + temp.max) / 2 + dayNightFactor * (temp.max - temp.min) / 2

    const eventDustBonus = this.store.activeEvents.some(e => {
      const cfg = EVENTS.find(ev => ev.id === e.configId)
      return cfg?.type === 'disaster' && cfg.id.includes('dust')
    }) ? 3 : 0

    const baseVariation = Math.sin(timeSystem.totalSeconds * 0.01) * 0.5
    currentRegion.environment.dustLevel = clamp(
      config.environment.dustLevel + baseVariation + eventDustBonus,
      0,
      10
    )
  }

  private updateTasks(deltaTime: number): void {
    if (!this.store) return

    const currentRegion = this.store.currentRegionState
    if (!currentRegion) return

    for (const task of currentRegion.tasks) {
      if (task.completed) continue

      if (task.type === 'research') {
        const hasLab = this.store.buildings.some(b => b.built && b.configId === 'research_lab')
        if (hasLab) {
          task.progress = clamp(task.progress + deltaTime, 0, task.target)
          this.checkTaskComplete(task)
        }
      }
    }
  }

  private checkTaskProgress(type: string, targetId: string | null, value?: number): void {
    if (!this.store) return

    const currentRegion = this.store.currentRegionState
    if (!currentRegion) return

    for (const task of currentRegion.tasks) {
      if (task.completed || task.type !== type) continue

      if (type === 'build') {
        const sameTypeBuildings = this.store.buildings.filter(
          b => b.built && b.regionId === currentRegion.id
        ).length
        task.progress = sameTypeBuildings
      } else if (type === 'explore' && value !== undefined) {
        task.progress = value
      }

      this.checkTaskComplete(task)
    }
  }

  private checkTaskComplete(task: any): void {
    if (!this.store || task.completed) return

    if (task.progress >= task.target) {
      task.completed = true

      for (const [resource, amount] of Object.entries(task.reward)) {
        if (amount) {
          this.store.addResource(resource as ResourceType, amount as number)
        }
      }

      this.store.addEventLog(`✅ 任务完成: ${task.name}`, 'success')
    }
  }

  getPendingEvent(): ActiveEvent | null {
    return this.pendingEvent
  }

  clearPendingEvent(): void {
    this.pendingEvent = null
  }
}

export const gameEngine = GameEngine.getInstance()
