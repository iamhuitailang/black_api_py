<template>
  <div class="game-container">
    <div class="cloud cloud1"></div>
    <div class="cloud cloud2"></div>
    <div class="cloud cloud3"></div>
    <div class="rainbow-bg"></div>
    <div class="stars">
      <span class="star star1">✨</span>
      <span class="star star2">⭐</span>
      <span class="star star3">✨</span>
      <span class="star star4">🌟</span>
    </div>
    
    <div class="game-header">
      <div class="header-left">
        <button class="btn btn-secondary" @click="goBack">← 返回</button>
        <div class="level-info">
          <span class="level-emoji">🎠</span>
          <span class="level-name">{{ currentLevel?.name || '加载中...' }}</span>
          <span class="level-difficulty">{{ '⭐'.repeat(currentLevel?.difficulty || 1) }}</span>
        </div>
      </div>
      <div class="header-right">
        <div class="stat-item">
          <span class="stat-label">🎯 分数</span>
          <span class="stat-value">{{ gameStore.score }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">📏 高度</span>
          <span class="stat-value">{{ Math.round(gameStore.maxHeight) }} / {{ currentLevel?.target_height || 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">🧱 方块</span>
          <span class="stat-value">{{ gameStore.blockCount }}</span>
        </div>
      </div>
    </div>

    <div class="game-body">
      <div class="block-toolbar card">
        <div class="toolbar-header">
          <span class="toolbar-icon">🧱</span>
          <span>建材库</span>
        </div>
        <p class="toolbar-hint">拖拽到搭建区</p>
        <div 
          v-for="block in blockTemplates" 
          :key="block.id"
          class="block-item"
          :class="{ selected: selectedBlock?.id === block.id }"
          :style="{ '--block-color': block.color }"
          draggable="true"
          @dragstart="onDragStart($event, block)"
          @click="selectBlock(block)"
        >
          <div class="block-preview" :class="block.type">
            <div class="block-shape" :style="{ background: getBlockGradient(block) }">
              <div class="block-highlight"></div>
              <div v-if="block.type === 'hollow_frame'" class="hollow-dot"></div>
            </div>
          </div>
          <div class="block-info">
            <span class="block-name">{{ block.name }}</span>
            <div class="block-tags">
              <span class="tag weight">重{{ block.weight }}</span>
              <span class="tag capacity">承{{ block.load_capacity }}</span>
            </div>
          </div>
        </div>
      </div>

      <div 
        class="game-area"
        ref="gameAreaRef"
        @dragover.prevent
        @drop="onDrop"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseUp"
        @click="onGameAreaClick"
      >
        <div class="sky-gradient"></div>
        <div class="ground">
          <div class="ground-grass">
            <div class="grass-blade" v-for="i in 20" :key="i" :style="{ left: (i * 5) + '%' }"></div>
          </div>
          <div class="ground-dirt"></div>
        </div>
        
        <div class="ground-decorations">
          <div class="flower flower1">🌸</div>
          <div class="flower flower2">🌷</div>
          <div class="flower flower3">🌻</div>
          <div class="mushroom">🍄</div>
          <div class="butterfly">🦋</div>
        </div>

        <div class="target-line" :style="{ bottom: currentLevel?.target_height + 40 + 'px' }">
          <div class="target-flag">
            <span class="flag-icon">🚩</span>
            <span>目标高度 {{ currentLevel?.target_height }}px</span>
          </div>
        </div>

        <div 
          v-for="block in gameStore.blocks" 
          :key="block.id"
          class="placed-block"
          :class="{ 
            falling: isBlockFalling(block), 
            collapsing: gameStore.isCollapsed,
            dragging: draggingBlock?.id === block.id,
            selected: selectedPlacedBlock?.id === block.id,
            'just-placed': justPlacedIds.has(block.id)
          }"
          :style="getBlockStyle(block)"
          @mousedown="onBlockMouseDown($event, block)"
          @click.stop="onBlockClick(block)"
        >
          <div class="block-content" :style="{ background: getBlockGradient(block) }">
            <div class="block-highlight"></div>
            <div v-if="block.type === 'hollow_frame'" class="hollow-inner">
              <div class="hollow-highlight"></div>
            </div>
            <div v-if="block.type === 'weight_block'" class="weight-bolts">
              <div class="bolt bolt1"></div>
              <div class="bolt bolt2"></div>
              <div class="bolt bolt3"></div>
              <div class="bolt bolt4"></div>
            </div>
            <div v-if="block.type === 'angle_bracket'" class="bracket-line"></div>
            <div v-if="block.type === 'long_beam'" class="beam-lines">
              <div class="beam-line line1"></div>
              <div class="beam-line line2"></div>
            </div>
          </div>
          <div v-if="selectedPlacedBlock?.id === block.id && !gameStore.isSimulating" class="block-controls">
            <button class="ctrl-btn rotate-left" @click.stop="rotateBlock(block, -45)">↺</button>
            <button class="ctrl-btn rotate-right" @click.stop="rotateBlock(block, 45)">↻</button>
            <button class="ctrl-btn delete" @click.stop="removeBlock(block)">🗑️</button>
          </div>
        </div>

        <div 
          v-if="gameStore.blocks.length > 0" 
          class="center-of-gravity"
          :style="{ 
            left: gameStore.centerOfGravity.x + 'px', 
            bottom: gameStore.centerOfGravity.y + 40 + 'px' 
          }"
        >
          <div class="cog-indicator">
            <div class="cog-ring"></div>
            <div class="cog-dot"></div>
          </div>
          <span class="cog-label">⚖️</span>
        </div>

        <div v-if="gameStore.isSimulating" class="wind-effect">
          <div class="wind-line" v-for="i in 8" :key="i" :style="{ animationDelay: i * 0.15 + 's', top: (15 + i * 8) + '%' }">
            <span class="wind-emoji">💨</span>
          </div>
        </div>

        <div v-if="gameStore.blocks.length === 0" class="empty-hint">
          <div class="empty-emoji">🎨</div>
          <p>从左侧拖拽建材到这里开始搭建吧！</p>
        </div>
      </div>

      <div class="status-panel card">
        <div class="status-header">
          <span class="status-icon">📊</span>
          <span>状态面板</span>
        </div>
        
        <div class="status-item">
          <span class="status-label">⚖️ 重心偏移</span>
          <div class="tilt-indicator">
            <div class="tilt-track">
              <div class="tilt-center-line"></div>
              <div 
                class="tilt-pointer" 
                :style="{ left: 50 + gameStore.tiltAngle + '%' }"
                :class="getTiltClass()"
              ></div>
            </div>
            <span class="tilt-value" :class="getTiltClass()">{{ gameStore.tiltAngle.toFixed(1) }}°</span>
          </div>
        </div>

        <div class="status-item">
          <span class="status-label">🏋️ 总重量</span>
          <span class="status-value-lg">{{ gameStore.totalLoad.toFixed(0) }}</span>
        </div>

        <div class="status-item">
          <span class="status-label">🌬️ 风力等级</span>
          <div class="wind-display">
            <span v-for="i in 5" :key="i" :class="{ active: i <= Math.ceil((currentLevel?.wind_force || 0) / 5) }">💨</span>
          </div>
        </div>

        <div class="status-item tips">
          <span class="status-label">💡 提示</span>
          <span class="tips-text">{{ currentTip }}</span>
        </div>

        <div class="action-buttons">
          <button 
            class="btn btn-success" 
            :disabled="gameStore.isSimulating || gameStore.blocks.length === 0"
            @click="startSimulation"
          >
            ▶️ 开始测试
          </button>
          <button 
            class="btn btn-warning" 
            v-if="gameStore.isSimulating"
            @click="stopSimulation"
          >
            ⏹️ 停止
          </button>
          <div class="secondary-buttons">
            <button class="btn btn-secondary small" @click="clearAll" :disabled="gameStore.isSimulating">
              🗑️ 清空
            </button>
            <button class="btn btn-secondary small" @click="saveGame" :disabled="gameStore.isSimulating || gameStore.blocks.length === 0">
              💾 保存
            </button>
          </div>
        </div>

        <div v-if="showResult" class="result-overlay">
          <div class="result-card card">
            <div class="result-icon">{{ isWin ? '🎉' : '💥' }}</div>
            <h2 v-if="isWin">恭喜过关！</h2>
            <h2 v-else>结构倒塌了！</h2>
            <div class="result-stats">
              <div class="stat-row">
                <span>🎯 最终分数</span>
                <span class="stat-highlight">{{ gameStore.score }}</span>
              </div>
              <div class="stat-row">
                <span>📏 达到高度</span>
                <span class="stat-highlight">{{ Math.round(gameStore.maxHeight) }}px</span>
              </div>
              <div class="stat-row">
                <span>🧱 使用方块</span>
                <span class="stat-highlight">{{ gameStore.blockCount }}个</span>
              </div>
            </div>
            <div class="result-actions">
              <button class="btn btn-primary" @click="retry">🔄 再试一次</button>
              <button class="btn btn-secondary" @click="goBack">🏠 返回</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showSaveConfirm" class="modal-overlay" @click="showSaveConfirm = false">
      <div class="modal card" @click.stop>
        <div class="modal-icon">💾</div>
        <h3>保存游戏</h3>
        <input 
          v-model="saveName" 
          type="text" 
          placeholder="输入存档名称"
          class="save-input"
          @keyup.enter="confirmSave"
          ref="saveInputRef"
        />
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showSaveConfirm = false">取消</button>
          <button class="btn btn-primary" @click="confirmSave">确认保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { levelApi, blockApi } from '@/utils/api'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()

const gameAreaRef = ref(null)
const saveInputRef = ref(null)
const blockTemplates = ref([])
const selectedBlock = ref(null)
const selectedPlacedBlock = ref(null)
const currentLevel = ref(null)
const showResult = ref(false)
const isWin = ref(false)
const showSaveConfirm = ref(false)
const saveName = ref('')
const simulationTimer = ref(null)
const autoSaveTimer = ref(null)
const draggingBlock = ref(null)
const dragStartPos = ref({ x: 0, y: 0 })
const blockStartPos = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const justPlacedIds = ref(new Set())

const tips = [
  '从左侧拖拽建材到搭建区',
  '按住已放置的方块可以拖动调整位置',
  '点击方块可以旋转或删除',
  '注意重心位置，保持结构平衡',
  '高难度关卡会有强风挑战',
  '使用配重铁块可以稳定重心'
]
const currentTipIndex = ref(0)
const currentTip = computed(() => tips[currentTipIndex.value])

function rotateTips() {
  currentTipIndex.value = (currentTipIndex.value + 1) % tips.length
}

let tipTimer = null

onMounted(async () => {
  tipTimer = setInterval(rotateTips, 5000)
  await loadLevel()
  await loadBlockTemplates()
  
  try {
    const saved = localStorage.getItem('balance_game_save')
    if (saved) {
      const data = JSON.parse(saved)
      if (data.levelId !== currentLevel.value?.id) {
        localStorage.removeItem('balance_game_save')
      }
    }
  } catch (e) {
    console.error('Check saved data failed:', e)
  }
  
  await loadSavedBlocks()
  
  autoSaveTimer.value = setInterval(() => {
    if (gameStore.blocks.length > 0 && !gameStore.isSimulating) {
      saveToLocalStorage()
    }
  }, 3000)
})

onUnmounted(() => {
  if (tipTimer) clearInterval(tipTimer)
  if (simulationTimer.value) clearInterval(simulationTimer.value)
  if (autoSaveTimer.value) clearInterval(autoSaveTimer.value)
})

watch(() => route.params.levelId, async (newLevelId, oldLevelId) => {
  if (newLevelId !== oldLevelId) {
    if (autoSaveTimer.value) {
      clearInterval(autoSaveTimer.value)
      autoSaveTimer.value = null
    }
    
    clearLocalStorageSave()
    gameStore.clearBlocks()
    selectedPlacedBlock.value = null
    showResult.value = false
    draggingBlock.value = null
    isDragging.value = false
    selectedBlock.value = null
    justPlacedIds.value.clear()
    
    await nextTick()
    await loadLevel()
    await loadSavedBlocks()
    
    autoSaveTimer.value = setInterval(() => {
      if (gameStore.blocks.length > 0 && !gameStore.isSimulating) {
        saveToLocalStorage()
      }
    }, 3000)
  }
}, { immediate: false })

function clearLocalStorageSave() {
  try {
    localStorage.removeItem('balance_game_save')
  } catch (e) {
    console.error('Clear localStorage failed:', e)
  }
}

function saveToLocalStorage() {
  try {
    const saveData = {
      blocks: gameStore.blocks,
      levelId: currentLevel.value?.id
    }
    localStorage.setItem('balance_game_save', JSON.stringify(saveData))
  } catch (e) {
    console.error('Local storage save failed:', e)
  }
}

function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem('balance_game_save')
    if (saved) {
      const data = JSON.parse(saved)
      if (data.levelId === currentLevel.value?.id && data.blocks && data.blocks.length > 0) {
        return data.blocks
      }
    }
  } catch (e) {
    console.error('Local storage load failed:', e)
  }
  return null
}

