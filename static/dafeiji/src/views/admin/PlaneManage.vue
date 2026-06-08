<template>
  <div class="plane-manage">
    <div class="toolbar">
      <h3 class="section-title">战机列表</h3>
      <button class="btn btn-primary btn-sm" @click="openCreateModal">+ 添加战机</button>
    </div>

    <div class="plane-grid">
      <div v-for="plane in planes" :key="plane.id" class="plane-card">
        <div class="plane-preview" :style="{ '--plane-color': plane.color }">
          <div class="plane-icon"></div>
        </div>
        <div class="plane-info">
          <h4 class="plane-name" :style="{ color: plane.color }">{{ plane.name }}</h4>
          <div class="plane-type">{{ getTypeName(plane.type) }}</div>
          
          <div class="stat-row">
            <span class="stat-label">速度</span>
            <span class="stat-value">{{ plane.speed }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">血量</span>
            <span class="stat-value">{{ plane.hp }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">伤害</span>
            <span class="stat-value">{{ plane.weapon_damage }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">射速</span>
            <span class="stat-value">{{ plane.weapon_fire_rate }}s</span>
          </div>

          <div class="skill-info">
            <div class="skill-name">{{ plane.skill_name }}</div>
            <div class="skill-desc">{{ plane.skill_description }}</div>
            <div class="skill-cd">冷却: {{ plane.skill_cooldown }}s</div>
          </div>

          <div class="card-actions">
            <button class="btn btn-xs" @click="openEditModal(plane)">编辑</button>
            <button class="btn btn-xs btn-danger" @click="deletePlane(plane)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal panel">
        <div class="panel-header">
          <span>{{ isEdit ? '编辑战机' : '添加战机' }}</span>
        </div>
        <div class="panel-body">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">战机ID</label>
              <input v-model="form.plane_id" type="text" class="input" :disabled="isEdit" />
            </div>
            <div class="form-group">
              <label class="form-label">名称</label>
              <input v-model="form.name" type="text" class="input" />
            </div>
            <div class="form-group">
              <label class="form-label">类型</label>
              <select v-model="form.type" class="input">
                <option value="light">轻型</option>
                <option value="medium">中型</option>
                <option value="heavy">重型</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">颜色</label>
              <input v-model="form.color" type="text" class="input" placeholder="#00d4ff" />
            </div>
            <div class="form-group">
              <label class="form-label">速度</label>
              <input v-model.number="form.speed" type="number" class="input" />
            </div>
            <div class="form-group">
              <label class="form-label">血量</label>
              <input v-model.number="form.hp" type="number" class="input" />
            </div>
            <div class="form-group">
              <label class="form-label">武器类型</label>
              <input v-model="form.weapon_type" type="text" class="input" />
            </div>
            <div class="form-group">
              <label class="form-label">武器伤害</label>
              <input v-model.number="form.weapon_damage" type="number" class="input" />
            </div>
            <div class="form-group">
              <label class="form-label">射速(秒)</label>
              <input v-model.number="form.weapon_fire_rate" type="number" step="0.01" class="input" />
            </div>
            <div class="form-group">
              <label class="form-label">技能名称</label>
              <input v-model="form.skill_name" type="text" class="input" />
            </div>
            <div class="form-group full-width">
              <label class="form-label">技能描述</label>
              <input v-model="form.skill_description" type="text" class="input" />
            </div>
            <div class="form-group">
              <label class="form-label">技能冷却(秒)</label>
              <input v-model.number="form.skill_cooldown" type="number" class="input" />
            </div>
            <div class="form-group full-width">
              <label class="form-label">描述</label>
              <textarea v-model="form.description" class="input" rows="2"></textarea>
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

const planes = ref<any[]>([])
const showModal = ref(false)
const isEdit = ref(false)

const form = reactive({
  id: 0,
  plane_id: '',
  name: '',
  type: 'light',
  description: '',
  speed: 200,
  hp: 100,
  weapon_type: 'laser',
  weapon_damage: 15,
  weapon_fire_rate: 0.2,
  skill_name: '',
  skill_description: '',
  skill_cooldown: 10,
  color: '#00d4ff'
})

onMounted(() => {
  loadPlanes()
})

const loadPlanes = async () => {
  try {
    const res = await adminApi.getPlanes()
    if (res.code === 0 && res.data) {
      planes.value = res.data
    }
  } catch (e) {
    console.error('加载飞机列表失败', e)
  }
}

const getTypeName = (type: string) => {
  const map: Record<string, string> = {
    light: '轻型战机',
    medium: '中型战机',
    heavy: '重型战机'
  }
  return map[type] || type
}

const openCreateModal = () => {
  isEdit.value = false
  Object.assign(form, {
    id: 0,
    plane_id: '',
    name: '',
    type: 'light',
    description: '',
    speed: 200,
    hp: 100,
    weapon_type: 'laser',
    weapon_damage: 15,
    weapon_fire_rate: 0.2,
    skill_name: '',
    skill_description: '',
    skill_cooldown: 10,
    color: '#00d4ff'
  })
  showModal.value = true
}

const openEditModal = (plane: any) => {
  isEdit.value = true
  Object.assign(form, plane)
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const submitForm = async () => {
  try {
    if (isEdit.value) {
      const res = await adminApi.updatePlane(form.id, { ...form })
      if (res.code === 0) {
        loadPlanes()
        closeModal()
      }
    } else {
      const res = await adminApi.createPlane({ ...form })
      if (res.code === 0) {
        loadPlanes()
        closeModal()
      }
    }
  } catch (e) {
    console.error('提交失败', e)
  }
}

const deletePlane = async (plane: any) => {
  if (!confirm(`确定要删除战机 ${plane.name} 吗？`)) return
  
  try {
    const res = await adminApi.deletePlane(plane.id)
    if (res.code === 0) {
      loadPlanes()
    }
  } catch (e) {
    console.error('删除失败', e)
  }
}
</script>

<style scoped>
.plane-manage {
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

.plane-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.plane-card {
  background: var(--color-bg-panel);
  border: 1px solid var(--color-border);
  overflow: hidden;
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
}

.plane-preview {
  height: 100px;
  background: linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--color-border);
}

.plane-icon {
  width: 50px;
  height: 65px;
  background: var(--plane-color, '#00d4ff');
  clip-path: polygon(50% 0%, 100% 60%, 80% 100%, 20% 100%, 0% 60%);
  box-shadow: 0 0 20px var(--plane-color, '#00d4ff');
}

.plane-info {
  padding: 15px;
}

.plane-name {
  font-family: 'Orbitron', sans-serif;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
}

.plane-type {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 12px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 4px;
}

.stat-label {
  color: var(--color-text-muted);
}

.stat-value {
  color: var(--color-text-primary);
  font-family: 'Orbitron', sans-serif;
}

.skill-info {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--color-border);
}

.skill-name {
  font-size: 12px;
  color: var(--color-neon-orange);
  font-weight: 600;
  margin-bottom: 4px;
}

.skill-desc {
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: 1.4;
  margin-bottom: 4px;
}

.skill-cd {
  font-size: 11px;
  color: var(--color-text-muted);
}

.card-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.btn-xs {
  padding: 5px 12px;
  font-size: 12px;
  flex: 1;
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
  width: 600px;
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

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid var(--color-border);
}
</style>
