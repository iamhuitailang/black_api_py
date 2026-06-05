<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/store/gameStore'
import { levels } from '@/levels'
import type { LevelData } from '@/levels'
import {
  ArrowLeft,
  Star,
  Lock,
  Sparkles,
  Trophy,
  Play,
  Settings
} from 'lucide-vue-next'
import SettingsPanel from './SettingsPanel.vue'

const router = useRouter()
const gameStore = useGameStore()

const canvasRefs = ref<Record<number, HTMLCanvasElement | null>>({})
const showSettings = ref(false)

const totalParticles = computed(() => gameStore.totalParticles)
const totalStars = computed(() => gameStore.totalStars)

const getLevelKey = (id: number): string => `level_${id}`

const isLevelUnlocked = (level: LevelData): boolean => {
  return gameStore.isLevelUnlocked(getLevelKey(level.id))
}

const getLevelStars = (level: LevelData): number => {
  return gameStore.getLevelStars(getLevelKey(level.id))
}

const drawLevelPreview = (level: LevelData) => {
  const canvas = canvasRefs.value[level.id]
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height

  ctx.clearRect(0, 0, width, height)

  const gradient = ctx.createLinearGradient(0, 0, width, height)
  const bgColor = level.background.backgroundColor
  gradient.addColorStop(0, bgColor)
  gradient.addColorStop(1, adjustColor(bgColor, -30))
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  const scale = Math.min(width / level.width, height / level.height) * 0.25
  const offsetX = (width - level.width * scale) / 2
  const offsetY = (height - level.height * scale) / 2 + 20

  level.platforms.forEach(platform => {
    const x = offsetX + platform.position.x * scale
    const y = offsetY + platform.position.y * scale
    const w = platform.size.width * scale
    const h = platform.size.height * scale

    const platformGradient = ctx.createLinearGradient(x, y, x, y + h)
    platformGradient.addColorStop(0, '#4a5568')
    platformGradient.addColorStop(1, '#2d3748')
    ctx.fillStyle = platformGradient
    ctx.fillRect(x, y, w, h)

    ctx.strokeStyle = '#718096'
    ctx.lineWidth = 1
    ctx.strokeRect(x, y, w, h)
  })

  level.traps.forEach(trap => {
    const x = offsetX + trap.position.x * scale
    const y = offsetY + trap.position.y * scale
    const w = trap.size.width * scale
    const h = trap.size.height * scale

    ctx.fillStyle = '#ef4444'
    ctx.fillRect(x, y, w, h)

    if (trap.type === 'spike') {
      const spikeCount = (trap as { spikeCount?: number }).spikeCount || 5
      const spikeWidth = w / spikeCount
      const spikeHeight = h * 0.6
      for (let i = 0; i < spikeCount; i++) {
        ctx.fillStyle = '#dc2626'
        ctx.beginPath()
        ctx.moveTo(x + i * spikeWidth, y + h)
        ctx.lineTo(x + i * spikeWidth + spikeWidth / 2, y + h - spikeHeight)
        ctx.lineTo(x + (i + 1) * spikeWidth, y + h)
        ctx.closePath()
        ctx.fill()
      }
    }
  })

  level.collectibles.forEach(collectible => {
    const x = offsetX + collectible.position.x * scale
    const y = offsetY + collectible.position.y * scale
    const size = collectible.size * scale * 2

    const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2)
    if (collectible.type === 'lightParticle') {
      glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)')
      glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)')
      ctx.fillStyle = glowGradient
      ctx.beginPath()
      ctx.arc(x, y, size * 2, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#ffd700'
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    } else if (collectible.type === 'star') {
      glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)')
      glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)')
      ctx.fillStyle = glowGradient
      ctx.beginPath()
      ctx.arc(x, y, size * 3, 0, Math.PI * 2)
      ctx.fill()

      drawStar(ctx, x, y, 5, size * 1.5, size * 0.7, '#ffd700')
    } else if (collectible.type === 'health') {
      ctx.fillStyle = '#ef4444'
      drawHeart(ctx, x, y, size)
    }
  })

  const spawnX = offsetX + level.spawnPoint.x * scale
  const spawnY = offsetY + level.spawnPoint.y * scale
  ctx.fillStyle = '#22c55e'
  ctx.beginPath()
  ctx.arc(spawnX, spawnY, 5, 0, Math.PI * 2)
  ctx.fill()

  const exitX = offsetX + level.exitPoint.x * scale
  const exitY = offsetY + level.exitPoint.y * scale
  const portalGlow = ctx.createRadialGradient(exitX, exitY, 0, exitX, exitY, 20)
  portalGlow.addColorStop(0, 'rgba(147, 51, 234, 0.8)')
  portalGlow.addColorStop(1, 'rgba(147, 51, 234, 0)')
  ctx.fillStyle = portalGlow
  ctx.beginPath()
  ctx.arc(exitX, exitY, 20, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#9333ea'
  ctx.beginPath()
  ctx.arc(exitX, exitY, 8, 0, Math.PI * 2)
  ctx.fill()
}