async function loadSavedBlocks() {
  if (!currentLevel.value) {
    gameStore.clearBlocks()
    return
  }
  
  const localBlocks = loadFromLocalStorage()
  if (localBlocks && localBlocks.length > 0) {
    gameStore.setBlocks(localBlocks)
    return
  }
  
  gameStore.clearBlocks()
}

async function loadLevel() {
  const levelId = route.params.levelId || 1
  try {
    currentLevel.value = await levelApi.getLevel(levelId)
  } catch (e) {
    const levelConfigs = {
      1: { name: '新手村 - 初次尝试', target_height: 200, wind_force: 0, difficulty: 1 },
      2: { name: '微风平原', target_height: 300, wind_force: 5, difficulty: 2 },
      3: { name: '彩虹桥', target_height: 400, wind_force: 10, difficulty: 3 },
      4: { name: '云端高塔', target_height: 500, wind_force: 15, difficulty: 4 },
      5: { name: '风暴之巅', target_height: 600, wind_force: 25, difficulty: 5 }
    }
    currentLevel.value = {
      id: parseInt(levelId),
      ...(levelConfigs[levelId] || levelConfigs[1]),
      gravity: 9.8
    }
  }
  gameStore.setLevel(currentLevel.value)
}

async function loadBlockTemplates() {
  try {
    blockTemplates.value = await blockApi.getBlocks()
  } catch (e) {
    blockTemplates.value = [
      { id: 1, name: '实心方块', type: 'solid_block', width: 80, height: 80, weight: 100, load_capacity: 500, color: '#FF6B6B' },
      { id: 2, name: '空心框架', type: 'hollow_frame', width: 80, height: 80, weight: 30, load_capacity: 200, color: '#4ECDC4' },
      { id: 3, name: '斜角支架', type: 'angle_bracket', width: 80, height: 40, weight: 50, load_capacity: 250, color: '#FFE66D' },
      { id: 4, name: '长条横梁', type: 'long_beam', width: 160, height: 30, weight: 40, load_capacity: 150, color: '#95E1D3' },
      { id: 5, name: '配重铁块', type: 'weight_block', width: 60, height: 60, weight: 200, load_capacity: 800, color: '#6C5B7B' }
    ]
  }
}

