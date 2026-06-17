<template>
  <div>
    <div class="grid-3 mb-20">
      <div class="stat-card">
        <div class="stat-label">考核周期总数</div>
        <div class="stat-value">{{ cycles.length }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">进行中的周期</div>
        <div class="stat-value" style="color: var(--color-primary)">{{ activeCycles }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">待处理事项</div>
        <div class="stat-value" style="color: var(--grade-c)">{{ pendingCount }}</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">
        <span>考核周期列表</span>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>周期名称</th>
            <th>年份</th>
            <th>季度</th>
            <th>起止时间</th>
            <th>维度数量</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in cycles" :key="c.id">
            <td>{{ c.name }}</td>
            <td>{{ c.year }}</td>
            <td>Q{{ c.quarter }}</td>
            <td>{{ c.start_date }} ~ {{ c.end_date }}</td>
            <td>{{ (c.dimensions || []).length }} 个</td>
            <td><span :class="['tag', 'tag-status', 'tag-status-' + c.status]">{{ statusText[c.status] }}</span></td>
          </tr>
          <tr v-if="cycles.length === 0"><td colspan="6" class="empty-state"><div class="empty-state-icon">📅</div>暂无考核周期</td></tr>
        </tbody>
      </table>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">我参与的考核</div>
        <table class="table">
          <thead>
            <tr>
              <th>周期</th>
              <th>自评</th>
              <th>最终得分</th>
              <th>等级</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in myRecords" :key="r.id">
              <td>{{ r.cycle_name || ('Q' + r.quarter) }}</td>
              <td>{{ r.self_total_score || '-' }}</td>
              <td>{{ r.final_score || '-' }}</td>
              <td>
                <span v-if="r.grade" :class="['tag', 'tag-grade-' + r.grade.toLowerCase()]">{{ r.grade }}</span>
                <span v-else>-</span>
              </td>
              <td><span :class="['tag', 'tag-status', 'tag-status-' + r.status]">{{ statusText[r.status] }}</span></td>
            </tr>
            <tr v-if="myRecords.length === 0"><td colspan="5" class="empty-state"><div class="empty-state-icon">📋</div>暂无记录</td></tr>
          </tbody>
        </table>
      </div>

      <div class="card" v-if="isManager">
        <div class="card-title">待我评分的下属</div>
        <table class="table">
          <thead>
            <tr>
              <th>姓名</th>
              <th>周期</th>
              <th>自评得分</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in pendingReviews" :key="r.id">
              <td>{{ r.employee_name }}</td>
              <td>{{ r.cycle_name || ('Q' + r.quarter) }}</td>
              <td>{{ r.self_total_score || '-' }}</td>
              <td><span :class="['tag', 'tag-status', 'tag-status-' + r.status]">{{ statusText[r.status] }}</span></td>
              <td>
                <button v-if="r.status === 'self_reviewed'" class="btn btn-sm btn-primary" @click="$router.push(`/supervisor-review/${r.id}`)">去评分</button>
                <span v-else class="tag tag-status-pending">等待自评</span>
              </td>
            </tr>
            <tr v-if="pendingReviews.length === 0"><td colspan="5" class="empty-state"><div class="empty-state-icon">✅</div>暂无待评分</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '../utils/api'

const props = defineProps({ user: Object })

const cycles = ref([])
const myRecords = ref([])
const pendingReviews = ref([])

const statusText = {
  draft: '草稿',
  active: '进行中',
  pending: '待自评',
  self_reviewed: '待上级评',
  completed: '已完成'
}

const activeCycles = computed(() => cycles.value.filter(c => c.status === 'active').length)

const pendingCount = computed(() => {
  let count = 0
  count += myRecords.value.filter(r => r.status === 'pending').length
  count += pendingReviews.value.filter(r => r.status === 'self_reviewed').length
  return count
})

const isManager = computed(() => {
  return props.user && (props.user.role === 'manager' || props.user.role === 'admin')
})

const loadData = async () => {
  try {
    const [cyclesRes, recordsRes] = await Promise.all([
      api.getCycles(),
      api.getRecords({ employee_id: props.user?.id })
    ])
    cycles.value = cyclesRes.data || []
    myRecords.value = recordsRes.data || []
  } catch (e) {
    console.error(e)
  }

  if (isManager.value) {
    try {
      const res = await api.getRecords({ supervisor_id: props.user?.id })
      pendingReviews.value = res.data || []
    } catch (e) { console.error(e) }
  }
}

watch(() => props.user, loadData, { immediate: true })
</script>
