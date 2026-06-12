<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Play, Trophy, Zap, Target } from 'lucide-vue-next'
import TopBar from '@/components/TopBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import { usePlayerStore } from '@/stores/player'
import { storeToRefs } from 'pinia'
import { HAMSTER_SKINS, SNOWBALL_EFFECTS } from '@/data/gameData'

const router = useRouter()
const playerStore = usePlayerStore()
const { player, currentHamsterSkin, currentSnowballEffect } = storeToRefs(playerStore)

const hamsterRotation = ref(0)

onMounted(() => {
  playerStore.loadPlayer()
  animateHamster()
})

function animateHamster() {
  const animate = () => {
    hamsterRotation.value += 0.5
    requestAnimationFrame(animate)
  }
  animate()
}

function startGame() {
  router.push('/game/prepare')
}

const gameModes = [
  { id: 'quick', name: '快速匹配', icon: Zap, color: 'from-green-400 to-emerald-500', desc: '随机地图，快速开战' },
  { id: 'ranked', name: '排位竞技', icon: Trophy, color: 'from-yellow-400 to-orange-500', desc: '提升段位，挑战自我' },
  { id: 'practice', name: '练习模式', icon: Target, color: 'from-blue-400 to-indigo-500', desc: '无压力练习技术' },
]
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-ice-200 via-ice-100 to-white pb-20 pt-20">
    <TopBar />
    
    <div class="max-w-lg mx-auto px-4 py-6">
      <div class="relative h-64 mb-8 flex items-center justify-center">
        <div class="absolute inset-0 flex items-center justify-center">
          <div 
            class="w-48 h-48 rounded-full bg-gradient-to-br from-white to-ice-100 shadow-glow opacity-50"
            :style="{ transform: `scale(${1 + Math.sin(Date.now() * 0.002) * 0.05})` }"
          ></div>
        </div>
        
        <div 
          class="relative z-10 text-center animate-float"
          :style="{ transform: `rotateY(${hamsterRotation}deg)` }"
        >
          <div class="text-8xl mb-4">{{ currentHamsterSkin.emoji }}</div>
          <div class="text-2xl font-bold text-gradient mb-1">{{ player.nickname }}</div>
          <div class="text-sm text-gray-500">
            {{ currentSnowballEffect.name }} · {{ currentHamsterSkin.name }}
          </div>
        </div>
        
        <div class="absolute top-4 left-4 text-3xl animate-bounce-slow" style="animation-delay: 0.2s">❄️</div>
        <div class="absolute top-10 right-8 text-2xl animate-bounce-slow" style="animation-delay: 0.5s">✨</div>
        <div class="absolute bottom-8 left-8 text-2xl animate-bounce-slow" style="animation-delay: 0.8s">🌟</div>
      </div>
      
      <button
        @click="startGame"
        class="w-full py-5 rounded-2xl bg-gradient-to-r from-ice-400 to-ice-600 text-white font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 mb-8"
      >
        <Play :size="28" fill="white" />
        开始游戏
      </button>
      
      <div class="grid grid-cols-3 gap-3 mb-8">
        <div 
          v-for="mode in gameModes" 
          :key="mode.id"
          class="bg-white/80 backdrop-blur rounded-2xl p-4 text-center shadow-soft hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          @click="startGame"
        >
          <div 
            class="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br flex items-center justify-center text-white"
            :class="mode.color"
          >
            <component :is="mode.icon" :size="24" />
          </div>
          <div class="font-bold text-gray-800 text-sm">{{ mode.name }}</div>
        </div>
      </div>
      
      <div class="bg-gradient-to-r from-warm-pink/20 to-warm-lavender/20 rounded-2xl p-4 mb-6">
        <div class="flex items-center gap-3">
          <div class="text-3xl">🎉</div>
          <div class="flex-1">
            <div class="font-bold text-gray-800">每日活动</div>
            <div class="text-sm text-gray-600">完成任务领取丰厚奖励</div>
          </div>
          <div class="bg-white/80 px-3 py-1 rounded-full text-sm font-bold text-pink-500">
            进行中
          </div>
        </div>
      </div>
      
      <div class="bg-white/60 backdrop-blur rounded-2xl p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-gray-800">今日任务</h3>
          <span class="text-xs text-gray-400">每日刷新</span>
        </div>
        <div class="space-y-3">
          <div class="flex items-center gap-3 bg-white/80 rounded-xl p-3">
            <div class="w-10 h-10 bg-ice-100 rounded-lg flex items-center justify-center text-xl">🎮</div>
            <div class="flex-1">
              <div class="font-medium text-sm text-gray-800">完成 3 场对战</div>
              <div class="w-full h-2 bg-gray-200 rounded-full mt-1">
                <div class="h-full bg-ice-400 rounded-full" style="width: 33%"></div>
              </div>
            </div>
            <div class="text-yellow-500 font-bold text-sm">+100</div>
          </div>
          <div class="flex items-center gap-3 bg-white/80 rounded-xl p-3">
            <div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-xl">🏆</div>
            <div class="flex-1">
              <div class="font-medium text-sm text-gray-800">赢得一场比赛</div>
              <div class="w-full h-2 bg-gray-200 rounded-full mt-1">
                <div class="h-full bg-yellow-400 rounded-full" style="width: 0%"></div>
              </div>
            </div>
            <div class="text-yellow-500 font-bold text-sm">+200</div>
          </div>
        </div>
      </div>
    </div>
    
    <BottomNav />
  </div>
</template>
