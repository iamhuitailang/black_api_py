<template>
  <div>
    <div class="card">
      <div class="card-title">
        <span>历史绩效趋势</span>
        <div class="flex" v-if="props.user?.role === 'admin'">
          <select class="form-select" style="width:200px;" v-model="targetEmployeeId" @change="loadTrend">
            <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.name }} - {{ e.department }}</option>
          </select>
        </div>
      </div>

      <div class="grid-3 mb-20">
        <div class="stat-card">
          <div class="stat-label">参与考核次数</div>
          <div class="stat-value">{{ trendData.x_labels.length }}</div>
        </div>
        <div class="stat-card" style="border-left-color: var(--grade-a);">
          <div class="stat-label">历史平均分</div>
          <div class="stat-value" style="color: var(--grade-a);">{{ avgScore }}</div>
        </div>
        <div class="stat-card" style="border-left-color: var(--grade-s);">
          <div class="stat-label">最高等级</div>
          <div class="stat-value" style="color: var(--grade-s);">{{ highestGrade }}</div>
        </div>
      </div>

      <div class="card" style="margin-bottom:0;">
        <div class="card-title" style="font-size:14px;">跨季度得分折线图</div>
        <div ref="lineChart" style="width:100%; height:380px;"></div>
      </div>

      <div style="margin-top:20px;">
        <table class="table">
          <thead>
            <tr>
              <th>考核周期</th>
              <th>自评得分</th>
              <th>上级得分</th>
              <th>最终得分</th>
              <th>等级</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in history" :key="r.id">
              <td>{{ r.cycle_name || (r.year + 'Q' + r.quarter) }}</td>
              <td>{{ r.self_total_score || '-' }}</td>
              <td>{{ r.supervisor_total_score || '-' }}</td>
              <td><strong>{{ r.final_score || '-' }}</strong></td>
              <td>
                <span v-if="r.grade" :class="['tag', 'tag-grade-' + r.grade.toLowerCase()]">{{ r.grade }}</span>
                <span v-else>-</span>
              </td>
              <td><span :class="['tag', 'tag-status', 'tag-status-' + r.status]">{{ statusText[r.status] }}</span></td>
            </tr>
            <tr v-if="history.length === 0"><td colspan="6" class="empty-state"><div class="empty-state-icon">📜</div>暂无历史数据</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import api from '../utils/api'

const props = defineProps({ user: Object })

const employees = ref([])
const targetEmployeeId = ref(null)
const history = ref([])
const trendData = ref({ x_labels: [], scores: [], grades: [] })
const lineChart = ref(null)
let lineInstance = null
const statusText = { pending: '待自评', self_reviewed: '待上级评', completed: '已完成' }

const avgScore = computed(() => {
  const list = trendData.value.scores.filter(s => s !== null && s !== undefined)
  return list.length ? (list.reduce((a, b) => a + b, 0) / list.length).toFixed(2) : '0.00'
})

const highestGrade = computed(() => {
  const order = { S: 5, A: 4, B: 3, C: 2, D: 1 }
  let best = ''
  for (const g of trendData.value.grades) {
    if (g && (!best || (order[g] > order[best]))) best = g
  }
  return best || '-'
})

const loadEmployees = async () => {
  try {
    const res = await api.getEmployees()
    employees.value = res.data || []
    if (props.user) {
      targetEmployeeId.value = props.user.id
    } else if (employees.value.length > 0) {
      targetEmployeeId.value = employees.value[0].id
    }
    loadTrend()
  } catch (e) {}
}

const loadTrend = async () => {
  if (!targetEmployeeId.value) return
  try {
    const [trendRes, histRes] = await Promise.all([
      api.getEmployeeTrend(targetEmployeeId.value),
      api.getRecords({ employee_id: targetEmployeeId.value })
    ])
    trendData.value = trendRes.data || { x_labels: [], scores: [], grades: [] }
    history.value = histRes.data || []
    await nextTick()
    renderChart()
  } catch (e) { console.error(e) }
}

const gradeColor = { S: '#d4a017', A: '#26a269', B: '#1c71d8', C: '#e66100', D: '#c01c28' }

const renderChart = () => {
  if (!lineChart.value) return
  if (!lineInstance) lineInstance = echarts.init(lineChart.value)
  lineInstance.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const p = params[0]
        const idx = p.dataIndex
        const g = trendData.value.grades[idx] || ''
        return `${p.axisValue}<br/>得分：<strong>${p.value || '-'}</strong><br/>等级：${g ? `<span style="color:${gradeColor[g]}">${g}</span>` : '-'}`
      }
    },
    grid: { left: 50, right: 50, top: 50, bottom: 70 },
    xAxis: {
      type: 'category',
      data: trendData.value.x_labels.length ? trendData.value.x_labels : ['暂无数据'],
      axisLine: { lineStyle: { color: '#dce1e8' } },
      axisLabel: { color: '#5e6c84', interval: 0, rotate: 25, fontSize: 12, padding: [8, 0, 0, 0] }
    },
    yAxis: {
      type: 'value', min: 0, max: 10,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#eef0f4' } },
      axisLabel: { color: '#5e6c84' }
    },
    series: [{
      name: '得分', type: 'line', smooth: true,
      data: trendData.value.scores.length ? trendData.value.scores : [0],
      lineStyle: { width: 3, color: '#1a5fb4' },
      itemStyle: { color: '#1a5fb4', borderWidth: 2, borderColor: '#fff' },
      symbol: 'circle', symbolSize: 10,
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(26,95,180,0.25)' },
            { offset: 1, color: 'rgba(26,95,180,0.02)' }
          ]
        }
      },
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: { type: 'dashed', color: '#999' },
        data: [
          { yAxis: 9, label: { formatter: 'S 9.0', color: '#d4a017' } },
          { yAxis: 8, label: { formatter: 'A 8.0', color: '#26a269' } },
          { yAxis: 7, label: { formatter: 'B 7.0', color: '#1c71d8' } },
          { yAxis: 6, label: { formatter: 'C 6.0', color: '#e66100' } }
        ]
      },
      label: {
        show: true, position: 'top', color: '#2e3440', fontWeight: 600,
        formatter: (p) => {
          const g = trendData.value.grades[p.dataIndex]
          return g ? `${p.value} (${g})` : p.value
        }
      }
    }]
  })
}

watch(() => props.user, loadEmployees, { immediate: true })

onMounted(() => {
  window.addEventListener('resize', () => { lineInstance && lineInstance.resize() })
})
</script>
