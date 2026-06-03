<template>
  <div class="explore container">
    <h1 class="mb-20">🔍 探索闹鬼地点</h1>

    <div v-if="!isExploring" class="location-selection">
      <div class="night-toggle mb-20">
        <label class="toggle-label">
          <input type="checkbox" v-model="isNightMode" @change="toggleNightMode" />
          <span class="toggle-slider"></span>
          夜间模式 (更危险但奖励更丰富)
        </label>
      </div>

      <div class="task-selection mb-20">
        <h3 class="mb-10">选择任务</h3>
        <div v-if="loadingTasks" class="loading-small">
          <div class="spinner-small"></div>
          <span>加载任务中...</span>
        </div>
        <div v-else class="grid grid-2">
          <div
            v-for="task in availableTasks"
            :key="task.id"
            class="task-select-card card"
            :class="{ selected: selectedTask?.id === task.id }"
            @click="selectTask(task)"
          >
            <h4>{{ task.title }}</h4>
            <p>{{ task.description }}</p>
            <div class="task-rewards-small">
              <span>💰 {{ task.reward_coins }}</span>
              <span>⭐ {{ task.reward_exp }}</span>
            </div>
          </div>
        </div>
        <p v-if="!loadingTasks && availableTasks.length === 0" class="text-center mt-10" style="color: var(--text-secondary)">
          暂无可用任务，请先去【任务】页面接受任务
        </p>
      </div>

      <h2 class="mb-20">选择地点</h2>
      <div class="grid grid-3">
        <div
          v-for="location in locations"
          :key="location.id"
          class="location-card card"
          :class="{ 
            locked: location.unlocked_level > userLevel,
            disabled: !selectedTask || selectedTask.location_id !== location.id
          }"
          @click="selectLocation(location)"
        >
          <div class="location-header">
            <h3>{{ location.name }}</h3>
            <span class="badge" :class="'badge-' + getDifficultyClass(location.difficulty)">
              难度 {{ location.difficulty }}
            </span>
          </div>
          <p class="location-desc">{{ location.description }}</p>
          <div class="location-info">
            <span>👻 鬼魂: {{ location.ghost_count }}</span>
            <span v-if="location.unlocked_level > userLevel">🔒 需要等级 {{ location.unlocked_level }}</span>
            <span v-else-if="selectedTask && selectedTask.location_id !== location.id">📍 与任务地点不匹配</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="exploration-area">
      <div class="exploration-header">
        <div>
          <h2>{{ selectedLocation?.name }}</h2>
          <p style="color: var(--text-secondary); font-size: 14px;">任务: {{ selectedTask?.title }}</p>
        </div>
        <div class="exploration-stats">
          <span>证据: {{ evidenceCollected }}/3</span>
          <span>理智: {{ currentSanity }}%</span>
        </div>
      </div>

      <div class="hint-box mb-20">
        <p>💡 提示：不同的设备能发现不同的证据。请根据线索类型选择合适的设备！</p>
        <p class="hint-detail">
          EMF探测器 → EMF异常 | 温度计 → 温度骤降 | 紫外线手电筒 → 指纹 |
          通灵盒 → 通灵回应
        </p>
      </div>

      <div class="exploration-content">
        <div class="scene-area card">
          <div class="scene-display" :class="{ night: isNightMode }">
            <div v-if="ghostAppeared" class="ghost-apparition">
              👻
            </div>
            <div v-for="(clue, index) in sceneClues" :key="index" 
                 class="clue-spot"
                 :class="{ investigated: clue.investigated }"
                 :style="{ left: clue.x + '%', top: clue.y + '%' }"
                 @click="investigateClue(clue)"
            >
              <span class="clue-icon">{{ clue.icon }}</span>
            </div>
          </div>
        </div>

        <div class="equipment-panel card">
          <h3>探测设备</h3>
          <p class="equip-hint">点击选择设备，再点击场景中的线索</p>
          <div class="equipment-list">
            <div
              v-for="eq in userEquipment"
              :key="eq.inventory_id"
              class="equipment-item"
              :class="{ active: selectedEquipment?.inventory_id === eq.inventory_id }"
              @click="selectEquipment(eq)"
            >
              <span class="eq-icon">📡</span>
              <span class="eq-name">{{ eq.name }}</span>
              <span class="eq-level">Lv.{{ eq.level }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="evidence-collected card mt-20">
        <h3>已收集证据</h3>
        <div class="evidence-grid">
          <div
            v-for="type in evidenceTypes"
            :key="type.id"
            class="evidence-slot"
            :class="{ collected: collectedEvidenceIds.includes(type.id) }"
          >
            <span class="evidence-icon">{{ type.icon }}</span>
            <span>{{ type.name }}</span>
          </div>
        </div>
      </div>

      <div class="action-buttons mt-20">
        <button class="btn btn-primary" @click="useEquipment" :disabled="!selectedEquipment">
          使用 {{ selectedEquipment?.name || '设备' }}
        </button>
        <button 
          v-if="evidenceCollected >= 3" 
          class="btn btn-success"
          @click="showExorcismModal = true"
        >
          进行驱魔
        </button>
        <button class="btn btn-danger" @click="stopExploring">
          放弃探索
        </button>
      </div>
    </div>

    <div v-if="showExorcismModal" class="modal-overlay" @click.self="showExorcismModal = false">
      <div class="modal card">
        <h2>选择鬼魂类型进行驱魔</h2>
        <p class="mb-10" style="color: var(--text-secondary)">根据收集到的证据，判断这是什么类型的鬼魂</p>
        <div class="collected-evidence-preview mb-20">
          <span>已收集: </span>
          <span v-for="id in collectedEvidenceIds" :key="id" class="evidence-tag">
            {{ getEvidenceName(id) }}
          </span>
        </div>
        <div class="ghost-options">
          <div
            v-for="ghost in ghostTypes"
            :key="ghost.id"
            class="ghost-option card"
            @click="performExorcism(ghost.id)"
          >
            <h3>{{ ghost.name }}</h3>
            <p>{{ ghost.description }}</p>
            <div class="ghost-weakness">弱点: {{ ghost.weakness }}</div>
          </div>
        </div>
        <button class="btn btn-outline mt-20" @click="showExorcismModal = false">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore, useToastStore } from '../store'
