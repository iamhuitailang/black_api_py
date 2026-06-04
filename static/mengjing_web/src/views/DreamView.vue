<template>
  <div class="dream-view" :style="{ background: getDreamBackground() }">
    <div class="dream-overlay"></div>
    
    <div class="dream-header">
      <button class="btn back-btn" @click="exitDream">
        ← 离开梦境
      </button>
      <div class="dream-title">
        <h2>{{ dream?.title }}</h2>
        <span class="phase-indicator">梦境深度: Lv.{{ progress?.dreamPhase || 1 }}</span>
      </div>
      <div class="header-right">
        <button class="btn help-btn" @click="toggleHelpPanel" title="获取帮助">
          💡 提示
        </button>
        <div class="status-panel">
          <div class="status-item">
            <span class="status-label">信任</span>
            <div class="status-bar trust-bar">
              <div class="status-fill" :style="{ width: `${progress?.trustLevel || 0}%` }"></div>
            </div>
            <span class="status-value">{{ progress?.trustLevel || 0 }}%</span>
          </div>
          <div class="status-item">
            <span class="status-label">恐惧</span>
            <div class="status-bar fear-bar">
              <div class="status-fill" :style="{ width: `${progress?.fearLevel || 50}%` }"></div>
            </div>
            <span class="status-value">{{ progress?.fearLevel || 50 }}%</span>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="showTutorial" class="tutorial-overlay" @click="closeTutorial">
      <div class="tutorial-modal">
        <h2 class="tutorial-title">✧ 欢迎来到梦境 ✧</h2>
        <div class="tutorial-steps">
          <div class="tutorial-step">
            <span class="step-number">1</span>
            <div class="step-content">
              <h4>探索梦境</h4>
              <p>点击「可探索区域」进入不同的场景，每个场景都有独特的记忆和谜题。</p>
            </div>
          </div>
          <div class="tutorial-step">
            <span class="step-number">2</span>
            <div class="step-content">
              <h4>收集记忆碎片</h4>
              <p>找到发光的记忆碎片，了解患者的完整故事，解锁隐藏区域。</p>
            </div>
          </div>
          <div class="tutorial-step">
            <span class="step-number">3</span>
            <div class="step-content">
              <h4>解开象征谜题</h4>
              <p>梦境中的物品都有深层含义，理解它们的象征意义，帮助患者面对内心。</p>
            </div>
          </div>
          <div class="tutorial-step">
            <span class="step-number">4</span>
            <div class="step-content">
              <h4>关注信任与恐惧</h4>
              <p>你的选择会影响信任和恐惧值，最终决定结局走向。</p>
            </div>
          </div>
        </div>
        <p class="tutorial-tip">💡 随时点击右上角的「提示」按钮获取帮助</p>
        <button class="btn tutorial-btn" @click="closeTutorial">
          开始探索
        </button>
      </div>
    </div>
    
    <div v-if="showHelpPanel" class="help-panel">
      <div class="help-header">
        <h3>📖 游戏指南</h3>
        <button class="btn close-help" @click="toggleHelpPanel">✕</button>
      </div>
      
      <div class="help-content scrollbar-thin">
        <div class="help-section">
          <h4>🎯 当前目标</h4>
          <p class="help-text">{{ currentGoal }}</p>
        </div>
        
        <div class="help-section">
          <h4>💡 当前提示</h4>
          <p class="help-text hint-text">{{ currentHint }}</p>
        </div>
        
        <div class="help-section">
          <h4>📊 进度追踪</h4>
          <div class="progress-list">
            <div class="progress-item">
              <span class="progress-label">记忆收集</span>
              <span class="progress-value">{{ collectedMemoriesCount }}/{{ totalMemoriesCount }}</span>
            </div>
            <div class="progress-item">
              <span class="progress-label">谜题解决</span>
              <span class="progress-value">{{ solvedPuzzlesCount }}/{{ totalPuzzlesCount }}</span>
            </div>
            <div class="progress-item">
              <span class="progress-label">梦境深度</span>
              <span class="progress-value">Phase {{ progress?.dreamPhase || 1 }}/4</span>
            </div>
          </div>
        </div>
        
        <div class="help-section">
          <h4>⚖️ 结局条件</h4>
          <div class="ending-conditions">
            <div class="ending-condition good">
              <span class="condition-title">✨ 治愈结局</span>
              <span class="condition-req">信任 ≥70%, 恐惧 ≤20%</span>
            </div>
            <div class="ending-condition neutral">
              <span class="condition-title">💫 和解结局</span>
              <span class="condition-req">信任 ≥40%, 恐惧 ≤50%</span>
            </div>
            <div class="ending-condition bad">
              <span class="condition-title">🌑 沉沦结局</span>
              <span class="condition-req">信任 <40%, 恐惧 >50%</span>
            </div>
          </div>
        </div>
        
        <div class="help-section">
          <h4>🎮 操作说明</h4>
          <ul class="help-list">
            <li>点击发光的物品进行互动</li>
            <li>点击记忆碎片收集回忆</li>
            <li>点击出口按钮移动到其他场景</li>
            <li>做出选择时请慎重考虑后果</li>
            <li>游戏进度会自动保存</li>
          </ul>
        </div>
      </div>
    </div>
    
    <div class="dream-content">
      <div v-if="currentRoom" class="room-view">
        <div class="room-header">
          <h3 class="room-name">{{ currentRoom.name }}</h3>
          <span class="room-phase">阶段 {{ currentRoom.phase }}</span>
        </div>
        
        <p class="room-description">{{ currentRoom.description }}</p>
        
        <div class="symbols-section">
          <h4 class="section-title">✧ 场景物品</h4>
          <div class="symbols-grid">
            <div v-for="symbol in currentRoom.symbols" :key="symbol.id" 
                 class="symbol-card"
                 :class="{ interactable: symbol.interactable, 'already-solved': isSymbolSolved(symbol) }"
                 @click="interactWithSymbol(symbol)">
              <div class="symbol-icon">
                {{ getSymbolIcon(symbol.id) }}
              </div>
              <div class="symbol-info">
                <h5 class="symbol-name">{{ symbol.name }}</h5>
                <p class="symbol-desc">{{ symbol.description }}</p>
                <span v-if="isSymbolSolved(symbol)" class="solved-badge">已理解</span>
              </div>
              <div v-if="symbol.interactable && !isSymbolSolved(symbol)" class="interact-hint">
                点击互动
              </div>
            </div>
          </div>
        </div>
        
        <div class="memories-section" v-if="availableMemories.length > 0">
          <h4 class="section-title">📜 记忆碎片</h4>
          <div class="memories-grid">
            <div v-for="memory in availableMemories" :key="memory.id" 
                 class="memory-card"
                 :class="{ collected: isMemoryCollected(memory.id) }"
                 @click="collectMemory(memory)">
              <div class="memory-icon">{{ memory.image }}</div>
              <div class="memory-info">
                <h5 class="memory-title">{{ memory.title }}</h5>
                <span class="memory-importance" :class="'emotion-' + memory.emotion">
                  {{ getEmotionLabel(memory.emotion) }}
                </span>
              </div>
              <span v-if="isMemoryCollected(memory.id)" class="collected-badge">已收集</span>
              <span v-else class="collect-hint">点击收集</span>
            </div>
          </div>
        </div>
        
        <div class="exits-section">
          <h4 class="section-title">🚪 可探索区域</h4>
          <div class="exits-list">
            <button v-for="exit in availableExits" :key="exit.to" 
                    class="btn exit-btn"
                    :class="{ locked: !canAccessExit(exit) }"
                    :disabled="!canAccessExit(exit)"
                    @click="goToRoom(exit.to)">
              <span class="exit-label">{{ exit.label }}</span>
              <span v-if="!canAccessExit(exit)" class="lock-reason">
                {{ getLockReason(exit.requires) }}
              </span>
            </button>
          </div>
        </div>
        
        <div v-if="currentRoom.endings && currentRoom.endings.length > 0" class="endings-section">
          <h4 class="section-title">✨ 抉择时刻</h4>
          <p class="endings-hint">根据你目前的信任和恐惧值，将触发不同的结局...</p>
          <button class="btn ending-btn" @click="triggerEnding">
            面对最终的真相
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="showPuzzleModal" class="modal-overlay" @click.self="closePuzzleModal">
      <div class="modal-content puzzle-modal">
        <h3 class="modal-title">{{ currentPuzzle?.title }}</h3>
        <p class="modal-description">{{ currentPuzzle?.description }}</p>
        
        <div class="hint-box">
          <span class="hint-label">💡 提示:</span>
          <span class="hint-text">{{ currentPuzzle?.hint }}</span>
        </div>
        
        <div class="puzzle-choices">
          <button v-for="choice in currentPuzzle?.choices" :key="choice.id" 
                  class="btn choice-btn"
                  @click="makeChoice(choice)">
            {{ choice.text }}
          </button>
        </div>
        
        <button class="btn close-btn" @click="closePuzzleModal">暂时离开</button>
      </div>
    </div>
    
    <div v-if="showMemoryModal && selectedMemory" class="modal-overlay" @click.self="closeMemoryModal">
      <div class="modal-content memory-modal">
        <div class="memory-detail-icon">{{ selectedMemory.image }}</div>
        <h3 class="modal-title">{{ selectedMemory.title }}</h3>
        <p class="memory-detail-content">{{ selectedMemory.content }}</p>
        <div class="memory-meta">
          <span class="meta-tag" :class="'emotion-' + selectedMemory.emotion">
            {{ getEmotionLabel(selectedMemory.emotion) }}
          </span>
          <span class="meta-tag">重要度: {{ '★'.repeat(selectedMemory.importance) }}</span>
        </div>
        <button class="btn" @click="closeMemoryModal">关闭</button>
      </div>
    </div>
    
    <div v-if="showResultModal" class="modal-overlay">
      <div class="modal-content result-modal">
        <div class="result-icon">{{ resultData.success ? '✨' : '💫' }}</div>
        <h3 class="modal-title">{{ resultData.success ? '理解了！' : '感受到了...' }}</h3>
        <p class="result-message">{{ resultData.message }}</p>
        <div v-if="resultData.effects" class="result-effects">
          <div v-if="resultData.effects.trust" class="effect-item" :class="resultData.effects.trust > 0 ? 'positive' : 'negative'">
            信任 {{ resultData.effects.trust > 0 ? '+' : '' }}{{ resultData.effects.trust }}
          </div>
          <div v-if="resultData.effects.fear" class="effect-item" :class="resultData.effects.fear < 0 ? 'positive' : 'negative'">
            恐惧 {{ resultData.effects.fear > 0 ? '+' : '' }}{{ resultData.effects.fear }}
          </div>
        </div>
        <button class="btn" @click="closeResultModal">继续</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '@/store/gameStore'