function selectBlock(block) {
  selectedBlock.value = block
}

function onDragStart(event, block) {
  selectedBlock.value = block
  event.dataTransfer.setData('blockId', block.id)
  event.dataTransfer.effectAllowed = 'copy'
}

function onDrop(event) {
  if (!selectedBlock.value) return
  if (!gameAreaRef.value) return
  
  const rect = gameAreaRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = rect.bottom - event.clientY
  
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    selectedBlock.value = null
    return
  }
  
  const halfW = selectedBlock.value.width / 2
  const halfH = selectedBlock.value.height / 2
  const groundOffset = 40
  
  const minX = halfW + 10
  const maxX = rect.width - halfW - 10
  const minY = halfH + groundOffset
  const maxY = rect.height - halfH - 10
  
  const clampedX = Math.max(minX, Math.min(maxX, x))
  const clampedY = Math.max(minY, Math.min(maxY, y))
  
  if (!Number.isFinite(clampedX) || !Number.isFinite(clampedY)) {
    selectedBlock.value = null
    return
  }
  
  const block = {
    ...selectedBlock.value,
    x: clampedX,
    y: clampedY,
    rotation: 0
  }
  
  gameStore.addBlock(block)
  
  const newBlock = gameStore.blocks[gameStore.blocks.length - 1]
  if (newBlock) {
    justPlacedIds.value.add(newBlock.id)
    setTimeout(() => {
      justPlacedIds.value.delete(newBlock.id)
    }, 600)
  }
  
  selectedPlacedBlock.value = null
  saveToLocalStorage()
  
  selectedBlock.value = null
}

