<template>
  <AppLayout role="admin" :currentPage="currentPage" @navigate="currentPage = $event">
    <template v-if="currentPage === 'all'">
      <OpinionWorkspace ref="workspaceRef" list-title="全量意见数据"
                        :categories="categories" :statuses="allStatuses"
                        :fetch-list="opinionApi.list" :fetch-detail="opinionApi.detail">
        <template #detail="{ opinion, timelines }">
          <OpinionDetail :opinion="opinion" :timelines="timelines">
            <template #actions>
              <div v-if="opinion" class="space-y-2">
                <div class="flex gap-2">
                  <select v-model="selectedHandler"
                          class="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">选择工作人员...</option>
                    <option v-for="s in staffList" :key="s.id" :value="s.id">
                      {{ s.real_name || s.username }} ({{ s.community || '未分配社区' }})
                    </option>
                  </select>
                  <button @click="handleAssign(opinion.id)" :disabled="!selectedHandler || assigning"
                          class="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm rounded-lg transition">
                    {{ assigning ? '分配中...' : '分配' }}
                  </button>
                </div>
                <div v-if="opinion.status !== 'escalated'" class="flex gap-2">
                  <button @click="handleEscalate(opinion.id)" :disabled="escalating"
                          class="flex-1 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white text-sm rounded-lg transition flex items-center justify-center gap-1">
                    <AlertTriangle class="w-4 h-4" /> {{ escalating ? '升级中...' : '升级督办' }}
                  </button>
                </div>
              </div>
            </template>
          </OpinionDetail>
        </template>
      </OpinionWorkspace>
    </template>

    <template v-else-if="currentPage === 'stats'">
      <div class="h-full overflow-y-auto bg-gray-50 p-6">
        <div class="max-w-6xl mx-auto space-y-6">
          <h2 class="text-xl font-semibold text-gray-800">统计分析</h2>

          <div class="grid grid-cols-4 gap-4">
            <div class="bg-white rounded-xl p-5 border">
              <div class="text-sm text-gray-500 mb-1">意见总数</div>
              <div class="text-3xl font-bold text-gray-800">{{ stats?.summary?.total || 0 }}</div>
            </div>
            <div class="bg-white rounded-xl p-5 border">
              <div class="text-sm text-gray-500 mb-1">已解决</div>
              <div class="text-3xl font-bold text-green-600">{{ stats?.summary?.resolved || 0 }}</div>
              <div class="text-xs text-gray-400 mt-1">解决率 {{ stats?.summary?.resolved_rate || 0 }}%</div>
            </div>
            <div class="bg-white rounded-xl p-5 border">
              <div class="text-sm text-gray-500 mb-1">平均满意度</div>
              <div class="text-3xl font-bold text-amber-500 flex items-center gap-1">
                {{ stats?.summary?.avg_rating || 0 }}
                <Star class="w-6 h-6 fill-amber-400 text-amber-400" />
              </div>
            </div>
            <div class="bg-white rounded-xl p-5 border">
              <div class="text-sm text-gray-500 mb-1">平均响应天数</div>
              <div class="text-3xl font-bold text-indigo-600">{{ stats?.summary?.avg_response_days || 0 }}<span class="text-base font-normal text-gray-400 ml-1">天</span></div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="bg-white rounded-xl p-5 border">
              <h3 class="text-sm font-semibold text-gray-700 mb-4">类别分布</h3>
              <div class="space-y-3">
                <template v-for="(v, k) in stats?.category" :key="k">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-600">{{ v.name }}</span>
                    <span class="font-medium text-gray-800">{{ v.count }} 件</span>
                  </div>
                  <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full bg-indigo-500 rounded-full"
                         :style="{ width: `${stats?.summary?.total ? (v.count / stats.summary.total * 100) : 0}%` }"></div>
                  </div>
                </template>
              </div>
            </div>

            <div class="bg-white rounded-xl p-5 border">
              <h3 class="text-sm font-semibold text-gray-700 mb-4">处理状态</h3>
              <div class="space-y-3">
                <template v-for="(v, k) in stats?.status" :key="k">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-600">{{ v.name }}</span>
                    <span class="font-medium text-gray-800">{{ v.count }} 件</span>
                  </div>
                  <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full bg-green-500 rounded-full"
                         :style="{ width: `${stats?.summary?.total ? (v.count / stats.summary.total * 100) : 0}%` }"></div>
                  </div>
                </template>
              </div>
            </div>

            <div class="bg-white rounded-xl p-5 border">
              <h3 class="text-sm font-semibold text-gray-700 mb-4">月度趋势</h3>
              <div class="h-40 flex items-end gap-3">
                <div v-for="m in stats?.monthly?.slice().reverse()" :key="m.month" class="flex-1 flex flex-col items-center gap-1">
                  <div class="w-full bg-indigo-500 rounded-t"
                       :style="{ height: `${m.count ? Math.max(m.count * 4, 4) : 2}px` }"></div>
                  <span class="text-xs text-gray-500">{{ m.month?.slice(5) }}月</span>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-xl p-5 border">
              <h3 class="text-sm font-semibold text-gray-700 mb-4">满意度分布</h3>
              <div class="h-40 flex items-end gap-2">
                <div v-for="i in 5" :key="i" class="flex-1 flex flex-col items-center gap-1">
                  <div class="text-xs font-medium text-gray-700">{{ stats?.rating?.[i] || 0 }}</div>
                  <div class="w-full bg-amber-400 rounded-t"
                       :style="{ height: `${(stats?.rating?.[i] || 0) * 8}px` }"></div>
                  <div class="flex">
                    <Star class="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="currentPage === 'report'">
      <div class="h-full overflow-y-auto bg-gray-50 p-6">
        <div class="max-w-4xl mx-auto">
          <div class="bg-white rounded-xl p-6 border">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">生成月度治理报告</h2>
            <div class="flex gap-3 mb-6">
              <select v-model="reportYear" class="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                <option v-for="y in yearOptions" :key="y" :value="y">{{ y }} 年</option>
              </select>
              <select v-model="reportMonth" class="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                <option v-for="m in 12" :key="m" :value="m">{{ m }} 月</option>
              </select>
              <button @click="loadReport" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">
                生成报告
              </button>
            </div>

            <div v-if="report" class="space-y-5">
              <div class="text-center pb-4 border-b">
                <h3 class="text-lg font-bold text-gray-800">{{ report.year }}年{{ report.month }}月 社区治理月度报告</h3>
              </div>

              <div class="grid grid-cols-4 gap-3">
                <div class="bg-gray-50 p-4 rounded-lg text-center">
                  <div class="text-xs text-gray-500">意见总数</div>
                  <div class="text-2xl font-bold text-gray-800">{{ report.summary.total }}</div>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg text-center">
                  <div class="text-xs text-gray-500">已解决</div>
                  <div class="text-2xl font-bold text-green-600">{{ report.summary.resolved }}</div>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg text-center">
                  <div class="text-xs text-gray-500">解决率</div>
                  <div class="text-2xl font-bold text-indigo-600">{{ report.summary.resolved_rate }}%</div>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg text-center">
                  <div class="text-xs text-gray-500">平均满意度</div>
                  <div class="text-2xl font-bold text-amber-500">{{ report.summary.avg_rating }}</div>
                </div>
              </div>

              <div>
                <h4 class="text-sm font-semibold text-gray-700 mb-2">一、各类别意见统计</h4>
                <table class="w-full text-sm border">
                  <thead class="bg-gray-50">
                    <tr><th class="px-3 py-2 text-left border-b">类别</th><th class="px-3 py-2 text-left border-b">数量</th><th class="px-3 py-2 text-left border-b">占比</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="(v, k) in report.category" :key="k" class="border-b">
                      <td class="px-3 py-2">{{ v.name }}</td>
                      <td class="px-3 py-2">{{ v.count }}</td>
                      <td class="px-3 py-2">{{ report.summary.total ? (v.count / report.summary.total * 100).toFixed(1) : 0 }}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h4 class="text-sm font-semibold text-gray-700 mb-2">二、处理效率</h4>
                <p class="text-sm text-gray-600">本月平均响应天数：<span class="font-medium">{{ report.summary.avg_response_days }} 天</span></p>
              </div>

              <div>
                <h4 class="text-sm font-semibold text-gray-700 mb-2">三、居民满意度</h4>
                <div class="flex gap-4">
                  <div v-for="i in 5" :key="i" class="flex items-center gap-1 text-sm text-gray-600">
                    <div class="flex">
                      <Star v-for="j in i" :key="j" class="w-4 h-4 text-amber-400 fill-amber-400" />
                    </div>
                    <span>{{ report.rating?.[i] || 0 }} 人</span>
                  </div>
                </div>
                <p class="text-sm text-gray-600 mt-2">综合满意度评分：<span class="font-medium text-amber-500">{{ report.summary.avg_rating }} 分</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="currentPage === 'public'">
      <PublicBoard />
    </template>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Star, AlertTriangle } from 'lucide-vue-next'
