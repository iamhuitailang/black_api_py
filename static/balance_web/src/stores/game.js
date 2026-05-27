import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { saveApi, scoreApi } from '@/utils/api'

let blockIdCounter = 0

export const useGameStore = defineStore('game', () => {
  const user = ref({ id: 1, username: 'guest', nickname: '游客玩家', total_score: 0 })
  const currentLevel = ref(null)
  const blocks = ref([])
  const isSimulating = ref(false)
  const score = ref(0)
  const centerOfGravity = ref({ x: 0, y: 0 })
  const tiltAngle = ref(0)
  const totalLoad = ref(0)
  const playTime = ref(0)
  const isCollapsed = ref(false)

  const blockCount = computed(() => blocks.value.length)
  const maxHeight = computed(() => {
    if (blocks.value.length === 0) return 0
    return Math.max(...blocks.value.map(b => b.y + b.height / 2))
  })

  function setLevel(level) {
    currentLevel.value = level
  }

  function setBlocks(newBlocks) {
    blocks.value = newBlocks
    calculatePhysics()
  }

  function addBlock(block) {
    const { id, ...blockData } = block
    blockIdCounter++
    blocks.value.push({
      ...blockData,
      id: `block_${Date.now()}_${blockIdCounter}`,
      rotation: blockData.rotation || 0
    })
    calculatePhysics()
  }

  function updateBlock(id, updates) {
    const index = blocks.value.findIndex(b => b.id === id)
    if (index !== -1) {
      blocks.value[index] = { ...blocks.value[index], ...updates }
      calculatePhysics()
    }
  }

  function removeBlock(id) {
    blocks.value = blocks.value.filter(b => b.id !== id)
    calculatePhysics()
  }

  function clearBlocks() {
    blocks.value = []
    score.value = 0
    isSimulating.value = false
    isCollapsed.value = false
    centerOfGravity.value = { x: 0, y: 0 }
    tiltAngle.value = 0
    totalLoad.value = 0
  }

  function calculatePhysics() {
    if (blocks.value.length === 0) {
      centerOfGravity.value = { x: 0, y: 0 }
      tiltAngle.value = 0
      totalLoad.value = 0
      score.value = 0
      return
    }

    let totalWeight = 0
    let weightedX = 0
    let weightedY = 0

    blocks.value.forEach(block => {
      totalWeight += block.weight
      weightedX += block.x * block.weight
      weightedY += block.y * block.weight
    })

    if (totalWeight > 0) {
      centerOfGravity.value = {
        x: weightedX / totalWeight,
        y: weightedY / totalWeight
      }

      const baseCenter = 400
      const offset = centerOfGravity.value.x - baseCenter
      const heightFactor = Math.min(centerOfGravity.value.y / 200, 3)
      tiltAngle.value = Math.min(Math.abs(offset) * heightFactor * 0.3, 45) * Math.sign(offset)
    }

    totalLoad.value = totalWeight

    score.value = Math.floor(maxHeight.value * 2 + blocks.value.length * 10)
  }

  function startSimulation() {
    isSimulating.value = true
    isCollapsed.value = false
  }

  function stopSimulation(collapsed = false) {
    isSimulating.value = false
    isCollapsed.value = collapsed
  }

  async function saveGame(autoSave = false, saveName = null) {
    if (!user.value.id || !currentLevel.value) return
    try {
      await saveApi.createSave({
        user_id: user.value.id,
        level_id: currentLevel.value.id,
        blocks_data: JSON.stringify(blocks.value),
        save_name: saveName,
        current_score: score.value,
        current_height: maxHeight.value,
        is_auto_save: autoSave
      })
    } catch (e) {
      console.error('Save failed:', e)
    }
  }

  async function loadGame(saveData) {
    if (saveData.blocks_data) {
      try {
        const parsedBlocks = JSON.parse(saveData.blocks_data)
        if (Array.isArray(parsedBlocks)) {
          blocks.value = parsedBlocks
          score.value = saveData.current_score || 0
          calculatePhysics()
        }
      } catch (e) {
        console.error('Parse save data failed:', e)
      }
    }
  }

  async function loadAutoSave() {
    if (!user.value.id || !currentLevel.value) return null
    try {
      const save = await saveApi.getAutoSave(user.value.id, currentLevel.value.id)
      if (save) {
        await loadGame(save)
        return save
      }
    } catch (e) {
      console.error('Load autosave failed:', e)
    }
    return null
  }

  async function submitScore(isStable) {
    if (!user.value.id || !currentLevel.value) return
    try {
      await scoreApi.createScore({
        user_id: user.value.id,
        level_id: currentLevel.value.id,
        score: score.value,
        height: maxHeight.value,
        blocks_used: blocks.value.length,
        is_stable: isStable,
        play_time: playTime.value
      })
    } catch (e) {
      console.error('Submit score failed:', e)
    }
  }

  return {
    user,
    currentLevel,
    blocks,
    isSimulating,
    score,
    centerOfGravity,
    tiltAngle,
    totalLoad,
    playTime,
    isCollapsed,
    blockCount,
    maxHeight,
    setLevel,
    setBlocks,
    addBlock,
    updateBlock,
    removeBlock,
    clearBlocks,
    calculatePhysics,
    startSimulation,
    stopSimulation,
    saveGame,
    loadGame,
    loadAutoSave,
    submitScore
  }
})
