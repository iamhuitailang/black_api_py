<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { BattleLogEntry } from '../types'

const props = defineProps<{
  logs: BattleLogEntry[]
}>()

const logContainer = ref<HTMLElement | null>(null)

watch(
  () => props.logs.length,
  async () => {
    await nextTick()
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  }
)

function getLogClass(type: BattleLogEntry['type']): string {
  switch (type) {
    case 'player':
      return 'text-jade-light'
    case 'enemy':
      return 'text-cinnabar-light'
    case 'damage':
      return 'text-cinnabar'
    case 'heal':
      return 'text-jade'
    case 'system':
    default:
      return 'text-gold'
  }
}
</script>

<template>
  <div
    ref="logContainer"
    class="ink-paper rounded p-3 h-full overflow-y-auto"
  >
    <div class="space-y-1">
      <div
        v-for="log in logs"
        :key="log.id"
        class="text-sm font-song leading-relaxed animate-fade-in"
        :class="getLogClass(log.type)"
      >
        <span class="text-ink-400 mr-2">▸</span>
        {{ log.text }}
      </div>
      <div v-if="logs.length === 0" class="text-ink-500 text-sm text-center py-4">
        战斗尚未开始……
      </div>
    </div>
  </div>
</template>
