<template>
  <div v-if="visible" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between p-4 border-b">
        <h3 class="font-semibold text-gray-800">{{ isResolved ? '提交处理结果' : '更新处理进度' }}</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
          <X class="w-5 h-5" />
        </button>
      </div>
      <div class="p-4 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">处理内容 *</label>
          <textarea v-model="form.content" rows="5"
                    :placeholder="isResolved ? '请填写处理措施和最终结果...' : '请填写当前处理进度...'"
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">处理凭证照片（最多5张）</label>
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
        <div v-if="!isResolved" class="flex items-center gap-2">
          <input id="resolveCheck" v-model="form.is_resolved" type="checkbox"
                 class="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
          <label for="resolveCheck" class="text-sm text-gray-700">标记为已处理完成</label>
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
import { ref, reactive, watch, computed } from 'vue'
import { X, ImagePlus, Loader } from 'lucide-vue-next'
import { opinionApi } from '@/api'

const props = defineProps<{
  visible: boolean
  opinionId: number | null
  isResolved?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

const form = reactive({ content: '', photos: [] as string[], is_resolved: false })
const submitting = ref(false)
const error = ref('')

watch(() => props.visible, (v) => {
  if (v) {
    form.content = ''
    form.photos = []
    form.is_resolved = !!props.isResolved
    error.value = ''
  }
})

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
  if (!form.content.trim() || !props.opinionId) { error.value = '请填写处理内容'; return }
  submitting.value = true
  error.value = ''
  try {
    const res = await opinionApi.process({
      opinion_id: props.opinionId,
      content: form.content,
      photos: form.photos.length ? form.photos : undefined,
      is_resolved: form.is_resolved
    })
    if (res.code === 0) {
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
