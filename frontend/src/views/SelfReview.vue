<template>
  <div>
    <div class="card">
      <div class="card-title">我的待自评考核</div>
      <table class="table">
        <thead>
          <tr>
            <th>考核周期</th>
            <th>起止时间</th>
            <th>状态</th>
            <th>自评得分</th>
            <th>最终得分</th>
            <th>等级</th>
            <th style="width: 140px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in records" :key="r.id">
            <td>{{ r.cycle_name || (r.year + '年Q' + r.quarter) }}</td>
            <td>{{ r.cycle?.start_date || '-' }} ~ {{ r.cycle?.end_date || '-' }}</td>
            <td><span :class="['tag', 'tag-status', 'tag-status-' + r.status]">{{ statusText[r.status] }}</span></td>
            <td>{{ r.self_total_score || '-' }}</td>
            <td>{{ r.final_score || '-' }}</td>
            <td>
              <span v-if="r.grade" :class="['tag', 'tag-grade-' + r.grade.toLowerCase()]">{{ r.grade }}</span>
              <span v-else>-</span>
            </td>
            <td>
              <button v-if="r.status === 'pending' || r.status === 'self_reviewed'" class="btn btn-sm btn-primary" @click="goDetail(r.id)">
                {{ r.status === 'pending' ? '去自评' : '查看/编辑' }}
              </button>
              <button v-else class="btn btn-sm" @click="goDetail(r.id)">查看详情</button>
            </td>
          </tr>
          <tr v-if="records.length === 0"><td colspan="7" class="empty-state"><div class="empty-state-icon">📝</div>暂无考核记录</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '../utils/api'

const props = defineProps({ user: Object })
const router = useRouter()
const records = ref([])
const statusText = { draft: '草稿', active: '进行中', pending: '待自评', self_reviewed: '待上级评', completed: '已完成' }

const loadData = async () => {
  try {
    const res = await api.getRecords({ employee_id: props.user?.id })
    records.value = (res.data || []).map(r => ({ ...r }))
    for (const r of records.value) {
      try {
        const detail = await api.getRecord(r.id)
        r.cycle = detail.data?.cycle || null
      } catch(e) {}
    }
  } catch (e) { console.error(e) }
}

watch(() => props.user, loadData, { immediate: true })

const goDetail = (id) => router.push(`/self-review/${id}`)
</script>