import { locationAPI, ghostAPI, gameAPI, evidenceAPI, equipmentAPI, taskAPI } from '../services/api'

const authStore = useAuthStore()
const toastStore = useToastStore()

const equipmentEvidenceMap = {
  'EMF探测器': 'EMF异常',
  '温度计': '温度骤降',
  '紫外线手电筒': '指纹',
  '通灵盒': '通灵回应'
}

const locations = ref([])
const ghostTypes = ref([])
const evidenceTypes = ref([])
const userEquipment = ref([])
const availableTasks = ref([])

const isExploring = ref(false)
const selectedLocation = ref(null)
const selectedTask = ref(null)
const selectedEquipment = ref(null)
const evidenceCollected = ref(0)
const collectedEvidenceIds = ref([])
const isNightMode = ref(false)
const showExorcismModal = ref(false)
const ghostAppeared = ref(false)
const sceneClues = ref([])
const loadingTasks = ref(false)
const currentSanity = ref(100)

const userLevel = computed(() => authStore.user?.level || 1)

const getDifficultyClass = (diff) => {
  if (diff <= 1) return 'success'
  if (diff <= 2) return 'warning'
  return 'danger'
}

const getEvidenceName = (id) => {
  const ev = evidenceTypes.value.find(e => e.id === id)
  return ev ? ev.name : '未知'
}

const toggleNightMode = async () => {
  try {
    await gameAPI.toggleNightMode(isNightMode.value)
  } catch (e) {
    console.error('Toggle night mode error:', e)
  }
}

const selectTask = (task) => {
  selectedTask.value = task
  toastStore.success(`已选择任务: ${task.title}`)
}