import { getDreamByPatientId } from '@/data/dreams'
import { getMemoriesByPatient, getMemoryById } from '@/data/memories'
import { getPuzzleById, getPuzzlesByPatient } from '@/data/puzzles'
import { determineEnding } from '@/data/endings'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()

const patientId = computed(() => route.params.patientId)
const dream = computed(() => getDreamByPatientId(patientId.value))
const progress = computed(() => gameStore.getPatientProgress(patientId.value))

const currentRoom = computed(() => {
  if (!dream.value || !progress.value) return null
  return dream.value.rooms[progress.value.currentRoom]
})

const allMemories = computed(() => getMemoriesByPatient(patientId.value))

const availableMemories = computed(() => {
  if (!currentRoom.value) return []
  return allMemories.value.filter(m => currentRoom.value.memories?.includes(m.id))
})

const availableExits = computed(() => {
  return currentRoom.value?.exits || []
})

const showPuzzleModal = ref(false)
const showMemoryModal = ref(false)
const showResultModal = ref(false)
const showHelpPanel = ref(false)
const showTutorial = ref(false)
const currentPuzzle = ref(null)
const selectedMemory = ref(null)
const resultData = ref({ success: false, message: '', effects: null })

const totalMemoriesCount = computed(() => allMemories.value.length)
const collectedMemoriesCount = computed(() => gameStore.getCollectedMemories(patientId.value).length)
const totalPuzzlesCount = computed(() => getPuzzlesByPatient(patientId.value).length)
const solvedPuzzlesCount = computed(() => gameStore.getSolvedPuzzles(patientId.value).length)

