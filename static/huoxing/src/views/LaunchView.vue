<template>
  <div class="min-h-screen bg-space flex flex-col items-center justify-center relative overflow-hidden">
    <div class="absolute inset-0">
      <StarField :star-count="8000" />
    </div>

    <div class="absolute inset-0 bg-gradient-to-b from-transparent via-space/50 to-space pointer-events-none" />

    <div class="relative z-10 text-center px-6">
      <div class="mb-8 animate-float">
        <div class="text-8xl mb-4">🔴</div>
        <h1 class="text-6xl font-bold bg-gradient-to-r from-mars via-orange-400 to-mars bg-clip-text text-transparent mb-4" style="font-family: 'Orbitron', sans-serif;">
          火星殖民基地
        </h1>
        <p class="text-xl text-gray-400 tracking-widest">MARS COLONY PROJECT</p>
      </div>

      <div class="text-gray-500 mb-12 max-w-lg mx-auto leading-relaxed">
        <p class="mb-2">公元2157年，人类首次登陆火星</p>
        <p>作为首批殖民者，你将在这片红色星球上建立人类的第一个家园</p>
      </div>

      <div class="space-y-4">
        <button
          @click="startNewGame"
          class="group relative w-64 px-8 py-4 bg-gradient-to-r from-mars to-orange-600 rounded-lg font-bold text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-neon-red"
        >
          <span class="relative z-10">🚀 开始新游戏</span>
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        </button>

        <button
          v-if="hasSave"
          @click="continueGame"
          class="w-64 px-8 py-4 bg-space border border-tech/50 rounded-lg font-bold text-lg text-tech transition-all duration-300 hover:bg-tech/10 hover:border-tech hover:shadow-neon-blue"
        >
          📂 继续游戏
        </button>

        <div class="pt-4">
          <button
            @click="showSettings = true"
            class="text-gray-500 hover:text-gray-300 transition-colors"
          >
            ⚙️ 游戏设置
          </button>
        </div>
      </div>

      <div class="mt-16 text-gray-600 text-sm">
        <p>版本 1.0.0 | 支持本地存档</p>
      </div>
    </div>

    <div v-if="showSettings" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50" @click.self="showSettings = false">
      <SciFiPanel title="游戏设置" class="w-96">
        <div class="space-y-6 p-4">
          <div>
            <label class="block text-gray-400 mb-2">游戏难度</label>
            <select v-model="difficulty" class="w-full bg-space border border-gray-700 rounded px-4 py-2 text-white">
              <option value="easy">简单 - 资源消耗降低50%</option>
              <option value="normal">普通 - 标准游戏体验</option>
              <option value="hard">困难 - 资源消耗增加50%</option>
            </select>
          </div>
          <div>
            <label class="block text-gray-400 mb-2">自动存档</label>
            <div class="flex items-center gap-3">
              <button
                @click="autoSave = true"
                :class="['px-4 py-2 rounded', autoSave ? 'bg-tech text-space' : 'bg-gray-800 text-gray-400']"
              >开启</button>
              <button
                @click="autoSave = false"
                :class="['px-4 py-2 rounded', !autoSave ? 'bg-tech text-space' : 'bg-gray-800 text-gray-400']"
              >关闭</button>
            </div>
          </div>
          <div v-if="hasSave" class="pt-4 border-t border-gray-800">
            <button
              @click="confirmDeleteSave"
              class="w-full px-4 py-2 bg-red-900/50 border border-red-500/50 rounded text-red-400 hover:bg-red-900/70 transition-colors"
            >
              🗑️ 删除存档
            </button>
          </div>
          <button
            @click="showSettings = false"
            class="w-full py-3 bg-tech/20 border border-tech/50 rounded text-tech hover:bg-tech/30 transition-colors"
          >
            确认
          </button>
        </div>
      </SciFiPanel>
    </div>

    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <SciFiPanel title="确认删除" border-color="red" class="w-80">
        <div class="p-4 text-center">
          <p class="text-gray-300 mb-6">确定要删除游戏存档吗？此操作不可撤销！</p>
          <div class="flex gap-3">
            <button
              @click="showDeleteConfirm = false"
              class="flex-1 py-2 bg-gray-800 rounded text-gray-300 hover:bg-gray-700 transition-colors"
            >取消</button>
            <button
              @click="deleteSaveData"
              class="flex-1 py-2 bg-red-600 rounded text-white hover:bg-red-500 transition-colors"
            >删除</button>
          </div>
        </div>
      </SciFiPanel>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import StarField from '@/components/three/StarField.vue'
import SciFiPanel from '@/components/ui/SciFiPanel.vue'
import { useGameStore } from '@/stores/gameStore'
import { hasSavedGame, deleteSave } from '@/utils/storage'
import { gameEngine } from '@/engine/GameEngine'
import { setGameInitialized } from '@/router'

const router = useRouter()
const gameStore = useGameStore()

const hasSave = ref(false)
const showSettings = ref(false)
const showDeleteConfirm = ref(false)
const difficulty = ref('normal')
const autoSave = ref(true)

onMounted(() => {
  hasSave.value = hasSavedGame()
})

function startNewGame() {
  gameStore.initNewGame()
  gameEngine.init(gameStore)
  gameEngine.start()
  setGameInitialized(true)
  router.push('/hall')
}

function continueGame() {
  if (gameStore.loadSavedGame()) {
    gameEngine.init(gameStore)
    gameEngine.start()
    setGameInitialized(true)
    router.push('/hall')
  }
}

function confirmDeleteSave() {
  showDeleteConfirm.value = true
}

function deleteSaveData() {
  deleteSave()
  hasSave.value = false
  showDeleteConfirm.value = false
  showSettings.value = false
}
</script>
