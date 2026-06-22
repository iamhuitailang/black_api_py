<template>
  <AppLayout role="resident" :currentPage="currentPage" @navigate="currentPage = $event">
    <template v-if="currentPage === 'list'">
      <OpinionWorkspace ref="workspaceRef" list-title="我的意见" :show-create-btn="true"
                        :categories="categories" :statuses="statuses"
                        :fetch-list="opinionApi.list" :fetch-detail="opinionApi.detail"
                        @create="showCreate = true">
        <template #detail="{ opinion, timelines }">
          <OpinionDetail :opinion="opinion" :timelines="timelines">
            <template #actions>
              <div v-if="opinion && opinion.status === 'resolved'" class="flex gap-2">
                <button @click="openRating(opinion.id)"
                        class="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition flex items-center justify-center gap-1">
                  <Star class="w-4 h-4" /> 满意度评价
                </button>
              </div>
            </template>
          </OpinionDetail>
        </template>
      </OpinionWorkspace>
    </template>

    <template v-else-if="currentPage === 'submit'">
      <div class="h-full overflow-y-auto bg-gray-50 p-6">
        <div class="max-w-2xl mx-auto">
          <div class="bg-white rounded-xl p-6">
            <h2 class="text-lg font-semibold text-gray-800 mb-4">提交新意见</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
                <input v-model="form.title" type="text" placeholder="请简要描述问题"
                       class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">类别 *</label>
                <div class="grid grid-cols-4 gap-2">
                  <button v-for="c in categories" :key="c.key" type="button"
                          @click="form.category = c.key"
                          :class="['py-3 px-3 rounded-lg text-sm border transition text-center',
                            form.category === c.key
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300']">
                    <component :is="categoryIcons[c.key] || MoreHorizontal" class="w-5 h-5 mx-auto mb-1" />
                    {{ c.name }}
                  </button>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">详细描述 *</label>
                <textarea v-model="form.description" rows="6" placeholder="请详细描述您遇到的问题或建议，包括具体位置、时间等信息..."
                          class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">照片（最多5张）</label>
                <div class="flex gap-2 flex-wrap">
                  <div v-for="(p, i) in form.photos" :key="i" class="relative">
                    <img :src="p" class="w-24 h-24 object-cover rounded-lg border" />
                    <button type="button" @click="removePhoto(i)"
                            class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                      <X class="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <label v-if="form.photos.length < 5"
                         class="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-indigo-400 hover:text-indigo-500 transition">
                    <ImagePlus class="w-8 h-8" />
                    <span class="text-xs mt-1">点击上传</span>
                    <input type="file" accept="image/*" multiple class="hidden" @change="handleUpload" />
                  </label>
                </div>
              </div>
              <div v-if="submitError" class="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{{ submitError }}</div>
              <button @click="handleSubmit" :disabled="submitting"
                      class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-medium transition flex items-center justify-center gap-2">
                <Loader v-if="submitting" class="w-5 h-5 animate-spin" />
                {{ submitting ? '提交中...' : '提交意见' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="currentPage === 'public'">
      <PublicBoard />
    </template>
  </AppLayout>

  <CreateOpinionModal :visible="showCreate" :categories="categories"
                      @close="showCreate = false" @success="onCreateSuccess" />
  <RatingModal :visible="showRating" :opinion-id="ratingOpinionId"
               @close="showRating = false" @success="onRatingSuccess" />
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Star, X, ImagePlus, MoreHorizontal, Leaf, ShieldCheck, Wrench, Loader } from 'lucide-vue-next'
import AppLayout from '@/components/AppLayout.vue'
import OpinionWorkspace from '@/components/OpinionWorkspace.vue'
import OpinionDetail from '@/components/OpinionDetail.vue'
import CreateOpinionModal from '@/components/CreateOpinionModal.vue'
import RatingModal from '@/components/RatingModal.vue'
import PublicBoard from '@/pages/PublicBoard.vue'
import { opinionApi } from '@/api'
import type { Category } from '@/types'

const workspaceRef = ref<any>(null)
const currentPage = ref('list')
const categories = ref<Category[]>([])
const statuses = [
  { key: '', name: '全部' },
  { key: 'pending', name: '待认领' },
  { key: 'claimed', name: '已认领' },
  { key: 'processing', name: '处理中' },
  { key: 'resolved', name: '已解决' },
  { key: 'closed', name: '已关闭' }
]

const categoryIcons: Record<string, any> = { environment: Leaf, security: ShieldCheck, facility: Wrench }

const showCreate = ref(false)
const showRating = ref(false)
const ratingOpinionId = ref<number | null>(null)

const form = reactive({ title: '', category: 'environment', description: '', photos: [] as string[] })
const submitting = ref(false)
const submitError = ref('')

onMounted(async () => {
  const res = await opinionApi.categories()
  if (res.code === 0) categories.value = res.data
})

function openRating(id: number) {
  ratingOpinionId.value = id
  showRating.value = true
}

function onCreateSuccess() {
  workspaceRef.value?.loadList()
}

function onRatingSuccess() {
  workspaceRef.value?.loadList()
  if (ratingOpinionId.value) workspaceRef.value?.selectOpinion(ratingOpinionId.value)
}

async function handleUpload(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  const files = Array.from(input.files).slice(0, 5 - form.photos.length)
  const res = await opinionApi.upload(files)
  if (res.code === 0 && res.data?.urls) {
    form.photos.push(...res.data.urls)
  }
  input.value = ''
}

function removePhoto(i: number) {
  form.photos.splice(i, 1)
}

async function handleSubmit() {
  if (!form.title.trim()) { submitError.value = '请填写标题'; return }
  if (!form.description.trim()) { submitError.value = '请填写详细描述'; return }
  submitting.value = true
  submitError.value = ''
  try {
    const res = await opinionApi.create({
      title: form.title, category: form.category, description: form.description,
      photos: form.photos.length ? form.photos : undefined
    })
    if (res.code === 0) {
      form.title = ''
      form.description = ''
      form.photos = []
      currentPage.value = 'list'
      setTimeout(() => workspaceRef.value?.loadList(), 100)
    } else {
      submitError.value = res.message || '提交失败'
    }
  } finally {
    submitting.value = false
  }
}
</script>