const currentGoal = computed(() => {
  const phase = progress.value?.dreamPhase || 1
  if (phase === 1) {
    return '探索梦境入口，收集记忆碎片，理解场景中的象征物品。'
  } else if (phase === 2) {
    return '深入探索更多区域，解开谜题，获取患者的信任。'
  } else if (phase === 3) {
    return '面对核心记忆，帮助患者直面内心的恐惧。'
  } else {
    return '做出最终选择，引导患者走向治愈。'
  }
})

const currentHint = computed(() => {
  const unsolvedSymbols = currentRoom.value?.symbols?.filter(s => s.interactable && !isSymbolSolved(s)) || []
  const uncollectedMemories = availableMemories.value.filter(m => !isMemoryCollected(m.id))
  const lockedExits = availableExits.value.filter(e => !canAccessExit(e))
  
  if (uncollectedMemories.length > 0) {
    return '这个场景中有未收集的记忆碎片，点击它们了解更多故事。'
  }
  if (unsolvedSymbols.length > 0) {
    return `试试与「${unsolvedSymbols[0].name}」互动，理解它的象征意义。`
  }
  if (lockedExits.length > 0) {
    return `前往其他场景收集记忆或解开谜题，来解锁「${lockedExits[0].label}」。`
  }
  return '探索所有可访问的区域，寻找更多线索。'
})

