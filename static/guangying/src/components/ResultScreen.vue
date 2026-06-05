<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Star, Clock, Target, Trophy, Sparkles, RotateCcw, Home, List, ArrowRight, Frown } from 'lucide-vue-next'
import { useGameStore } from '@/store/gameStore'
import { levels } from '@/levels'
import type { LevelData } from '@/levels'
import { cn } from '@/lib/utils'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()

/** Canvas 引用 */
const canvasRef = ref<HTMLCanvasElement | null>(null)

/** 动画帧ID */
let animationFrameId: number | null = null

/** 烟花粒子数组 */
interface FireworkParticle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  alpha: number
  size: number
  decay: number
  gravity: number
}

/** 烟花数组 */
interface Firework {
  x: number
  y: number
  targetY: number
  vy: number
  color: string
  exploded: boolean
  particles: FireworkParticle[]
}

const fireworks = ref<Firework[]>([])

/** 星级动画状态 */
const litStars = ref<number>(0)

/** 是否显示内容 */
const showContent = ref<boolean>(false)

/** 是否为胜利状态 */
const isVictory = computed<boolean>(() => {
  return gameStore.currentScene === 'victory'
})

/** 当前关卡数据 */
const currentLevelData = computed<LevelData | undefined>(() => {
  const levelId = route.params.levelId as string
  const levelIndex = parseInt(levelId.replace('level_', ''), 10)
  return levels.find(l => l.id === levelIndex)
})

/** 收集物总数 */
const totalCollectibles = computed<number>(() => {
  return currentLevelData.value?.collectibles.length ?? 0
})

/** 收集率（百分比） */
const collectRate = computed<number>(() => {
  if (totalCollectibles.value === 0) return 100
  return Math.round((gameStore.gameState.collectibles / totalCollectibles.value) * 100)
})

/** 计算星级 */
const earnedStars = computed<number>(() => {
  if (!isVictory.value) return 0
  const rate = collectRate.value
  const time = gameStore.gameState.gameTime
  const targetTime = currentLevelData.value?.targetTime ?? 120

  let stars = 1
  if (rate >= 70) stars = 2
  if (rate >= 90 && time <= targetTime * 1.5) stars = 3
  return stars
})

/** 格式化时间显示 */
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/** 是否有下一关 */
const hasNextLevel = computed<boolean>(() => {
  const levelId = route.params.levelId as string
  const currentIndex = levels.findIndex(l => `level_${l.id}` === levelId)
  return currentIndex >= 0 && currentIndex < levels.length - 1
})

/** 下一关ID */
const nextLevelId = computed<string | null>(() => {
  if (!hasNextLevel.value) return null
  const levelId = route.params.levelId as string
  const currentIndex = levels.findIndex(l => `level_${l.id}` === levelId)
  return `level_${levels[currentIndex + 1].id}`
})

/** 生成随机颜色 */
const getRandomColor = (): string => {
  const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6B9D', '#C56CF0']
  return colors[Math.floor(Math.random() * colors.length)]
}

/** 创建烟花 */
const createFirework = (canvas: HTMLCanvasElement): Firework => {
  return {
    x: Math.random() * canvas.width,
    y: canvas.height,
    targetY: Math.random() * canvas.height * 0.6,
    vy: -8 - Math.random() * 4,
    color: getRandomColor(),
    exploded: false,
    particles: []
  }
}

/** 爆炸烟花 */
const explodeFirework = (firework: Firework): void => {
  const particleCount = 50 + Math.floor(Math.random() * 30)
  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount
    const speed = 2 + Math.random() * 4
    firework.particles.push({
      x: firework.x,
      y: firework.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: firework.color,
      alpha: 1,
      size: 2 + Math.random() * 3,
      decay: 0.015 + Math.random() * 0.01,
      gravity: 0.05
    })
  }
  firework.exploded = true
}

