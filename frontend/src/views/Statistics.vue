<template>
  <div>
    <div class="card">
      <div class="card-title">
        <span>部门绩效统计分析</span>
        <div class="flex">
          <select class="form-select" style="width:200px; margin-right:10px;" v-model="filterCycle" @change="loadData">
            <option value="">请选择考核周期</option>
            <option v-for="c in cycles" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
          <select class="form-select" style="width:180px;" v-model="filterDept" @change="loadData">
            <option value="">全部门</option>
            <option v-for="d in departments" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>
      </div>

      <div v-if="!filterCycle" class="empty-state">
        <div class="empty-state-icon">📊</div>
        请选择考核周期查看统计数据
      </div>

      <template v-else>
        <div class="grid-3 mb-20">
          <div class="stat-card">
            <div class="stat-label">参评总人数</div>
            <div class="stat-value">{{ stats.total_count }}</div>
          </div>
          <div class="stat-card" style="border-left-color: var(--grade-a);">
            <div class="stat-label">平均得分</div>
            <div class="stat-value" style="color: var(--grade-a);">{{ stats.avg_score }}</div>
          </div>
          <div class="stat-card" style="border-left-color: var(--grade-s);">
            <div class="stat-label">S/A级人数占比</div>
            <div class="stat-value" style="color: var(--grade-s);">{{ saRate }}%</div>
          </div>
        </div>

        <div class="grid-2">
          <div class="card" style="margin-bottom:0;">
            <div class="card-title" style="font-size:14px;">等级分布饼图</div>
            <div ref="pieChart" class="chart-container"></div>
          </div>
          <div class="card" style="margin-bottom:0;">
            <div class="card-title" style="font-size:14px;">分数段直方图</div>
            <div ref="barChart" class="chart-container"></div>
          </div>
        </div>

        <div class="card" style="margin-top:20px;">
          <div class="card-title" style="font-size:14px;">员工详细得分表</div>
          <table class="table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>部门</th>
                <th>职位</th>
                <th>自评得分</th>
                <th>上级得分</th>
                <th>最终得分</th>
                <th>等级</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in records" :key="r.id" v-if="r.status === 'completed'">
                <td>{{ r.employee_name }}</td>
                <td>{{ r.department }}</td>
                <td>{{ r.position }}</td>
                <td>{{ r.self_total_score }}</td>
                <td>{{ r.supervisor_total_score }}</td>
                <td><strong>{{ r.final_score }}</strong></td>
                <td><span class="tag tag-grade-{{r.grade.toLowerCase()}}">{{ r.grade }}</span></td>
              </tr>
              <tr v-if="records.filter(r=>r.status==='completed').length === 0">
                <td colspan="7" class="empty-state"><div class="empty-state-icon">📋</div>暂无已完成的考核数据</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, defineProps } from 'vue'
import * as echarts from 'echarts'
import api from '../utils/api'

defineProps({ user: Object })

const cycles = ref([])
const departments = ref([])
const filterCycle = ref('')
const filterDept = ref('')
const stats = ref({ total_count: 0, avg_score: 0, grade_distribution: {}, score_ranges: {} })
const records = ref([])
const pieChart = ref(null)
const barChart = ref(null)
let pieInstance = null, barInstance = null

const saRate = computed(() => {
  const gd = stats.value.grade_distribution || {}
  const sa = (gd.S || 0) + (gd.A || 0)
  return stats.value.total_count ? Math.round(sa / stats.value.total_count * 100) : 0
})

const loadData = async () => {
  try {
    const dres = await api.getDepartments()
    departments.value = dres.data || []
  } catch(e) {}

  if (!filterCycle.value) return
  try {
    const params = { cycle_id: filterCycle.value }
    if (filterDept.value) params.department = filterDept.value
    const [statRes, recRes] = await Promise.all([
      api.getStatistics(params),
      api.getRecords(filterDept.value ? { cycle_id: filterCycle.value, department: filterDept.value } : { cycle_id: filterCycle.value })
    ])
    stats.value = statRes.data || stats.value
    records.value = recRes.data || []
    await nextTick()
    renderCharts()
  } catch (e) { console.error(e) }
}

const renderCharts = () => {
  if (pieChart.value) {
    if (!pieInstance) pieInstance = echarts.init(pieChart.value)
    const gd = stats.value.grade_distribution || {}
    const data = [
      { value: gd.S || 0, name: 'S', itemStyle: { color: '#d4a017' } },
      { value: gd.A || 0, name: 'A', itemStyle: { color: '#26a269' } },
      { value: gd.B || 0, name: 'B', itemStyle: { color: '#1c71d8' } },
      { value: gd.C || 0, name: 'C', itemStyle: { color: '#e66100' } },
      { value: gd.D || 0, name: 'D', itemStyle: { color: '#c01c28' } }
    ]
    pieInstance.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
      legend: { bottom: 0, itemWidth: 14, itemHeight: 14 },
      series: [{
        type: 'pie', radius: ['45%', '70%'], avoidLabelOverlap: false,
        label: { show: true, formatter: '{b}\n{c}人' },
        labelLine: { show: true },
        data
      }]
    })
  }
  if (barChart.value) {
    if (!barInstance) barInstance = echarts.init(barChart.value)
    const sr = stats.value.score_ranges || {}
    barInstance.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 40, right: 20, top: 30, bottom: 30 },
      xAxis: {
        type: 'category',
        data: ['0-5.9', '6-6.9', '7-7.9', '8-8.9', '9-10'],
        axisLine: { lineStyle: { color: '#dce1e8' } },
        axisLabel: { color: '#5e6c84' }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#eef0f4' } },
        axisLabel: { color: '#5e6c84' }
      },
      series: [{
        type: 'bar', barWidth: '50%',
        data: [
          { value: sr['0-5.9'] || 0, itemStyle: { color: '#c01c28' } },
          { value: sr['6-6.9'] || 0, itemStyle: { color: '#e66100' } },
          { value: sr['7-7.9'] || 0, itemStyle: { color: '#1c71d8' } },
          { value: sr['8-8.9'] || 0, itemStyle: { color: '#26a269' } },
          { value: sr['9-10'] || 0, itemStyle: { color: '#d4a017' } }
        ],
        label: { show: true, position: 'top', color: '#2e3440' }
      }]
    })
  }
}

onMounted(async () => {
  try {
    const res = await api.getCycles()
    cycles.value = res.data || []
    if (cycles.value.length > 0) {
      filterCycle.value = cycles.value[0].id
    }
    loadData()
    window.addEventListener('resize', () => {
      pieInstance && pieInstance.resize()
      barInstance && barInstance.resize()
    })
  } catch (e) {}
})
</script>