const hasSeenTutorial = () => {
  return localStorage.getItem(`dreamTutorial_${patientId.value}`) === 'true'
}

const markTutorialSeen = () => {
  localStorage.setItem(`dreamTutorial_${patientId.value}`, 'true')
}

onMounted(() => {
  if (!gameStore.currentPatientId) {
    gameStore.enterDream(patientId.value)
  }
  if (!hasSeenTutorial()) {
    showTutorial.value = true
  }
})

onUnmounted(() => {
  gameStore.saveGame()
})

const getDreamBackground = () => {
  if (currentRoom.value) {
    return currentRoom.value.bgColor
  }
  return dream.value?.entrance?.color || '#1a1a2e'
}

const exitDream = () => {
  gameStore.exitDream()
  gameStore.saveGame()
  router.push('/patients')
}

const goToRoom = (roomId) => {
  gameStore.enterRoom(roomId)
  gameStore.saveGame()
}

const canAccessExit = (exit) => {
  if (!exit.requires) return true
  
  if (exit.requires.startsWith('memory_')) {
    return gameStore.isMemoryCollected(patientId.value, exit.requires)
  }
  if (exit.requires.startsWith('puzzle_')) {
    return gameStore.isPuzzleSolved(patientId.value, exit.requires)
  }
  
  return true
}

const getLockReason = (requirement) => {
  if (!requirement) return ''
  if (requirement.startsWith('memory_')) return '需要收集特定记忆'
  if (requirement.startsWith('puzzle_')) return '需要解开特定谜题'
  return '未解锁'
}

const getSymbolIcon = (symbolId) => {
  const icons = {
    symbol_umbrella: '☂️',
    symbol_roses: '🥀',
    symbol_piano: '🎹',
    symbol_music_sheet: '🎼',
    symbol_photos: '📷',
    symbol_living_rose: '🌹',
    symbol_mirror: '🪞',
    symbol_accident: '🚗',
    symbol_empty_canvas: '🖼️',
    symbol_faces: '👤',
    symbol_landscape: '🏔️',
    symbol_blood: '🩸',
    symbol_dark_painting: '🎨',
    symbol_clock: '🕰️',
    symbol_diary: '📔',
    symbol_microphone: '🎤',
    symbol_papers: '📄',
    symbol_photo: '📸',
    symbol_guitar: '🎸',
    symbol_graffiti: '✏️',
    symbol_letter: '✉️',
    symbol_two_mirrors: '🪟',
    symbol_puzzle: '🧩',
    symbol_radio: '📻',
    symbol_book: '📖',
    symbol_ring: '💍',
    symbol_hand: '🤝',
    symbol_calculator: '🧮',
    symbol_balance: '📊',
    symbol_password: '🔐',
    symbol_scale: '⚖️',
    symbol_report: '📋'
  }
  return icons[symbolId] || '✨'
}

const toggleHelpPanel = () => {
  showHelpPanel.value = !showHelpPanel.value
}

const closeTutorial = () => {
  showTutorial.value = false
  markTutorialSeen()
}

const isSymbolSolved = (symbol) => {
  if (!symbol.onInteract) return true
  if (symbol.onInteract.startsWith('puzzle_')) {
    return gameStore.isPuzzleSolved(patientId.value, symbol.onInteract)
  }
  if (symbol.onInteract.startsWith('memory_')) {
    return gameStore.isMemoryCollected(patientId.value, symbol.onInteract)
  }
  return false
}