function onBlockMouseDown(event, block) {
  if (gameStore.isSimulating) return
  if (event.button !== 0) return
  
  draggingBlock.value = block
  dragStartPos.value = { x: event.clientX, y: event.clientY }
  blockStartPos.value = { x: block.x, y: block.y }
  isDragging.value = false
  
  event.preventDefault()
}

function onMouseMove(event) {
  if (!draggingBlock.value) return
  
  const dx = event.clientX - dragStartPos.value.x
  const dy = event.clientY - dragStartPos.value.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  if (distance > 3) {
    isDragging.value = true
  }
  
  if (isDragging.value) {
    const newX = blockStartPos.value.x + dx
    const newY = blockStartPos.value.y - dy
    
    const rect = gameAreaRef.value.getBoundingClientRect()
    const clampedX = Math.max(40, Math.min(rect.width - 40, newX))
    const clampedY = Math.max(draggingBlock.value.height / 2 + 40, newY)
    
    gameStore.updateBlock(draggingBlock.value.id, { x: clampedX, y: clampedY })
  }
}

function onMouseUp() {
  if (draggingBlock.value) {
    if (isDragging.value) {
      saveToLocalStorage()
    }
    draggingBlock.value = null
    isDragging.value = false
  }
}

function onGameAreaClick() {
  selectedPlacedBlock.value = null
}

function onBlockClick(block) {
  if (gameStore.isSimulating) return
  if (isDragging.value) return
  selectedPlacedBlock.value = block
}

function rotateBlock(block, degrees) {
  gameStore.updateBlock(block.id, {
    rotation: (block.rotation || 0) + degrees
  })
  saveToLocalStorage()
}

function removeBlock(block) {
  gameStore.removeBlock(block.id)
  selectedPlacedBlock.value = null
  saveToLocalStorage()
}

function getBlockStyle(block) {
  return {
    left: (block.x - block.width / 2) + 'px',
    bottom: (block.y - block.height / 2) + 'px',
    width: block.width + 'px',
    height: block.height + 'px',
    transform: `rotate(${block.rotation || 0}deg)`,
    '--block-color': block.color
  }
}

function getBlockGradient(block) {
  const color = block.color
  return `linear-gradient(145deg, ${lightenColor(color, 15)} 0%, ${color} 40%, ${darkenColor(color, 10)} 100%)`
}

function lightenColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, (num >> 16) + amt)
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt)
  const B = Math.min(255, (num & 0x0000FF) + amt)
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
}

function darkenColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.max(0, (num >> 16) - amt)
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt)
  const B = Math.max(0, (num & 0x0000FF) - amt)
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
}

function getTiltClass() {
  const angle = Math.abs(gameStore.tiltAngle)
  if (angle < 5) return 'safe'
  if (angle < 15) return 'warning'
  return 'danger'
}

function startSimulation() {
  if (gameStore.blocks.length === 0) return
  
  gameStore.startSimulation()
  showResult.value = false
  selectedPlacedBlock.value = null
  
  let time = 0
  const maxTime = 60
  const windForce = currentLevel.value?.wind_force || 0
  
  simulationTimer.value = setInterval(() => {
    time++
    
    gameStore.blocks.forEach(block => {
      const windEffect = windForce * Math.sin(time * 0.3) * 0.3
      const gravityEffect = 0.3
      
      const newY = block.y - gravityEffect
      const newX = block.x + windEffect
      
      if (newY > block.height / 2 + 40) {
        gameStore.updateBlock(block.id, { y: newY, x: newX })
      }
    })
    
    if (Math.abs(gameStore.tiltAngle) > 35 || time >= maxTime) {
      const collapsed = Math.abs(gameStore.tiltAngle) > 35
      stopSimulation(collapsed)
    }
  }, 80)
}

function stopSimulation(collapsed = false) {
  if (simulationTimer.value) {
    clearInterval(simulationTimer.value)
    simulationTimer.value = null
  }
  
  gameStore.stopSimulation(collapsed)
  
  const reachedTarget = gameStore.maxHeight >= (currentLevel.value?.target_height || 0)
  isWin.value = !collapsed && reachedTarget
  showResult.value = true
  
  try {
    gameStore.submitScore(!collapsed && reachedTarget)
    if (!collapsed && reachedTarget) {
      gameStore.saveGame(true)
    }
  } catch (e) {
    console.error('Save score failed:', e)
  }
}

function isBlockFalling(block) {
  return gameStore.isSimulating && block.y > block.height / 2 + 45
}

function clearAll() {
  gameStore.clearBlocks()
  selectedPlacedBlock.value = null
  showResult.value = false
  clearLocalStorageSave()
}

function retry() {
  showResult.value = false
  gameStore.clearBlocks()
  clearLocalStorageSave()
}

function saveGame() {
  if (gameStore.blocks.length === 0) return
  saveName.value = ''
  showSaveConfirm.value = true
  nextTick(() => {
    saveInputRef.value?.focus()
  })
}

