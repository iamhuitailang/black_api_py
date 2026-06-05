<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Volume2, VolumeX, Music, Music2, RotateCcw, Save, Eye, Monitor } from 'lucide-vue-next'
import { useGameStore } from '@/store/gameStore'
import type { GraphicsQuality } from '@/types'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const gameStore = useGameStore()

/** 画质选项 */
const qualityOptions: { value: GraphicsQuality; label: string }[] = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' }
]

/** 本地设置副本 */
const localSettings = ref({
  bgmVolume: gameStore.settings.bgmVolume,
  sfxVolume: gameStore.settings.sfxVolume,
  bgmEnabled: gameStore.settings.bgmEnabled,
  sfxEnabled: gameStore.settings.sfxEnabled,
  graphicsQuality: gameStore.settings.graphicsQuality,
  showFPS: gameStore.settings.showFPS,
  showHitboxes: gameStore.settings.showHitboxes
})

/** 是否有未保存的更改 */
const hasChanges = computed<boolean>(() => {
  return (
    localSettings.value.bgmVolume !== gameStore.settings.bgmVolume ||
    localSettings.value.sfxVolume !== gameStore.settings.sfxVolume ||
    localSettings.value.bgmEnabled !== gameStore.settings.bgmEnabled ||
    localSettings.value.sfxEnabled !== gameStore.settings.sfxEnabled ||
    localSettings.value.graphicsQuality !== gameStore.settings.graphicsQuality ||
    localSettings.value.showFPS !== gameStore.settings.showFPS ||
    localSettings.value.showHitboxes !== gameStore.settings.showHitboxes
  )
})

/** 保存设置 */
const saveSettings = (): void => {
  gameStore.updateSettings(localSettings.value)
  gameStore.saveProgress()
  emit('close')
}

/** 重置设置 */
const resetSettings = (): void => {
  localSettings.value = {
    bgmVolume: 0.7,
    sfxVolume: 0.8,
    bgmEnabled: true,
    sfxEnabled: true,
    graphicsQuality: 'high' as GraphicsQuality,
    showFPS: false,
    showHitboxes: false
  }
}

/** 关闭面板 */
const closePanel = (): void => {
  emit('close')
}

/** 格式化音量百分比 */
const formatVolume = (value: number): string => {
  return `${Math.round(value * 100)}%`
}

/** 获取画质标签 */
const getQualityLabel = (value: GraphicsQuality): string => {
  return qualityOptions.find(opt => opt.value === value)?.label || '未知'
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
    <div class="w-full max-w-md mx-4 p-6 bg-gray-900/95 rounded-3xl shadow-2xl border-2 border-gray-700">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-white">游戏设置</h2>
        <button
          @click="closePanel"
          class="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X :size="24" />
        </button>
      </div>

      <div class="space-y-6">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <button
                @click="localSettings.bgmEnabled = !localSettings.bgmEnabled"
                :class="[
                  'p-2 rounded-lg transition-colors',
                  localSettings.bgmEnabled
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                ]"
              >
                <Music v-if="localSettings.bgmEnabled" :size="20" />
                <Music2 v-else :size="20" />
              </button>
              <span class="text-white">背景音乐</span>
            </div>
            <span class="text-gray-400">{{ localSettings.bgmEnabled ? '开启' : '关闭' }}</span>
          </div>

          <div class="ml-14">
            <input
              v-model.number="localSettings.bgmVolume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              :disabled="!localSettings.bgmEnabled"
              class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 disabled:opacity-50"
            />
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>{{ formatVolume(localSettings.bgmVolume) }}</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <button
                @click="localSettings.sfxEnabled = !localSettings.sfxEnabled"
                :class="[
                  'p-2 rounded-lg transition-colors',
                  localSettings.sfxEnabled
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                ]"
              >
                <Volume2 v-if="localSettings.sfxEnabled" :size="20" />
                <VolumeX v-else :size="20" />
              </button>
              <span class="text-white">音效</span>
            </div>
            <span class="text-gray-400">{{ localSettings.sfxEnabled ? '开启' : '关闭' }}</span>
          </div>

          <div class="ml-14">
            <input
              v-model.number="localSettings.sfxVolume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              :disabled="!localSettings.sfxEnabled"
              class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 disabled:opacity-50"
            />
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>{{ formatVolume(localSettings.sfxVolume) }}</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-gray-700 space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-blue-600 text-white rounded-lg">
                <Monitor :size="20" />
              </div>
              <span class="text-white">画质</span>
            </div>
            <div class="flex gap-1">
              <button
                v-for="option in qualityOptions"
                :key="option.value"
                @click="localSettings.graphicsQuality = option.value"
                :class="[
                  'px-3 py-1 rounded-lg text-sm font-medium transition-all',
                  localSettings.graphicsQuality === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                ]"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                :class="[
                  'p-2 rounded-lg transition-colors',
                  localSettings.showFPS
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                ]"
              >
                <Eye :size="20" />
              </div>
              <span class="text-white">显示FPS</span>
            </div>
            <button
              @click="localSettings.showFPS = !localSettings.showFPS"
              :class="[
                'relative w-12 h-6 rounded-full transition-colors',
                localSettings.showFPS ? 'bg-green-600' : 'bg-gray-600'
              ]"
            >
              <div
                :class="[
                  'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                  localSettings.showFPS ? 'translate-x-7' : 'translate-x-1'
                ]"
              />
            </button>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                :class="[
                  'p-2 rounded-lg transition-colors',
                  localSettings.showHitboxes
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                ]"
              >
                <Eye :size="20" />
              </div>
              <span class="text-white">显示碰撞盒</span>
            </div>
            <button
              @click="localSettings.showHitboxes = !localSettings.showHitboxes"
              :class="[
                'relative w-12 h-6 rounded-full transition-colors',
                localSettings.showHitboxes ? 'bg-orange-600' : 'bg-gray-600'
              ]"
            >
              <div
                :class="[
                  'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                  localSettings.showHitboxes ? 'translate-x-7' : 'translate-x-1'
                ]"
              />
            </button>
          </div>
        </div>
      </div>

      <div class="flex gap-3 mt-8">
        <button
          @click="resetSettings"
          class="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-200"
        >
          <RotateCcw :size="18" />
          重置
        </button>
        <button
          @click="saveSettings"
          :disabled="!hasChanges"
          :class="[
            'flex-1 flex items-center justify-center gap-2 py-3 px-4 font-semibold rounded-xl transition-all duration-200',
            hasChanges
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          ]"
        >
          <Save :size="18" />
          保存
        </button>
      </div>
    </div>
  </div>
</template>