const interactWithSymbol = (symbol) => {
  if (!symbol.interactable) return
  if (isSymbolSolved(symbol)) return
  
  if (symbol.onInteract?.startsWith('puzzle_')) {
    const puzzle = getPuzzleById(patientId.value, symbol.onInteract)
    if (puzzle) {
      currentPuzzle.value = puzzle
      showPuzzleModal.value = true
    }
  } else if (symbol.onInteract?.startsWith('memory_')) {
    const memory = getMemoryById(patientId.value, symbol.onInteract)
    if (memory) {
      collectMemory(memory)
    }
  }
}

const closePuzzleModal = () => {
  showPuzzleModal.value = false
  currentPuzzle.value = null
}

const makeChoice = (choice) => {
  if (!currentPuzzle.value) return
  
  const isCorrect = choice.result === currentPuzzle.value.solution
  const puzzle = currentPuzzle.value
  
  gameStore.solvePuzzle(patientId.value, puzzle.id)
  gameStore.makeChoice(patientId.value, choice.id)
  
  if (choice.effect) {
    if (choice.effect.trust) {
      gameStore.adjustTrust(patientId.value, choice.effect.trust)
    }
    if (choice.effect.fear) {
      gameStore.adjustFear(patientId.value, choice.effect.fear)
    }
  }
  
  if (choice.unlocks) {
    gameStore.unlockRoom(patientId.value, choice.unlocks)
  }
  
  resultData.value = {
    success: isCorrect,
    message: puzzle.solvedMessage,
    effects: choice.effect
  }
  
  closePuzzleModal()
  showResultModal.value = true
  gameStore.saveGame()
}

const isMemoryCollected = (memoryId) => {
  return gameStore.isMemoryCollected(patientId.value, memoryId)
}

const collectMemory = (memory) => {
  if (isMemoryCollected(memory.id)) {
    selectedMemory.value = memory
    showMemoryModal.value = true
    return
  }
  
  gameStore.collectMemory(patientId.value, memory.id)
  gameStore.saveGame()
  
  resultData.value = {
    success: true,
    message: `获得记忆碎片：${memory.title}`,
    effects: { trust: 5, fear: -5 }
  }
  
  selectedMemory.value = memory
  showResultModal.value = true
}

const closeMemoryModal = () => {
  showMemoryModal.value = false
  selectedMemory.value = null
}

const closeResultModal = () => {
  showResultModal.value = false
  resultData.value = { success: false, message: '', effects: null }
}

const getEmotionLabel = (emotion) => {
  const labels = {
    sweet: '甜蜜',
    painful: '痛苦',
    bittersweet: '苦乐参半',
    trauma: '创伤',
    mystery: '谜团',
    horror: '恐惧'
  }
  return labels[emotion] || emotion
}

const triggerEnding = () => {
  const ending = determineEnding(
    patientId.value,
    progress.value.trustLevel,
    progress.value.fearLevel
  )
  
  if (ending) {
    gameStore.unlockEnding(patientId.value, ending.id)
    gameStore.saveGame()
    router.push(`/ending/${patientId.value}/${ending.id}`)
  }
}
</script>

<style scoped>
.dream-view {
  width: 100%;
  min-height: 100vh;
  position: relative;
  overflow-y: auto;
  transition: background 1s ease;
}

.dream-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.3) 100%);
  pointer-events: none;
  z-index: 1;
}

.dream-header {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 40px;
  background: linear-gradient(to bottom, rgba(10, 10, 20, 0.8), transparent);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.help-btn {
  padding: 8px 16px;
  font-size: 13px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(59, 130, 246, 0.4));
  border: 1px solid rgba(139, 92, 246, 0.5);
}

.dream-title {
  text-align: center;
}

.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(8px);
}

.tutorial-modal {
  background: linear-gradient(145deg, rgba(40, 30, 60, 0.95), rgba(25, 18, 45, 0.98));
  border: 1px solid rgba(139, 92, 246, 0.5);
  border-radius: 16px;
  padding: 40px;
  max-width: 600px;
  width: 90%;
  text-align: center;
  animation: modalFadeIn 0.5s ease;
}

@keyframes modalFadeIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.tutorial-title {
  color: #c8a2e8;
  font-size: 28px;
  letter-spacing: 3px;
  margin-bottom: 30px;
}