const adjustColor = (color: string, amount: number): string => {
  const hex = color.replace('#', '')
  const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount))
  const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount))
  const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount))
  return `rgb(${r}, ${g}, ${b})`
}

const drawStar = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number,
  color: string
) => {
  let rot = (Math.PI / 2) * 3
  const step = Math.PI / spikes

  ctx.beginPath()
  ctx.moveTo(cx, cy - outerRadius)

  for (let i = 0; i < spikes; i++) {
    let x = cx + Math.cos(rot) * outerRadius
    let y = cy + Math.sin(rot) * outerRadius
    ctx.lineTo(x, y)
    rot += step

    x = cx + Math.cos(rot) * innerRadius
    y = cy + Math.sin(rot) * innerRadius
    ctx.lineTo(x, y)
    rot += step
  }

  ctx.lineTo(cx, cy - outerRadius)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

const drawHeart = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) => {
  ctx.beginPath()
  ctx.moveTo(x, y + size * 0.3)
  ctx.bezierCurveTo(x - size, y - size * 0.3, x - size, y - size * 0.9, x, y - size * 0.5)
  ctx.bezierCurveTo(x + size, y - size * 0.9, x + size, y - size * 0.3, x, y + size * 0.3)
  ctx.closePath()
  ctx.fill()
}

const handleLevelClick = (level: LevelData) => {
  if (isLevelUnlocked(level)) {
    gameStore.selectLevel(getLevelKey(level.id))
    gameStore.changeScene('playing')
    router.push(`/game/${level.id}`)
  }
}

const handleBack = () => {
  gameStore.changeScene('menu')
  router.push('/')
}

const handleOpenSettings = () => {
  showSettings.value = true
}

onMounted(() => {
  gameStore.changeScene('levelSelect')
  setTimeout(() => {
    levels.forEach(level => {
      drawLevelPreview(level)
    })
  }, 100)
})
</script>