const selectLocation = async (location) => {
  if (location.unlocked_level > userLevel.value) {
    toastStore.warning('等级不足，无法进入此地点')
    return
  }
  if (!selectedTask.value) {
    toastStore.warning('请先选择一个任务')
    return
  }
  if (selectedTask.value.location_id !== location.id) {
    toastStore.warning('请选择与任务匹配的地点')
    return
  }
  
  selectedLocation.value = location
  await startExploring()
}

const startExploring = async () => {
  try {
    const res = await gameAPI.startExplore(selectedLocation.value.id, selectedTask.value.id)
    if (res.code === 200) {
      isExploring.value = true
      evidenceCollected.value = 0
      collectedEvidenceIds.value = []
      currentSanity.value = 100
      generateSceneClues()
      toastStore.success('进入 ' + selectedLocation.value.name)
    }
  } catch (e) {
    console.error('Start explore error:', e)
    toastStore.error('进入地点失败')
  }
}

const generateSceneClues = () => {
  const clueTypes = ['emf', 'temperature', 'fingerprint', 'writing', 'orb', 'radio', 'movement']
  const positions = [
    { x: 15, y: 25 }, { x: 50, y: 35 }, { x: 80, y: 20 },
    { x: 25, y: 60 }, { x: 60, y: 70 }, { x: 75, y: 50 },
    { x: 40, y: 80 }
  ]
  
  const count = Math.min(5, (selectedLocation.value?.ghost_count || 1) + 3)
  sceneClues.value = clueTypes.slice(0, count).map((type, index) => ({
    ...positions[index],
    icon: '❓',
    type: type,
    investigated: false,
    evidenceId: null
  }))
}

const selectEquipment = (eq) => {
  selectedEquipment.value = eq
  toastStore.success(`已选择: ${eq.name}`)
}

const investigateClue = async (clue) => {
  if (!selectedEquipment.value) {
    toastStore.warning('请先选择一个探测设备')
    return
  }
  
  if (clue.investigated) {
    toastStore.warning('这个线索已经调查过了')
    return
  }

  const equipmentName = selectedEquipment.value.name
  const expectedEvidence = equipmentEvidenceMap[equipmentName]
  
  if (!expectedEvidence) {
    toastStore.warning('此设备无法用于探测证据，请选择探测设备')
    return
  }

  const clueEvidenceMap = {
    'emf': 'EMF异常',
    'temperature': '温度骤降',
    'fingerprint': '指纹',
    'writing': '鬼魂笔迹',
    'orb': '灵球',
    'radio': '通灵回应',
    'movement': '移动物体'
  }
  
  const clueEvidence = clueEvidenceMap[clue.type]
  const isMatch = clueEvidence === expectedEvidence
  
  const baseSuccessRate = isMatch ? 0.5 : 0.05
  const levelBonus = (selectedEquipment.value.level - 1) * 0.08
  const nightPenalty = isNightMode.value ? 0.1 : 0
  const successRate = Math.max(0.05, baseSuccessRate + levelBonus - nightPenalty)
  
  const success = Math.random() < successRate
  
  if (success && isMatch) {
    const evidenceType = evidenceTypes.value.find(e => e.name === expectedEvidence)
    
    if (evidenceType && !collectedEvidenceIds.value.includes(evidenceType.id)) {
      collectedEvidenceIds.value.push(evidenceType.id)
      evidenceCollected.value++
      clue.evidenceId = evidenceType.id
      
      try {
        await gameAPI.collectEvidence({
          evidence_type_id: evidenceType.id,
          location_id: selectedLocation.value.id,
          task_id: selectedTask.value.id,
          notes: `在 ${selectedLocation.value.name} 使用 ${selectedEquipment.value.name} 发现`
        })
      } catch (e) {
        console.error('Collect evidence error:', e)
      }
      
      toastStore.success(`发现证据: ${evidenceType.name}! (成功率: ${Math.round(successRate * 100)}%)`)
      clue.icon = '✅'
      
      if (Math.random() > 0.75) {
        ghostAppeared.value = true
        setTimeout(() => { ghostAppeared.value = false }, 2000)
      }
    } else if (evidenceType) {
      toastStore.warning('这个证据已经收集过了')
      clue.icon = '🔄'
    }
  } else if (success && !isMatch) {
    toastStore.warning('设备不匹配，虽然有反应但无法识别具体证据类型')
    clue.icon = '⚠️'
  } else {
    toastStore.warning(`什么都没发现... (成功率: ${Math.round(successRate * 100)}%)`)
    clue.icon = '❌'
    
    if (isNightMode.value && Math.random() > 0.7) {
      toastStore.warning('你感到一阵寒意...理智值下降了')
      currentSanity.value = Math.max(0, currentSanity.value - 10)
    }
  }
  
  clue.investigated = true
}