.tutorial-steps {
  text-align: left;
  margin-bottom: 25px;
}

.tutorial-step {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  align-items: flex-start;
}

.step-number {
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  flex-shrink: 0;
}

.step-content h4 {
  color: #e8e8f0;
  font-size: 16px;
  margin-bottom: 5px;
}

.step-content p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  line-height: 1.6;
}

.tutorial-tip {
  color: #8b5cf6;
  font-size: 14px;
  margin-bottom: 25px;
  padding: 10px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 8px;
}

.tutorial-btn {
  padding: 12px 40px;
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  font-size: 16px;
}

.help-panel {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 320px;
  max-height: calc(100vh - 100px);
  background: linear-gradient(145deg, rgba(40, 30, 60, 0.95), rgba(25, 18, 45, 0.98));
  border: 1px solid rgba(139, 92, 246, 0.4);
  border-radius: 12px;
  z-index: 100;
  overflow: hidden;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

.help-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  border-bottom: 1px solid rgba(100, 80, 150, 0.3);
  background: rgba(139, 92, 246, 0.1);
}

.help-header h3 {
  color: #c8a2e8;
  font-size: 16px;
  letter-spacing: 1px;
}

.close-help {
  padding: 4px 10px;
  font-size: 12px;
  background: transparent;
  border: none;
}

.help-content {
  padding: 20px;
  overflow-y: auto;
  max-height: calc(100vh - 160px);
}

.help-section {
  margin-bottom: 20px;
}

.help-section h4 {
  color: #e8e8f0;
  font-size: 14px;
  margin-bottom: 10px;
  letter-spacing: 1px;
}

.help-text {
  color: rgba(255, 255, 255, 0.75);
  font-size: 13px;
  line-height: 1.6;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  border-left: 2px solid #8b5cf6;
}

.help-text.hint-text {
  border-left-color: #fbbf24;
  color: rgba(251, 191, 36, 0.9);
}

.progress-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
}

.progress-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
}

.progress-value {
  color: #c8a2e8;
  font-size: 13px;
  font-weight: bold;
}

.ending-conditions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ending-condition {
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ending-condition.good {
  border-left: 3px solid #10b981;
}

.ending-condition.neutral {
  border-left: 3px solid #fbbf24;
}

.ending-condition.bad {
  border-left: 3px solid #ef4444;
}

.condition-title {
  color: #e8e8f0;
  font-size: 12px;
  font-weight: bold;
}

.condition-req {
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
}

.help-list {
  list-style: none;
  padding: 0;
}

.help-list li {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  padding: 6px 0;
  padding-left: 20px;
  position: relative;
}

.help-list li::before {
  content: '✦';
  position: absolute;
  left: 0;
  color: #8b5cf6;
  font-size: 10px;
}

.dream-title h2 {
  color: #e8e8f0;
  font-size: 28px;
  letter-spacing: 3px;
  margin-bottom: 5px;
}

.phase-indicator {
  color: rgba(200, 162, 232, 0.8);
  font-size: 14px;
}

.status-panel {
  display: flex;
  gap: 20px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  width: 40px;
}

.status-bar {
  width: 100px;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.status-fill {
  height: 100%;
  transition: width 0.5s ease;
  border-radius: 4px;
}

.trust-bar .status-fill {
  background: linear-gradient(90deg, #10b981, #34d399);
}

.fear-bar .status-fill {
  background: linear-gradient(90deg, #ef4444, #f87171);
}

.status-value {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  width: 40px;
}

.dream-content {
  position: relative;
  z-index: 10;
  padding: 20px 40px 60px;
  max-width: 1200px;
  margin: 0 auto;
}

.room-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.room-name {
  color: #c8a2e8;
  font-size: 32px;
  letter-spacing: 3px;
}

.room-phase {
  background: rgba(139, 92, 246, 0.3);
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 14px;
  color: #ddd6fe;
}

.room-description {
  color: rgba(255, 255, 255, 0.85);
  font-size: 16px;
  line-height: 1.8;
  margin-bottom: 40px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border-left: 3px solid #8b5cf6;
}

.section-title {
  color: #c8a2e8;
  font-size: 18px;
  margin-bottom: 20px;
  letter-spacing: 2px;
}

.symbols-section,
.memories-section,
.exits-section,
.endings-section {
  margin-bottom: 40px;
}

.symbols-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.symbol-card {
  display: flex;
  gap: 15px;
  padding: 20px;
  background: linear-gradient(145deg, rgba(40, 30, 60, 0.7), rgba(25, 18, 45, 0.8));
  border: 1px solid rgba(100, 80, 150, 0.3);
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
}

.symbol-card.interactable {
  cursor: pointer;
}

.symbol-card.interactable:hover {
  transform: translateY(-3px);
  border-color: rgba(180, 140, 220, 0.6);
  box-shadow: 0 10px 30px rgba(100, 80, 150, 0.2);
}

.symbol-card.already-solved {
  opacity: 0.6;
}

.symbol-icon {
  font-size: 36px;
  flex-shrink: 0;
}

.symbol-info {
  flex: 1;
}

.symbol-name {
  color: #e8e8f0;
  font-size: 16px;
  margin-bottom: 8px;
}

.symbol-desc {
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  line-height: 1.5;
}

.interact-hint {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 11px;
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.2);
  padding: 3px 8px;
  border-radius: 10px;
}

.solved-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 11px;
  color: #10b981;
  background: rgba(16, 185, 129, 0.2);
  padding: 3px 8px;
  border-radius: 10px;
}

.memories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.memory-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  background: linear-gradient(145deg, rgba(60, 40, 30, 0.6), rgba(45, 30, 20, 0.7));
  border: 1px solid rgba(200, 160, 100, 0.3);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.memory-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 20px rgba(255, 200, 100, 0.2);
}

.memory-card.collected {
  border-color: rgba(255, 200, 100, 0.6);
}

.memory-icon {
  font-size: 28px;
}

.memory-title {
  color: #e8e8f0;
  font-size: 14px;
  margin-bottom: 4px;
}

.memory-importance {
  font-size: 12px;
}

.collected-badge {
  font-size: 11px;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.2);
  padding: 3px 8px;
  border-radius: 10px;
  margin-left: auto;
}

