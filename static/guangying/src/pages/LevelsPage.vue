<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Settings } from 'lucide-vue-next'
import { useGameStore } from '@/store/gameStore'
import LevelSelect from '@/components/LevelSelect.vue'
import SettingsPanel from '@/components/SettingsPanel.vue'

const gameStore = useGameStore()

/** 是否显示设置面板 */
const showSettings = ref<boolean>(false)

/** 切换设置面板 */
const toggleSettings = (): void => {
  showSettings.value = !showSettings.value
}

/** 关闭设置面板 */
const closeSettings = (): void => {
  showSettings.value = false
}

onMounted(() => {
  gameStore.changeScene('levelSelect')
})
</script>

<template>
  <div class="relative min-h-screen">
    <button
      @click="toggleSettings"
      class="fixed top-6 right-6 z-30 p-3 bg-black/50 backdrop-blur-sm rounded-xl hover:bg-black/70 transition-all duration-200 transform hover:scale-105"
    >
      <Settings :size="24" class="text-white" />
    </button>

    <LevelSelect />

    <SettingsPanel
      v-if="showSettings"
      @close="closeSettings"
    />
  </div>
</template>
