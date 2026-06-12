<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  show: boolean
  title?: string
}>()

const emit = defineEmits<{
  close: []
}>()

function handleClose() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="handleClose"></div>
        <div class="relative bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden transform">
          <div v-if="title" class="px-6 py-4 border-b border-gray-100">
            <h3 class="text-lg font-bold text-gray-800">{{ title }}</h3>
          </div>
          <div class="p-6 overflow-y-auto max-h-[60vh]">
            <slot></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.9) translateY(20px);
}
</style>