/** 更新烟花 */
const updateFireworks = (canvas: HTMLCanvasElement): void => {
  if (Math.random() < 0.05) {
    fireworks.value.push(createFirework(canvas))
  }

  fireworks.value = fireworks.value.filter(firework => {
    if (!firework.exploded) {
      firework.y += firework.vy
      firework.vy += 0.15
      if (firework.y <= firework.targetY || firework.vy >= 0) {
        explodeFirework(firework)
      }
      return true
    } else {
      firework.particles = firework.particles.filter(p => {
        p.x += p.vx
        p.y += p.vy
        p.vy += p.gravity
        p.alpha -= p.decay
        return p.alpha > 0
      })
      return firework.particles.length > 0
    }
  })
}

/** 绘制烟花 */
const drawFireworks = (ctx: CanvasRenderingContext2D): void => {
  fireworks.value.forEach(firework => {
    if (!firework.exploded) {
      ctx.beginPath()
      ctx.arc(firework.x, firework.y, 3, 0, Math.PI * 2)
      ctx.fillStyle = firework.color
      ctx.fill()

      ctx.beginPath()
      ctx.moveTo(firework.x, firework.y)
      ctx.lineTo(firework.x, firework.y + 15)
      ctx.strokeStyle = firework.color
      ctx.lineWidth = 2
      ctx.stroke()
    } else {
      firework.particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2, '0')
        ctx.fill()
      })
    }
  })
}

/** 动画循环 */
const animate = (): void => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  if (isVictory.value) {
    updateFireworks(canvas)
    drawFireworks(ctx)
  }

  animationFrameId = requestAnimationFrame(animate)
}