async function confirmSave() {
  await gameStore.saveGame(false, saveName.value || undefined)
  saveToLocalStorage()
  showSaveConfirm.value = false
}

function goBack() {
  if (gameStore.blocks.length > 0 && !gameStore.isSimulating) {
    saveToLocalStorage()
    try {
      gameStore.saveGame(true)
    } catch (e) {
      console.error('Auto save failed:', e)
    }
  }
  router.push('/')
}
</script>

<style scoped>
.game-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: linear-gradient(180deg, #E3F2FD 0%, #BBDEFB 25%, #C8E6C9 60%, #A5D6A7 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.rainbow-bg {
  position: absolute;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 300px;
  border-radius: 300px 300px 0 0;
  background: 
    linear-gradient(180deg, 
      transparent 0%, 
      transparent 50%,
      rgba(255, 182, 193, 0.15) 55%,
      rgba(255, 218, 185, 0.15) 65%,
      rgba(255, 255, 224, 178, 0.15) 75%,
      rgba(144, 238, 144, 0.15) 85%,
      transparent 100%
    );
  pointer-events: none;
  z-index: 1;
}

.stars {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 2;
}

.star {
  position: absolute;
  animation: twinkle 2s ease-in-out infinite;
  opacity: 0.6;
}

.star1 { top: 8%; left: 25%; animation-delay: 0s; }
.star2 { top: 12%; right: 20%; animation-delay: 0.5s; font-size: 14px; }
.star3 { top: 18%; left: 50%; animation-delay: 1s; font-size: 12px; }
.star4 { top: 6%; right: 35%; animation-delay: 1.5s; font-size: 16px; }

@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 0.8; transform: scale(1.2); }
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 253, 250, 0.95) 100%);
  backdrop-filter: blur(10px);
  z-index: 100;
  border-bottom: 3px solid rgba(255, 182, 193, 0.4);
  box-shadow: 0 2px 20px rgba(255, 182, 193, 0.15);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.level-info {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #FFF5F7 0%, #FFF0F5 100%);
  padding: 8px 16px;
  border-radius: 20px;
  border: 2px solid #FFE4E9;
}

.level-emoji {
  font-size: 20px;
}

.level-name {
  font-size: 16px;
  font-weight: bold;
  color: #FF6B9D;
}

.level-difficulty {
  font-size: 12px;
  color: #FFB74D;
}

.header-right {
  display: flex;
  gap: 30px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(135deg, #FFF9F0 0%, #FFF5E6 100%);
  padding: 6px 16px;
  border-radius: 12px;
  border: 2px solid #FFE0B2;
}

.stat-label {
  font-size: 10px;
  color: #999;
}

.stat-value {
  font-size: 16px;
  font-weight: bold;
  color: #FF6B9D;
}

.game-body {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 16px;
  overflow: hidden;
}

.block-toolbar {
  width: 170px;
  overflow-y: auto;
  border-radius: 24px;
  padding: 16px;
}

.toolbar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #FF6B9D;
  font-weight: bold;
  font-size: 15px;
  margin-bottom: 4px;
}

.toolbar-icon {
  font-size: 18px;
}

.toolbar-hint {
  text-align: center;
  font-size: 10px;
  color: #999;
  margin-bottom: 12px;
  background: #FFF5F7;
  padding: 4px 8px;
  border-radius: 8px;
}

.block-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  margin-bottom: 10px;
  background: linear-gradient(135deg, #FFFEFE 0%, #FFF8FA 100%);
  border-radius: 14px;
  cursor: grab;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 3px solid transparent;
}

.block-item:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 10px 30px rgba(255, 107, 157, 0.2);
}

.block-item.selected {
  border-color: var(--block-color);
  box-shadow: 0 0 20px var(--block-color), 0 8px 25px rgba(0,0,0,0.08);
  transform: translateY(-2px) scale(1.03);
}

.block-preview {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.block-shape {
  border-radius: 10px;
  position: relative;
  overflow: hidden;
  box-shadow: 3px 3px 10px rgba(0,0,0,0.12), inset -2px -2px 6px rgba(0,0,0,0.08), inset 2px 2px 6px rgba(255,255,255,0.25);
}

.block-highlight {
  position: absolute;
  top: 8%;
  left: 12%;
  width: 35%;
  height: 35%;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  filter: blur(2px);
}

.hollow-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 55%;
  height: 55%;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 6px;
  box-shadow: inset 1px 1px 3px rgba(0,0,0,0.1);
}

.solid_block .block-shape { width: 36px; height: 36px; }
.hollow_frame .block-shape { width: 36px; height: 36px; }
.angle_bracket .block-shape { width: 36px; height: 22px; transform: rotate(-12deg); }
.long_beam .block-shape { width: 46px; height: 14px; }
.weight_block .block-shape { width: 32px; height: 32px; }

.block-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.block-name {
  font-size: 11px;
  font-weight: bold;
  color: #555;
}

.block-tags {
  display: flex;
  gap: 4px;
}

.tag {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 6px;
  color: white;
}

