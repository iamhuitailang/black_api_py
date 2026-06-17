<template>
  <div>
    <div class="card">
      <div class="card-title">
        <span>考核周期管理</span>
        <button class="btn btn-primary" @click="openCreateModal">+ 新建考核周期</button>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>周期名称</th>
            <th>年份</th>
            <th>季度</th>
            <th>起止时间</th>
            <th>维度数</th>
            <th>状态</th>
            <th style="width: 220px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in cycles" :key="c.id">
            <td>{{ c.id }}</td>
            <td>{{ c.name }}</td>
            <td>{{ c.year }}</td>
            <td>Q{{ c.quarter }}</td>
            <td>{{ c.start_date }} ~ {{ c.end_date }}</td>
            <td>{{ (c.dimensions || []).length }}</td>
            <td><span :class="['tag', 'tag-status', 'tag-status-' + c.status]">{{ statusText[c.status] }}</span></td>
            <td>
              <button class="btn btn-sm" @click="editCycle(c)">编辑</button>
              <button v-if="c.status === 'draft'" class="btn btn-sm btn-primary" @click="publishCycle(c.id)">发布</button>
              <button class="btn btn-sm btn-danger" @click="deleteCycle(c.id)">删除</button>
            </td>
          </tr>
          <tr v-if="cycles.length === 0"><td colspan="8" class="empty-state"><div class="empty-state-icon">📅</div>暂无数据，点击右上角新建考核周期</td></tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-mask" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">{{ editingId ? '编辑考核周期' : '新建考核周期' }}</div>
          <button class="modal-close" @click="showModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row-inline">
            <div class="form-row">
              <label class="form-label">周期名称 *</label>
              <input class="form-input" v-model="form.name" placeholder="如：2026年第二季度绩效考核">
            </div>
          </div>
          <div class="form-row-inline">
            <div class="form-row">
              <label class="form-label">年份 *</label>
              <input type="number" class="form-input" v-model.number="form.year">
            </div>
            <div class="form-row">
              <label class="form-label">季度 *</label>
              <select class="form-select" v-model.number="form.quarter">
                <option :value="1">Q1</option>
                <option :value="2">Q2</option>
                <option :value="3">Q3</option>
                <option :value="4">Q4</option>
              </select>
            </div>
          </div>
          <div class="form-row-inline">
            <div class="form-row">
              <label class="form-label">开始日期 *</label>
              <input type="date" class="form-input" v-model="form.start_date">
            </div>
            <div class="form-row">
              <label class="form-label">结束日期 *</label>
              <input type="date" class="form-input" v-model="form.end_date">
            </div>
          </div>

          <div class="form-row">
            <div class="flex-between mb-16" style="margin-bottom:10px;">
              <label class="form-label" style="margin:0;">考核维度（3-5个，权重合计100%）</label>
              <button class="btn btn-sm" @click="addDimension" :disabled="form.dimensions.length >= 5">+ 添加维度</button>
            </div>
            <div style="color:var(--text-light); font-size:12px; margin-bottom:10px;">
              当前权重合计：<strong :style="{color: totalWeight===100 ? 'var(--grade-a)' : 'var(--grade-d)'}">{{ totalWeight }}%</strong>
            </div>
            <div v-for="(d, idx) in form.dimensions" :key="idx" class="dimension-item" style="padding:14px;">
              <div class="form-row-inline">
                <div class="form-row" style="flex:2;">
                  <label class="form-label">维度名称</label>
                  <input class="form-input" v-model="d.name" placeholder="如：业绩/协作/创新">
                </div>
                <div class="form-row">
                  <label class="form-label">权重(%)</label>
                  <input type="number" min="0" max="100" class="form-input" v-model.number="d.weight">
                </div>
                <div class="form-row" style="flex:0 0 40px; padding-top:24px;">
                  <button class="btn btn-sm btn-danger" @click="removeDimension(idx)" :disabled="form.dimensions.length <= 3">×</button>
                </div>
              </div>
              <div class="form-row" style="margin-bottom:0;">
                <label class="form-label">维度说明</label>
                <input class="form-input" v-model="d.description" placeholder="该维度的考核重点说明">
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showModal = false">取消</button>
          <button class="btn btn-primary" @click="saveCycle">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../utils/api'

const cycles = ref([])
const showModal = ref(false)
const editingId = ref(null)
const statusText = { draft: '草稿', active: '进行中', pending: '待自评', self_reviewed: '待上级评', completed: '已完成' }

const defaultForm = () => ({
  name: '',
  year: new Date().getFullYear(),
  quarter: Math.ceil((new Date().getMonth() + 1) / 3),
  start_date: '2026-04-01',
  end_date: '2026-06-30',
  status: 'draft',
  dimensions: [
    { name: '业绩目标', description: '季度OKR/KPI完成情况', weight: 40 },
    { name: '团队协作', description: '跨部门沟通、团队配合', weight: 20 },
    { name: '创新改进', description: '流程优化、技术创新', weight: 20 },
    { name: '学习培训', description: '技能提升、知识分享', weight: 20 }
  ]
})

const form = ref(defaultForm())

const totalWeight = computed(() => form.value.dimensions.reduce((s, d) => s + (d.weight || 0), 0))

const loadCycles = async () => {
  try {
    const res = await api.getCycles()
    cycles.value = res.data || []
  } catch (e) { console.error(e) }
}

onMounted(loadCycles)

const openCreateModal = () => {
  editingId.value = null
  form.value = defaultForm()
  showModal.value = true
}

const editCycle = (c) => {
  editingId.value = c.id
  form.value = {
    name: c.name,
    year: c.year,
    quarter: c.quarter,
    start_date: c.start_date,
    end_date: c.end_date,
    status: c.status,
    dimensions: (c.dimensions || []).map(d => ({ name: d.name, description: d.description || '', weight: d.weight }))
  }
  showModal.value = true
}

const addDimension = () => {
  if (form.value.dimensions.length < 5) {
    form.value.dimensions.push({ name: '', description: '', weight: 10 })
  }
}

const removeDimension = (idx) => {
  if (form.value.dimensions.length > 3) {
    form.value.dimensions.splice(idx, 1)
  }
}

const saveCycle = async () => {
  if (!form.value.name || !form.value.year || !form.value.quarter || !form.value.start_date || !form.value.end_date) {
    alert('请填写完整基础信息')
    return
  }
  if (form.value.dimensions.length < 3 || form.value.dimensions.length > 5) {
    alert('维度数量需在3-5个之间')
    return
  }
  if (totalWeight.value !== 100) {
    alert('权重合计必须为100%')
    return
  }
  for (const d of form.value.dimensions) {
    if (!d.name) { alert('请填写维度名称'); return }
  }

  try {
    if (editingId.value) {
      await api.updateCycle(editingId.value, form.value)
    } else {
      await api.createCycle(form.value)
    }
    showModal.value = false
    loadCycles()
  } catch (e) { alert('保存失败') }
}

const deleteCycle = async (id) => {
  if (!confirm('确定要删除该考核周期吗？相关数据将被清除。')) return
  try {
    await api.deleteCycle(id)
    loadCycles()
  } catch (e) { alert('删除失败') }
}

const publishCycle = async (id) => {
  if (!confirm('发布后将为所有员工生成考核记录，确定发布？')) return
  try {
    await api.publishCycle(id)
    loadCycles()
  } catch (e) { alert('发布失败') }
}
</script>
