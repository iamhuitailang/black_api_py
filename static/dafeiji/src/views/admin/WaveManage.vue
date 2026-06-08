<template>
  <div class="wave-manage">
    <div class="toolbar">
      <h3 class="section-title">波次配置</h3>
      <button class="btn btn-primary btn-sm" @click="openCreateModal">+ 添加波次</button>
    </div>

    <div class="panel">
      <div class="panel-body">
        <table class="table">
          <thead>
            <tr>
              <th>波次</th>
              <th>类型</th>
              <th>描述</th>
              <th>敌人配置</th>
              <th>生成间隔</th>
              <th>难度倍率</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="wave in waves" :key="wave.id">
              <td>
                <strong>Wave {{ wave.wave_number }}</strong>
              </td>
              <td>
                <span class="badge" :class="wave.is_boss_wave ? 'badge-admin' : 'badge-user'">
                  {{ wave.is_boss_wave ? 'BOSS波' : '普通波' }}
                </span>
              </td>
              <td>{{ wave.description }}</td>
              <td>
                <span v-for="(enemy, idx) in wave.enemies" :key="idx" class="enemy-tag">
                  {{ getEnemyTypeName(enemy.type) }} x{{ enemy.count }}
                </span>
              </td>
              <td>{{ wave.spawn_interval }}s</td>
              <td>{{ wave.difficulty_multiplier }}x</td>
              <td>
                <button class="btn btn-xs" @click="openEditModal(wave)">编辑</button>
                <button class="btn btn-xs btn-danger" @click="deleteWave(wave)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="pagination">
          <button class="btn btn-sm" :disabled="page === 1" @click="prevPage">上一页</button>
          <span class="page-info">第 {{ page }} 页 / 共 {{ totalPages }} 页</span>
          <button class="btn btn-sm" :disabled="page >= totalPages" @click="nextPage">下一页</button>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal panel">
        <div class="panel-header">
          <span>{{ isEdit ? '编辑波次' : '添加波次' }}</span>
        </div>
        <div class="panel-body">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">波次编号</label>
              <input v-model.number="form.wave_number" type="number" class="input" :disabled="isEdit" />
            </div>
            <div class="form-group">
              <label class="form-label">描述</label>
              <input v-model="form.description" type="text" class="input" />
            </div>
            <div class="form-group">
              <label class="form-label">生成间隔(秒)</label>
              <input v-model.number="form.spawn_interval" type="number" step="0.1" class="input" />
            </div>
            <div class="form-group">
              <label class="form-label">难度倍率</label>
              <input v-model.number="form.difficulty_multiplier" type="number" step="0.1" class="input" />
            </div>
            <div class="form-group full-width">
              <label class="form-label">
                是否BOSS波
                <input type="checkbox" v-model="form.is_boss_wave" style="margin-left: 10px;" />
              </label>
            </div>
          </div>

          <div class="enemies-section">
            <div class="section-head">
              <span class="form-label">敌人配置</span>
              <button class="btn btn-xs" @click="addEnemy">+ 添加敌人</button>
            </div>
            <div v-for="(enemy, idx) in form.enemies" :key="idx" class="enemy-row">
              <select v-model="enemy.type" class="input">
                <option value="small">小型</option>
                <option value="medium">中型</option>
                <option value="heavy">重型</option>
                <option value="elite">精英</option>
                <option value="boss">Boss</option>
              </select>
              <input v-model.number="enemy.count" type="number" class="input" placeholder="数量" />
              <button class="btn btn-xs btn-danger" @click="removeEnemy(idx)">删除</button>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn" @click="closeModal">取消</button>
            <button class="btn btn-primary" @click="submitForm">{{ isEdit ? '保存' : '创建' }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { adminApi } from '@/api/admin'

const waves = ref<any[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const showModal = ref(false)
const isEdit = ref(false)

const form = reactive<any>({
  id: 0,
  wave_number: 1,
  is_boss_wave: 0,
  description: '',
  spawn_interval: 1.5,
  difficulty_multiplier: 1.0,
  enemies: [{ type: 'small', count: 5 }]
})

const totalPages = ref(1)

onMounted(() => {
  loadWaves()
})

const loadWaves = async () => {
  try {
    const res = await adminApi.getWaves(page.value, pageSize.value)
    if (res.code === 0 && res.data) {
      waves.value = res.data.items
      total.value = res.data.total
      totalPages.value = Math.ceil(total.value / pageSize.value)
    }
  } catch (e) {
    console.error('加载波次列表失败', e)
  }
}

const getEnemyTypeName = (type: string) => {
  const map: Record<string, string> = {
    small: '小型',
    medium: '中型',
    heavy: '重型',
    elite: '精英',
    boss: 'Boss'
  }
  return map[type] || type
}

const openCreateModal = () => {
  isEdit.value = false
  Object.assign(form, {
    id: 0,
    wave_number: waves.value.length + 1,
    is_boss_wave: 0,
    description: '',
    spawn_interval: 1.5,
    difficulty_multiplier: 1.0,
    enemies: [{ type: 'small', count: 5 }]
  })
  showModal.value = true
}

const openEditModal = (wave: any) => {
  isEdit.value = true
  Object.assign(form, wave)
  if (!form.enemies || form.enemies.length === 0) {
    form.enemies = [{ type: 'small', count: 5 }]
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const addEnemy = () => {
  form.enemies.push({ type: 'small', count: 3 })
}

const removeEnemy = (idx: number) => {
  form.enemies.splice(idx, 1)
}

const submitForm = async () => {
  try {
    const data = { ...form }
    if (isEdit.value) {
      const res = await adminApi.updateWave(form.id, data)
      if (res.code === 0) {
        loadWaves()
        closeModal()
      }
    } else {
      const res = await adminApi.createWave(data)
      if (res.code === 0) {
        loadWaves()
        closeModal()
      }
    }
  } catch (e) {
    console.error('提交失败', e)
  }
}

const deleteWave = async (wave: any) => {
  if (!confirm(`确定要删除第 ${wave.wave_number} 波吗？`)) return
  
  try {
    const res = await adminApi.deleteWave(wave.id)
    if (res.code === 0) {
      loadWaves()
    }
  } catch (e) {
    console.error('删除失败', e)
  }
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    loadWaves()
  }
}

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    loadWaves()
  }
}
</script>

<style scoped>
.wave-manage {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 16px;
  color: var(--color-neon-blue);
}

.btn-sm {
  padding: 8px 18px;
  font-size: 13px;
}

.enemy-tag {
  display: inline-block;
  padding: 3px 8px;
  margin: 2px;
  font-size: 11px;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  color: var(--color-neon-blue);
  border-radius: 3px;
}

.btn-xs {
  padding: 5px 12px;
  font-size: 12px;
  margin-right: 5px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid var(--color-border);
}

.page-info {
  font-size: 13px;
  color: var(--color-text-muted);
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
  z-index: 1000;
}

.modal {
  width: 550px;
  max-height: 80vh;
  overflow-y: auto;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-label {
  display: block;
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.enemies-section {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid var(--color-border);
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.enemy-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
}

.enemy-row .input {
  flex: 1;
}

.enemy-row .btn {
  flex-shrink: 0;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid var(--color-border);
}
</style>
