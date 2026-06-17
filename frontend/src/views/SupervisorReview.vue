<template>
  <div>
    <div class="card">
      <div class="card-title">
        <span>下属考核列表（待评分）</span>
        <div class="flex">
          <select class="form-select" style="width:200px;" v-model="filterCycle" @change="loadData">
            <option value="">全部周期</option>
            <option v-for="c in cycles" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>姓名</th>
            <th>部门</th>
            <th>职位</th>
            <th>考核周期</th>
            <th>状态</th>
            <th>自评得分</th>
            <th>最终得分</th>
            <th>等级</th>
            <th style="width: 120px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in records" :key="r.id">
            <td>{{ r.employee_name }}</td>
            <td>{{ r.department }}</td>
            <td>{{ r.position }}</td>
            <td>{{ r.cycle_name || (r.year + 'Q' + r.quarter) }}</td>
            <td><span class="tag tag-status tag-status-{{r.status}}">{{ statusText[r.status] }}</span></td>
            <td>{{ r.self_total_score || '-' }}</td>
            <td>{{ r.final_score || '-' }}</td>
            <td>
              <span v-if="r.grade" class="tag tag-grade-{{r.grade.toLowerCase()}}">{{ r.grade }}</span>
              <span v-else>-</span>
            </td>
            <td>
              <button class="btn btn-sm btn-primary" @click="$router.push(`/supervisor-review/${r.id}`)">
                {{ r.status === 'self_reviewed' ? '去评分' : r.status === 'completed' ? '查看' : '查看' }}
              </button>
            </td>
          </tr>
          <tr v-if="records.length === 0"><td colspan="9" class="empty-state"><div class="empty-state-icon">📋</div>暂无下属考核数据</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps, watch } from 'vue'
import api from '../utils/api'

const props = defineProps({ user: Object })
const records = ref([])
const cycles = ref([])
const filterCycle = ref('')
const statusText = { pending: '待自评', self_reviewed: '待评分', completed: '已完成' }

const loadCycles = async () => {
  try {
    const res = await api.getCycles()
    cycles.value = res.data || []
  } catch (e) {}
}

const loadData = async () => {
  try {
    const params = { supervisor_id: props.user?.id }
    if (filterCycle.value) params.cycle_id = filterCycle.value
    const res = await api.getRecords(params)
    records.value = res.data || []
  } catch (e) { console.error(e) }
}

watch(() => props.user, () => {
  loadCycles()
  loadData()
}, { immediate: true })
</script>
