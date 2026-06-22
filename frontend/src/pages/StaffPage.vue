<template>
  <AppLayout role="staff" :currentPage="currentPage" @navigate="currentPage = $event">
    <template v-if="currentPage === 'pending'">
      <OpinionWorkspace ref="workspaceRef" list-title="待认领意见"
                        :categories="categories" :statuses="[{ key: '', name: '全部' }]"
                        :fetch-list="fetchPending" :fetch-detail="opinionApi.detail">
        <template #detail="{ opinion, timelines }">
          <OpinionDetail :opinion="opinion" :timelines="timelines">
            <template #actions>
              <div v-if="opinion && (opinion.status === 'pending' || opinion.status === 'escalated')" class="flex gap-2">
                <button @click="handleClaim(opinion.id)" :disabled="claiming"
                        class="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm rounded-lg transition flex items-center justify-center gap-1">
                  <UserCheck class="w-4 h-4" /> {{ claiming ? '认领中...' : '认领该意见' }}
                </button>
              </div>
            </template>
          </OpinionDetail>
        </template>
      </OpinionWorkspace>
    </template>

    <template v-else-if="currentPage === 'my'">
      <OpinionWorkspace ref="workspaceRef" list-title="我的处理任务"
                        :categories="categories" :statuses="statuses"
                        :fetch-list="opinionApi.list" :fetch-detail="opinionApi.detail">
        <template #detail="{ opinion, timelines }">
          <OpinionDetail :opinion="opinion" :timelines="timelines">
            <template #actions>
              <div v-if="opinion && opinion.handler_id === currentUserId && ['claimed', 'processing'].includes(opinion.status)" class="flex gap-2">
                <button @click="openProcess(false)"
                        class="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition flex items-center justify-center gap-1">
                  <Wrench class="w-4 h-4" /> 更新进度
                </button>
                <button @click="openProcess(true)"
                        class="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition flex items-center justify-center gap-1">
                  <CheckCircle2 class="w-4 h-4" /> 处理完成
                </button>
              </div>
            </template>
          </OpinionDetail>
        </template>
      </OpinionWorkspace>
    </template>

    <template v-else-if="currentPage === 'public'">
      <PublicBoard />
    </template>
  </AppLayout>

  <ProcessModal :visible="showProcess" :opinion-id="processingOpinionId" :is-resolved="markResolved"
                @close="showProcess = false" @success="onProcessSuccess" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { UserCheck, Wrench, CheckCircle2 } from 'lucide-vue-next'
import AppLayout from '@/components/AppLayout.vue'
import OpinionWorkspace from '@/components/OpinionWorkspace.vue'
import OpinionDetail from '@/components/OpinionDetail.vue'
import ProcessModal from '@/components/ProcessModal.vue'
import PublicBoard from '@/pages/PublicBoard.vue'
import { opinionApi, getUser } from '@/api'
import type { Category } from '@/types'

const workspaceRef = ref<any>(null)
const currentPage = ref('pending')
const categories = ref<Category[]>([])
const statuses = [
  { key: '', name: '全部' },
  { key: 'claimed', name: '已认领' },
  { key: 'processing', name: '处理中' },
  { key: 'resolved', name: '已解决' },
  { key: 'closed', name: '已关闭' }
]

const user = getUser()
const currentUserId = user?.id || 0

const claiming = ref(false)
const showProcess = ref(false)
const processingOpinionId = ref<number | null>(null)
const markResolved = ref(false)

onMounted(async () => {
  const res = await opinionApi.categories()
  if (res.code === 0) categories.value = res.data
})

async function fetchPending(params: any) {
  return opinionApi.pendingList(params)
}

async function handleClaim(id: number) {
  claiming.value = true
  try {
    const res = await opinionApi.claim(id)
    if (res.code === 0) {
      workspaceRef.value?.loadList()
      workspaceRef.value?.selectOpinion(id)
    } else {
      alert(res.message)
    }
  } finally {
    claiming.value = false
  }
}

function openProcess(resolved: boolean) {
  const selected = workspaceRef.value?.selectedOpinion
  if (selected) {
    processingOpinionId.value = selected.id
    markResolved.value = resolved
    showProcess.value = true
  }
}

function onProcessSuccess() {
  workspaceRef.value?.loadList()
  if (processingOpinionId.value) workspaceRef.value?.selectOpinion(processingOpinionId.value)
}
</script>
