<template>
  <div class="page-container">
    <h1 class="page-title neon-text">⚙️ 管理后台</h1>

    <div class="admin-tabs">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'configs' }"
        @click="activeTab = 'configs'"
      >
        机关配置
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'scores' }"
        @click="loadScores"
      >
        分数管理
      </button>
    </div>

    <div v-if="activeTab === 'configs'" class="config-section">
      <div class="section-header">
        <h2 class="section-title">机关列表</h2>
        <button @click="showAddModal = true" class="neon-btn add-btn">
          + 添加机关
        </button>
      </div>

      <div v-if="loading" class="loading">加载中...</div>

      <div class="config-list">
        <div
          v-for="cfg in configStore.allConfigs"
          :key="cfg.id"
          class="config-item neon-card"
        >
          <div class="config-header">
            <div class="config-name">
              <span class="config-icon" :style="{ color: getConfigColor(cfg) }">●</span>
              {{ cfg.name }}
            </div>
            <span class="config-type-badge" :class="cfg.type">
              {{ getTypeLabel(cfg.type) }}
            </span>
          </div>

          <div class="config-info">
            <div class="info-row">
              <span class="info-label">类型:</span>
              <span class="info-value">{{ cfg.type }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">得分:</span>
              <span class="info-value score">{{ cfg.score }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">状态:</span>
              <span class="info-value" :class="{ active: cfg.is_active }">
                {{ cfg.is_active ? '启用' : '禁用' }}
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">排序:</span>
              <span class="info-value">{{ cfg.sort_order }}</span>
            </div>
          </div>

          <div class="config-actions">
            <button @click="editConfig(cfg)" class="action-btn edit">编辑</button>
            <button @click="deleteConfig(cfg.id)" class="action-btn delete">删除</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'scores'" class="scores-section">
      <h2 class="section-title">分数记录</h2>
      <div class="scores-table neon-card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>用户</th>
              <th>分数</th>
              <th>最高连击</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="score in scores" :key="score.id">
              <td>{{ score.id }}</td>
              <td>{{ score.username }}</td>
              <td class="score-cell">{{ score.score }}</td>
              <td>{{ score.highest_combo }}x</td>
              <td>{{ formatDate(score.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal neon-card">
        <h3 class="modal-title">{{ showAddModal ? '添加机关' : '编辑机关' }}</h3>

        <div class="form-group">
          <label class="form-label">名称</label>
          <input v-model="formData.name" type="text" class="input-neon" />
        </div>

        <div class="form-group">
          <label class="form-label">类型</label>
          <select v-model="formData.type" class="input-neon">
            <option value="bumper">圆形弹射器</option>
            <option value="accelerator">加速带</option>
            <option value="rotator">旋转门</option>
            <option value="portal_in">传送门入口</option>
            <option value="portal_out">传送门出口</option>
            <option value="multiplier">得分倍增器</option>
            <option value="splitter">弹珠分裂器</option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">位置 X</label>
            <input v-model.number="formData.posX" type="number" class="input-neon" />
          </div>
          <div class="form-group">
            <label class="form-label">位置 Y</label>
            <input v-model.number="formData.posY" type="number" class="input-neon" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">得分</label>
            <input v-model.number="formData.score" type="number" class="input-neon" />
          </div>
          <div class="form-group">
            <label class="form-label">排序</label>
            <input v-model.number="formData.sort_order" type="number" class="input-neon" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">配置 JSON</label>
          <textarea
            v-model="formData.config_json"
            class="input-neon"
            rows="4"
            placeholder='{"radius": 25, "color": "#ff00ff"}'
          ></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">
            <input type="checkbox" v-model="formData.is_active" />
            启用此机关
          </label>
        </div>

        <div class="modal-actions">
          <button @click="closeModals" class="neon-btn neon-btn-secondary">取消</button>
          <button @click="saveConfig" class="neon-btn" :disabled="saving">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>

        <p v-if="formError" class="form-error">{{ formError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useConfigStore, useUserStore } from '@/stores'
import { addConfig, updateConfig, deleteConfig } from '@/api/pinball'
import { getMyScores } from '@/api/game'
import type { PinballConfig } from '@/types'

const configStore = useConfigStore()
const userStore = useUserStore()

const activeTab = ref<'configs' | 'scores'>('configs')
const loading = ref(false)
const saving = ref(false)
const scores = ref<any[]>([])

const showAddModal = ref(false)
const showEditModal = ref(false)
const formError = ref('')
const editingId = ref<number | null>(null)

const formData = reactive({
  name: '',
  type: 'bumper',
  posX: 200,
  posY: 300,
  score: 50,
  sort_order: 0,
  config_json: '{}',
  is_active: 1,
})

const typeLabels: Record<string, string> = {
  bumper: '弹射器',
  accelerator: '加速带',
  rotator: '旋转门',
  portal_in: '传送门(入)',
  portal_out: '传送门(出)',
  multiplier: '倍增器',
  splitter: '分裂器',
}

onMounted(async () => {
  await loadConfigs()
})

async function loadConfigs() {
  loading.value = true
  try {
    await configStore.fetchAllConfigs()
  } finally {
    loading.value = false
  }
}

async function loadScores() {
  activeTab.value = 'scores'
  try {
    const res = await getMyScores(50)
    if (res.code === 0 && res.data) {
      scores.value = res.data.items
    }
  } catch (e) {
    console.error('Load scores error:', e)
  }
}

function getTypeLabel(type: string) {
  return typeLabels[type] || type
}

function getConfigColor(cfg: PinballConfig) {
  try {
    const config = JSON.parse(cfg.config_json)
    return config.color || '#00d4ff'
  } catch {
    return '#00d4ff'
  }
}

function editConfig(cfg: PinballConfig) {
  editingId.value = cfg.id
  formData.name = cfg.name
  formData.type = cfg.type
  formData.score = cfg.score
  formData.sort_order = cfg.sort_order
  formData.config_json = cfg.config_json
  formData.is_active = cfg.is_active

  try {
    const pos = JSON.parse(cfg.position_json)
    formData.posX = pos.x || 200
    formData.posY = pos.y || 300
  } catch {
    formData.posX = 200
    formData.posY = 300
  }

  showEditModal.value = true
  formError.value = ''
}

async function saveConfig() {
  formError.value = ''

  if (!formData.name.trim()) {
    formError.value = '请输入机关名称'
    return
  }

  saving.value = true

  try {
    const positionJson = JSON.stringify({
      x: formData.posX,
      y: formData.posY,
    })

    if (showAddModal.value) {
      const res = await addConfig({
        name: formData.name,
        type: formData.type,
        config_json: formData.config_json,
        position_json: positionJson,
        score: formData.score,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
      })
      if (res.code === 0) {
        closeModals()
        await loadConfigs()
      } else {
        formError.value = res.message || '添加失败'
      }
    } else if (showEditModal.value && editingId.value) {
      const res = await updateConfig({
        id: editingId.value,
        name: formData.name,
        type: formData.type,
        config_json: formData.config_json,
        position_json: positionJson,
        score: formData.score,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
      })
      if (res.code === 0) {
        closeModals()
        await loadConfigs()
      } else {
        formError.value = res.message || '更新失败'
      }
    }
  } catch (e: any) {
    formError.value = '保存失败，请稍后重试'
  } finally {
    saving.value = false
  }
}

async function deleteConfig(id: number) {
  if (!confirm('确定要删除这个机关吗？')) return

  try {
    const res = await deleteConfig(id)
    if (res.code === 0) {
      await loadConfigs()
    } else {
      alert(res.message || '删除失败')
    }
  } catch (e) {
    alert('删除失败')
  }
}

function closeModals() {
  showAddModal.value = false
  showEditModal.value = false
  editingId.value = null
  formError.value = ''
  resetForm()
}

function resetForm() {
  formData.name = ''
  formData.type = 'bumper'
  formData.posX = 200
  formData.posY = 300
  formData.score = 50
  formData.sort_order = 0
  formData.config_json = '{}'
  formData.is_active = 1
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}
</script>

<style scoped>
.page-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 24px;
}

.page-title {
  text-align: center;
  font-size: 28px;
  margin-bottom: 24px;
  color: var(--neon-pink);
}

.admin-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tab-btn {
  padding: 10px 24px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 15px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--neon-pink);
  border-bottom-color: var(--neon-pink);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 20px;
  color: var(--text-primary);
}

.add-btn {
  padding: 8px 20px;
  font-size: 14px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.config-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-item {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.config-name {
  font-size: 17px;
  font-weight: bold;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 10px;
}

.config-icon {
  font-size: 12px;
  text-shadow: 0 0 8px currentColor;
}

.config-type-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  background: rgba(0, 212, 255, 0.15);
  color: var(--neon-blue);
  border: 1px solid var(--neon-blue);
}

.config-info {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: 11px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
}

.info-value.score {
  color: var(--neon-green);
  font-weight: bold;
}

.info-value.active {
  color: var(--neon-green);
}

.config-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.action-btn {
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid;
  background: transparent;
  transition: all 0.3s ease;
}

.action-btn.edit {
  color: var(--neon-blue);
  border-color: var(--neon-blue);
}

.action-btn.edit:hover {
  background: rgba(0, 212, 255, 0.1);
}

.action-btn.delete {
  color: var(--neon-pink);
  border-color: var(--neon-pink);
}

.action-btn.delete:hover {
  background: rgba(255, 0, 255, 0.1);
}

.scores-table {
  padding: 0;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 14px 18px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

th {
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
  background: rgba(255, 255, 255, 0.02);
}

td {
  font-size: 14px;
  color: var(--text-primary);
}

.score-cell {
  color: var(--neon-green);
  font-weight: bold;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal {
  width: 100%;
  max-width: 480px;
  padding: 28px;
  margin: 20px;
}

.modal-title {
  font-size: 22px;
  color: var(--text-primary);
  margin-bottom: 20px;
  text-align: center;
}

.form-group {
  margin-bottom: 14px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

textarea.input-neon {
  resize: vertical;
  min-height: 80px;
  font-family: monospace;
  font-size: 13px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}

.form-error {
  color: #ff4466;
  font-size: 13px;
  text-align: center;
  margin-top: 12px;
}

select.input-neon {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2300d4ff' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

@media (max-width: 600px) {
  .config-info {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
