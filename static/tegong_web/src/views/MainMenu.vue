<template>
  <div class="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-black"></div>
    
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div v-for="i in 20" :key="i" 
           class="absolute w-2 h-2 bg-yellow-500/20 rounded-full particle"
           :style="{
             left: `${Math.random() * 100}%`,
             top: `${Math.random() * 100}%`,
             animationDelay: `${Math.random() * 4}s`
           }">
      </div>
    </div>

    <div class="relative z-10 text-center mb-16">
      <h1 class="game-title mb-4">龙影特工</h1>
      <p class="text-yellow-500/80 font-wuxia text-2xl">暗夜潜行 · 一击必杀</p>
    </div>

    <div class="relative z-10 flex flex-col gap-4">
      <button @click="startNewGame" class="btn-gold">
        开始新游戏
      </button>
      
      <button @click="continueGame" 
              :disabled="!hasSave"
              class="btn-gold"
              :class="{ 'opacity-50 cursor-not-allowed': !hasSave }">
        继续游戏
      </button>
      
      <button @click="goToLevelSelect" class="btn-gold">
        关卡选择
      </button>
      
      <button @click="showControls = true" class="btn-gold">
        操作说明
      </button>
    </div>

    <div class="absolute bottom-8 text-yellow-500/50 text-sm">
      按 WASD 移动 · J 攻击 · K 技能 · L 潜行 · ESC 暂停
    </div>

    <div v-if="showControls" 
         class="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
         @click.self="showControls = false">
      <div class="panel-border p-8 max-w-md">
        <h2 class="font-wuxia text-3xl text-yellow-500 text-center mb-6">操作说明</h2>
        
        <div class="space-y-4 text-white">
          <div class="flex items-center gap-4">
            <span class="w-24 text-yellow-500 font-bold">W / ↑ / 空格</span>
            <span>跳跃</span>
          </div>
          <div class="flex items-center gap-4">
            <span class="w-24 text-yellow-500 font-bold">A / ←</span>
            <span>向左移动</span>
          </div>
          <div class="flex items-center gap-4">
            <span class="w-24 text-yellow-500 font-bold">D / →</span>
            <span>向右移动</span>
          </div>
          <div class="flex items-center gap-4">
            <span class="w-24 text-yellow-500 font-bold">S / ↓</span>
            <span>下蹲</span>
          </div>
          <div class="flex items-center gap-4">
            <span class="w-24 text-yellow-500 font-bold">J</span>
            <span>普通攻击</span>
          </div>
          <div class="flex items-center gap-4">
            <span class="w-24 text-yellow-500 font-bold">K</span>
            <span>释放技能</span>
          </div>
          <div class="flex items-center gap-4">
            <span class="w-24 text-yellow-500 font-bold">L</span>
            <span>潜行模式（降低被发现几率）</span>
          </div>
          <div class="flex items-center gap-4">
            <span class="w-24 text-yellow-500 font-bold">ESC</span>
            <span>暂停游戏</span>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-yellow-500/30">
          <p class="text-yellow-500/70 text-sm text-center">
            收集卷轴学习新技能，利用隐藏点躲避敌人！
          </p>
        </div>

        <button @click="showControls = false" class="btn-gold w-full mt-6">
          知道了
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore'

const router = useRouter()
const gameStore = useGameStore()

const showControls = ref(false)
const hasSave = computed(() => gameStore.hasSave)

function startNewGame() {
  gameStore.startNewGame()
  router.push('/game/1')
}

function continueGame() {
  if (hasSave.value) {
    gameStore.continueGame()
    router.push(`/game/${gameStore.currentLevel}`)
  }
}

function goToLevelSelect() {
  router.push('/level-select')
}
</script>