const useEquipment = () => {
  if (!selectedEquipment.value) {
    toastStore.warning('请先选择一个设备')
    return
  }
  toastStore.success(`正在使用 ${selectedEquipment.value.name} 扫描周围...`)
  
  if (Math.random() > 0.6) {
    toastStore.info('设备有反应！场景中有异常波动...')
    ghostAppeared.value = true
    setTimeout(() => { ghostAppeared.value = false }, 1500)
  }
}

const performExorcism = async (ghostTypeId) => {
  showExorcismModal.value = false
  
  try {
    const res = await gameAPI.performExorcism({
      task_id: selectedTask.value.id,
      ghost_type_id: ghostTypeId
    })

    if (res.code === 200) {
      if (res.data.success) {
        const selectedGhost = ghostTypes.value.find(g => g.id === ghostTypeId)
        toastStore.success(`驱魔成功！这只鬼魂是「${selectedGhost?.name || '未知'}」。${res.data.story || ''}`)
        authStore.updateCoins(res.data.rewards.coins)
        authStore.updateExp(res.data.rewards.exp)
        
        availableTasks.value = availableTasks.value.filter(t => t.id !== selectedTask.value.id)
      } else {
        const correctGhost = ghostTypes.value.find(g => g.id === selectedTask.value.ghost_type_id)
        const selectedGhost = ghostTypes.value.find(g => g.id === ghostTypeId)
        toastStore.error(`驱魔失败！你判断的是「${selectedGhost?.name || '未知'}」，但实际是「${correctGhost?.name || '未知'}」。理智值下降。`)
        currentSanity.value = Math.max(0, currentSanity.value - 20)
      }
      isExploring.value = false
      selectedTask.value = null
      selectedLocation.value = null
    }
  } catch (e) {
    console.error('Exorcism error:', e)
    toastStore.error('驱魔失败')
  }
}

const stopExploring = async () => {
  try {
    await gameAPI.stopExplore()
  } catch (e) {
    console.error('Stop explore error:', e)
  }
  isExploring.value = false
  selectedTask.value = null
  selectedLocation.value = null
  toastStore.info('已离开探索地点')
}