/** 设置Canvas尺寸 */
const setupCanvas = (): void => {
  const canvas = canvasRef.value
  if (!canvas) return

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

/** 星级依次亮起动画 */
const startStarAnimation = (): void => {
  if (!isVictory.value) {
    showContent.value = true
    return
  }

  showContent.value = true

  const total = earnedStars.value
  let current = 0

  const lightNextStar = (): void => {
    if (current < total) {
      current++
      litStars.value = current
      setTimeout(lightNextStar, 600)
    }
  }

  setTimeout(lightNextStar, 500)
}

/** 返回主菜单 */
const goToHome = (): void => {
  gameStore.changeScene('menu')
  router.push('/')
}

/** 进入关卡选择 */
const goToLevels = (): void => {
  gameStore.changeScene('levelSelect')
  router.push('/levels')
}

/** 重新开始当前关卡 */
const restartLevel = (): void => {
  gameStore.resetLevelState()
  gameStore.changeScene('playing')
  const levelId = route.params.levelId as string
  router.push(`/game/${levelId}`)
}

/** 进入下一关 */
const goToNextLevel = (): void => {
  if (!nextLevelId.value) return
  gameStore.resetLevelState()
  gameStore.selectLevel(nextLevelId.value)
  gameStore.changeScene('playing')
  router.push(`/game/${nextLevelId.value}`)
}

/** 失败时重试 */
const retryLevel = (): void => {
  gameStore.resetLevelState()
  gameStore.changeScene('playing')
  const levelId = route.params.levelId as string
  router.push(`/game/${levelId}`)
}

onMounted(() => {
  setupCanvas()
  window.addEventListener('resize', setupCanvas)

  if (isVictory.value) {
    animate()
  }

  startStarAnimation()
})

onUnmounted(() => {
  window.removeEventListener('resize', setupCanvas)
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
})

watch(isVictory, (newVal) => {
  if (newVal && animationFrameId === null) {
    animate()
  }
})
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/70 backdrop-blur-sm">
    <canvas
      ref="canvasRef"
      class="absolute inset-0 pointer-events-none"
    />

    <div
      :class="[
        'relative z-10 w-full max-w-lg mx-4 p-8 rounded-3xl shadow-2xl transition-all duration-500 transform',
        showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        isVictory ? 'bg-gradient-to-br from-amber-900/90 to-yellow-800/90 border-2 border-yellow-500/50' : 'bg-gradient-to-br from-gray-900/90 to-red-900/90 border-2 border-red-500/50'
      ]"
    >
      <div class="text-center mb-6">
        <h2
          :class="[
            'text-4xl font-bold mb-2',
            isVictory ? 'text-yellow-300' : 'text-red-400'
          ]"
        >
          {{ isVictory ? '关卡完成！' : '挑战失败' }}
        </h2>
        <p class="text-xl text-gray-200">
          {{ currentLevelData?.name ?? '未知关卡' }}
        </p>
      </div>

      <div v-if="isVictory" class="flex justify-center gap-4 mb-8">
        <div
          v-for="i in 3"
          :key="i"
          :class="[
            'transition-all duration-500 transform',
            litStars >= i ? 'scale-110' : 'scale-100'
          ]"
        >
          <Star
            :size="64"
            :class="[
              'transition-all duration-500',
              litStars >= i
                ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]'
                : 'text-gray-600 fill-gray-800'
            ]"
          />
        </div>
      </div>

      <div v-else class="flex justify-center mb-8">
        <Frown :size="80" class="text-red-400" />
      </div>

      <div v-if="!isVictory" class="text-center mb-8">
        <p class="text-lg text-gray-300 mb-2">不要气馁，再试一次吧！</p>
        <p class="text-gray-400">光明总会战胜黑暗 ✨</p>
      </div>

      <div v-if="isVictory" class="grid grid-cols-2 gap-4 mb-8">
        <div class="bg-black/30 rounded-xl p-4 text-center">
          <div class="flex items-center justify-center gap-2 mb-2">
            <Clock :size="20" class="text-blue-400" />
            <span class="text-gray-300">用时</span>
          </div>
          <p class="text-2xl font-bold text-white">{{ formatTime(gameStore.gameState.gameTime) }}</p>
          <p class="text-xs text-gray-400">目标: {{ formatTime(currentLevelData?.targetTime ?? 120) }}</p>
        </div>

        <div class="bg-black/30 rounded-xl p-4 text-center">
          <div class="flex items-center justify-center gap-2 mb-2">
            <Target :size="20" class="text-green-400" />
            <span class="text-gray-300">收集率</span>
          </div>
          <p class="text-2xl font-bold text-white">{{ collectRate }}%</p>
          <p class="text-xs text-gray-400">{{ gameStore.gameState.collectibles }} / {{ totalCollectibles }}</p>
        </div>

        <div class="bg-black/30 rounded-xl p-4 text-center">
          <div class="flex items-center justify-center gap-2 mb-2">
            <Trophy :size="20" class="text-yellow-400" />
            <span class="text-gray-300">分数</span>
          </div>
          <p class="text-2xl font-bold text-white">{{ gameStore.gameState.score.toLocaleString() }}</p>
          <p
            v-if="gameStore.getHighScore(route.params.levelId as string) > 0"
            class="text-xs text-gray-400"
          >
            最高: {{ gameStore.getHighScore(route.params.levelId as string).toLocaleString() }}
          </p>
        </div>

        <div class="bg-black/30 rounded-xl p-4 text-center">
          <div class="flex items-center justify-center gap-2 mb-2">
            <Sparkles :size="20" class="text-purple-400" />
            <span class="text-gray-300">光粒子</span>
          </div>
          <p class="text-2xl font-bold text-white">{{ gameStore.totalParticles }}</p>
          <p class="text-xs text-gray-400">累计收集</p>
        </div>
      </div>

      <div class="space-y-3">
        <template v-if="isVictory">
          <button
            v-if="hasNextLevel"
            @click="goToNextLevel"
            class="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <ArrowRight :size="20" />
            下一关
          </button>

          <button
            @click="restartLevel"
            class="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <RotateCcw :size="20" />
            重新开始
          </button>

          <div class="grid grid-cols-2 gap-3">
            <button
              @click="goToLevels"
              class="flex items-center justify-center gap-2 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
            >
              <List :size="18" />
              关卡选择
            </button>
            <button
              @click="goToHome"
              class="flex items-center justify-center gap-2 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
            >
              <Home :size="18" />
              主菜单
            </button>
          </div>
        </template>

        <template v-else>
          <button
            @click="retryLevel"
            class="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <RotateCcw :size="22" />
            再试一次
          </button>

          <div class="grid grid-cols-2 gap-3">
            <button
              @click="goToLevels"
              class="flex items-center justify-center gap-2 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
            >
              <List :size="18" />
              关卡选择
            </button>
            <button
              @click="goToHome"
              class="flex items-center justify-center gap-2 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
            >
              <Home :size="18" />
              主菜单
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