.collect-hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-left: auto;
}

.exits-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.exit-btn {
  min-width: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.exit-btn.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.lock-reason {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.endings-section {
  text-align: center;
  padding: 30px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2));
  border-radius: 16px;
  border: 1px solid rgba(139, 92, 246, 0.4);
}

.endings-hint {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 20px;
}

.ending-btn {
  padding: 16px 48px;
  font-size: 18px;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: linear-gradient(145deg, rgba(40, 30, 60, 0.95), rgba(25, 18, 45, 0.98));
  border: 1px solid rgba(100, 80, 150, 0.4);
  border-radius: 16px;
  padding: 40px;
  max-width: 500px;
  width: 90%;
  text-align: center;
}

.modal-title {
  color: #c8a2e8;
  font-size: 24px;
  margin-bottom: 20px;
  letter-spacing: 2px;
}

.modal-description {
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.8;
  margin-bottom: 25px;
}

.hint-box {
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 25px;
  text-align: left;
}

.hint-label {
  color: #a78bfa;
  font-weight: bold;
  margin-right: 8px;
}

.hint-text {
  color: rgba(255, 255, 255, 0.7);
}

.puzzle-choices {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 25px;
}

.choice-btn {
  padding: 15px 20px;
  text-align: left;
  font-size: 15px;
}

.memory-detail-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.memory-detail-content {
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.8;
  margin-bottom: 25px;
  font-size: 16px;
}

.memory-meta {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 25px;
}

.meta-tag {
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 13px;
}

.result-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.result-message {
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.8;
  margin-bottom: 20px;
}

.result-effects {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 25px;
}

.effect-item {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
}

.effect-item.positive {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.effect-item.negative {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.close-btn {
  background: rgba(100, 80, 150, 0.3);
}

.emotion-sweet { color: #f472b6; background: rgba(244, 114, 182, 0.2); }
.emotion-painful { color: #f87171; background: rgba(248, 113, 113, 0.2); }
.emotion-bittersweet { color: #fbbf24; background: rgba(251, 191, 36, 0.2); }
.emotion-trauma { color: #a78bfa; background: rgba(167, 139, 250, 0.2); }
.emotion-mystery { color: #60a5fa; background: rgba(96, 165, 250, 0.2); }
.emotion-horror { color: #f97316; background: rgba(249, 115, 22, 0.2); }
</style>