.tag.weight {
  background: linear-gradient(135deg, #90CAF9 0%, #64B5F6 100%);
}

.tag.capacity {
  background: linear-gradient(135deg, #A5D6A7 0%, #81C784 100%);
}

.game-area {
  flex: 1;
  position: relative;
  background: linear-gradient(180deg, 
    rgba(179, 229, 252, 0.4) 0%, 
    rgba(200, 230, 201, 0.5) 50%, 
    rgba(165, 214, 167, 0.6) 100%
  );
  border-radius: 28px;
  overflow: hidden;
  min-width: 450px;
  border: 4px solid rgba(255, 255, 255, 0.6);
  box-shadow: 
    inset 0 0 60px rgba(255, 255, 255, 0.4),
    0 8px 32px rgba(0, 0, 0, 0.08);
}

.sky-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(180deg, 
    rgba(179, 229, 252, 0.6) 0%,
    transparent 100%
  );
  pointer-events: none;
}

.ground {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  z-index: 5;
}

.ground-grass {
  height: 18px;
  background: linear-gradient(180deg, #81C784 0%, #66BB6A 100%);
  border-top: 4px solid #A5D6A7;
  position: relative;
  overflow: hidden;
}

.grass-blade {
  position: absolute;
  bottom: 0;
  width: 4px;
  height: 12px;
  background: linear-gradient(180deg, #9CCC65 0%, #7CB342 100%);
  border-radius: 2px 2px 0 0;
  transform: rotate(-5deg);
}

.grass-blade:nth-child(odd) {
  transform: rotate(5deg);
  height: 10px;
}

.grass-blade:nth-child(3n) {
  height: 14px;
}

.ground-dirt {
  height: 22px;
  background: linear-gradient(180deg, #A1887F 0%, #8D6E63 100%);
  border-top: 2px solid #BCAAA4;
}

.ground-decorations {
  position: absolute;
  bottom: 30px;
  left: 0;
  right: 0;
  pointer-events: none;
  font-size: 20px;
  z-index: 4;
}

.flower {
  position: absolute;
  bottom: 0;
  animation: sway 3s ease-in-out infinite;
}

.flower1 { left: 8%; animation-delay: 0s; }
.flower2 { left: 28%; animation-delay: 0.5s; font-size: 18px; }
.flower3 { right: 12%; animation-delay: 1s; font-size: 22px; }
.mushroom { right: 32%; bottom: 3px; font-size: 18px; animation: sway 2.5s ease-in-out infinite; animation-delay: 0.3s; }
.butterfly { 
  position: absolute; 
  top: 20%; 
  left: 20%; 
  font-size: 18px;
  animation: butterfly 8s ease-in-out infinite;
}

@keyframes sway {
  0%, 100% { transform: rotate(-8deg); }
  50% { transform: rotate(8deg); }
}

@keyframes butterfly {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(30px, -20px) rotate(15deg); }
  50% { transform: translate(60px, 10px) rotate(-10deg); }
  75% { transform: translate(30px, -10px) rotate(5deg); }
}

.target-line {
  position: absolute;
  left: 10px;
  right: 10px;
  height: 3px;
  background: repeating-linear-gradient(90deg, #FF6B9D 0px, #FF6B9D 10px, transparent 10px, transparent 20px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 6;
}

.target-flag {
  background: linear-gradient(135deg, #FF6B9D 0%, #FF8E53 100%);
  color: white;
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 11px;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.4);
  display: flex;
  align-items: center;
  gap: 4px;
}

.flag-icon {
  font-size: 14px;
}

.placed-block {
  position: absolute;
  cursor: grab;
  transition: box-shadow 0.2s ease;
  z-index: 10;
}

.placed-block:active {
  cursor: grabbing;
}

.placed-block:hover .block-content {
  box-shadow: 0 0 25px var(--block-color), 0 8px 25px rgba(0, 0, 0, 0.15);
}

.placed-block.selected .block-content {
  box-shadow: 0 0 30px var(--block-color), 0 0 50px rgba(255, 107, 157, 0.3);
}

.placed-block.dragging {
  z-index: 1000;
  opacity: 0.95;
}

.placed-block.falling {
  transition: left 0.08s linear, bottom 0.08s linear;
}

.placed-block.collapsing {
  animation: collapse 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes collapse {
  0% { opacity: 1; transform: rotate(0) scale(1); }
  30% { opacity: 0.9; transform: rotate(15deg) scale(0.95); }
  100% { opacity: 0; transform: rotate(45deg) translateY(150px) scale(0.7); }
}

.block-content {
  width: 100%;
  height: 100%;
  border-radius: 14px;
  box-shadow: 
    4px 4px 12px rgba(0, 0, 0, 0.15), 
    inset -3px -3px 8px rgba(0, 0, 0, 0.1), 
    inset 3px 3px 10px rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.block-content .block-highlight {
  position: absolute;
  top: 10%;
  left: 12%;
  width: 30%;
  height: 30%;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  filter: blur(3px);
}

.hollow-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 55%;
  height: 55%;
  background: linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(240,248,255,0.6) 100%);
  border-radius: 8px;
  box-shadow: inset 2px 2px 6px rgba(0, 0, 0, 0.08);
}

.hollow-highlight {
  position: absolute;
  top: 15%;
  left: 15%;
  width: 30%;
  height: 30%;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
}

.weight-bolts {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 8px;
}

.bolt {
  position: absolute;
  width: 10px;
  height: 10px;
  background: radial-gradient(circle, #B0BEC5 0%, #78909C 60%, #546E7A 100%);
  border-radius: 50%;
  box-shadow: 1px 1px 3px rgba(0,0,0,0.3);
}

.bolt1 { top: 6px; left: 6px; }
.bolt2 { top: 6px; right: 6px; }
.bolt3 { bottom: 6px; left: 6px; }
.bolt4 { bottom: 6px; right: 6px; }

.bracket-line {
  position: absolute;
  bottom: 10%;
  left: 10%;
  right: 10%;
  height: 4px;
  background: rgba(0,0,0,0.15);
  border-radius: 2px;
}

.beam-lines {
  position: absolute;
  top: 50%;
  left: 10%;
  right: 10%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.beam-line {
  height: 2px;
  background: rgba(0,0,0,0.1);
  border-radius: 1px;
}

.beam-line.line2 {
  width: 60%;
  margin: 0 auto;
}

.block-controls {
  position: absolute;
  top: -45px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  background: linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,250,252,0.95) 100%);
  padding: 6px 10px;
  border-radius: 20px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  border: 2px solid #FFE4E9;
}

.ctrl-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: bold;
}

.ctrl-btn:hover {
  transform: scale(1.15);
}

.ctrl-btn.rotate-left {
  background: linear-gradient(135deg, #80DEEA 0%, #4DD0E1 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(77, 208, 225, 0.4);
}

.ctrl-btn.rotate-right {
  background: linear-gradient(135deg, #FFE082 0%, #FFD54F 100%);
  color: #795548;
  box-shadow: 0 2px 8px rgba(255, 213, 79, 0.4);
}

.ctrl-btn.delete {
  background: linear-gradient(135deg, #EF9A9A 0%, #E57373 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(229, 115, 115, 0.4);
}

.center-of-gravity {
  position: absolute;
  transform: translate(-50%, 50%);
  z-index: 20;
  pointer-events: none;
}

.cog-indicator {
  position: relative;
  width: 28px;
  height: 28px;
}

.cog-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 3px solid #FF6B9D;
  border-radius: 50%;
  animation: cogPulse 1.5s ease-in-out infinite;
}

.cog-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background: radial-gradient(circle, #FF6B9D 0%, #FF4081 100%);
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(255, 107, 157, 0.6);
}

@keyframes cogPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.6; }
}

.cog-label {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 18px;
}

.wind-effect {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 40px;
  pointer-events: none;
  overflow: hidden;
  z-index: 15;
}

.wind-line {
  position: absolute;
  animation: windMove 2s linear infinite;
}

.wind-emoji {
  font-size: 16px;
  opacity: 0.7;
}

@keyframes windMove {
  0% { transform: translateX(-80px); }
  100% { transform: translateX(calc(100% + 80px)); }
}

.empty-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  opacity: 0.5;
  pointer-events: none;
}

.empty-emoji {
  font-size: 48px;
  margin-bottom: 12px;
  animation: floatEmoji 3s ease-in-out infinite;
}

@keyframes floatEmoji {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.empty-hint p {
  font-size: 14px;
  color: #888;
}

.status-panel {
  width: 210px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-radius: 24px;
  padding: 18px;
}

.status-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #FF6B9D;
  font-weight: bold;
  font-size: 15px;
}

.status-icon {
  font-size: 18px;
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.status-label {
  font-size: 11px;
  color: #888;
}

.tilt-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tilt-track {
  flex: 1;
  height: 14px;
  background: linear-gradient(90deg, 
    #FFAB91 0%, 
    #FFCC80 25%, 
    #A5D6A7 50%, 
    #FFCC80 75%, 
    #FFAB91 100%
  );
  border-radius: 7px;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
}

.tilt-center-line {
  position: absolute;
  top: -2px;
  left: 50%;
  width: 3px;
  height: calc(100% + 4px);
  background: rgba(0,0,0,0.25);
  border-radius: 2px;
}

.tilt-pointer {
  position: absolute;
  top: -4px;
  width: 10px;
  height: 22px;
  background: linear-gradient(180deg, #546E7A 0%, #37474F 100%);
  border-radius: 5px;
  transform: translateX(-50%);
  transition: left 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
}

.tilt-value {
  font-size: 13px;
  font-weight: bold;
  min-width: 50px;
  text-align: right;
}

.tilt-value.safe { color: #66BB6A; }
.tilt-value.warning { color: #FFA726; }
.tilt-value.danger { color: #EF5350; }

.status-value-lg {
  font-size: 22px;
  font-weight: bold;
  color: #546E7A;
  text-shadow: 1px 1px 0 rgba(255,255,255,0.5);
}

.wind-display {
  display: flex;
  gap: 2px;
}

.wind-display span {
  opacity: 0.2;
  transition: opacity 0.3s ease, transform 0.3s ease;
  font-size: 14px;
}

.wind-display span.active {
  opacity: 1;
  transform: scale(1.1);
}

.tips {
  background: linear-gradient(135deg, #FFF8E1 0%, #FFF3E0 100%);
  padding: 10px 12px;
  border-radius: 12px;
  border-left: 3px solid #FFB74D;
}

.tips-text {
  font-size: 11px;
  color: #795548;
  line-height: 1.4;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
}

.action-buttons .btn {
  padding: 10px;
  font-size: 13px;
  border-radius: 18px;
}

.secondary-buttons {
  display: flex;
  gap: 8px;
}

.secondary-buttons .btn {
  flex: 1;
  padding: 8px;
  font-size: 11px;
  border-radius: 14px;
}

.action-buttons .btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.result-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.result-card {
  text-align: center;
  min-width: 300px;
  animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes bounceIn {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}

.result-icon {
  font-size: 64px;
  margin-bottom: 12px;
  animation: resultBounce 0.6s ease 0.3s infinite;
}

@keyframes resultBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

.result-card h2 {
  margin-bottom: 20px;
  color: #FF6B9D;
  font-size: 24px;
}

.result-stats {
  margin-bottom: 24px;
  background: #FFF5F7;
  border-radius: 16px;
  padding: 16px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  font-size: 14px;
  color: #666;
  border-bottom: 2px dashed #FFE4E9;
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-highlight {
  font-weight: bold;
  color: #FF6B9D;
  font-size: 16px;
}

.result-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.result-actions .btn {
  padding: 14px 28px;
  font-size: 14px;
  border-radius: 22px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal {
  min-width: 300px;
  text-align: center;
  animation: bounceIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.modal-icon {
  font-size: 44px;
  margin-bottom: 8px;
}

.modal h3 {
  color: #FF6B9D;
  margin-bottom: 16px;
  font-size: 18px;
}

.save-input {
  width: 100%;
  padding: 14px;
  border: 3px solid #FFE4E9;
  border-radius: 14px;
  font-size: 14px;
  font-family: inherit;
  margin-bottom: 16px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  background: #FFFAFB;
}

.save-input:focus {
  outline: none;
  border-color: #FF6B9D;
  box-shadow: 0 0 15px rgba(255, 107, 157, 0.2);
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.modal-actions .btn {
  padding: 10px 24px;
  font-size: 13px;
  border-radius: 18px;
}

.placed-block.just-placed {
  animation: blockPlace 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes blockPlace {
  0% { 
    transform: scale(0.3) rotate(-10deg); 
    opacity: 0; 
  }
  50% { 
    transform: scale(1.15) rotate(5deg); 
    opacity: 1; 
  }
  70% { 
    transform: scale(0.95) rotate(-3deg); 
  }
  100% { 
    transform: scale(1) rotate(0deg); 
    opacity: 1; 
  }
}

.placed-block.just-placed .block-content {
  animation: rainbowGlow 0.8s ease;
}

@keyframes rainbowGlow {
  0%, 100% { 
    box-shadow: 0 0 20px var(--block-color), 4px 4px 12px rgba(0, 0, 0, 0.15), 
      inset -3px -3px 8px rgba(0, 0, 0, 0.1), 
      inset 3px 3px 10px rgba(255, 255, 255, 0.2);
  }
  25% { 
    box-shadow: 0 0 40px #FF6B9D, 0 0 60px #FFE66D, 4px 4px 12px rgba(0, 0, 0, 0.15), 
      inset -3px -3px 8px rgba(0, 0, 0, 0.1), 
      inset 3px 3px 10px rgba(255, 255, 255, 0.2);
  }
  50% { 
    box-shadow: 0 0 30px #4ECDC4, 0 0 50px #95E1D3, 4px 4px 12px rgba(0, 0, 0, 0.15), 
      inset -3px -3px 8px rgba(0, 0, 0, 0.1), 
      inset 3px 3px 10px rgba(255, 255, 255, 0.2);
  }
  75% { 
    box-shadow: 0 0 25px var(--block-color), 4px 4px 12px rgba(0, 0, 0, 0.15), 
      inset -3px -3px 8px rgba(0, 0, 0, 0.1), 
      inset 3px 3px 10px rgba(255, 255, 255, 0.2);
  }
}

.game-area::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 30%;
  background: linear-gradient(180deg, 
    rgba(255, 182, 193, 0.15) 0%,
    rgba(255, 218, 185, 0.1) 50%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 1;
}

.game-area::after {
  content: '';
  position: absolute;
  bottom: 40px;
  left: 0;
  right: 0;
  height: 20%;
  background: linear-gradient(0deg, 
    rgba(165, 214, 167, 0.3) 0%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 1;
}

.empty-hint {
  animation: gentleFloat 4s ease-in-out infinite;
}

@keyframes gentleFloat {
  0%, 100% { transform: translate(-50%, -50%); }
  50% { transform: translate(-50%, calc(-50% - 10px)); }
}

.empty-emoji {
  filter: drop-shadow(0 4px 8px rgba(255, 182, 193, 0.5));
}

.block-item {
  position: relative;
}

.block-item::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(135deg, #FF6B9D 0%, #FFE66D 50%, #4ECDC4 100%);
  border-radius: 16px;
  opacity: 0;
  z-index: -1;
  transition: opacity 0.3s ease;
}

.block-item:hover::before,
.block-item.selected::before {
  opacity: 0.6;
}

.block-item:hover {
  animation: wiggle 0.4s ease;
}

@keyframes wiggle {
  0%, 100% { transform: translateY(-3px) scale(1.02) rotate(0deg); }
  25% { transform: translateY(-3px) scale(1.02) rotate(-1deg); }
  75% { transform: translateY(-3px) scale(1.02) rotate(1deg); }
}

.status-item {
  position: relative;
}

.status-item:not(:last-child)::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 20%;
  right: 20%;
  height: 2px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(255, 182, 193, 0.3) 50%, 
    transparent 100%
  );
}

.btn-success {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { 
    box-shadow: 0 6px 20px rgba(17, 153, 142, 0.3), 
      inset 0 -3px 10px rgba(0,0,0,0.1), 
      inset 0 3px 10px rgba(255,255,255,0.3);
  }
  50% { 
    box-shadow: 0 6px 30px rgba(17, 153, 142, 0.5), 
      0 0 20px rgba(56, 239, 125, 0.3),
      inset 0 -3px 10px rgba(0,0,0,0.1), 
      inset 0 3px 10px rgba(255,255,255,0.3);
  }
}

.btn:hover::after {
  animation: shimmer 0.6s ease;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
</style>
