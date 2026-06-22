<template>
  <div v-if="visible" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl w-full max-w-md">
      <div class="flex items-center justify-between p-4 border-b">
        <h3 class="font-semibold text-gray-800">满意度评价</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
          <X class="w-5 h-5" />
        </button>
      </div>
      <div class="p-6">
        <div class="text-center mb-4">
          <p class="text-sm text-gray-500 mb-3">请对本次处理结果进行评价</p>
          <div class="flex justify-center gap-2">
            <button v-for="i in 5" :key="i" type="button" @click="form.rating = i"
                    class="p-1 transition transform hover:scale-110">
              <Star :class="i <= form.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'" class="w-10 h-10" />
            </button>
          </div>
          <p class="text-sm text-gray-600 mt-2">{{ ratingText }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">评价内容（可选）</label>
          <textarea v-model="form.comment" rows="3" placeholder="说说您的感受..."
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"></textarea>
        </div>
        <div v-if="error" class="mt-3 text-sm text-red-500 bg-red-50 p-3 rounded-lg">{{ error }}</div>
      </div>
      <div class="flex justify-end gap-2 p-4 border-t">
        <button @click="$emit('close')" class="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition">
          取消
        </button>
        <button @click="handleSubmit" :disabled="submitting || !form.rating"
                class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition flex items-center gap-1">
          <Loader v-if="submitting" class="w-4 h-4 animate-spin" />
          {{ submitting ? '提交中...' : '提交评价' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { X, Star, Loader } from 'lucide-vue-next'
import { opinionApi } from '@/api'

const props = defineProps<{
  visible: boolean
  opinionId: number | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

const form = reactive({ rating: 0, comment: '' })
const submitting = ref(false)
const error = ref('')

const ratingText = computed(() => {
  const texts = ['', '非常不满意', '不满意', '一般', '满意', '非常满意']
  return texts[form.rating] || ''
})

watch(() => props.visible, (v) => {
  if (v) {
    form.rating = 0
    form.comment = ''
    error.value = ''
  }
})

async function handleSubmit() {
  if (!form.rating || !props.opinionId) return
  submitting.value = true
  error.value = ''
  try {
    const res = await opinionApi.rate({
      opinion_id: props.opinionId,
      rating: form.rating,
      comment: form.comment || undefined
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