const loadData = async () => {
  loadingTasks.value = true
  try {
    const [locRes, ghostRes, eviRes, invRes, eqRes, taskRes, myTaskRes] = await Promise.all([
      locationAPI.getAll(),
      ghostAPI.getAll(),
      evidenceAPI.getAllTypes(),
      gameAPI.getInventory(),
      equipmentAPI.getAll(),
      taskAPI.getAll(),
      gameAPI.getMyTasks('pending')
    ])
    
    if (locRes.code === 200) locations.value = locRes.data
    if (ghostRes.code === 200) ghostTypes.value = ghostRes.data
    if (eviRes.code === 200) evidenceTypes.value = eviRes.data
    
    if (eqRes.code === 200 && invRes.code === 200) {
      const allEq = eqRes.data
      userEquipment.value = invRes.data
        .map(inv => {
          const eq = allEq.find(e => e.id === inv.equipment_id) || {}
          return { ...inv, ...eq, inventory_id: inv.id }
        })
        .filter(e => e.type === 'detector')
    }
    
    if (taskRes.code === 200 && myTaskRes.code === 200) {
      const myTaskIds = myTaskRes.data.map(t => t.task_id)
      availableTasks.value = taskRes.data.filter(t => myTaskIds.includes(t.id))
    }
  } catch (e) {
    console.error('Load data error:', e)
    toastStore.error('加载数据失败')
  } finally {
    loadingTasks.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.night-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.toggle-slider {
  width: 50px;
  height: 25px;
  background: var(--bg-secondary);
  border-radius: 15px;
  position: relative;
  transition: 0.3s;
}

input:checked + .toggle-slider {
  background: var(--accent-primary);
}

.toggle-slider::after {
  content: '';
  position: absolute;
  width: 21px;
  height: 21px;
  background: white;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: 0.3s;
}

input:checked + .toggle-slider::after {
  left: 27px;
}

.mb-10 {
  margin-bottom: 10px;
}

.mt-10 {
  margin-top: 10px;
}

.loading-small {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.task-selection h3 {
  color: var(--text-primary);
}

.task-select-card {
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.task-select-card.selected {
  border-color: var(--accent-primary);
  background: rgba(139, 92, 246, 0.1);
}

.task-select-card h4 {
  color: var(--accent-primary);
  margin-bottom: 8px;
}

.task-select-card p {
  color: var(--text-secondary);
  font-size: 13px;
  margin-bottom: 10px;
}

.task-rewards-small {
  display: flex;
  gap: 15px;
  font-size: 13px;
}

.location-card {
  cursor: pointer;
}

.location-card.locked,
.location-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.location-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.location-desc {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 15px;
}

.location-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-secondary);
  flex-wrap: wrap;
  gap: 5px;
}

.exploration-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.exploration-stats {
  display: flex;
  gap: 20px;
}

.hint-box {
  padding: 15px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 8px;
  border-left: 4px solid var(--accent-primary);
}

.hint-box p {
  color: var(--text-primary);
  font-size: 14px;
  margin-bottom: 5px;
}

.hint-detail {
  color: var(--text-secondary) !important;
  font-size: 12px !important;
}

.exploration-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.scene-display {
  height: 400px;
  position: relative;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 8px;
  overflow: hidden;
}

.scene-display.night {
  background: linear-gradient(180deg, #0a0a0f 0%, #0f0f1a 100%);
}

.clue-spot {
  position: absolute;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(139, 92, 246, 0.2);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s;
  animation: pulse 2s infinite;
}

.clue-spot:hover:not(.investigated) {
  transform: scale(1.2);
  background: rgba(139, 92, 246, 0.4);
}

.clue-spot.investigated {
  animation: none;
  cursor: default;
  opacity: 0.8;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.ghost-apparition {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 80px;
  animation: ghostAppear 2s ease-in-out;
}

@keyframes ghostAppear {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
}

.equipment-panel h3 {
  margin-bottom: 5px;
}

.equip-hint {
  color: var(--text-secondary);
  font-size: 12px;
  margin-bottom: 15px;
}

.equipment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.equipment-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.equipment-item.active {
  background: rgba(139, 92, 246, 0.3);
  border: 1px solid var(--accent-primary);
}

.eq-icon {
  font-size: 24px;
}

.eq-name {
  flex: 1;
  font-size: 14px;
}

.eq-level {
  font-size: 12px;
  color: var(--accent-primary);
}

.evidence-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.evidence-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 15px;
  background: var(--bg-secondary);
  border-radius: 8px;
  opacity: 0.4;
}

.evidence-slot.collected {
  opacity: 1;
  background: rgba(34, 197, 94, 0.2);
  border: 1px solid var(--accent-success);
}

.evidence-icon {
  font-size: 32px;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  max-width: 800px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.collected-evidence-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.evidence-tag {
  padding: 4px 12px;
  background: rgba(34, 197, 94, 0.2);
  color: var(--accent-success);
  border-radius: 15px;
  font-size: 13px;
}

.ghost-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-top: 20px;
}

.ghost-option {
  cursor: pointer;
  transition: all 0.3s;
}

.ghost-option:hover {
  border-color: var(--accent-primary);
  transform: translateY(-5px);
}

.ghost-option h3 {
  color: var(--accent-primary);
  margin-bottom: 10px;
}

.ghost-option p {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 10px;
}

.ghost-weakness {
  font-size: 12px;
  color: var(--accent-warning);
}
</style>
