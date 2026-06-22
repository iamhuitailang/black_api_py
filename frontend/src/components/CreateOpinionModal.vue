<template>
  <div v-if="visible" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between p-4 border-b">
        <h3 class="font-semibold text-gray-800">提交意见</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
          <X class="w-5 h-5" />
        </button>
      </div>
      <div class="p-4 space-y-4">
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
                    :class="['py-2 px-3 rounded-lg text-sm border transition',
                      form.category === c.key
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300']">
              <component :is="categoryIcons[c.key] || MoreHorizontal" class="w-4 h-4 mx-auto mb-1" />
              {{ c.name }}
            </button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">详细描述 *</label>
          <textarea v-model="form.description" rows="4" placeholder="请详细描述您遇到的问题或建议..."
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">照片（最多5张）</label>
          <div class="flex gap-2 flex-wrap">
            <div v-for="(p, i) in form.photos" :key="i" class="relative">
              <img :src="p" class="w-20 h-20 object-cover rounded-lg border" />
              <button type="button" @click="removePhoto(i)"
                      class="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                <X class="w-3 h-3" />
              </button>
            </div>
            <label v-if="form.photos.length < 5"
                   class="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-indigo-400 hover:text-indigo-500 transition">
              <ImagePlus class="w-6 h-6" />
              <span class="text-xs mt-1">上传</span>
              <input type="file" accept="image/*" multiple class="hidden" @change="handleUpload" />
            </label>
          </div>
        </div>
        <div v-if="error" class="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{{ error }}</div>
      </div>
      <div class="flex justify-end gap-2 p-4 border-t">
        <button @click="$emit('close')" class="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition">
          取消
        </button>
        <button @click="handleSubmit" :disabled="submitting"
                class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition flex items-center gap-1">
          <Loader v-if="submitting" class="w-4 h-4 animate-spin" />
          {{ submitting ? '提交中...' : '提交' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { X, ImagePlus, MoreHorizontal, Leaf, ShieldCheck, Wrench, Loader } from 'lucide-vue-next'
import type { Category } from '@/types'
import { opinionApi } from '@/api'

const DRAFT_KEY = 'opinion_draft'

const props = defineProps<{
  visible: boolean
  categories: Category[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

const categoryIcons: Record<string, any> = { environment: Leaf, security: ShieldCheck, facility: Wrench }

function loadDraft() {
  try {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return null
}

function saveDraft() {
  const data = { title: form.title, category: form.category, description: form.description }
  localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY)
}

const draft = loadDraft()
const form = reactive({
  title: draft?.title || '',
  category: draft?.category || 'environment',
  description: draft?.description || '',
  photos: [] as string[]
})
const submitting = ref(false)
const error = ref('')

watch(() => props.visible, (v) => {
  if (v) {
    const d = loadDraft()
    form.title = d?.title || ''
    form.category = d?.category || props.categories[0]?.key || 'environment'
    form.description = d?.description || ''
    form.photos = []
    error.value = ''
  }
})

watch(() => [form.title, form.category, form.description], () => {
  saveDraft()
}, { deep: true })

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
  if (!form.title.trim()) { error.value = '请填写标题'; return }
  if (!form.description.trim()) { error.value = '请填写详细描述'; return }
  submitting.value = true
  error.value = ''
  try {
    const res = await opinionApi.create({
      title: form.title,
      category: form.category,
      description: form.description,
      photos: form.photos.length ? form.photos : undefined
    })
    if (res.code === 0) {
      clearDraft()
      emit('success')
      emit('close')
    } else {
      error.value = res.message || '提交失败'
    }
  } finally {
    submitting.value = false
  }
}
</script>
