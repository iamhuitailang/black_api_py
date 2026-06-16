import { reactive } from 'vue'
import { UPGRADE_TYPES, getUpgradeCost } from '../constants/upgrades.js'
import { SYSTEMS } from '../constants/systems.js'
import { loadGame, saveGame, addCollectionLog } from './storage.js'
import { soundManager } from './soundManager.js'

export function createGameState() {
  const savedData = loadGame()
  
  const state = reactive({
    money: savedData.money || 0,
    upgrades: {
      engine: (savedData.upgrades && savedData.upgrades.engine) || 0,
      fuel_tank: (savedData.upgrades && savedData.upgrades.fuel_tank) || 0,
      armor: (savedData.upgrades && savedData.upgrades.armor) || 0,
      pick_radius: (savedData.upgrades && savedData.upgrades.pick_radius) || 0
    },
    progress: {
      currentSystem: (savedData.progress && savedData.progress.currentSystem) || 0,
      currentZone: (savedData.progress && savedData.progress.currentZone) || 0,
      zoneCompleted: (savedData.progress && savedData.progress.zoneCompleted) 
        ? savedData.progress.zoneCompleted.map(arr => [...(arr || [])])
        : [[false, false, false, false, false], [false, false, false, false, false], [false, false, false, false, false]]
    },
    collectionLog: Array.isArray(savedData.collectionLog) ? [...savedData.collectionLog] : [],
    totalCollected: {
      small_screw: (savedData.totalCollected && savedData.totalCollected.small_screw) || 0,
      medium_panel: (savedData.totalCollected && savedData.totalCollected.medium_panel) || 0,
      large_wreck: (savedData.totalCollected && savedData.totalCollected.large_wreck) || 0,
      dangerous: (savedData.totalCollected && savedData.totalCollected.dangerous) || 0,
      rare_part: (savedData.totalCollected && savedData.totalCollected.rare_part) || 0
    },
    sessionScore: 0,
    sessionCollected: 0,
    isPaused: false,
    isGameOver: false,
    showUpgradePanel: false,
    showMissionPanel: false,
    currentSystemData: null,
    currentZoneData: null
  })

  function updateCurrentSystemData() {
    state.currentSystemData = SYSTEMS[state.progress.currentSystem]
    state.currentZoneData = state.currentSystemData?.zones[state.progress.currentZone] || null
  }

  updateCurrentSystemData()

  function canAffordUpgrade(upgradeType) {
    const upgrade = UPGRADE_TYPES[upgradeType.toUpperCase()]
    if (!upgrade) return false
    const currentLevel = state.upgrades[upgrade.id] || 0
    if (currentLevel >= upgrade.maxLevel) return false
    const cost = getUpgradeCost(upgrade, currentLevel)
    return state.money >= cost
  }

  function buyUpgrade(upgradeType) {
    const upgradeKey = upgradeType.toUpperCase()
    const upgrade = UPGRADE_TYPES[upgradeKey]
    if (!upgrade) return false
    
    const currentLevel = state.upgrades[upgrade.id] || 0
    if (currentLevel >= upgrade.maxLevel) return false
    
    const cost = getUpgradeCost(upgrade, currentLevel)
    if (state.money < cost) return false
    
    state.money -= cost
    state.upgrades[upgrade.id] = currentLevel + 1
    
    soundManager.playUpgrade()
    saveToStorage()
    
    return true
  }

  function getUpgradeLevel(upgradeId) {
    return state.upgrades[upgradeId] || 0
  }

  function addMoney(amount) {
    state.money += amount
    state.sessionScore += amount
    saveToStorage()
  }

  function addCollected(debrisType) {
    const typeId = debrisType.id
    state.totalCollected[typeId] = (state.totalCollected[typeId] || 0) + 1
    state.sessionCollected++
    
    const logEntry = {
      type: typeId,
      name: debrisType.name,
      value: debrisType.value,
      time: Date.now()
    }
    state.collectionLog = addCollectionLog(logEntry, state)
    saveToStorage()
  }

  function selectZone(systemId, zoneId) {
    if (systemId < 0 || systemId >= SYSTEMS.length) return false
    if (zoneId < 0 || zoneId >= SYSTEMS[systemId].zones.length) return false
    
    if (!isSystemUnlocked(systemId)) return false
    if (!isZoneUnlocked(systemId, zoneId)) return false
    
    state.progress.currentSystem = systemId
    state.progress.currentZone = zoneId
    updateCurrentSystemData()
    saveToStorage()
    return true
  }

  function isSystemUnlocked(systemId) {
    if (systemId === 0) return true
    const prevSystem = SYSTEMS[systemId - 1]
    if (!prevSystem) return false
    return prevSystem.zones.every((_, idx) => 
      state.progress.zoneCompleted[systemId - 1][idx]
    )
  }

  function isZoneUnlocked(systemId, zoneId) {
    if (!isSystemUnlocked(systemId)) return false
    if (zoneId === 0) return true
    return state.progress.zoneCompleted[systemId][zoneId - 1]
  }

  function completeZone(systemId, zoneId) {
    if (state.progress.zoneCompleted[systemId][zoneId]) return false
    state.progress.zoneCompleted[systemId][zoneId] = true
    saveToStorage()
    return true
  }

  function checkZoneComplete(collectedValue) {
    if (!state.currentZoneData) return false
    if (collectedValue >= state.currentZoneData.requiredValue) {
      return completeZone(state.progress.currentSystem, state.progress.currentZone)
    }
    return false
  }

  function saveToStorage() {
    saveGame({
      money: state.money,
      upgrades: { ...state.upgrades },
      progress: {
        currentSystem: state.progress.currentSystem,
        currentZone: state.progress.currentZone,
        zoneCompleted: state.progress.zoneCompleted.map(arr => [...arr])
      },
      collectionLog: [...state.collectionLog],
      totalCollected: { ...state.totalCollected }
    })
  }

  function resetSession() {
    state.sessionScore = 0
    state.sessionCollected = 0
    state.isGameOver = false
    state.isPaused = false
  }

  function togglePause() {
    state.isPaused = !state.isPaused
    return state.isPaused
  }

  function toggleUpgradePanel() {
    state.showUpgradePanel = !state.showUpgradePanel
    if (state.showUpgradePanel) {
      state.showMissionPanel = false
      state.isPaused = true
    }
    return state.showUpgradePanel
  }

  function toggleMissionPanel() {
    state.showMissionPanel = !state.showMissionPanel
    if (state.showMissionPanel) {
      state.showUpgradePanel = false
      state.isPaused = true
    }
    return state.showMissionPanel
  }

  function closePanels() {
    state.showUpgradePanel = false
    state.showMissionPanel = false
    state.isPaused = false
  }

  return {
    state,
    canAffordUpgrade,
    buyUpgrade,
    getUpgradeLevel,
    addMoney,
    addCollected,
    selectZone,
    isSystemUnlocked,
    isZoneUnlocked,
    completeZone,
    checkZoneComplete,
    saveToStorage,
    resetSession,
    togglePause,
    toggleUpgradePanel,
    toggleMissionPanel,
    closePanels
  }
}