<template>
  <div class="relative w-full min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
    <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <div class="absolute top-0 left-0 w-full h-full">
        <div class="absolute top-1/3 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" style="animation-duration: 8s;" />
        <div class="absolute top-1/2 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style="animation-duration: 6s; animation-delay: 2s;" />
        <div class="absolute bottom-1/4 left-1/3 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style="animation-duration: 7s; animation-delay: 1s;" />
      </div>
    </div>

    <div class="relative z-10 p-6">
      <div class="flex items-center justify-between mb-8">
        <button
          @click="handleBack"
          class="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-white rounded-lg transition-all duration-200 border border-slate-600 hover:border-slate-500"
        >
          <ArrowLeft class="w-5 h-5" />
          <span>返回主菜单</span>
        </button>

        <div class="flex items-center gap-6">
          <div class="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
            <Sparkles class="w-5 h-5 text-yellow-400" />
            <span class="text-yellow-300 font-bold">{{ totalParticles }}</span>
            <span class="text-yellow-400/70 text-sm">光粒子</span>
          </div>

          <div class="flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
            <Trophy class="w-5 h-5 text-purple-400" />
            <span class="text-purple-300 font-bold">{{ totalStars }}</span>
            <span class="text-purple-400/70 text-sm">/ {{ levels.length * 3 }}</span>
          </div>

          <button
            @click="handleOpenSettings"
            class="p-2 bg-slate-800/80 hover:bg-slate-700/80 text-gray-300 hover:text-white rounded-lg transition-all duration-200 border border-slate-600 hover:border-slate-500"
          >
            <Settings class="w-5 h-5" />
          </button>
        </div>
      </div>

      <div class="text-center mb-12">
        <h1 class="text-4xl md:text-5xl font-bold text-white mb-2">
          选择关卡
        </h1>
        <p class="text-gray-400">
          选择一个关卡开始你的光影之旅
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <div
          v-for="level in levels"
          :key="level.id"
          @click="handleLevelClick(level)"
          :class="[
            'level-card group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden border-2 transition-all duration-300 cursor-pointer',
            isLevelUnlocked(level)
              ? 'border-slate-600 hover:border-yellow-500 hover:shadow-xl hover:shadow-yellow-500/20 hover:-translate-y-2'
              : 'border-slate-700/50 opacity-70 cursor-not-allowed'
          ]"
        >
          <div class="relative aspect-video overflow-hidden bg-slate-900">
            <canvas
              :ref="el => { if (el) canvasRefs[level.id] = el as HTMLCanvasElement }"
              :width="320"
              :height="180"
              class="w-full h-full"
            />

            <div
              v-if="!isLevelUnlocked(level)"
              class="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm"
            >
              <div class="text-center">
                <Lock class="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <span class="text-gray-400">未解锁</span>
              </div>
            </div>

            <div
              v-if="isLevelUnlocked(level) && getLevelStars(level) > 0"
              class="absolute bottom-2 right-2 flex gap-1"
            >
              <Star
                v-for="i in 3"
                :key="i"
                :class="[
                  'w-5 h-5 drop-shadow-lg transition-all duration-300',
                  i <= getLevelStars(level)
                    ? 'text-yellow-400 fill-yellow-400 scale-110'
                    : 'text-gray-500/70'
                ]"
              />
            </div>

            <div
              v-if="isLevelUnlocked(level)"
              class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
            >
              <div class="w-16 h-16 rounded-full bg-yellow-500/90 flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300">
                <Play class="w-8 h-8 text-white ml-1" />
              </div>
            </div>
          </div>

          <div class="p-5">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-xl font-bold text-white">{{ level.name }}</h3>
              <div class="flex gap-0.5">
                <Star
                  v-for="i in level.difficulty"
                  :key="i"
                  class="w-4 h-4 text-orange-400 fill-orange-400"
                />
              </div>
            </div>

            <p class="text-gray-400 text-sm line-clamp-2 mb-3">
              {{ level.description }}
            </p>

            <div class="flex items-center justify-between text-xs">
              <span class="text-gray-500">
                目标时间: {{ level.targetTime }}秒
              </span>
              <span class="text-gray-500">
                收集物: {{ level.collectibles.length }}
              </span>
            </div>
          </div>

          <div
            v-if="isLevelUnlocked(level)"
            class="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          >
            <div class="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-yellow-500/30 to-transparent rounded-br-full" />
            <div class="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-purple-500/30 to-transparent rounded-tl-full" />
          </div>
        </div>
      </div>
    </div>

    <SettingsPanel v-if="showSettings" @close="showSettings = false" />
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.level-card::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 1rem;
  background: linear-gradient(45deg, #ffd700, #9333ea, #06b6d4, #ffd700);
  background-size: 400% 400%;
  opacity: 0;
  z-index: -1;
  transition: opacity 0.3s ease;
  animation: gradientShift 3s ease infinite;
}

.level-card:hover::before {
  opacity: 0.5;
  filter: blur(12px);
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>