import AppLayout from '@/components/AppLayout.vue'
import OpinionWorkspace from '@/components/OpinionWorkspace.vue'
import OpinionDetail from '@/components/OpinionDetail.vue'
import PublicBoard from '@/pages/PublicBoard.vue'
import { opinionApi } from '@/api'
import type { Category, Staff, Statistics, MonthlyReport } from '@/types'

const workspaceRef = ref<any>(null)
const currentPage = ref('all')
const categories = ref<Category[]>([])
const staffList = ref<Staff[]>([])
const allStatuses = [
  { key: '', name: '全部' },
  { key: 'pending', name: '待认领' },
  { key: 'claimed', name: '已认领' },
  { key: 'processing', name: '处理中' },
  { key: 'resolved', name: '已解决' },
  { key: 'escalated', name: '已升级' },
  { key: 'closed', name: '已关闭' }
]

const selectedHandler = ref<number | ''>('')
const assigning = ref(false)
const escalating = ref(false)

const stats = ref<Statistics | null>(null)

const now = new Date()
const reportYear = ref(now.getFullYear())
const reportMonth = ref(now.getMonth() + 1)
const report = ref<MonthlyReport | null>(null)
const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

onMounted(async () => {
  const [catRes, staffRes, statsRes] = await Promise.all([
    opinionApi.categories(), opinionApi.staffList(), opinionApi.statistics()
  ])
  if (catRes.code === 0) categories.value = catRes.data
  if (staffRes.code === 0) staffList.value = staffRes.data
  if (statsRes.code === 0) stats.value = statsRes.data
})

async function handleAssign(id: number) {
  if (!selectedHandler.value) return
  assigning.value = true
  try {
    const res = await opinionApi.assign({ opinion_id: id, handler_id: Number(selectedHandler.value) })
    if (res.code === 0) {
      selectedHandler.value = ''
      workspaceRef.value?.loadList()
      workspaceRef.value?.selectOpinion(id)
    } else {
      alert(res.message)
    }
  } finally {
    assigning.value = false
  }
}

async function handleEscalate(id: number) {
  escalating.value = true
  try {
    const res = await opinionApi.escalate(id)
    if (res.code === 0) {
      workspaceRef.value?.loadList()
      workspaceRef.value?.selectOpinion(id)
    } else {
      alert(res.message)
    }
  } finally {
    escalating.value = false
  }
}

async function loadReport() {
  const res = await opinionApi.report(reportYear.value, reportMonth.value)
  if (res.code === 0) report.value = res.data
}
</script>
